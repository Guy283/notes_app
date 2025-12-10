// src/server.js
const express = require("express");
const path = require("path");
const { getNotes, addNote } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// API: get all notes
app.get("/api/notes", (req, res) => {
  try {
    const notes = getNotes(200);
    res.json({ success: true, notes });
  } catch (err) {
    console.error("Error getting notes:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// API: add a new note
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

// Fallback: serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Public notes app listening on http://localhost:${PORT}`);
});
