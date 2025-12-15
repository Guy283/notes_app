// src/server.js
const express = require("express");
const path = require("path");

// JSON-based DB functions
const { 
  getNotes, 
  addNote, 
  deleteAllNotes,
  deleteNoteById 
} = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Admin password middleware
function requireAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  next();
}

// -------------------------
// Public API
// -------------------------

// Get latest 200 notes
app.get("/api/notes", (req, res) => {
  try {
    const notes = getNotes(200);
    res.json({ success: true, notes });
  } catch (err) {
    console.error("Error getting notes:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Add a note
app.post("/api/notes", (req, res) => {
  try {
    const { content, author } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const trimmedContent = content.trim();
    const trimmedAuthor = author ? String(author).trim() : "";

    if (trimmedContent.length > 500) {
      return res
        .status(400)
        .json({ success: false, error: "Note is too long (max 500 chars)" });
    }

    const note = addNote(trimmedContent, trimmedAuthor);
    res.status(201).json({ success: true, note });
  } catch (err) {
    console.error("Error adding note:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// -------------------------
// Admin API (Protected)
// -------------------------

// Get ALL notes (admin only)
app.get("/api/admin/notes", requireAdmin, (req, res) => {
  try {
    const notes = getNotes(99999);
    res.json({ success: true, notes });
  } catch (err) {
    console.error("Error loading admin notes:", err);
    res.status(500).json({ success: false });
  }
});

// Delete ONE note (admin only)
app.delete("/api/admin/notes/:id", requireAdmin, (req, res) => {
  try {
    deleteNoteById(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ success: false });
  }
});

// Delete ALL notes (admin only)
app.delete("/api/admin/clear", requireAdmin, (req, res) => {
  try {
    deleteAllNotes();
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing notes:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Admin UI page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

// Root public page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Public notes app listening on http://localhost:${PORT}`);
});
