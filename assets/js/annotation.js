// Annotation page logic
function addNote() {
  document.getElementById('noteInput').focus();
}
function saveNote() {
  const input = document.getElementById('noteInput');
  const note = input.value.trim();
  if (!note) return;
  let notes = JSON.parse(localStorage.getItem('teacher_notes') || '[]');
  const editIdx = input.dataset.editIdx;
  if (editIdx !== undefined && editIdx !== '') {
    notes[parseInt(editIdx)] = note;
    delete input.dataset.editIdx;
  } else {
    notes.push(note);
  }
  localStorage.setItem('teacher_notes', JSON.stringify(notes));
  input.value = '';
  renderNotes();
}
function editNote(idx) {
  let notes = JSON.parse(localStorage.getItem('teacher_notes') || '[]');
  const input = document.getElementById('noteInput');
  input.value = notes[idx];
  input.dataset.editIdx = idx;
  input.focus();
}
function deleteNote(idx) {
  let notes = JSON.parse(localStorage.getItem('teacher_notes') || '[]');
  notes.splice(idx, 1);
  localStorage.setItem('teacher_notes', JSON.stringify(notes));
  renderNotes();
}
function renderNotes() {
  const noteList = document.getElementById('noteList');
  let notes = JSON.parse(localStorage.getItem('teacher_notes') || '[]');
  noteList.innerHTML = notes.map((n,i) => `<div class='note-item'>${n} <span style='float:right;'><button onclick='editNote(${i})' title='Edit' style='background:none;border:none;color:#1E90FF;cursor:pointer;font-size:1em;'>Edit</button> <button onclick='deleteNote(${i})' title='Delete' style='background:none;border:none;color:#AABBCF;cursor:pointer;font-size:1em;'>Delete</button></span></div>`).join('');
}
function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  if (fileInput.files.length === 0) return;
  let files = JSON.parse(localStorage.getItem('teacher_files') || '[]');
  for (let file of fileInput.files) {
    files.push(file.name);
  }
  localStorage.setItem('teacher_files', JSON.stringify(files));
  renderFiles();
}
function renderFiles() {
  const fileList = document.getElementById('fileList');
  let files = JSON.parse(localStorage.getItem('teacher_files') || '[]');
  if (files.length === 0) {
    fileList.innerHTML = '<div style="color:var(--muted)">No files uploaded yet.</div>';
    return;
  }
  fileList.innerHTML = files.map(f => `<div>${f}</div>`).join('');
}
window.onload = function() { renderNotes(); renderFiles(); };