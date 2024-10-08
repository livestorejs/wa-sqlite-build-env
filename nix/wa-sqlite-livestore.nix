{ lib, stdenv, fetchFromGitHub, fetchurl, pkgs }:
let 
  extension-functions = ./extension-functions.c;
  localWaSqlite = ../wa-sqlite;  # Adjust this path as needed
in
stdenv.mkDerivation rec {
  pname = "wa-sqlite-livestore";
  version = "3.46.0";
  # version = "3.46.1";

  srcs = [
    localWaSqlite
    (fetchFromGitHub {
      owner = "sqlite";
      repo = "sqlite";
      rev = "5fb718aaab631e6a7f750e5049aa6f1eb33fb4a8";
      sha256 = "sha256-ySHTmoONjoN965Q3OrYQRC6MiuCMDRvHnyRcjV6fa4Y=";
      # version = "3.46.1";
      # rev = "f3d536d37825302e31ed0eddd811c689f38f85a3";
      # sha256 = "sha256-dJd03TOsNkOeW3f8vC5hXiIx+/w74vXcnq6HkRL7A24=";
      name = "sqlite-src";
    })
  ];

  sourceRoot = pname;

  unpackPhase = ''
    runHook preUnpack

    mkdir -p ${pname}
    cd ${pname}
    
    # Unpack the SQLite source to sqlite-src
    unpackFile ${builtins.elemAt srcs 1}

    # Copy wa-sqlite sources
    cp -r ${localWaSqlite}/* .

    # Set the source root
    sourceRoot=${pname}

    cd ..

    runHook postUnpack
  '';

  # Disable the automatic update of GNU config scripts
  dontUpdateAutotoolsGnuConfigScripts = true;

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
    pwd
    ls -la

    mkdir -p cache/version-${version}
    cp -r ./sqlite-src/* ./cache/version-${version}

    cp ${extension-functions} ./cache/extension-functions.c

    # Since we provide the source code via Nix, we don't need to download it
    # comment out all `curl` commands in `Makefile` of wa-sqlite
    chmod u+w Makefile # Ensure we have write permissions for the Makefile
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

    # Ensure dist directory exists and has correct permissions
    mkdir -p dist
    chmod 755 dist

    # Extra build with FTS5
    make dist/wa-sqlite.mjs dist/wa-sqlite.node.mjs WASQLITE_EXTRA_DEFINES="-DSQLITE_ENABLE_BYTECODE_VTAB -DSQLITE_ENABLE_SESSION -DSQLITE_ENABLE_PREUPDATE_HOOK -DSQLITE_ENABLE_FTS5"
    mkdir -p dist-fts5
    mv dist/wa-sqlite* dist-fts5

    make clean

    # Add SQLite flags to `ext/wasm/api/sqlite3-wasm.c` (bytecode, session (incl. preupdate))
    make dist/wa-sqlite.mjs dist/wa-sqlite.node.mjs WASQLITE_EXTRA_DEFINES="-DSQLITE_ENABLE_BYTECODE_VTAB -DSQLITE_ENABLE_SESSION -DSQLITE_ENABLE_PREUPDATE_HOOK"

    mkdir -p dist/fts5
    mv dist-fts5/wa-sqlite* dist/fts5
    rm -rf dist-fts5

  '';

  installPhase = ''
    cp -r . $out
  '';
}
