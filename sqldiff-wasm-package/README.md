# sqldiff-wasm

WebAssembly build of SQLite's `sqldiff` utility with JavaScript bindings.

## Installation

```bash
npm install @schickling/sqldiff-wasm
```

## Quick Start

```javascript
import { createSqlDiff } from '@schickling/sqldiff-wasm';

// Create sqldiff instance
const sqldiff = await createSqlDiff();

// Load databases (as Uint8Array)
const db1 = new Uint8Array(/* your database bytes */);
const db2 = new Uint8Array(/* your database bytes */);

// Compare databases and get SQL diff
const result = await sqldiff.diff(db1, db2);
console.log(result.sql); // SQL statements to transform db1 into db2
console.log(result.exitCode); // 0 for success

// Get summary of changes
const summary = await sqldiff.summary(db1, db2);
console.log(summary.output); // Table-by-table summary
```

## API Reference

### `createSqlDiff()`

Creates a new sqldiff instance.

**Returns:** `Promise<SqlDiff>`

### `SqlDiff` Methods

#### `diff(db1: Uint8Array, db2: Uint8Array, options?: DiffOptions): Promise<DiffResult>`

Compare two SQLite databases and return SQL statements to transform db1 into db2.

**Parameters:**
- `db1` - First database as Uint8Array
- `db2` - Second database as Uint8Array  
- `options` - Optional configuration

**Returns:** `Promise<DiffResult>`

#### `summary(db1: Uint8Array, db2: Uint8Array): Promise<DiffResult>`

Get a summary of differences between two databases.

#### `schemaDiff(db1: Uint8Array, db2: Uint8Array): Promise<DiffResult>`

Compare only the schema (structure) of two databases.

#### `tableDiff(db1: Uint8Array, db2: Uint8Array, tableName: string): Promise<DiffResult>`

Compare a specific table between two databases.

#### `transactionDiff(db1: Uint8Array, db2: Uint8Array, options?: DiffOptions): Promise<DiffResult>`

Get diff wrapped in a transaction (BEGIN...COMMIT).

### Types

```typescript
interface DiffOptions {
  /** Use schema-defined PRIMARY KEYs */
  primarykey?: boolean;
  /** Handle fts3, fts4, fts5 and rtree tables */
  vtab?: boolean;
  /** Output SQL to create/populate RBU table(s) */
  rbu?: boolean;
}

interface DiffResult {
  /** SQL output from sqldiff */
  sql: string;
  /** Exit code (0 for success) */
  exitCode: number;
  /** Raw output (includes both stdout and stderr) */
  output: string;
}
```

## Command Line Options

The underlying sqldiff utility supports these options:

- `--changeset FILE` - Write a CHANGESET into FILE
- `--primarykey` - Use schema-defined PRIMARY KEYs  
- `--rbu` - Output SQL to create/populate RBU table(s)
- `--schema` - Show only differences in the schema
- `--summary` - Show only a summary of the differences
- `--table TAB` - Show only differences in table TAB
- `--transaction` - Show SQL output inside a transaction
- `--vtab` - Handle fts3, fts4, fts5 and rtree tables

## Examples

### Basic Database Comparison

```javascript
import { createSqlDiff } from 'sqldiff-wasm';
import fs from 'fs';

const sqldiff = await createSqlDiff();

// Read database files
const db1 = fs.readFileSync('database1.db');
const db2 = fs.readFileSync('database2.db');

// Get the diff
const result = await sqldiff.diff(db1, db2);

if (result.exitCode === 0) {
  console.log('Differences found:');
  console.log(result.sql);
} else {
  console.log('No differences or error occurred');
}
```

### Schema-Only Comparison

```javascript
const result = await sqldiff.schemaDiff(db1, db2);
console.log('Schema differences:');
console.log(result.sql);
```

### Table-Specific Comparison

```javascript
const result = await sqldiff.tableDiff(db1, db2, 'users');
console.log('Differences in users table:');
console.log(result.sql);
```

### Browser Usage

```javascript
// In browser environments
import { createSqlDiff } from 'sqldiff-wasm';

const sqldiff = await createSqlDiff();

// Use with File API
const fileInput = document.getElementById('database-file');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const db = new Uint8Array(arrayBuffer);
  
  // Compare with another database...
  const result = await sqldiff.diff(db1, db2);
  console.log(result.sql);
});
```

## Requirements

- Node.js 18+ (for Node.js environments)
- Modern browser with WebAssembly support (for browser environments)

## License

MIT

## See Also

- [SQLite sqldiff documentation](https://sqlite.org/sqldiff.html)
- [wa-sqlite](https://github.com/rhashimoto/wa-sqlite) - WebAssembly SQLite 