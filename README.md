# wa-sqlite-build-env

Build environment for [livestorejs/wa-sqlite](https://github.com/livestorejs/wa-sqlite).

## Install

```bash
pnpm install
```

## Test

```bash
pnpm test:run
```

## Build

Build wa-sqlite using Nix:

```bash
nix run .#build-wa-sqlite
```

This will:
- Initialize the wa-sqlite submodule if needed
- Build wa-sqlite with emscripten using the configured SQLite version
- Generate both standard and FTS5-enabled builds
- Copy the built artifacts to `wa-sqlite/dist/`

The build generates:
- `wa-sqlite/dist/wa-sqlite.mjs` - Browser build
- `wa-sqlite/dist/wa-sqlite.node.mjs` - Node.js build  
- `wa-sqlite/dist/wa-sqlite.wasm` - WebAssembly binary
- `wa-sqlite/dist/fts5/` - FTS5 full-text search variants

## Publish

```sh
cd wa-sqlite
pnpm publish
```
