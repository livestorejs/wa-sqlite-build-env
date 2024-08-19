{ lib, stdenv, fetchFromGitHub, fetchurl, pkgs }:
let 
  extension-functions = ./extension-functions.c;
  # wa-sqlite = ./../wa-sqlite;
in
stdenv.mkDerivation rec {
  pname = "wa-sqlite-livestore";
  version = "3.46.0";

  srcs = [
    (fetchFromGitHub {
      owner = "rhashimoto";
      repo = "wa-sqlite";
      rev = "f5092b5bce7b7edb6371ca53ec8b9ebf332d82c2";
      sha256 = "sha256-2XczCBLeViooKTkT7tSOOaRg/m6C7MIEMZLrr9EiKiI=";
      # sha256 = lib.fakeSha256;
      name = pname;
    })
    (fetchFromGitHub {
      owner = "sqlite";
      repo = "sqlite";
      rev = "5fb718aaab631e6a7f750e5049aa6f1eb33fb4a8";
      sha256 = "sha256-ySHTmoONjoN965Q3OrYQRC6MiuCMDRvHnyRcjV6fa4Y=";
      # sha256 = lib.fakeSha256;
      name = "sqlite-src";
    })
  ];

  # sourceRoot = wa-sqlite;
  sourceRoot = pname;

  # preUnpack = ''
  #   mkdir -p ${sourceRoot}
  #   cp -r ${wa-sqlite}/* ${sourceRoot}
  # '';


  # src = ./../wa-sqlite;

  nativeBuildInputs = [
    pkgs.which # needed for Make file
    pkgs.tcl
    pkgs.gcc
    pkgs.wabt
    pkgs.emscripten
    pkgs.unzip
    pkgs.openssl
    pkgs.zip
  ];

  # unpackPhase = ''
  # mkdir -p ${pname}
  # echo $PWD
  #   cp -r ${wa-sqlite}/* ${pname}
  # ls -la
  # ls -la ${pname}
  # '';

  configurePhase = ''
  ls -la

    mkdir -p cache/version-${version}
    cp -r ../sqlite-src/* ./cache/version-${version}

    cp ${extension-functions} ./cache/extension-functions.c

    # Since we provide the source code via Nix, we don't need to download it
    # comment out all `curl` commands in `Makefile` of wa-sqlite
    sed -i 's/curl/#curl/g' Makefile

    # Add `dist/wa-sqlite.node.mjs` to end of `Makefile` of wa-sqlite
    cat >> Makefile <<EOF
  dist/wa-sqlite.node.mjs: \$(OBJ_FILES_DIST) \$(JSFILES) \$(EXPORTED_FUNCTIONS) \$(EXPORTED_RUNTIME_METHODS)
  ''\tmkdir -p dist
  ''\t\$(EMCC) \$(EMFLAGS_NODE) \$(EMFLAGS_INTERFACES) \$(EMFLAGS_LIBRARIES) -s ENVIRONMENT=node \$(OBJ_FILES_DIST) -o \$@
  EOF

    cat Makefile
  '';

  buildPhase = ''
    # Needed for `make`
    export DESTDIR="$PWD"
    export HOME="$PWD"

    # Add SQLite flags to `ext/wasm/api/sqlite3-wasm.c` (bytecode, session (incl. preupdate))
    make dist dist/wa-sqlite.node.mjs WASQLITE_EXTRA_DEFINES="-DSQLITE_ENABLE_BYTECODE_VTAB -DSQLITE_ENABLE_SESSION -DSQLITE_ENABLE_PREUPDATE_HOOK"

  '';

  installPhase = ''
    cp -r . $out
  '';
}
