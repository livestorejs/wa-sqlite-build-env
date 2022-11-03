import install from "./sqlite3.js";

const wrapper = {};
// these calls need to happen within a ESM module for Vite's magic to work
const proxyWorkerUrl = new URL("sqlite3-opfs-async-proxy.js", import.meta.url)
  .href;
wrapper.makeProxyWorker = () => new Worker(proxyWorkerUrl, { type: "module" });

wrapper.wasmBinaryFile = new URL("sqlite3.wasm", import.meta.url).href;

const init = () => {
  install(wrapper);
  return wrapper.self.sqlite3InitModule(wrapper);
};

export default init;
