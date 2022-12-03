# sqlite-wasm-esm

The new [SQLite WASM build](https://github.com/sqlite/sqlite/tree/master/ext/wasm/) is rather hard to use in modern JS apps, so this wrapper package tries to make this easier.

Currently only tested with Vite. According to the

## Usage

```sh
yarn add sqlite-wasm-esm
```

```js
// your-worker.js
import sqlite3InitModule from "sqlite-wasm-esm";

sqlite3InitModule().then((sqlite3) => {
  const opfsDb = new sqlite3.opfs.OpfsDb("my-db", "c");
  // or in-memory ...
  const db = new sqlite3.DB();
});
```

### Vite config

```js
{
	// ...
	build: { target: ['es2020'], }, // Needed in `sqlite-wasm-esm` for big-ints to work
	optimizeDeps: {
		exclude: ['sqlite-wasm-esm'], // TODO remove once fixed https://github.com/vitejs/vite/issues/8427
    esbuildOptions: { target: 'es2020' }, // Needed in `sqlite-wasm-esm` for big-ints to work
	},
}
```
