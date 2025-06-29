{ lib, stdenv, fetchFromGitHub, fetchurl, pkgs, pkgsUnstable }:

stdenv.mkDerivation rec {
  pname = "sqldiff-wasm";
  version = "3.47.0";

  src = fetchFromGitHub {
    owner = "sqlite";
    repo = "sqlite";
    rev = "f5fb820c0f4781337faf02ed871be68d13a83d94";
    sha256 = "sha256-35xrRPgoj92rji9EAyCHvhMP/NEz9hffOMJyhSKCCZ8=";
    name = "sqlite-src";
  };

  # Disable the automatic update of GNU config scripts
  dontUpdateAutotoolsGnuConfigScripts = true;

  nativeBuildInputs = [
    pkgs.which # needed for Make file
    pkgs.tcl
    pkgs.gcc
    pkgs.wabt
    pkgsUnstable.emscripten
    pkgs.unzip
    pkgs.openssl
    pkgs.zip
  ];

  configurePhase = ''
    echo "Emscripten version:"
    emcc --version

    pwd
    ls -la

    # Configure SQLite with all features enabled
    ./configure --enable-all

    # Make sqlite3.c amalgamation
    make sqlite3.c

    # Copy sqldiff.c from tool directory for building
    cp tool/sqldiff.c .
    
    # Copy required header files from ext/misc directory
    cp ext/misc/sqlite3_stdio.h .
  '';

  buildPhase = ''
    # Needed for `make`
    export DESTDIR="$PWD"
    export HOME="$PWD"

    mkdir -p cache/emscripten
    export EM_CACHE="$PWD/cache/emscripten"

    # Ensure dist directory exists and has correct permissions
    mkdir -p dist
    chmod 755 dist

    # Build WASM version of sqldiff
    emcc -O2 \
      -s WASM=1 \
      -s ALLOW_MEMORY_GROWTH=1 \
      -s ENVIRONMENT="web,worker,node" \
      -s INVOKE_RUN=0 \
      -s MODULARIZE=1 \
      -s EXPORT_ES6=1 \
      -s EXPORT_NAME="createSqlDiffModule" \
      -s EXPORTED_FUNCTIONS='["_main", "_malloc", "_free"]' \
      -s EXPORTED_RUNTIME_METHODS='["callMain", "FS", "PROXYFS", "MEMFS", "ccall", "cwrap"]' \
      -s STACK_SIZE=512KB \
      -s WASM_BIGINT=0 \
      -DSQLITE_ENABLE_BYTECODE_VTAB \
      -DSQLITE_ENABLE_SESSION \
      -DSQLITE_ENABLE_PREUPDATE_HOOK \
      sqldiff.c sqlite3.c \
      -o dist/sqldiff.mjs

    # Create a README with usage instructions
    cat > dist/README.md << 'EOF'
# SqlDiff WASM

This package contains a WebAssembly build of SQLite's sqldiff utility.

## Files

- `sqldiff.mjs` - The main WASM module
- `sqldiff.wasm` - The WebAssembly binary

## Usage

```javascript
import createSqlDiffModule from './sqldiff.mjs';

async function main() {
  const module = await createSqlDiffModule();
  
  // Write test databases to virtual filesystem
  module.FS.writeFile('/db1.sqlite', db1Bytes);
  module.FS.writeFile('/db2.sqlite', db2Bytes);
  
  // Run sqldiff
  const result = module.callMain(['sqldiff', '/db1.sqlite', '/db2.sqlite']);
  
  console.log('Exit code:', result);
}

main();
```

## Command Line Options

The WASM version supports the same options as the native sqldiff:

- `--changeset FILE` - Write binary changeset to FILE
- `--schema` - Show only schema differences  
- `--summary` - Show summary of changes
- `--table TABLE` - Show differences for specific table
- `--transaction` - Wrap output in transaction
- `--vtab` - Handle virtual tables
EOF
  '';

  installPhase = ''
    cp -r . $out
  '';
} 