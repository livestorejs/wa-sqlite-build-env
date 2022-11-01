import sqlite3RawSrc from '../lib/sqlite3.js.txt'

// these calls need to happen within a ESM module for Vite's magic to work
const proxyWorkerUrl = new URL('sqlite3-opfs-async-proxy.js', import.meta.url).href;
globalThis.makeProxyWorker = () => new Worker(proxyWorkerUrl, { type: 'module' });

globalThis.wasmBinaryFile = new URL('sqlite3.wasm', import.meta.url).href;

const init = () => {
	eval(sqlite3RawSrc)

	return self.sqlite3InitModule()
}

export default init