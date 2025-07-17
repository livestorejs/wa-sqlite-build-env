# Using wa-sqlite + sqldiff-wasm in Vite

## Installation

```bash
pnpm add @livestore/wa-sqlite @schickling/sqldiff-wasm
```

## Dependencies

```json
{
  "dependencies": {
    "@livestore/wa-sqlite": "^1.0.0",
    "@schickling/sqldiff-wasm": "^0.0.1"
  }
}
```

## Basic Usage

```javascript
import SQLiteESMFactory from '@livestore/wa-sqlite/dist/wa-sqlite.mjs';
import { MemoryVFS } from '@livestore/wa-sqlite/src/examples/MemoryVFS.js';
import * as SQLite from '@livestore/wa-sqlite/src/sqlite-api.js';
import { SqlDiffWasm } from '@schickling/sqldiff-wasm';

// Initialize wa-sqlite
const module = await SQLiteESMFactory();
const sqlite3 = SQLite.Factory(module);
const vfs = new MemoryVFS('memory', module);
sqlite3.vfs_register(vfs, true);

// Initialize sqldiff
const sqlDiff = new SqlDiffWasm();
await sqlDiff.init();

// Create database
const db = await sqlite3.open_v2('test.db', undefined, 'memory');

// Use sqldiff to compare databases
const db1Data = sqlite3.serialize(db);
const db2Data = sqlite3.serialize(db); // after modifications
const diffResult = await sqlDiff.diff(db1Data, db2Data);
```

## Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@schickling/sqldiff-wasm', '@livestore/wa-sqlite']
  },
  assetsInclude: ['**/*.wasm']
});
```

## Key Points

- Use `@livestore/wa-sqlite` (not `wa-sqlite`) for the `serialize` function
- Both libraries handle WASM loading automatically
- No manual WASM file copying required
- Exclude both packages from Vite's dependency optimization 