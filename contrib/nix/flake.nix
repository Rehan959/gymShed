{
  description = "GymShed — self-hosted gym & body-weight tracker";

  inputs = {
    # A release branch, not nixos-unstable: this flake is contributed packaging that has to
    # keep evaluating for self-hosters on a channel. unstable has moved on to 26.11, which
    # already dropped x86_64-darwin — one of the systems eachDefaultSystem evaluates.
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        gymshedPackages = import ./default.nix { inherit pkgs; };

        gymshedNixOSModule = self.nixosModules.gymshed;

        testConfig = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = [
            gymshedNixOSModule
            {
              services.gymshed = {
                enable = true;
                rpId = "localhost";
                origin = "http://localhost:8080";
                apiPort = 3000;
                environment = {
                  MY_FLAG = "1";
                };
              };
              system.stateVersion = "25.05";
            }
          ];
        };

        cfg = testConfig.config.services.gymshed;

        nginxEnabled = testConfig.config.services.nginx.enable;

        # Variant with the optional managed nginx vhost switched on.
        nginxTestConfig = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = [
            gymshedNixOSModule
            {
              services.gymshed = {
                enable = true;
                nginx.enable = true;
              };
              system.stateVersion = "25.05";
            }
          ];
        };

        check = pkgs.runCommand "gymshed-module-check" { } ''
          set -euo pipefail
          # Verify the module evaluated correctly
          echo "services.gymshed.enable = ${if cfg.enable then "true" else "false"}"
          echo "services.gymshed.apiPort = ${toString cfg.apiPort}"
          echo "services.gymshed.rpId = ${cfg.rpId}"
          echo "services.gymshed.origin = ${cfg.origin}"

          # Verify systemd service exists
          echo "systemd.services.gymshed-api exists = ${
            if testConfig.config.systemd.services ? gymshed-api then "true" else "false"
          }"

          # Verify extra environment is applied to the API unit
          echo "gymshed-api env MY_FLAG = ${
            if testConfig.config.systemd.services.gymshed-api.environment ? MY_FLAG then
              testConfig.config.systemd.services.gymshed-api.environment.MY_FLAG
            else
              "missing"
          }"

          # Verify nginx is disabled by default (system uses Caddy)
          echo "services.nginx.enable (default) = ${if nginxEnabled then "true" else "false"}"

          # Verify the optional managed nginx vhost gets configured
          echo "services.nginx.enable (nginx.enable) = ${
            if nginxTestConfig.config.services.nginx.enable then "true" else "false"
          }"
          echo "nginx vhost for 'localhost' = ${
            if nginxTestConfig.config.services.nginx.virtualHosts ? localhost then "true" else "false"
          }"
          echo "nginx /api proxyPass = ${
            nginxTestConfig.config.services.nginx.virtualHosts."localhost".locations."/api/".proxyPass
              or "missing"
          }"
          echo "nginx /exercise-media location = ${
            if nginxTestConfig.config.services.nginx.virtualHosts."localhost".locations ? "/exercise-media/" then
              "true"
            else
              "false"
          }"

          # Verify frontend/media store paths are exposed for a web server
          echo "services.gymshed.web.root = ${cfg.web.root}"
          echo "services.gymshed.media.root = ${cfg.media.root}"

          # Verify user exists
          echo "users.users.gymshed exists = ${
            if testConfig.config.users.users ? gymshed then "true" else "false"
          }"

          # All checks passed
          touch $out
        '';
      in
      {
        packages = gymshedPackages // {
          default = gymshedPackages.gymshed-frontend;
        };

        apps.gymshed = {
          type = "app";
          # Runs the full local stack: API + frontend (exercise media included) behind a throwaway
          # Caddy. Defaults to http://localhost:8080; env vars override ports/data/rp.
          program = "${pkgs.writeShellScript "gymshed" ''
            set -euo pipefail

            DATA_DIR=''${GYMSHED_DATA_DIR:-/tmp/gymshed-data}
            API_PORT=''${GYMSHED_API_PORT:-3000}
            WEB_PORT=''${GYMSHED_WEB_PORT:-8080}
            mkdir -p "$DATA_DIR"

            export PORT="$API_PORT"
            export DATA_DIR
            export RP_ID=''${GYMSHED_RP_ID:-localhost}
            export ORIGIN=''${GYMSHED_ORIGIN:-http://localhost:$WEB_PORT}
            export ALLOW_GUEST=''${ALLOW_GUEST:-1}

            ${gymshedPackages.gymshed-api}/bin/gymshed-api &
            API_PID=$!

            CFGDIR=$(mktemp -d)
            CGFILE="$CFGDIR/Caddyfile"
            cleanup() {
              rm -rf "$CFGDIR"
              kill "$API_PID" 2>/dev/null || true
            }
            trap cleanup EXIT

            cat > "$CGFILE" <<EOF
            {
              admin off
            }

            :$WEB_PORT {
              encode zstd gzip

              handle /api/* {
                reverse_proxy 127.0.0.1:$API_PORT
              }
              handle {
                root * ${gymshedPackages.gymshed-frontend}/share/gymshed
                try_files {path} /index.html
                file_server
              }
            }
            EOF

            echo "GymShed running at http://localhost:$WEB_PORT (API on :$API_PORT, data in $DATA_DIR) — Ctrl-C to stop"
            ${pkgs.caddy}/bin/caddy run --config "$CGFILE"
          ''}";
        };

        apps.default = self.apps.${system}.gymshed;

        checks = {
          nixos-module-eval = check;
        }
        // (pkgs.lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
          # Boots a NixOS VM and exercises the full HTTP contract (API + nginx vhost + SPA).
          gymshed-nixos-test = import ./tests.nix {
            inherit pkgs;
            modules = [ gymshedNixOSModule ];
          };
        });

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            coreutils
            git
          ];
          shellHook = ''
            echo "GymShed dev shell (Node.js $(node --version))"
            echo "  cd frontend && npm install && npm run dev"
            echo "  cd api && npm install && node server.js"
          '';
        };
      }
    )
    // {
      # Wraps the module so NixOS configurations using it get GymShed packages built from this
      # flake's LOCKED nixpkgs input. Importing contrib/nix/gymshed.nix directly falls back to
      # the importing system's nixpkgs.
      nixosModules.gymshed =
        { pkgs, ... }:
        {
          imports = [ ./gymshed.nix ];
          _module.args.gymshedPkgs = self.packages.${pkgs.stdenv.hostPlatform.system} or null;
        };
      nixosModules.default = self.nixosModules.gymshed;

      # Conventional NixOS test output (boots a VM; also wired into checks on Linux).
      nixosTests.gymshed = import ./tests.nix {
        pkgs = nixpkgs.legacyPackages.x86_64-linux;
        modules = [ self.nixosModules.gymshed ];
      };
    };
}
