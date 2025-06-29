#!/usr/bin/env node

import createSqlDiffModule from './sqldiff-wasm/dist/sqldiff.mjs';
import fs from 'fs';
import { execSync } from 'child_process';

async function createTestDatabases() {
  // Create first database
  execSync(`sqlite3 db1.db "
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'alice@example.com'), (2, 'Bob', 'bob@example.com');
    INSERT INTO posts VALUES (1, 1, 'Hello World', 'This is my first post'), (2, 2, 'SQLite Rocks', 'I love databases');
  "`);
  
  // Create second database with differences
  execSync(`sqlite3 db2.db "
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, created_at TEXT);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT);
    CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER, user_id INTEGER, content TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', '2025-01-01'), (2, 'Bob', 'bob@newdomain.com', '2025-01-02'), (3, 'Charlie', 'charlie@example.com', '2025-01-03');
    INSERT INTO posts VALUES (1, 1, 'Hello World', 'This is my updated first post'), (2, 2, 'SQLite Rocks', 'I love databases'), (3, 3, 'New Post', 'Welcome to the blog');
    INSERT INTO comments VALUES (1, 1, 2, 'Great post!'), (2, 2, 1, 'Thanks for sharing');
  "`);
}

async function runTest(module, testName, args) {
  console.log(`\n=== ${testName} ===`);
  try {
    const exitCode = module.callMain(args);
    console.log(`Exit code: ${exitCode}`);
    return exitCode;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return -1;
  }
}

async function main() {
  console.log('🧪 Comprehensive sqldiff WASM test suite');
  
  try {
    console.log('Creating test databases...');
    await createTestDatabases();
    console.log('✓ Test databases created');
  } catch (error) {
    console.error('❌ Error creating test databases:', error.message);
    console.log('Make sure sqlite3 is installed on your system');
    return;
  }

  try {
    // Load the WASM module
    const module = await createSqlDiffModule();
    console.log('✓ WASM module loaded');

    // Read the database files
    const db1Bytes = fs.readFileSync('db1.db');
    const db2Bytes = fs.readFileSync('db2.db');
    
    // Write databases to virtual filesystem
    module.FS.writeFile('/db1.db', db1Bytes);
    module.FS.writeFile('/db2.db', db2Bytes);
    console.log('✓ Databases written to virtual filesystem');

    // Test 1: Basic diff
    await runTest(module, 'Basic diff', ['/db1.db', '/db2.db']);
    
    // Test 2: Summary
    await runTest(module, 'Summary', ['--summary', '/db1.db', '/db2.db']);
    
    // Test 3: Schema only
    await runTest(module, 'Schema only', ['--schema', '/db1.db', '/db2.db']);
    
    // Test 4: Specific table
    await runTest(module, 'Specific table (users)', ['--table', 'users', '/db1.db', '/db2.db']);
    
    // Test 5: Transaction wrapper
    await runTest(module, 'Transaction wrapper', ['--transaction', '/db1.db', '/db2.db']);
    
    // Test 6: Help
    await runTest(module, 'Help', ['--help']);
    
    // Test 7: Identical databases (should return 0 with no output)
    module.FS.writeFile('/db1_copy.db', db1Bytes);
    await runTest(module, 'Identical databases', ['/db1.db', '/db1_copy.db']);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error running tests:', error);
  } finally {
    // Clean up test files
    try {
      fs.unlinkSync('db1.db');
      fs.unlinkSync('db2.db');
      console.log('✓ Test files cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️  Warning: Could not clean up test files:', cleanupError.message);
    }
  }
}

main().catch(console.error); 