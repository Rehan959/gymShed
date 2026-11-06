{
  lib,
  buildNpmPackage,
  nodejs_22,
  makeWrapper,
  importNpmLock,
  version,
}:

buildNpmPackage rec {
  pname = "gymshed-mcp";
  inherit version;

  src = ./../../mcp;

  # The MCP server reads shared domain helpers from the sibling frontend/src/lib; include them.
  frontendSrc = ./../../frontend;

  nodejs = nodejs_22;

  npmDeps = importNpmLock { npmRoot = src; };
  npmConfigHook = importNpmLock.npmConfigHook;

  dontNpmBuild = true;

  nativeBuildInputs = [ makeWrapper ];

  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/gymshed-mcp
    cp -r node_modules $out/lib/gymshed-mcp/
    cp -r src $out/lib/gymshed-mcp/

    # The MCP server imports shared training/domain helpers from ../../frontend/src/lib
    # (history, exercises, muscles, onerm, progression, workout-model, format, …). They are
    # resolved relative to $out/lib/gymshed-mcp/src, so they must sit at $out/lib/frontend/src/lib.
    mkdir -p $out/lib/frontend/src
    cp -r $frontendSrc/src/lib $out/lib/frontend/src/lib

    mkdir -p $out/bin
    makeWrapper ${nodejs_22}/bin/node $out/bin/gymshed-mcp \
      --add-flags "$out/lib/gymshed-mcp/src/index.js"
    runHook postInstall
  '';

  meta = with lib; {
    description = "GymShed MCP server — read-only stdio bridge for LLM clients";
    homepage = "https://gitlab.com/gymshed/gymshed";
    license = licenses.agpl3Plus;
    platforms = nodejs.meta.platforms;
  };
}
