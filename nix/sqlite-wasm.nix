{ lib, stdenv, fetchFromGitHub, pkgs }:

stdenv.mkDerivation rec {
  pname = "sqlite-wasm";
  version = "3.40.0";

  src = fetchFromGitHub {
    owner = "sqlite";
    repo = "sqlite";
    rev = "8d7b41302f13ce815a6f1535ef8cc8f8fd5a1c8e";
    sha256 = "sha256-2gvucSHyaqP0EHEkvpUmvkxlWx76FKBXIVdODSXWZR4=";
    # sha256 = lib.fakeSha256;
  };

  nativeBuildInputs = [
    pkgs.which # needed for Make file
    pkgs.tcl
    pkgs.gcc
    pkgs.wabt
    pkgs.emscripten
    pkgs.unzip
    pkgs.zip
  ];

  configurePhase = ''
    cp -r ${pkgs.emscripten}/share/emscripten/cache/ $TMPDIR/emscripten_cache_sqlite
    chmod u+rwX -R $TMPDIR/emscripten_cache_sqlite
    export EM_CACHE=$TMPDIR/emscripten_cache_sqlite

    ./configure
  '';

  buildPhase = ''
    # Needed for `make`
    export DESTDIR="$PWD"

    make -C ext/wasm dist
    # make -C ext/wasm esm

    cp -r . $out
  '';
}
