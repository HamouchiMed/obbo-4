// Admin frontend integration with backend API
const API_BASE = (window.API_BASE || '') + '/api'; // keep relative by default

function getAuthToken(){
  return localStorage.getItem('obbo_admin_token')
}

function setAuthToken(t){
  if(t) localStorage.setItem('obbo_admin_token', t)
  else localStorage.removeItem('obbo_admin_token')
}

function authFetch(path, opts = {}){
  const headers = opts.headers || {};
  const token = getAuthToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  return fetch(API_BASE + path, { ...opts, headers })
    .then(async res => {
      const text = await res.text();
      try { return JSON.parse(text); } catch { return text }
    })
}

async function login(emailOrPhone, password){
  const body = { password };
  // decide whether input is email or phone
  if(emailOrPhone.includes('@')) body.email = emailOrPhone;
  else body.phone = emailOrPhone;

  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if(res.ok && data.success){
    setAuthToken(data.data.token);
    return data;
  }
  throw new Error(data.message || 'Login failed');
}

async function fetchMerchants(){
  const res = await authFetch('/admin/merchants');
  if(res && res.success) return res.data.merchants || [];
  throw new Error(res.message || 'Failed to fetch merchants');
}

async function fetchOrders(){
  const res = await authFetch('/admin/orders');
  if(res && res.success) return res.data.orders || [];
  throw new Error(res.message || 'Failed to fetch orders');
}

async function verifyMerchant(id){
  const res = await authFetch('/admin/merchants/' + id + '/verify', { method: 'PUT' });
  return res;
}

async function deactivateMerchant(id){
  const res = await authFetch('/admin/merchants/' + id + '/deactivate', { method: 'PUT' });
  return res;
}

function renderMerchants(merchants){
  const body = document.getElementById('merchantsBody');
  body.innerHTML = '';
  merchants.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = 'border-t';
    tr.innerHTML = `
      <td class="py-3">${m.profile?.businessName || m.profile?.fullName || m.email || ''}</td>
      <td>${m.email || m.phone || ''}</td>
      <td>${m.profile?.isVerified ? 'verified' : 'unverified'}</td>
      <td>
        ${!m.profile?.isVerified ? '<button class="bg-green-600 text-white px-3 py-1 rounded mr-2" data-id="'+m._id+'" data-action="verify">Vérifier</button>' : ''}
        <button class="bg-red-600 text-white px-3 py-1 rounded" data-id="${m._id}" data-action="deactivate">Désactiver</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

function renderOrders(orders){
  const body = document.getElementById('ordersBody');
  body.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.className = 'border-t';
    tr.innerHTML = `
      <td class="py-3">${o._id}</td>
      <td>${o.client?.profile?.fullName || o.client?.profile?.firstName || ''}</td>
      <td>${o.pricing?.total ? o.pricing.total + ' DH' : (o.total || '')}</td>
      <td>${o.status}</td>
    `;
    body.appendChild(tr);
  });
}

// Event handlers
document.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');

  try{
    if(action === 'verify'){
      const res = await verifyMerchant(id);
      alert(res.message || 'Merchant verified');
      await loadMerchants();
    }
    if(action === 'deactivate'){
      const res = await deactivateMerchant(id);
      alert(res.message || 'Merchant deactivated');
      await loadMerchants();
    }
  }catch(err){
    alert(err.message || 'Action failed');
  }
});

// UI: login modal handling
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const loginCancel = document.getElementById('loginCancel');
const loginSubmit = document.getElementById('loginSubmit');
const logoutBtn = document.getElementById('logout');

loginBtn.addEventListener('click', ()=> loginModal.classList.remove('hidden'));
loginCancel.addEventListener('click', ()=> loginModal.classList.add('hidden'));

loginSubmit.addEventListener('click', async ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try{
    await login(email, password);
    loginModal.classList.add('hidden');
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    await refreshAll();
  }catch(err){
    alert(err.message || 'Login failed');
  }
});

logoutBtn.addEventListener('click', ()=>{
  setAuthToken(null);
  loginBtn.classList.remove('hidden');
  logoutBtn.classList.add('hidden');
  alert('Déconnecté');
});

// Loaders
let LAST_LOADED_ORDERS = [];
let LAST_LOADED_MERCHANTS = [];

function showSpinner(id){
  document.getElementById(id)?.classList.remove('hidden');
}
function hideSpinner(id){
  document.getElementById(id)?.classList.add('hidden');
}

function setLastRefreshed(panelId, date){
  const lastEl = document.getElementById(panelId + 'Last');
  const timeEl = document.getElementById(panelId + 'LastTime');
  if(!lastEl || !timeEl) return;
  timeEl.textContent = date.toLocaleString();
  lastEl.classList.remove('hidden');
}

function exportOrdersCSV(){
  const orders = LAST_LOADED_ORDERS.length ? LAST_LOADED_ORDERS : SAMPLE_ORDERS;
  if(!orders || orders.length === 0){
    alert('Aucune commande à exporter');
    return;
  }
  const rows = [];
  rows.push(['ID','Client','Total','Statut','Date']);
  orders.forEach(o=>{
    const id = o._id || '';
    const client = (o.client?.profile?.fullName) || '';
    const total = o.pricing?.total ? o.pricing.total : (o.total || '');
    const status = o.status || '';
    const date = o.createdAt || o.created_date || '';
    rows.push([id, client, total, status, date]);
  });
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders_export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadMerchants(){
  showSpinner('merchantsSpinner');
  try{
    const merchants = await fetchMerchants();
    if(!merchants || merchants.length === 0){
      console.info('No merchants from API — using sample data');
      document.getElementById('merchantsSampleBadge')?.classList.remove('hidden');
      renderMerchants(SAMPLE_MERCHANTS);
      LAST_LOADED_MERCHANTS = SAMPLE_MERCHANTS;
      setLastRefreshed('merchants', new Date());
      return;
    }
    document.getElementById('merchantsSampleBadge')?.classList.add('hidden');
    renderMerchants(merchants);
    LAST_LOADED_MERCHANTS = merchants;
    setLastRefreshed('merchants', new Date());
  }catch(err){
    console.warn('Failed to load merchants, showing sample:', err && err.message ? err.message : err);
    document.getElementById('merchantsSampleBadge')?.classList.remove('hidden');
    renderMerchants(SAMPLE_MERCHANTS);
    LAST_LOADED_MERCHANTS = SAMPLE_MERCHANTS;
    setLastRefreshed('merchants', new Date());
  }finally{
    hideSpinner('merchantsSpinner');
  }
}

async function loadOrders(){
  showSpinner('ordersSpinner');
  try{
    const orders = await fetchOrders();
    if(!orders || orders.length === 0){
      console.info('No orders from API — using sample data');
      document.getElementById('ordersSampleBadge')?.classList.remove('hidden');
      renderOrders(SAMPLE_ORDERS);
      LAST_LOADED_ORDERS = SAMPLE_ORDERS;
      setLastRefreshed('orders', new Date());
      return;
    }
    document.getElementById('ordersSampleBadge')?.classList.add('hidden');
    renderOrders(orders);
    LAST_LOADED_ORDERS = orders;
    setLastRefreshed('orders', new Date());
  }catch(err){
    console.warn('Failed to load orders, showing sample:', err && err.message ? err.message : err);
    document.getElementById('ordersSampleBadge')?.classList.remove('hidden');
    renderOrders(SAMPLE_ORDERS);
    LAST_LOADED_ORDERS = SAMPLE_ORDERS;
    setLastRefreshed('orders', new Date());
  }finally{
    hideSpinner('ordersSpinner');
  }
}

// --- sample fallback data for dashboard feeds ---
const SAMPLE_MERCHANTS = [
  { _id: 'm_001', email: 'boulangerie@example.com', profile: { businessName: 'Boulangerie du Coin', isVerified: true } },
  { _id: 'm_002', email: 'epicerie@example.com', profile: { businessName: 'Épicerie Locale', isVerified: false } },
  { _id: 'm_003', email: 'pizzeria@example.com', profile: { businessName: 'La Pizzeria', isVerified: true } }
];

const SAMPLE_ORDERS = [
  { _id: 'o_1001', client: { profile: { fullName: 'Alice Martin' } }, pricing: { total: 29.90 }, status: 'pending' },
  { _id: 'o_1002', client: { profile: { fullName: 'Bob Leroy' } }, pricing: { total: 12.50 }, status: 'shipped' },
  { _id: 'o_1003', client: { profile: { fullName: 'Chloé Durant' } }, pricing: { total: 45.00 }, status: 'delivered' }
];

async function refreshAll(){
  await Promise.all([loadMerchants(), loadOrders()]);
}

// init: if token present, refresh data
if(getAuthToken()){
  loginBtn.classList.add('hidden');
  logoutBtn.classList.remove('hidden');
  refreshAll();
}

// refresh merchants
document.getElementById('refreshMerchants').addEventListener('click', async ()=>{
  await loadMerchants();
});

// refresh orders (dashboard)
const refreshOrdersBtn = document.getElementById('refreshOrders');
if(refreshOrdersBtn){
  refreshOrdersBtn.addEventListener('click', async ()=>{
    await loadOrders();
  });
}

// export orders
const exportBtn = document.getElementById('exportOrders');
if(exportBtn){
  exportBtn.addEventListener('click', ()=> exportOrdersCSV());
}

// --- Viewers chart & online users ---
let viewersChart = null;
function initViewersChart(){
  const ctx = document.getElementById('viewersChart');
  if(!ctx) return;
  // simulate labels for last 12 hours
  const labels = [];
  for(let i=11;i>=0;i--){
    const d = new Date(Date.now() - i * 3600 * 1000);
    labels.push(d.getHours() + 'h');
  }
  const data = labels.map(()=> Math.floor(Math.random()*120) + 20);
  viewersChart = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Visiteurs',
        data,
        borderColor: 'rgba(34,197,94,0.9)',
        backgroundColor: 'rgba(34,197,94,0.12)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function fetchViewers(){
  // prefer API if available
  try{
    const res = await authFetch('/admin/analytics/viewers');
    if(res && res.success && Array.isArray(res.data.values)) return res.data.values;
  }catch(e){ /* ignore and fallback */ }
  // fallback: simulate 12 values
  return Array.from({length:12}, ()=> Math.floor(Math.random()*120)+20);
}

async function refreshViewersChart(){
  const values = await fetchViewers();
  // compute total visitors for the shown period and update UI
  try{
    const total = Array.isArray(values) ? values.reduce((a,b)=>a+b,0) : 0;
    const totalEl = document.getElementById('viewersTotal');
    if(totalEl) totalEl.textContent = String(total);
  }catch(e){ /* ignore */ }
  if(viewersChart){
    viewersChart.data.datasets[0].data = values;
    viewersChart.update();
  }
}

// viewers modal: large chart + raw data
let viewersLargeChart = null;
function openViewersModal(){
  const modal = document.getElementById('viewersModal');
  if(!modal) return;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  // render data
  fetchViewers().then(values=>{
    const pre = document.getElementById('viewersRaw');
    const labels = values.map((_,i)=> (new Date(Date.now() - (values.length-1-i)*3600*1000)).toLocaleString());
    if(pre) pre.textContent = formatSeries(values, { labels, unit: 'visiteurs' });
    const ctx = document.getElementById('viewersLargeChart').getContext('2d');
    if(viewersLargeChart) viewersLargeChart.destroy();
    viewersLargeChart = new Chart(ctx, { type:'line', data:{ labels, datasets:[{ data: values, borderColor:'rgba(34,197,94,0.9)', backgroundColor:'rgba(34,197,94,0.12)', fill:true }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
  });
}

function closeViewersModal(){
  const modal = document.getElementById('viewersModal');
  if(!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
}

// helper: format a numeric series into readable lines with labels and units
function formatSeries(values, opts = {}){
  const labels = opts.labels || values.map((_,i)=>i+1);
  const unit = opts.unit || '';
  // produce lines like "2025-10-20 10:00 — 2 593 visiteurs"
  return values.map((v,i)=> `${labels[i]} — ${typeof v === 'number' ? Number(v).toLocaleString('fr-FR') : v} ${unit}`.trim()).join('\n');
}

// wire buttons
document.getElementById('viewersTotalBtn')?.addEventListener('click', openViewersModal);
document.getElementById('viewersModalClose')?.addEventListener('click', closeViewersModal);

// KPI modal handling
let kpiChart = null;
function openKpiModal(title, values, opts = {}){
  const modal = document.getElementById('kpiModal');
  if(!modal) return;
  document.getElementById('kpiModalTitle').textContent = title;
  modal.classList.remove('hidden'); modal.style.display = 'flex';
  // derive labels (dates) if not provided
  const labels = opts.labels || values.map((_,i)=> (new Date(Date.now() - (values.length-1-i)*24*3600*1000)).toLocaleDateString());
  const ctx = document.getElementById('kpiLargeChart').getContext('2d');
  if(kpiChart) kpiChart.destroy();
  const color = opts.color || 'rgba(16,163,74,0.6)';
  const type = opts.type || 'bar';
  kpiChart = new Chart(ctx, { type, data:{ labels, datasets:[{ data: values, backgroundColor: color, borderColor: color, fill: type === 'line' ? false : true }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
  const pre = document.getElementById('kpiRaw');
  if(pre){
    pre.textContent = formatSeries(values, { labels, unit: opts.unit || '' });
  }
}

function closeKpiModal(){ const modal = document.getElementById('kpiModal'); if(!modal) return; modal.classList.add('hidden'); modal.style.display='none'; }

document.getElementById('kpiModalClose')?.addEventListener('click', closeKpiModal);

// simulate KPI fetches (replace with authFetch calls as needed)
async function fetchKpi(name){
  try{
    // example: const res = await authFetch('/admin/kpi/' + name);
    // if(res && res.success) return res.data.values;
  }catch(e){}
  // fallback: generate 12 values with different profiles per KPI
  if(name === 'sales'){
    // sales: larger values, some weekly pattern
    return Array.from({length:12}, (_,i)=> Math.round(2000 + Math.sin(i/2)*300 + Math.random()*800));
  }
  if(name === 'profit'){
    // profit: smaller absolute but stable growth
    return Array.from({length:12}, (_,i)=> Math.round(500 + i*15 + Math.random()*120));
  }
  if(name === 'growth'){
    // growth: percent points between -5 and +25
    return Array.from({length:12}, (_,i)=> Number((Math.random()*30 - 5 + (i*0.5)).toFixed(1)));
  }
  // default
  return Array.from({length:12}, ()=> Math.round(Math.random()*1000 + 100));
}

// helper to format numbers for dashboard summaries
function formatCurrency(n){
  try{ return Number(n).toLocaleString('fr-FR') + ' DH' }catch(e){ return String(n) }
}

// render the small KPI summaries with trend badges
async function refreshKpiSummaries(){
  const sales = await fetchKpi('sales');
  const profit = await fetchKpi('profit');
  const growth = await fetchKpi('growth');

  // compute summary values (last point)
  const salesVal = sales[sales.length-1];
  const profitVal = profit[profit.length-1];
  const growthVal = growth[growth.length-1];

  const salesEl = document.getElementById('salesAmount');
  const profitEl = document.getElementById('profitAmount');
  const growthEl = document.getElementById('growthAmount');
  if(salesEl) salesEl.textContent = formatCurrency(salesVal);
  if(profitEl) profitEl.textContent = formatCurrency(profitVal);
  if(growthEl) growthEl.textContent = (growthVal >= 0 ? '+' : '') + String(growthVal) + '%';

  // add small trend badges next to each (colored dots / delta)
  function makeBadge(delta){
    const el = document.createElement('span');
    el.className = 'ml-2 text-sm font-semibold';
    el.textContent = delta >= 0 ? '+'+ (Math.round(delta*10)/10) + '%' : String(Math.round(delta*10)/10) + '%';
    el.style.color = delta >= 0 ? '#16a34a' : '#dc2626';
    return el;
  }

  // compute simple delta between last and first
  const sDelta = ((salesVal - sales[0]) / (sales[0] || 1) * 100);
  const pDelta = ((profitVal - profit[0]) / (profit[0] || 1) * 100);
  const gDelta = (growthVal - growth[0]);

  // ensure badges placed once
  const sParent = document.getElementById('kpiSalesBtn');
  const pParent = document.getElementById('kpiProfitBtn');
  const gParent = document.getElementById('kpiGrowthBtn');
  if(sParent){
    sParent.querySelectorAll('.kpi-badge').forEach(n=>n.remove());
    const b = makeBadge(sDelta); b.classList.add('kpi-badge'); sParent.querySelector('div')?.appendChild(b);
  }
  if(pParent){
    pParent.querySelectorAll('.kpi-badge').forEach(n=>n.remove());
    const b = makeBadge(pDelta); b.classList.add('kpi-badge'); pParent.querySelector('div')?.appendChild(b);
  }
  if(gParent){
    gParent.querySelectorAll('.kpi-badge').forEach(n=>n.remove());
    const b = makeBadge(gDelta); b.classList.add('kpi-badge'); gParent.querySelector('div')?.appendChild(b);
  }
}

// open modal with color/style per KPI
function openKpiModal(title, values, opts = {}){
  const modal = document.getElementById('kpiModal');
  if(!modal) return;
  document.getElementById('kpiModalTitle').textContent = title;
  modal.classList.remove('hidden'); modal.style.display = 'flex';
  const ctx = document.getElementById('kpiLargeChart').getContext('2d');
  const labels = values.map((_,i)=> (opts.labels && opts.labels[i]) || (i+1));
  if(kpiChart) kpiChart.destroy();
  const color = opts.color || 'rgba(16,163,74,0.6)';
  const type = opts.type || 'bar';
  kpiChart = new Chart(ctx, { type, data:{ labels, datasets:[{ data: values, backgroundColor: color, borderColor: color, fill: false }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
  const pre = document.getElementById('kpiRaw');
  if(pre){
    const unit = opts.unit || '';
    pre.textContent = formatSeries(values, { labels, unit });
  }
}

// wire KPI buttons with distinct styles
document.getElementById('kpiSalesBtn')?.addEventListener('click', async ()=>{
  const values = await fetchKpi('sales');
  const labels = values.map((_,i)=> (new Date(Date.now() - (values.length-1-i)*24*3600*1000)).toLocaleDateString());
  openKpiModal('Ventes (30 derniers jours)', values, { color: 'rgba(34,197,94,0.8)', type: 'line', labels, unit: 'DH' });
});
document.getElementById('kpiProfitBtn')?.addEventListener('click', async ()=>{
  const values = await fetchKpi('profit');
  const labels = values.map((_,i)=> (new Date(Date.now() - (values.length-1-i)*24*3600*1000)).toLocaleDateString());
  openKpiModal('Profit net (30 derniers jours)', values, { color: 'rgba(250,204,21,0.85)', type: 'bar', labels, unit: 'DH' });
});
document.getElementById('kpiGrowthBtn')?.addEventListener('click', async ()=>{
  const values = await fetchKpi('growth');
  const labels = values.map((_,i)=> (new Date(Date.now() - (values.length-1-i)*24*3600*1000)).toLocaleDateString());
  openKpiModal('Taux de croissance (30 derniers jours)', values, { color: 'rgba(16,185,129,0.9)', type: 'line', labels, unit: '%' });
});

// kick off KPI summaries on load
refreshKpiSummaries().catch(()=>{});

// online users polling
function simulateOnlineUsers(){
  const sampleNames = ['Boulangerie', 'Épicerie', 'La Pizzeria', 'Salon Café', 'Librairie'];
  const count = Math.floor(Math.random()*5) + 1;
  return Array.from({length:count}, (_,i)=> ({ id: 'u'+i, name: sampleNames[Math.floor(Math.random()*sampleNames.length)], since: new Date() }));
}

async function fetchOnlineUsers(){
  try{
    const res = await authFetch('/admin/analytics/online');
    if(res && res.success && Array.isArray(res.data.users)) return res.data.users;
  }catch(e){ /* ignore and fallback */ }
  return simulateOnlineUsers();
}

async function refreshOnlineUsers(){
  const users = await fetchOnlineUsers();
  const list = document.getElementById('onlineUsersList');
  const countEl = document.getElementById('onlineCount');
  if(!list || !countEl) return;
  list.innerHTML = '';
  users.forEach(u=>{
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between';
    li.innerHTML = `<div>${u.name}</div><div class="text-xs text-gray-500">${new Date(u.since).toLocaleTimeString()}</div>`;
    list.appendChild(li);
  });
  countEl.textContent = String(users.length);
}

// initialize viewers chart and start polling
initViewersChart();
refreshViewersChart();
refreshOnlineUsers();
setInterval(()=>{ refreshViewersChart(); refreshOnlineUsers(); }, 10000);

// --- Socket.IO client for realtime testing ---
let socket = null;
function initSocket(){
  try{
    const ioScript = document.createElement('script');
    // Load socket.io client from backend host (window.API_BASE) so it comes from the API server
    const socketIoSrc = (window.API_BASE || '') + '/socket.io/socket.io.js';
    ioScript.src = socketIoSrc;
    ioScript.onload = ()=>{
      // initialize socket connecting to backend (relative to API_BASE)
      try {
        socket = window.io ? window.io((window.API_BASE || ''), { path: '/socket.io' }) : null;
      } catch (e) {
        socket = window.io ? window.io() : null;
      }
      if(!socket) return console.warn('Socket.IO client not available');
      console.info('Socket connected:', socket.id);
      socket.on('connect', ()=> console.info('Socket connected', socket.id));
      socket.on('disconnect', ()=> console.info('Socket disconnected'));
      socket.on('realtime-test', (data)=>{
        console.log('Realtime event received:', data);
        const el = document.getElementById('realtimeEvents');
        if(el){
          const li = document.createElement('li');
          li.className = 'text-sm text-gray-700 bg-white p-2 rounded shadow-sm';
          li.textContent = JSON.stringify(data);
          el.prepend(li);
        }
      });
    
        // Handle new-basket events specifically
        socket.on('new-basket', (data)=>{
          const list = document.getElementById('adminNotificationsList');
          if(!list) return;
          const li = document.createElement('li');
          li.className = 'p-3 bg-white rounded shadow-sm flex items-start justify-between';
          li.innerHTML = `
            <div>
              <div class="font-medium">Nouvelle demande: ${data.name} — ${data.price} DH</div>
              <div class="text-sm text-gray-500">Collecte: ${data.collectionDate} ${data.collectionTime}</div>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1 bg-green-600 text-white rounded" data-action="accept">Accepter</button>
              <button class="px-3 py-1 bg-red-600 text-white rounded" data-action="deny">Refuser</button>
            </div>
          `;
          // store data on li for reference
          li._basketData = data;
          list.prepend(li);
        });
    };
    document.body.appendChild(ioScript);
  }catch(e){ console.warn('Socket init failed', e); }
}

initSocket();

// handle clicks on admin notifications
document.getElementById('adminNotificationsList')?.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const li = btn.closest('li');
  if(!li) return;
  const data = li._basketData || {};
  // emit decision via socket or HTTP fallback
  if(socket){
    socket.emit('basket-decision', { decision: action, basket: data });
  }else{
    try{
      await fetch((window.API_BASE||'') + '/api/realtime/emit', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ event: 'basket-decision', data: { decision: action, basket: data } })
      });
    }catch(err){ console.warn('Failed to send decision', err); }
  }
  // remove the notification from UI
  li.remove();
});

// --- Revenue sparkline and quick actions ---
let sparklineChart = null;
function initSparkline(){
  const ctx = document.getElementById('sparklineRevenue');
  if(!ctx) return;
  const labels = Array.from({length:24}, (_,i)=> (i+1) + 'h');
  const data = labels.map(()=> Math.floor(Math.random()*5000) + 2000);
  sparklineChart = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: 'rgba(16,185,129,0.9)', tension: 0.3, fill: true, backgroundColor: 'rgba(16,185,129,0.08)' }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { display: false } }, elements: { point: { radius: 0 } } }
  });
  // set amount
  const total = data.reduce((s,n)=>s+n,0);
  document.getElementById('revenueAmount').textContent = total.toLocaleString() + ' DH';
  const delta = ((data[data.length-1] - data[0]) / data[0] * 100).toFixed(1);
  const deltaEl = document.getElementById('revenueDelta');
  deltaEl.textContent = (delta >=0 ? '+' : '') + delta + '%';
  deltaEl.className = delta >=0 ? 'text-green-600' : 'text-red-600';
}

function wireQuickActions(){
  document.getElementById('quickCreateOffer')?.addEventListener('click', ()=>{
    const name = prompt('Titre de l\'offre');
    if(name) alert('Offre "'+name+'" créée (simulation)');
  });
  document.getElementById('quickNotify')?.addEventListener('click', ()=>{
    const msg = prompt('Message à envoyer');
    if(msg) alert('Notification envoyée (simulation): '+msg);
  });
  document.getElementById('quickSeed')?.addEventListener('click', ()=>{
    if(confirm('Souhaitez-vous créer des données de test (simulation) ?')) alert('Seed lancé (simulation)');
  });

  document.getElementById('recentErrors')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action="dismiss-error"]');
    if(!btn) return;
    const li = btn.closest('li');
    if(li) li.remove();
  });
}

initSparkline();
wireQuickActions();