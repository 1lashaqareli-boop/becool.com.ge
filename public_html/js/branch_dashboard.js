/* ============================================================
   BECOOL CRM — branch_dashboard.js v2 (განახლებული)
   viewBranchDashboard → _doViewBranchDashboard
   (wrapper branch_ui.js-შია — breadcrumb-ის განახლებისთვის)
   ============================================================ */

const OPENWEATHER_KEY = 'a155a131748709196243b52b5bf35b53';
let bdcMap = null;
let bdcOpen = true;

/* ── _doViewBranchDashboard ── (ძველი viewBranchDashboard) */
function _doViewBranchDashboard(b) {
    activeBranch = b;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-dashboard-view').classList.add('active');
    if (bdcMap) { bdcMap.remove(); bdcMap = null; }
    fillBdcHeader(b);
    loadBdcKPIs();
    loadBdcWeather();
    const firstTab = document.querySelector('#bdc-nav .bdc-tab');
    switchBdcTab('home', firstTab);
}

/* ── backToBranches ── */
function backToBranches() {
    if (bdcMap) { bdcMap.remove(); bdcMap = null; }
    /* branch_ui.js-ის backToCustomer-ს ვიყენებ */
    backToCustomer();
}

/* ── toggleBdcDetails ── */
function toggleBdcDetails() {
    bdcOpen = !bdcOpen;
    ['bdc-kpi-strip','bdc-weather-strip'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = bdcOpen ? '' : 'none';
    });
    const ic = document.getElementById('bdc-chev');
    if (ic) ic.innerHTML = bdcOpen
        ? '<polyline points="18 15 12 9 6 15"/>'
        : '<polyline points="6 9 12 15 18 9"/>';
}

/* ── fillBdcHeader ── */
function fillBdcHeader(b) {
    const av = document.getElementById('bdc-avatar');
    if (b.image_url) {
        av.innerHTML = `<img src="${b.image_url}" class="w-full h-full object-cover">`;
    } else {
        av.textContent = (b.name||'BC').substring(0,2).toUpperCase();
        av.className = 'w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0';
    }
    document.getElementById('bdc-name').textContent = b.name || '---';

    const stEl = document.getElementById('bdc-status');
    stEl.textContent = b.is_active ? 'Active' : 'Inactive';
    stEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`;

    const btEl = document.getElementById('bdc-btype');
    if (b.building_type) { btEl.textContent = b.building_type; btEl.classList.remove('hidden'); }
    else btEl.classList.add('hidden');

    const prEl = document.getElementById('bdc-priority');
    const prMap = { Critical:'bg-red-100 text-red-700', High:'bg-amber-100 text-amber-700', Standard:'bg-green-100 text-green-700', Low:'bg-slate-100 text-slate-500' };
    if (b.service_priority) {
        prEl.textContent = b.service_priority;
        prEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${prMap[b.service_priority]||'bg-slate-100 text-slate-500'}`;
        prEl.classList.remove('hidden');
    } else prEl.classList.add('hidden');

    document.getElementById('bdc-addr').textContent  = b.address || '—';
    document.getElementById('bdc-phone').textContent = b.contact_phone || b.emergency_phone || '—';
    document.getElementById('bdc-sla').textContent   = b.sla_response_hours ? b.sla_response_hours + 'h' : '—';
    document.getElementById('bdc-freq').textContent  = b.service_frequency || '—';

    const warnEl = document.getElementById('bdc-contract-warn');
    if (b.contract_end) {
        const days = Math.ceil((new Date(b.contract_end) - new Date()) / 86400000);
        if (days < 30) { warnEl.textContent = `⚠ ხელშ. ${days}დ`; warnEl.classList.remove('hidden'); }
        else warnEl.classList.add('hidden');
    } else warnEl.classList.add('hidden');
}

/* ── loadBdcKPIs ── */
async function loadBdcKPIs() {
    const { data: assets } = await _supabase
        .from('assets').select('status, category').eq('branch_id', activeBranch.id);
    if (assets) {
        document.getElementById('bdc-kpi-total').textContent = assets.length;
        document.getElementById('bdc-kpi-ok').textContent    = assets.filter(a=>a.status==='Operational').length;
        document.getElementById('bdc-kpi-maint').textContent = assets.filter(a=>a.status==='Maintenance_Required').length;
        document.getElementById('bdc-kpi-down').textContent  = assets.filter(a=>a.status==='Down').length;
        document.getElementById('bdc-kpi-ac').textContent    = assets.filter(a=>a.category==='AC').length;
        document.getElementById('bdc-kpi-ref').textContent   = assets.filter(a=>a.category==='Refrigeration').length;
    }
    const { count } = await _supabase
        .from('service_logs').select('*',{count:'exact',head:true}).eq('branch_id',activeBranch.id);
    document.getElementById('bdc-kpi-svc').textContent = count ?? '0';

    const { data: last } = await _supabase
        .from('service_logs').select('service_date').eq('branch_id',activeBranch.id)
        .order('service_date',{ascending:false}).limit(1);
    document.getElementById('bdc-kpi-last').textContent = last?.[0]
        ? new Date(last[0].service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
        : '—';
}

/* ── loadBdcWeather ── */
async function loadBdcWeather() {
    const lat = activeBranch.lat, lng = activeBranch.lng;

    const loadEl = document.getElementById('bdc-w-loading');
    const dataEl = document.getElementById('bdc-w-data');
    const errEl  = document.getElementById('bdc-w-error');
    const wLoad  = document.getElementById('bdc-w-widget-loading');
    const wData  = document.getElementById('bdc-w-widget');
    const wErr   = document.getElementById('bdc-w-widget-err');

    if (!lat || !lng) {
        loadEl?.classList.add('hidden'); errEl?.classList.remove('hidden');
        wLoad?.classList.add('hidden');  wErr?.classList.remove('hidden');
        return;
    }
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_KEY}&units=metric&lang=ka`);
        if (!res.ok) throw new Error(res.status);
        const w = await res.json();
        const temp  = Math.round(w.main.temp);
        const feels = Math.round(w.main.feels_like);
        const hum   = w.main.humidity;
        const wind  = w.wind.speed.toFixed(1);
        const vis   = w.visibility ? (w.visibility/1000).toFixed(1)+' km' : '—';
        const desc  = w.weather[0].description;
        const icon  = `https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;
        const aqi   = hum < 50 ? 'კარგი' : hum < 70 ? 'საშ.' : 'ცუდი';
        const aqiColor = hum < 50 ? '#15803d' : hum < 70 ? '#b45309' : '#dc2626';

        loadEl?.classList.add('hidden'); dataEl?.classList.remove('hidden');
        document.getElementById('bdc-w-temp').textContent  = temp+'°C';
        document.getElementById('bdc-w-hum').textContent   = hum+'%';
        document.getElementById('bdc-w-wind').textContent  = wind+' m/s';
        document.getElementById('bdc-w-air').textContent   = aqi;
        document.getElementById('bdc-w-air').style.color   = aqiColor;
        document.getElementById('bdc-w-feels').textContent = feels+'°C';
        document.getElementById('bdc-w-vis').textContent   = vis;

        wLoad?.classList.add('hidden'); wData?.classList.remove('hidden');
        document.getElementById('bdc-w-widget-temp').textContent = temp;
        document.getElementById('bdc-w-widget-desc').textContent = desc;
        document.getElementById('bdc-w-widget-icon').src = icon;
        document.getElementById('bdc-w2-hum').textContent  = hum+'%';
        document.getElementById('bdc-w2-wind').textContent = wind+' m/s';

        const wfEl = document.getElementById('bdc-weather-full');
        if (wfEl) wfEl.innerHTML = `
            <div class="flex items-center gap-4 mb-5">
                <img src="${icon}" class="w-16 h-16">
                <div><div class="text-4xl font-black text-slate-900">${temp}°C</div><p class="text-slate-500 capitalize">${desc}</p></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ტენიანობა</div><div class="font-bold text-slate-900">${hum}%</div></div>
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ქარი</div><div class="font-bold text-slate-900">${wind} m/s</div></div>
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">შეგრძნება</div><div class="font-bold text-slate-900">${feels}°C</div></div>
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ხილვადობა</div><div class="font-bold text-slate-900">${vis}</div></div>
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ჰაერი</div><div class="font-bold" style="color:${aqiColor};">${aqi}</div></div>
                <div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ლოკაცია</div><div class="font-bold text-slate-900">${w.name||'—'}</div></div>
            </div>`;
    } catch(e) {
        loadEl?.classList.add('hidden'); errEl?.classList.remove('hidden');
        wLoad?.classList.add('hidden');  wErr?.classList.remove('hidden');
    }
}

/* ── switchBdcTab ── */
function switchBdcTab(name, btn) {
    document.querySelectorAll('#bdc-nav .bdc-tab').forEach(t => {
        t.classList.remove('border-blue-600','text-blue-600','font-bold');
        t.classList.add('border-transparent','text-slate-400','font-medium');
    });
    if (btn && btn.classList) {
        btn.classList.add('border-blue-600','text-blue-600','font-bold');
        btn.classList.remove('border-transparent','text-slate-400','font-medium');
    }
    document.querySelectorAll('.bdc-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById('bdcp-'+name);
    if (panel) panel.classList.remove('hidden');

    if (name==='home')    { loadBdcRecentServices(); loadBdcAssets(); }
    if (name==='fridge')  loadBdcAssetsFull('Refrigeration','bdc-fridge-full');
    if (name==='ac')      loadBdcAssetsFull('AC','bdc-ac-full');
    if (name==='service') loadBdcServices();
    if (name==='stats')   loadBdcStats();
    if (name==='weather') loadBdcWeather();
}

/* ── loadBdcRecentServices ── */
async function loadBdcRecentServices() {
    const el = document.getElementById('bdc-recent-svc');
    const { data } = await _supabase
        .from('service_logs')
        .select('service_date,service_type,technician_name,assets(name)')
        .eq('branch_id',activeBranch.id)
        .order('service_date',{ascending:false}).limit(5);
    if (!data || !data.length) { el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვისები არ არის</div>'; return; }
    const tc = {PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML = data.map(s=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
            <span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span>
            <span class="text-xs text-slate-600 flex-1 truncate">${s.technician_name||'—'} · ${s.assets?.name||'—'}</span>
        </div>`).join('');
}

/* ── loadBdcAssets (home ტაბი) ── */
async function loadBdcAssets() {
    const { data } = await _supabase
        .from('assets').select('id,name,brand,model,status,category,cooling_capacity_kw,tag_number,last_service_date')
        .eq('branch_id',activeBranch.id).order('name');
    if (!data) return;
    const ac  = data.filter(a=>a.category==='AC');
    const ref = data.filter(a=>a.category==='Refrigeration');
    document.getElementById('bdc-ac-badge').textContent  = ac.length;
    document.getElementById('bdc-ref-badge').textContent = ref.length;
    renderBdcAssetMini('bdc-ac-list',  ac);
    renderBdcAssetMini('bdc-ref-list', ref);
}

/* ── renderBdcAssetMini ── */
function renderBdcAssetMini(id, assets) {
    const el = document.getElementById(id);
    if (!assets.length) { el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-3">—</div>'; return; }
    const sc = {Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const ss = {Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const dc = {Operational:'#22c55e',Maintenance_Required:'#f59e0b',Down:'#ef4444'};
    el.innerHTML = assets.map(a=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-1 cursor-pointer transition"
             onclick='openBdcAsset(${JSON.stringify(a)})'>
            <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${dc[a.status]||'#94a3b8'};"></div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-slate-900 truncate">${a.name}</div>
                <div class="text-[10px] text-slate-400 truncate">${[a.brand,a.model].filter(Boolean).join(' ')}${a.cooling_capacity_kw?' · '+a.cooling_capacity_kw+' kW':''}</div>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc[a.status]||'bg-slate-100 text-slate-500'}">${ss[a.status]||a.status}</span>
        </div>`).join('');
}

/* ── loadBdcAssetsFull ── */
async function loadBdcAssetsFull(category, containerId) {
    const el = document.getElementById(containerId);
    el.innerHTML = '<div class="text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>';

    const { data, error } = await _supabase.from('assets').select('*')
        .eq('branch_id', activeBranch.id).order('name');

    if (error) { el.innerHTML = '<div class="text-xs text-red-500 italic text-center py-10">შეცდომა</div>'; return; }
    if (!data || !data.length) { el.innerHTML = '<div class="text-xs text-slate-300 italic text-center py-10">ჩანაწერები არ არის</div>'; return; }

    el.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">` + data.map(a => `
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:-translate-y-2 transition-all">
            <div class="h-48 bg-slate-900 relative overflow-hidden">
                ${a.image_url
                    ? `<img src="${a.image_url}" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition duration-700">`
                    : `<div class="w-full h-full flex items-center justify-center text-slate-700 font-black italic">NO IMAGE</div>`
                }
                <div class="absolute top-4 left-4">
                    <span class="status-badge ${a.status === 'Operational' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">${a.status}</span>
                </div>
                <div class="absolute bottom-4 right-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic">${a.asset_type}</div>
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">${a.name}</h4>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${a.brand} ${a.model || ''}</p>
                    </div>
                    <span class="text-[10px] font-black text-blue-600 block uppercase">TAG: ${a.tag_number || '---'}</span>
                </div>
                <div class="grid grid-cols-2 gap-y-3 mb-6 border-t border-slate-50 pt-6 text-[11px] font-bold">
                    <div class="text-slate-400">სიმძლავრე: <span class="text-slate-900 italic">${a.cooling_capacity_kw || 0} kW</span></div>
                    <div class="text-slate-400">ფრეონი: <span class="text-slate-900 italic">${a.refrigerant_type || '---'}</span></div>
                    <div class="text-slate-400">სერიული: <span class="text-slate-900 italic text-[9px]">${a.serial_number || '---'}</span></div>
                    <div class="text-slate-400">ელ-კვება: <span class="text-slate-900 italic">${a.voltage || 400}V / ${a.phase || '3'}</span></div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick='openBdcAsset(${JSON.stringify(a)})' class="w-full bg-orange-500 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-orange-600 transition flex items-center justify-center gap-2 italic shadow-lg shadow-orange-100">
                        სერვისის ისტორია <i data-lucide="history" class="w-4 h-4"></i>
                    </button>
                    <div class="flex gap-2">
                        <button onclick='openAssetModal(${JSON.stringify(a)})' class="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-blue-600 transition">რედაქტირება</button>
                        <button onclick='deleteData("assets", "${a.id}")' class="px-4 text-slate-300 hover:text-red-500 transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') + `</div>`;

    lucide.createIcons();
}

/* ── loadBdcServices ── */
async function loadBdcServices() {
    const el   = document.getElementById('bdc-service-full');
    const type = document.getElementById('bdc-svc-filter-type')?.value || '';
    el.innerHTML = '<div class="text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>';
    let q = _supabase.from('service_logs')
        .select('service_date,service_type,technician_name,job_description,assets(name)')
        .eq('branch_id',activeBranch.id).order('service_date',{ascending:false});
    if (type) q = q.eq('service_type',type);
    const { data } = await q;
    if (!data || !data.length) { el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">სერვისები არ არის</div>'; return; }
    const tc = {PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML = `<table class="w-full text-xs border-collapse">
        <thead><tr class="border-b border-slate-100">
            <th class="text-left font-medium text-slate-400 py-2 px-2">თარიღი</th>
            <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
            <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნიკოსი</th>
            <th class="text-left font-medium text-slate-400 py-2 px-2">აგრეგატი</th>
            <th class="text-left font-medium text-slate-400 py-2 px-2">აღწერა</th>
        </tr></thead>
        <tbody>${data.map(s=>`
            <tr class="border-b border-slate-50 hover:bg-slate-50">
                <td class="py-2 px-2 text-slate-500">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td class="py-2 px-2"><span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
                <td class="py-2 px-2 font-medium text-slate-900">${s.technician_name||'—'}</td>
                <td class="py-2 px-2 text-slate-500">${s.assets?.name||'—'}</td>
                <td class="py-2 px-2 text-slate-400 truncate max-w-xs">${s.job_description?s.job_description.substring(0,60)+'...':'—'}</td>
            </tr>`).join('')}
        </tbody></table>`;
}

/* ── openBdcAsset ── */
function openBdcAsset(a) {
    activeAsset = a;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText = a.name||'სერვისი';
    loadServiceLogs();
}
