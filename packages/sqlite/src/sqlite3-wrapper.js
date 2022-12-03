import wasmBinaryFileUrl from "./sqlite3.wasm?url";
// import proxyWorkerFileUrl from './sqlite3-opfs-async-proxy.js?url';
import install from "./sqlite3.js";

import proxyWorkerFileStr from "./sqlite3-opfs-async-proxy.js.txt?raw";
const proxyWorkerFileUrl = URL.createObjectURL(new Blob([proxyWorkerFileStr], {type: 'application/javascript'}))

const wrapper = {};

const init = () => {
  install(wrapper, wasmBinaryFileUrl, proxyWorkerFileUrl);
  return wrapper.self.sqlite3InitModule(wrapper);
};

export default init;
