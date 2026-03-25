// Assignments page logic
function addAssignment() {
  const input = document.getElementById('assignmentInput');
  const due = document.getElementById('assignmentDue');
  const title = input.value.trim();
  const dueDate = due.value;
  if (!title || !dueDate) return;
  let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  assignments.push({ title, due: dueDate });
  localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
  input.value = '';
  due.value = '';
  renderAssignments();
}
function removeAssignment(idx) {
  let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  assignments.splice(idx, 1);
  localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
  renderAssignments();
}
function renderAssignments() {
  const assignmentList = document.getElementById('assignmentList');
  let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  if (assignments.length === 0) {
    assignmentList.innerHTML = `<li style='color:var(--muted)'>No assignments yet. Add one!</li>`;
    return;
  }
  assignmentList.innerHTML = assignments.map((a,i) => `<li>${a.title} - <span class='due-date'>Due: ${a.due}</span> <button onclick='removeAssignment(${i})' title='Remove' style='background:none;border:none;color:#AABBCF;cursor:pointer;font-size:1em;margin-left:8px;'>Delete</button></li>`).join('');
}
window.onload = renderAssignments;