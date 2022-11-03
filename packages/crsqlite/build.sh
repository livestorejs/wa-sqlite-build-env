#! /bin/bash

# In case you're wondering. Yes, this build script is doing unholy things...

set -e

rm -rf dist
mkdir dist

cp src/sqlite3.d.ts dist
cp lib/sqlite3.wasm dist

cat <(echo "export default function install(wrapper) {") lib/sqlite3.js <(echo "wrapper.self = self; }") > dist/sqlite3.js

cp lib/sqlite3-opfs-async-proxy.js dist

sed -i '' 's|const originalInit = self.sqlite3InitModule;|const originalInit = sqlite3InitModule;|g' dist/sqlite3.js

sed -i '' "s|const W = new Worker(options.proxyUri);|const W = wrapper.makeProxyWorker();|g" dist/sqlite3.js

sed -i '' "s|wasmBinaryFile = 'sqlite3.wasm';|wasmBinaryFile = wrapper.wasmBinaryFile;|g" dist/sqlite3.js

sed -i '' "s|wasmBinaryFile = locateFile(wasmBinaryFile)|// wasmBinaryFile = locateFile(wasmBinaryFile)|g" dist/sqlite3.js

# prevent warn log message (even during dev)
sed -i '' "s|console.warn(\"Installing sqlite3|// console.warn(\"Installing sqlite3|g" dist/sqlite3.js

sed -i '' "s|Module\['locateFile'\] = function(path, prefix) {|Module\['locateFile'\] = function(path, prefix) { return wrapper.wasmBinaryFile;|" dist/sqlite3.js

cp src/sqlite3-wrapper.js dist/sqlite3-wrapper.js