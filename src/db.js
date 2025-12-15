const fs = require("fs");
const path = require("path");

// Path to notes.json inside /data
const DB_PATH = path.join(__dirname, "..", "data", "notes.json");

// Ensure /data folder exists
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure notes.json exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "[]", "utf-8");
}

// Load notes from JSON
function loadNotes() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading notes.json:", err);
    return [];
  }
}

// Save notes to JSON
function saveNotes(notes) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(notes, null, 2));
  } catch (err) {
    console.error("Error writing notes.json:", err);
  }
}

// Get latest N notes (default: 200)
function getNotes(limit = 200) {
  const notes = loadNotes();
  return notes.slice(-limit); // last N notes
}

// Add a new note
function addNote(content, author = "") {
  const notes = loadNotes();

  const newNote = {
    id: Date.now(),
    content,
    author,
    created_at: new Date().toISOString()
  };

  notes.push(newNote);
  saveNotes(notes);
  return newNote;
}

// Delete all notes
function deleteAllNotes() {
  saveNotes([]);
}

function deleteNoteById(id) {
  const notes = loadNotes();
  const filtered = notes.filter(n => n.id !== Number(id));
  saveNotes(filtered);
  return true;
}

module.exports = {
  getNotes,
  addNote,
  deleteAllNotes,
  deleteNoteById
};

