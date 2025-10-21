// Mock merchants page (no backend)
const merchants = [
  { id: 'm1', name: 'Boulangerie du coin', email: 'boulangerie@example.com', status: 'pending' },
  { id: 'm2', name: 'Café Central', email: 'cafe@example.com', status: 'active' },
  { id: 'm3', name: 'Epicerie Locale', email: 'epicerie@example.com', status: 'active' }
];

function render(){
  const el = document.getElementById('list'); el.innerHTML = '';
  merchants.forEach(m => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded shadow flex items-center justify-between';
    card.innerHTML = `
      <div>
        <div class="font-semibold">${m.name}</div>
        <div class="text-sm text-gray-600">${m.email}</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-sm">${m.status}</div>
        ${m.status === 'pending' ? '<button data-id="'+m.id+'" data-action="approve" class="px-3 py-1 bg-green-600 text-white rounded">Approuver</button>' : ''}
        <button data-id="'+m.id+'" data-action="deactivate" class="px-3 py-1 bg-red-600 text-white rounded">Désactiver</button>
      </div>
    `;
    el.appendChild(card);
  });
}

document.getElementById('refresh').addEventListener('click', render);

// simple actions
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return; const id = btn.getAttribute('data-id'); const action = btn.getAttribute('data-action');
  if(action === 'approve'){
    const m = merchants.find(x=>x.id===id); if(m) m.status = 'active'; render(); alert('Approuvé');
  }
  if(action === 'deactivate'){
    const idx = merchants.findIndex(x=>x.id===id); if(idx!==-1) merchants.splice(idx,1); render(); alert('Désactivé');
  }
});

render();
