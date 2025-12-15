const { deleteAllNotes } = require("./db");

try {
  deleteAllNotes();
  console.log(`[PURGE] All notes deleted at ${new Date().toISOString()}`);
} catch (err) {
  console.error("[PURGE] Error purging notes:", err);
}
