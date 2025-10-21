// Mock orders data and basic UI for the admin orders page
const orders = [
  { id: 'ord_001', customer: 'Alice', total: 29.90, status: 'pending', createdAt: '2025-10-10' },
  { id: 'ord_002', customer: 'Bob', total: 12.50, status: 'shipped', createdAt: '2025-10-11' },
  { id: 'ord_003', customer: 'Chloé', total: 45.00, status: 'delivered', createdAt: '2025-10-09' },
  { id: 'ord_004', customer: 'David', total: 9.99, status: 'cancelled', createdAt: '2025-10-12' }
];

function formatCurrency(n){
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function renderList(){
  const container = document.getElementById('list');
  container.innerHTML = '';

  orders.forEach(o => {
    const el = document.createElement('div');
    el.className = 'bg-white p-4 rounded shadow flex items-center justify-between';
    el.innerHTML = `
      <div>
        <div class="font-medium">${o.id} — ${o.customer}</div>
        <div class="text-sm text-gray-500">${o.createdAt} • ${o.status}</div>
      </div>
      <div class="text-right">
        <div class="font-semibold">${formatCurrency(o.total)}</div>
        <div class="mt-2 flex gap-2">
          <button class="bg-yellow-500 text-white px-2 py-1 rounded" onclick="markShipped('${o.id}')">Marquer expédié</button>
          <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="cancelOrder('${o.id}')">Annuler</button>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

function findOrder(id){
  return orders.find(o => o.id === id);
}

function markShipped(id){
  const o = findOrder(id);
  if(!o) return alert('Commande introuvable');
  if(o.status === 'shipped') return alert('Déjà expédiée');
  if(!confirm(`Marquer la commande ${id} comme expédiée ?`)) return;
  o.status = 'shipped';
  renderList();
}

function cancelOrder(id){
  const o = findOrder(id);
  if(!o) return alert('Commande introuvable');
  if(o.status === 'cancelled') return alert('Déjà annulée');
  if(!confirm(`Annuler la commande ${id} ?`)) return;
  o.status = 'cancelled';
  renderList();
}

document.getElementById('refresh').addEventListener('click', ()=>{
  // in a real app we'd re-fetch from the API; here we simply re-render
  renderList();
});

renderList();
