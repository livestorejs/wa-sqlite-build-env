import SQLiteESMFactory from '@livestore/wa-sqlite/dist/wa-sqlite.mjs';
import { MemoryVFS } from '@livestore/wa-sqlite/src/examples/MemoryVFS.js';
import * as SQLite from '@livestore/wa-sqlite/src/sqlite-api.js';
import { SqlDiffWasm } from '@schickling/sqldiff-wasm';

// Global variables
let sqlite3;
let db1, db2;
let sqlDiff;
let db1Buffer, db2Buffer;

// DOM elements
const initBtn = document.getElementById('init-btn');
const initStatus = document.getElementById('init-status');
const demoContent = document.getElementById('demo-content');
const createDb1Btn = document.getElementById('create-db1-btn');
const createDb2Btn = document.getElementById('create-db2-btn');
const runDiffBtn = document.getElementById('run-diff-btn');
const runSummaryBtn = document.getElementById('run-summary-btn');
const runSchemaBtn = document.getElementById('run-schema-btn');
const runTransactionBtn = document.getElementById('run-transaction-btn');
const resetBtn = document.getElementById('reset-btn');

// Output elements
const db1Output = document.getElementById('db1-output');
const db2Output = document.getElementById('db2-output');
const diffOutput = document.getElementById('diff-output');
const summaryOutput = document.getElementById('summary-output');
const schemaOutput = document.getElementById('schema-output');
const transactionOutput = document.getElementById('transaction-output');

// Utility functions
function updateStatus(element, message, type = 'loading') {
  element.textContent = message;
  element.className = `status ${type}`;
}

function updateOutput(element, content) {
  element.textContent = content;
}

function disableButton(button, disabled = true) {
  button.disabled = disabled;
}

// Initialize libraries
async function initializeLibraries() {
  try {
    updateStatus(initStatus, 'Initializing wa-sqlite...', 'loading');
    disableButton(initBtn);

    // Initialize wa-sqlite with WASM from public directory
    const module = await SQLiteESMFactory({
      // locateFile: (path) => {
      //   if (path.endsWith('.wasm')) {
      //     return '/wa-sqlite.wasm';
      //   }
      //   return path;
      // }
    });
    sqlite3 = SQLite.Factory(module);

    // Register MemoryVFS
    sqlite3.vfs_register(new MemoryVFS('memory', module));

    updateStatus(initStatus, 'Initializing sqldiff-wasm...', 'loading');

    // Initialize sqldiff-wasm
    sqlDiff = new SqlDiffWasm();
    await sqlDiff.init();

    updateStatus(initStatus, '✅ Both libraries initialized successfully!', 'success');
    
    // Show demo content
    demoContent.style.display = 'block';
    
    // Enable database creation buttons
    disableButton(createDb1Btn, false);
    disableButton(createDb2Btn, false);

  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus(initStatus, `❌ Initialization failed: ${error.message}`, 'error');
    disableButton(initBtn, false);
  }
}

// Create database 1 (original)
async function createDatabase1() {
  try {
    disableButton(createDb1Btn);
    updateOutput(db1Output, 'Creating database 1...');

    // Close existing database if any
    if (db1) {
      await sqlite3.close(db1);
    }

    // Open new database
    db1 = await sqlite3.open_v2('db1.sqlite', SQLite.OPEN_CREATE | SQLite.OPEN_READWRITE, 'memory');

    // Create and populate tables
    const sql = `
-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol Davis', 'carol@example.com');

INSERT INTO posts (user_id, title, content, published) VALUES 
    (1, 'Getting Started with SQLite', 'SQLite is a great database...', TRUE),
    (1, 'Advanced SQL Queries', 'Let me show you some advanced techniques...', FALSE),
    (2, 'Web Development Tips', 'Here are some useful tips...', TRUE),
    (3, 'Database Design Patterns', 'Good database design is crucial...', TRUE);
`;

    // Split SQL into individual statements for better error handling
    const statements = [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `INSERT INTO users (name, email) VALUES 
        ('Alice Johnson', 'alice@example.com'),
        ('Bob Smith', 'bob@example.com'),
        ('Carol Davis', 'carol@example.com')`,
      `INSERT INTO posts (user_id, title, content, published) VALUES 
        (1, 'Getting Started with SQLite', 'SQLite is a great database...', 1),
        (1, 'Advanced SQL Queries', 'Let me show you some advanced techniques...', 0),
        (2, 'Web Development Tips', 'Here are some useful tips...', 1),
        (3, 'Database Design Patterns', 'Good database design is crucial...', 1)`
    ];
    
    for (let i = 0; i < statements.length; i++) {
      await sqlite3.exec(db1, statements[i]);
    }

    // Format output
    let output = "Database 1 created successfully!\n\n";
    output += "Tables:\n";
    output += "- users: 3 records\n";
    output += "- posts: 4 records\n\n";
    output += "Sample data loaded:\n";
    output += "✓ 3 users (Alice, Bob, Carol)\n";
    output += "✓ 4 posts (2 published, 2 drafts)";

    updateOutput(db1Output, output);

    // Export database to buffer for sqldiff
    const data = sqlite3.serialize(db1);
    db1Buffer = new Uint8Array(data);

    // Enable diff buttons if both databases exist
    if (db2Buffer) {
      enableDiffButtons();
    }

    disableButton(createDb1Btn, false);

  } catch (error) {
    console.error('Database 1 creation error:', error);
    updateOutput(db1Output, `❌ Error creating database 1: ${error.message}`);
    disableButton(createDb1Btn, false);
  }
}

// Create database 2 (modified)
async function createDatabase2() {
  try {
    disableButton(createDb2Btn);
    updateOutput(db2Output, 'Creating database 2...');

    // Close existing database if any
    if (db2) {
      await sqlite3.close(db2);
    }

    // Open new database
    db2 = await sqlite3.open_v2('db2.sqlite', SQLite.OPEN_CREATE | SQLite.OPEN_READWRITE, 'memory');

    // Create and populate tables (with modifications)
    const sql = `
-- Create users table (same structure)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table with additional column
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,  -- NEW COLUMN
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create new comments table
CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- Insert sample data (modified)
INSERT INTO users (name, email) VALUES 
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol Davis', 'carol@example.com'),
    ('David Wilson', 'david@example.com');  -- NEW USER

INSERT INTO posts (user_id, title, content, published, views) VALUES 
    (1, 'Getting Started with SQLite', 'SQLite is a great database for beginners...', TRUE, 150),  -- MODIFIED
    (1, 'Advanced SQL Queries', 'Let me show you some advanced techniques...', TRUE, 75),  -- PUBLISHED
    (2, 'Web Development Tips', 'Here are some useful tips for web developers...', TRUE, 200),  -- MODIFIED
    (3, 'Database Design Patterns', 'Good database design is crucial...', TRUE, 100),
    (4, 'Introduction to NoSQL', 'While SQL is great, sometimes you need NoSQL...', TRUE, 50);  -- NEW POST

-- Insert comments
INSERT INTO comments (post_id, author_name, content) VALUES 
    (1, 'Reader1', 'Great introduction to SQLite!'),
    (1, 'Reader2', 'Very helpful, thanks!'),
    (3, 'Developer', 'Nice tips, will use them in my project'),
    (4, 'Student', 'Clear explanation of design patterns');
`;

    // Split SQL into individual statements for better error handling
    const statements2 = [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT FALSE,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE comments (
        id INTEGER PRIMARY KEY,
        post_id INTEGER,
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )`,
      `INSERT INTO users (name, email) VALUES 
        ('Alice Johnson', 'alice@example.com'),
        ('Bob Smith', 'bob@example.com'),
        ('Carol Davis', 'carol@example.com'),
        ('David Wilson', 'david@example.com')`,
      `INSERT INTO posts (user_id, title, content, published, views) VALUES 
        (1, 'Getting Started with SQLite', 'SQLite is a great database for beginners...', 1, 150),
        (1, 'Advanced SQL Queries', 'Let me show you some advanced techniques...', 1, 75),
        (2, 'Web Development Tips', 'Here are some useful tips for web developers...', 1, 200),
        (3, 'Database Design Patterns', 'Good database design is crucial...', 1, 100),
        (4, 'Introduction to NoSQL', 'While SQL is great, sometimes you need NoSQL...', 1, 50)`,
      `INSERT INTO comments (post_id, author_name, content) VALUES 
        (1, 'Reader1', 'Great introduction to SQLite!'),
        (1, 'Reader2', 'Very helpful, thanks!'),
        (3, 'Developer', 'Nice tips, will use them in my project'),
        (4, 'Student', 'Clear explanation of design patterns')`
    ];
    
    for (let i = 0; i < statements2.length; i++) {
      await sqlite3.exec(db2, statements2[i]);
    }

    // Format output
    let output = "Database 2 created successfully!\n\n";
    output += "Tables:\n";
    output += "- users: 4 records (+1)\n";
    output += "- posts: 5 records (+1, +views column)\n";
    output += "- comments: 4 records (NEW TABLE)\n\n";
    output += "Changes from Database 1:\n";
    output += "✓ Added 1 new user (David)\n";
    output += "✓ Added 1 new post\n";
    output += "✓ Added 'views' column to posts\n";
    output += "✓ Added new 'comments' table\n";
    output += "✓ Modified some existing content\n";
    output += "✓ Published draft post";

    updateOutput(db2Output, output);

    // Export database to buffer for sqldiff
    const data = sqlite3.serialize(db2);
    db2Buffer = new Uint8Array(data);

    // Enable diff buttons if both databases exist
    if (db1Buffer) {
      enableDiffButtons();
    }

    disableButton(createDb2Btn, false);

  } catch (error) {
    console.error('Database 2 creation error:', error);
    updateOutput(db2Output, `❌ Error creating database 2: ${error.message}`);
    disableButton(createDb2Btn, false);
  }
}

// Enable diff buttons
function enableDiffButtons() {
  disableButton(runDiffBtn, false);
  disableButton(runSummaryBtn, false);
  disableButton(runSchemaBtn, false);
  disableButton(runTransactionBtn, false);
  disableButton(resetBtn, false);
}

// Run basic diff
async function runBasicDiff() {
  try {
    disableButton(runDiffBtn);
    updateOutput(diffOutput, 'Running basic diff...');

    const result = await sqlDiff.diff(db1Buffer, db2Buffer);
    
    if (result.trim()) {
      updateOutput(diffOutput, result);
    } else {
      updateOutput(diffOutput, '-- No differences found --');
    }

    disableButton(runDiffBtn, false);

  } catch (error) {
    console.error('Diff error:', error);
    updateOutput(diffOutput, `❌ Error running diff: ${error.message}`);
    disableButton(runDiffBtn, false);
  }
}

// Run summary
async function runSummary() {
  try {
    disableButton(runSummaryBtn);
    updateOutput(summaryOutput, 'Running summary...');

    const result = await sqlDiff.summary(db1Buffer, db2Buffer);
    
    if (result.trim()) {
      updateOutput(summaryOutput, result);
    } else {
      updateOutput(summaryOutput, '-- No differences found --');
    }

    disableButton(runSummaryBtn, false);

  } catch (error) {
    console.error('Summary error:', error);
    updateOutput(summaryOutput, `❌ Error running summary: ${error.message}`);
    disableButton(runSummaryBtn, false);
  }
}

// Run schema diff
async function runSchemaDiff() {
  try {
    disableButton(runSchemaBtn);
    updateOutput(schemaOutput, 'Running schema diff...');

    const result = await sqlDiff.schemaDiff(db1Buffer, db2Buffer);
    
    if (result.trim()) {
      updateOutput(schemaOutput, result);
    } else {
      updateOutput(schemaOutput, '-- No schema differences found --');
    }

    disableButton(runSchemaBtn, false);

  } catch (error) {
    console.error('Schema diff error:', error);
    updateOutput(schemaOutput, `❌ Error running schema diff: ${error.message}`);
    disableButton(runSchemaBtn, false);
  }
}

// Run transaction diff
async function runTransactionDiff() {
  try {
    disableButton(runTransactionBtn);
    updateOutput(transactionOutput, 'Running transaction diff...');

    const result = await sqlDiff.transactionDiff(db1Buffer, db2Buffer);
    
    if (result.trim()) {
      updateOutput(transactionOutput, result);
    } else {
      updateOutput(transactionOutput, '-- No differences found --');
    }

    disableButton(runTransactionBtn, false);

  } catch (error) {
    console.error('Transaction diff error:', error);
    updateOutput(transactionOutput, `❌ Error running transaction diff: ${error.message}`);
    disableButton(runTransactionBtn, false);
  }
}

// Reset demo
async function resetDemo() {
  try {
    disableButton(resetBtn);

    // Close databases
    if (db1) {
      await sqlite3.close(db1);
      db1 = null;
    }
    if (db2) {
      await sqlite3.close(db2);
      db2 = null;
    }

    // Clear buffers
    db1Buffer = null;
    db2Buffer = null;

    // Reset UI
    updateOutput(db1Output, '-- Database not created yet --');
    updateOutput(db2Output, '-- Database not created yet --');
    updateOutput(diffOutput, '-- Run diff to see changes --');
    updateOutput(summaryOutput, '-- Run summary to see overview --');
    updateOutput(schemaOutput, '-- Run schema diff to see structure changes --');
    updateOutput(transactionOutput, '-- Run transaction diff to see wrapped changes --');

    // Reset button states
    disableButton(createDb1Btn, false);
    disableButton(createDb2Btn, false);
    disableButton(runDiffBtn, true);
    disableButton(runSummaryBtn, true);
    disableButton(runSchemaBtn, true);
    disableButton(runTransactionBtn, true);
    disableButton(resetBtn, true);

  } catch (error) {
    console.error('Reset error:', error);
  }
}

// Event listeners
initBtn.addEventListener('click', initializeLibraries);
createDb1Btn.addEventListener('click', createDatabase1);
createDb2Btn.addEventListener('click', createDatabase2);
runDiffBtn.addEventListener('click', runBasicDiff);
runSummaryBtn.addEventListener('click', runSummary);
runSchemaBtn.addEventListener('click', runSchemaDiff);
runTransactionBtn.addEventListener('click', runTransactionDiff);
resetBtn.addEventListener('click', resetDemo);

// Initial state
disableButton(createDb1Btn, true);
disableButton(createDb2Btn, true);
disableButton(runDiffBtn, true);
disableButton(runSummaryBtn, true);
disableButton(runSchemaBtn, true);
disableButton(runTransactionBtn, true);
disableButton(resetBtn, true);
