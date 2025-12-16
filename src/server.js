// src/server.js
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");

// JSON-based DB functions
const {
  getNotes,
  addNote,
  deleteAllNotes,
  deleteNoteById,
} = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------
   Redis
------------------------- */
const redisClient = new Redis({
  host: "redis",
  port: 6379,
});

/* -------------------------
   Proxy awareness
------------------------- */
app.set("trust proxy", true);

/* -------------------------
   Middlewares
------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

/* -------------------------
   Rate limiters
------------------------- */

// 1 message per minute per IP
const perMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "You can only post 1 message per minute. Please wait and try again.",
    });
  },
});

// 10 messages per day per IP
const perDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Daily limit reached",
      message: "You have reached the daily limit of 10 messages. Try again tomorrow.",
    });
  },
});

/* -------------------------
   Admin password middleware
------------------------- */
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_WINDOW_SECONDS = 60 * 60; // 1 hour

async function recordAdminFailure(ip) {
  const key = `admin:fail:${ip}`;
  const attempts = await redisClient.incr(key);

  if (attempts === 1) {
    await redisClient.expire(key, ADMIN_WINDOW_SECONDS);
  }

  return attempts;
}

async function isAdminLocked(ip) {
  const attempts = await redisClient.get(`admin:fail:${ip}`);
  return attempts && Number(attempts) >= ADMIN_MAX_ATTEMPTS;
}


async function requireAdmin(req, res, next) {
  const ip = req.ip;

  if (await isAdminLocked(ip)) {
    return res.status(429).json({
      success: false,
      message: "Too many incorrect attempts. Try again in 1 hour.",
    });
  }

  const password = req.headers["x-admin-password"];

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    const attempts = await recordAdminFailure(ip);

    return res.status(401).json({
      success: false,
      message: `Wrong admin password. Attempts left: ${Math.max(
        0,
        ADMIN_MAX_ATTEMPTS - attempts
      )}`,
    });
  }

  // Correct password → allow immediately
  next();
}


/* -------------------------
   Public API
------------------------- */

// Get latest 200 notes
app.get("/api/notes", (req, res) => {
  try {
    const notes = getNotes(200);
    res.json({ success: true, notes });
  } catch (err) {
    console.error("Error getting notes:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to load notes.",
    });
  }
});

// Add a note (RATE LIMITED)
app.post(
  "/api/notes",
  perMinuteLimiter,
  perDayLimiter,
  (req, res) => {
    try {
      const { content, author } = req.body;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Message content is required.",
        });
      }

      const trimmedContent = content.trim();
      const trimmedAuthor = author ? String(author).trim() : "";

      if (trimmedContent.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Message too long",
          message: "Message exceeds maximum length of 500 characters.",
        });
      }

      const note = addNote(trimmedContent, trimmedAuthor);
      res.status(201).json({ success: true, note });
    } catch (err) {
      console.error("Error adding note:", err);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to save the message.",
      });
    }
  }
);

/* -------------------------
   Admin API (Protected)
------------------------- */

// Get ALL notes
app.get("/api/admin/notes", requireAdmin, (req, res) => {
  try {
    const notes = getNotes(99999);
    res.json({ success: true, notes });
  } catch (err) {
    console.error("Error loading admin notes:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Delete ONE note
app.delete("/api/admin/notes/:id", requireAdmin, (req, res) => {
  try {
    deleteNoteById(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Delete ALL notes
app.delete("/api/admin/clear", requireAdmin, (req, res) => {
  try {
    deleteAllNotes();
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing notes:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to clear notes.",
    });
  }
});

/* -------------------------
   Pages
------------------------- */

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

/* -------------------------
   Start server
------------------------- */
app.listen(PORT, () => {
  console.log(`Public notes app listening on port ${PORT}`);
});
