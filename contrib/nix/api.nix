{
  lib,
  buildNpmPackage,
  nodejs_22,
  makeWrapper,
  importNpmLock,
  version,
}:

buildNpmPackage rec {
  pname = "gymshed-api";
  inherit version;

  src = ./../../api;

  nodejs = nodejs_22;

  npmDeps = importNpmLock { npmRoot = src; };
  npmConfigHook = importNpmLock.npmConfigHook;

  dontNpmBuild = true;

  nativeBuildInputs = [ makeWrapper ];

  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/gymshed-api
    cp -r node_modules $out/lib/gymshed-api/
    cp -r coach $out/lib/gymshed-api/
    # Every top-level module server.js imports: server.js, password.js, passkeys-store.js,
    # rate-limit.js, media.js, device-link.js, push-messages.js, verify-error.js. Copy the
    # glob rather than an explicit list — a hand-kept list silently ships an incomplete tree
    # and the failure only shows up as ERR_MODULE_NOT_FOUND in the systemd journal.
    cp ./*.js $out/lib/gymshed-api/

    mkdir -p $out/bin
    makeWrapper ${nodejs_22}/bin/node $out/bin/gymshed-api \
      --add-flags "$out/lib/gymshed-api/server.js" \
      --set NODE_ENV production
    runHook postInstall
  '';

  meta = with lib; {
    description = "GymShed API — passkey auth + per-user workout data (Node.js)";
    homepage = "https://gitlab.com/gymshed/gymshed";
    license = licenses.agpl3Plus;
    platforms = nodejs.meta.platforms;
  };
}
