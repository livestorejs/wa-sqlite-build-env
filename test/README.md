# WA-SQLite Test Suite

This directory contains a comprehensive test suite for wa-sqlite functionality, including both unit tests and example scripts.

## Setup

1. Install dependencies (from project root):
   ```bash
   pnpm install
   ```

2. Run tests:
   ```bash
   pnpm test:run
   ```

   Or run in watch mode:
   ```bash
   pnpm test
   ```

3. Run type checking:
   ```bash
   pnpm type-check
   ```

## Directory Structure

```
test/
├── lib/                     # Core utilities and helpers
│   ├── lib.ts              # Synchronous DB wrapper
│   └── sqlite-utils.ts     # SQLite loading utilities
├── unit/                   # Unit tests
│   ├── basic-sqlite-api.test.ts
│   └── session-extension.test.ts
├── examples/               # Example scripts
│   ├── session-ext.ts
│   ├── session-ext2.ts
│   ├── session-ext3.ts
│   ├── session-ext4.ts
│   └── test-blob.ts
└── types.d.ts             # Type declarations
```

## Test Coverage

### Basic SQLite Synchronous API (`unit/basic-sqlite-api.test.ts`)

- ✅ Create and execute basic SQL statements
- ✅ Handle prepared statements  
- ✅ Handle transactions
- ✅ Handle named parameters
- ✅ Handle different data types (TEXT, INTEGER, REAL, BLOB, NULL)
- ✅ Database export functionality
- ✅ Track row changes

### Session Extension (`unit/session-extension.test.ts`)

- ✅ Create and manage session objects
- ✅ Track changes when session is enabled
- ✅ Session behavior when disabled
- ✅ Apply changeset to revert changes
- ✅ Handle multiple independent sessions
- ✅ Track specific table changes when attached to specific table
- ✅ Session lifecycle management
- ✅ Complex changeset operations

## Technical Details

The test setup uses:
- **vitest** for the test runner
- **wa-sqlite Node.js build** for SQLite functionality
- **MemoryVFS** for in-memory database testing
- **Synchronous database wrapper** for easier testing

All tests run in Node.js environment with the synchronous SQLite API wrapper provided in `lib/lib.ts`.

## Example Scripts

The `examples/` directory contains various demonstration scripts:

- `session-ext.ts` - Basic session extension usage with changeset operations
- `session-ext2.ts` - Advanced session management patterns
- `session-ext3.ts` - Session isolation and conflict handling
- `session-ext4.ts` - Complex session workflow examples
- `test-blob.ts` - BLOB data handling examples

These can be run individually using:
```bash
bun test/examples/session-ext.ts
```

## CI/CD

The test suite is automatically run in GitHub Actions on:
- ✅ Push to main branch
- ✅ Pull requests to main branch
- ✅ Node.js 24 with pnpm
- ✅ TypeScript type checking
- ✅ Full test execution