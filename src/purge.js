// src/purge.js
const { deleteAllNotes } = require("./db");

console.log("Purging all notes...");
deleteAllNotes();
console.log("All notes deleted successfully.");
