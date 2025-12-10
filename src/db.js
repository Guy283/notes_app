// src/db.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "notes.db");
const db = new Database(dbPath);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function getNotes(limit = 100) {
  const stmt = db.prepare(`
    SELECT id, content, author, created_at
    FROM notes
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function addNote(content, author) {
  const stmt = db.prepare(`
    INSERT INTO notes (content, author)
    VALUES (?, ?)
  `);
  const info = stmt.run(content, author || null);
  return {
    id: info.lastInsertRowid,
    content,
    author: author || null,
    created_at: new Date().toISOString()
  };
}

function deleteAllNotes() {
  const stmt = db.prepare(`DELETE FROM notes`);
  stmt.run();
}

module.exports = {
  getNotes,
  addNote,
  deleteAllNotes
};
