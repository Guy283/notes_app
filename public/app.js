// public/app.js
const notesList = document.getElementById("notesList");
const noteForm = document.getElementById("noteForm");
const formMessage = document.getElementById("formMessage");

async function fetchNotes() {
  try {
    const res = await fetch("/api/notes");
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to load notes");

    renderNotes(data.notes);
  } catch (err) {
    console.error(err);
    formMessage.textContent = "Error loading notes.";
  }
}

function renderNotes(notes) {
  notesList.innerHTML = "";
  if (!notes || notes.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No notes yet. Be the first!";
    notesList.appendChild(li);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "note";

    const meta = document.createElement("div");
    meta.className = "note-meta";

    const author = document.createElement("span");
    author.className = "note-author";
    author.textContent = note.author && note.author.trim()
      ? note.author
      : "Anonymous";

    const date = document.createElement("span");
    date.className = "note-date";
    date.textContent = new Date(note.created_at).toLocaleString();

    meta.appendChild(author);
    meta.appendChild(date);

    const content = document.createElement("p");
    content.className = "note-content";
    content.textContent = note.content; // textContent → avoids XSS

    li.appendChild(meta);
    li.appendChild(content);

    notesList.appendChild(li);
  });
}

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const content = document.getElementById("content").value;
  const author = document.getElementById("author").value;

  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content, author })
    });

    const data = await res.json();

    if (!data.success) {
      formMessage.textContent = data.error || "Something went wrong.";
      formMessage.classList.add("error");
      return;
    }

    // Reset form & reload notes
    noteForm.reset();
    formMessage.textContent = "Note posted!";
    formMessage.classList.remove("error");
    formMessage.classList.add("success");

    await fetchNotes();
  } catch (err) {
    console.error(err);
    formMessage.textContent = "Failed to post note.";
    formMessage.classList.add("error");
  }
});

// Initial load
fetchNotes();

