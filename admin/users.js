// Mock users, search, pagination, and confirmation modal
const mockUsers = [];
for(let i=1;i<=47;i++){
  mockUsers.push({
    id: 'user_' + String(i).padStart(3,'0'),
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: i % 7 !== 0, // some inactive
    role: i % 11 === 0 ? 'admin' : 'user'
  });
}

let filtered = [...mockUsers];
const pageSize = 10;
let page = 1;
let pendingAction = null;
const trash = [];

function render(){
  const list = document.getElementById('list');
  const totalEl = document.getElementById('total');
  const pagination = document.getElementById('pagination');
  const start = (page-1)*pageSize;
  const pageItems = filtered.slice(start, start+pageSize);

  list.innerHTML = '';
  pageItems.forEach(u => {
    const el = document.createElement('div');
    el.className = 'bg-white p-3 rounded flex items-center justify-between shadow';
    el.innerHTML = `
      <div>
        <div class="font-medium">${u.name} <span class="text-sm text-gray-500">(${u.email})</span></div>
        <div class="text-sm text-gray-500">Role: ${u.role} • Status: ${u.active ? 'Actif' : 'Inactif'}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-2 py-1 bg-blue-500 text-white rounded" onclick="viewUser('${u.id}')">Voir</button>
        <button class="px-2 py-1 bg-${u.active? 'yellow-500' : 'green-600'} text-white rounded" onclick="toggleActive('${u.id}')">${u.active ? 'Désactiver' : 'Activer'}</button>
        <button class="px-2 py-1 bg-red-500 text-white rounded" onclick="askDelete('${u.id}')">Supprimer</button>
      </div>
    `;
    list.appendChild(el);
  });

  totalEl.textContent = filtered.length;

  // pagination
  pagination.innerHTML = '';
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  for(let p=1;p<=pageCount;p++){
    const btn = document.createElement('button');
    btn.textContent = p;
    btn.className = `px-2 py-1 rounded ${p===page? 'bg-gray-800 text-white' : 'bg-white border'}`;
    btn.onclick = ()=>{ page = p; render(); };
    pagination.appendChild(btn);
  }
}

function viewUser(id){
  // navigate to the detail page; the detail page will try the API and fallback to mock data
  window.location.href = `user.html?id=${encodeURIComponent(id)}`;
}

function toggleActive(id){
  const u = mockUsers.find(x=>x.id===id);
  if(!u) return alert('Utilisateur introuvable');
  const action = u.active ? 'désactiver' : 'activer';
  showModal(`Voulez-vous ${action} ${u.name} (${u.email}) ?`, ()=>{
    u.active = !u.active; render(); hideModal();
  });
}

function askDelete(id){
  const u = mockUsers.find(x=>x.id===id);
  if(!u) return alert('Utilisateur introuvable');
  showModal(`Déplacer ${u.name} (${u.email}) vers la corbeille ?`, ()=>{
    // move to trash instead of permanent delete
    const idx = mockUsers.indexOf(u);
    if(idx>=0) mockUsers.splice(idx,1);
    filtered = filtered.filter(x=>x.id!==id);
    trash.push(u);
    updateTrashCount();
    render(); hideModal();
  });
}

function updateTrashCount(){
  const el = document.getElementById('trashCount');
  if(el) el.textContent = String(trash.length);
}

function openTrash(){
  // show a modal listing trashed users with restore and delete permanently
  if(trash.length === 0){ showModal('La corbeille est vide.', ()=>{}); return; }
  let html = '<div class="space-y-2 max-h-64 overflow-auto">';
  trash.forEach((u, idx)=>{
    html += `<div class="p-2 bg-gray-50 rounded flex items-center justify-between"><div><div class="font-medium">${u.name}</div><div class="text-sm text-gray-500">${u.email}</div></div><div class=\"flex gap-2\"><button onclick=\"restoreFromTrash(${idx})\" class=\"px-2 py-1 bg-green-600 text-white rounded\">Restaurer</button><button onclick=\"permaDelete(${idx})\" class=\"px-2 py-1 bg-red-600 text-white rounded\">Suppr. définitive</button></div></div>`;
  });
  html += '</div>';
  showModal(html, ()=>{});
}

function restoreFromTrash(index){
  const u = trash[index];
  if(!u) return;
  // restore to mockUsers and refresh
  mockUsers.push(u);
  filtered = [...mockUsers];
  trash.splice(index,1);
  updateTrashCount();
  hideModal();
  render();
}

function permaDelete(index){
  const u = trash[index];
  if(!u) return;
  trash.splice(index,1);
  updateTrashCount();
  hideModal();
}

function showModal(html, onConfirm){
  pendingAction = onConfirm;
  const modal = document.getElementById('modal');
  document.getElementById('modalContent').innerHTML = html;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function hideModal(){
  pendingAction = null;
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.style.display = 'none';
}

// search
document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  filtered = mockUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  page = 1; render();
});

// modal buttons
document.getElementById('modalCancel').addEventListener('click', hideModal);
document.getElementById('modalConfirm').addEventListener('click', ()=>{
  if(typeof pendingAction === 'function') pendingAction();
});

// refresh
document.getElementById('refresh').addEventListener('click', ()=>{ filtered = [...mockUsers]; page = 1; document.getElementById('search').value = ''; render(); });
// trash button
const trashBtn = document.getElementById('trashBtn');
if(trashBtn) trashBtn.addEventListener('click', openTrash);

updateTrashCount();
render();
