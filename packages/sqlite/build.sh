#! /bin/bash

# In case you're wondering. Yes, this build script is doing unholy things...

set -e

# nix shell nixpkgs#esbuild

rm -rf dist
mkdir dist

cp src/sqlite3.d.ts dist
cp lib/sqlite3.wasm dist

cp lib/sqlite3.js lib/sqlite3.js.txt
esbuild src/sqlite3-wrapper.js --outfile=dist/sqlite3.js --format=esm --target=es2020 --bundle
rm lib/sqlite3.js.txt

cp lib/sqlite3-opfs-async-proxy.js dist

sed -i '' 's|const originalInit = self.sqlite3InitModule;|const originalInit = sqlite3InitModule;|g' dist/sqlite3.js

# -w 0 disables newlines
# PROXY_WORKER_B64=$(base64 -w 0 lib/sqlite3-opfs-async-proxy.js)
# PROXY_WORKER_DATA_URL="data:text/javascript;base64,$PROXY_WORKER_B64"
# sed -i '' "s|const W = new Worker(options.proxyUri);|const proxyWorkerUrl = new URL(\"$PROXY_WORKER_DATA_URL\", self.location);\n    const W = new Worker(proxyWorkerUrl, { type: 'module' });|g" dist/sqlite3.js

# sed -i '' "s|const W = new Worker(options.proxyUri);|const W = new Worker(globalThis.proxyWorkerUrl, { type: 'module' });|g" dist/sqlite3.js
sed -i '' "s|const W = new Worker(options.proxyUri);|const W = globalThis.makeProxyWorker();|g" dist/sqlite3.js

sed -i '' "s|wasmBinaryFile = 'sqlite3.wasm';|wasmBinaryFile = globalThis.wasmBinaryFile;|g" dist/sqlite3.js

# sqlite3.wasm file path is already fully resolved via Vite
sed -i '' "s|wasmBinaryFile = locateFile(wasmBinaryFile)|// wasmBinaryFile = locateFile(wasmBinaryFile)|g" dist/sqlite3.js

# prevent warn log message (even during dev)
sed -i '' "s|console.warn(\"Installing sqlite3|// console.warn(\"Installing sqlite3|g" dist/sqlite3.js

