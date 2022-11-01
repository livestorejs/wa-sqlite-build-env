# sqlite-wasm-esm

The new [SQLite WASM build](https://github.com/sqlite/sqlite/tree/master/ext/wasm/) is rather hard to use in modern JS apps, so this wrapper package tries to make this easier.

Currently only tested with Vite.

## Usage

```sh
yarn add sqlite-wasm-esm
```

### Vite config

```js
{
	// ...
	// requires the following options
	build: { target: ['es2020'], },
	optimizeDeps: { esbuildOptions: { target: 'es2020' } },
}
```

```sh
# TODO report & fix bug in Vite (currently 404 for those files)
cp node_modules/sqlite-wasm-esm/dist/sqlite3{.wasm,-opfs-async-proxy.js} node_modules/.vite/deps/
```
