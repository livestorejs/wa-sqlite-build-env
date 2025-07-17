#!/usr/bin/env node

import { createSqlDiff } from './dist/index.mjs';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  console.log('🔍 SQLDiff WASM Example');
  console.log('========================');
  
  // Create two sample databases
  console.log('📁 Creating sample databases...');
  
  execSync(`sqlite3 example1.db "
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'alice@example.com'), (2, 'Bob', 'bob@example.com');
    INSERT INTO posts VALUES (1, 1, 'Hello World'), (2, 2, 'SQLite is Great');
  "`);
  
  execSync(`sqlite3 example2.db "
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, created_at TEXT);
    CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);
    CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER, user_id INTEGER, content TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', '2025-01-01'), (2, 'Bob', 'bob@newdomain.com', '2025-01-02');
    INSERT INTO posts VALUES (1, 1, 'Hello World'), (2, 2, 'SQLite is Great');
    INSERT INTO comments VALUES (1, 1, 2, 'Great post!');
  "`);
  
  // Load databases
  const db1 = fs.readFileSync('example1.db');
  const db2 = fs.readFileSync('example2.db');
  
  // Create sqldiff instance
  console.log('⚡ Initializing sqldiff-wasm...');
  const sqldiff = await createSqlDiff();
  
  // Example 1: Basic diff
  console.log('\n🔄 Basic Diff:');
  console.log('==============');
  const diff = await sqldiff.diff(db1, db2);
  console.log(diff.sql);
  
  // Example 2: Summary
  console.log('\n📊 Summary:');
  console.log('===========');
  const summary = await sqldiff.summary(db1, db2);
  console.log(summary.sql);
  
  // Example 3: Schema only
  console.log('\n🏗️  Schema Diff:');
  console.log('===============');
  const schema = await sqldiff.schemaDiff(db1, db2);
  console.log(schema.sql);
  
  // Example 4: Transaction wrapped
  console.log('\n💾 Transaction Diff:');
  console.log('===================');
  const transaction = await sqldiff.transactionDiff(db1, db2);
  console.log(transaction.sql);
  
  // Cleanup
  fs.unlinkSync('example1.db');
  fs.unlinkSync('example2.db');
  
  console.log('\n✅ Example completed successfully!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 