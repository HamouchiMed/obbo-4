// Simple mock clients list with recent activities
const mockClients = [];
const activities = ['placed order', 'opened app', 'used coupon', 'left review', 'contacted support'];
for(let i=1;i<=25;i++){
  const last = activities[Math.floor(Math.random()*activities.length)];
  mockClients.push({
    id: 'client_' + String(i).padStart(3,'0'),
    name: `Client ${i}`,
    email: `client${i}@example.com`,
    lastActivity: last,
    lastAt: new Date(Date.now() - Math.floor(Math.random()*7*24*3600*1000)).toISOString()
  });
}

function renderClients(list){
  const container = document.getElementById('clientsList');
  container.innerHTML = '';
  list.forEach(c=>{
    const el = document.createElement('div');
    el.className = 'bg-white p-3 rounded flex items-center justify-between shadow';
    el.innerHTML = `
      <div>
        <div class="font-medium">${c.name} <span class="text-sm text-gray-500">(${c.email})</span></div>
        <div class="text-sm text-gray-500">Dernière activité: ${c.lastActivity} • ${new Date(c.lastAt).toLocaleString()}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-2 py-1 bg-blue-500 text-white rounded" onclick="viewClient('${c.id}')">Voir</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function viewClient(id){
  window.location.href = `client.html?id=${encodeURIComponent(id)}`;
}

document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  const f = mockClients.filter(c=> c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  renderClients(f);
});

document.getElementById('refresh').addEventListener('click', ()=> renderClients(mockClients));

renderClients(mockClients);
