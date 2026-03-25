// Classes page logic
function addClass() {
  const input = document.getElementById('classInput');
  const className = input.value.trim();
  if (!className) return;
  let classes = JSON.parse(localStorage.getItem('teacher_classes') || '[]');
  classes.push({ name: className, status: 'Active' });
  localStorage.setItem('teacher_classes', JSON.stringify(classes));
  input.value = '';
  renderClasses();
}
function removeClass(idx) {
  let classes = JSON.parse(localStorage.getItem('teacher_classes') || '[]');
  classes.splice(idx, 1);
  localStorage.setItem('teacher_classes', JSON.stringify(classes));
  renderClasses();
}
function renderClasses() {
  const classList = document.getElementById('classList');
  let classes = JSON.parse(localStorage.getItem('teacher_classes') || '[]');
  if (classes.length === 0) {
    classList.innerHTML = `<li style='color:var(--muted)'>No classes yet. Add one!</li>`;
    return;
  }
  classList.innerHTML = classes.map((c,i) => `<li>${c.name} - <span class='status'>${c.status}</span> <button onclick='removeClass(${i})' title='Remove' style='background:none;border:none;color:#AABBCF;cursor:pointer;font-size:1em;margin-left:8px;'>Delete</button></li>`).join('');
}
window.onload = renderClasses;