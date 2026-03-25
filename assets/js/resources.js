// Resources page logic
function uploadResource() {
  const input = document.getElementById('resourceUpload');
  if (input.files.length === 0) return;
  let resources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
  for (let file of input.files) {
    resources.push(file.name);
  }
  localStorage.setItem('teacher_resources', JSON.stringify(resources));
  renderResources();
}
function renderResources() {
  const resourceList = document.getElementById('resourceList');
  let resources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
  if (resources.length === 0) {
    resourceList.innerHTML = `<li style='color:var(--muted)'>No resources uploaded yet.</li>`;
    return;
  }
  resourceList.innerHTML = resources.map(f => `<li>${f}</li>`).join('');
}
window.onload = renderResources;