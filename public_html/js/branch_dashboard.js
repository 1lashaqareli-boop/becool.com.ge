/* ============================================================
   BECOOL CRM — branch_dashboard.js
   Fix: Asset Card click -> Unified Dashboard
   ============================================================ */

const OPENWEATHER_KEY = 'a155a131748709196243b52b5bf35b53';
let bdcOpen = true;

function _doViewBranchDashboard(b){
    activeBranch=b;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-dashboard-view').classList.add('active');
    fillBdcHeader(b); loadBdcKPIs(); loadBdcWeather();
    const firstTab=document.querySelector('#bdc-nav .bdc-tab'); switchBdcTab('home',firstTab);
}

function fillBdcHeader(b){
    const av=document.getElementById('bdc-avatar'); if(av){if(b.image_url){av.innerHTML=`<img src="${b.image_url}" class="w-full h-full object-cover">`;}else{av.textContent=(b.name||'BC').substring(0,2).toUpperCase();av.className='w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0';}}
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||'';};
    s('bdc-name',b.name||'---'); s('bdc-addr',b.address||'—'); s('bdc-phone',b.contact_phone||'—');
}

async function loadBdcKPIs(){
    const {data:assets}=await _supabase.from('assets').select('status').eq('branch_id',activeBranch.id);
    if(assets){ const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;}; s('bdc-kpi-total',assets.length); s('bdc-kpi-ok',assets.filter(a=>a.status==='Operational').length); s('bdc-kpi-down',assets.filter(a=>a.status==='Down').length); }
}

async function loadBdcWeather(){
    const lat=activeBranch.lat,lng=activeBranch.lng; if(!lat||!lng)return;
    try { const res=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_KEY}&units=metric&lang=ka`); const w=await res.json(); document.getElementById('bdc-w-temp').textContent=Math.round(w.main.temp)+'°C'; document.getElementById('bdc-w-loading').classList.add('hidden'); document.getElementById('bdc-w-data').classList.remove('hidden'); } catch(e){}
}

function switchBdcTab(name,btn){
    document.querySelectorAll('#bdc-nav .bdc-tab').forEach(t=>{t.classList.remove('border-blue-600','text-blue-600','font-bold');t.classList.add('border-transparent','text-slate-400','font-medium');});
    if(btn?.classList){btn.classList.add('border-blue-600','text-blue-600','font-bold');btn.classList.remove('border-transparent','text-slate-400','font-medium');}
    document.querySelectorAll('.bdc-panel').forEach(p=>p.classList.add('hidden'));
    const panel=document.getElementById('bdcp-'+name); if(panel)panel.classList.remove('hidden');
    if(name==='home') loadBdcHome(); if(name==='assets') loadBdcAssetsPanel();
}

async function loadBdcHome(){
    const {data}=await _supabase.from('service_logs').select('*').eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(5);
    const el=document.getElementById('bdc-recent-svc'); if(el) el.innerHTML=data.map(s=>`<div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer transition" onclick='_showServiceModal(${JSON.stringify(s)})'><span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span><span class="text-xs text-slate-600 flex-1 truncate">${s.technician_name}</span></div>`).join('');
    loadBdcAssetsMini();
}

async function loadBdcAssetsMini(){
    const {data}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name'); if(!data)return;
    document.getElementById('bdc-ac-list').innerHTML=data.map(a=>`<div class="flex items-center gap-2 py-2 border-b border-slate-50 cursor-pointer" onclick='_openBdcAssetCard(${JSON.stringify(a)})'><div class="text-xs font-medium text-slate-900">${a.name}</div></div>`).join('');
}

/* FIX: Redirection from Branch Dashboard to Asset Dashboard  */
function _openBdcAssetCard(a) {
    if (typeof navigateToAsset === 'function') {
        navigateToAsset(a, activeBranch);
    } else {
        activeAsset = a;
        openBdcAsset(a);
    }
}

async function loadBdcAssetsPanel(){
    const {data}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name');
    const grid=document.getElementById('bdc-assets-grid'); if(!grid)return;
    grid.innerHTML=data.map(a=>`<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer" onclick='_openBdcAssetCard(${JSON.stringify(a)})'><div class="p-4"><h4 class="text-sm font-black text-slate-900 leading-tight">${a.name}</h4><button class="w-full bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase mt-3">გახსნა →</button></div></div>`).join('');
}

function openBdcAsset(a){ activeAsset=a; document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active')); document.getElementById('service-logs-view').classList.add('active'); loadServiceLogs(); }
