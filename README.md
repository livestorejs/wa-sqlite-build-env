# wa-sqlite-build-env

Build environment for [livestorejs/wa-sqlite](https://github.com/livestorejs/wa-sqlite) and SQLite utilities.

## Build wa-sqlite

```sh
cp -r wa-sqlite wa-sqlite-local
rm -rf wa-sqlite-local/.git
git add wa-sqlite-local
# update `localWaSqlite` in `nix/wa-sqlite-livestore.nix`
nix develop  --print-build-logs     

# TODO bring this back once Nix-submodule issue is fixed
rm -rf wa-sqlite/dist
nix develop '.?submodules=1' --print-build-logs     
```

NOTE: `.?submodules=1` is required since `wa-sqlite` is a submodule.

## Build sqldiff WASM

Build a WebAssembly version of SQLite's `sqldiff` utility with JavaScript bindings:

```sh
nix run .#build-sqldiff
```

This creates `sqldiff-wasm/dist/` with:
- `sqldiff.mjs` - ES6 module with WASM loader
- `sqldiff.wasm` - WebAssembly binary
- `README.md` - Usage instructions

### Testing sqldiff WASM

Run the comprehensive test suite:

```sh
node test-sqldiff-comprehensive.js
```

This tests all sqldiff features including basic diff, summary, schema-only, table-specific diffs, transaction wrapping, and help.

## Publish

```sh
cd wa-sqlite
pnpm publish
```
