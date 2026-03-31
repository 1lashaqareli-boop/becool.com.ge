/* ============================================================
   BECOOL CRM — branch_dashboard.js (სრული ვერსია)
   ✅ "მაცივრები" / "კონდ." / "სტატ." ტაბები ამოღებული
   ✅ ახალი "აგრეგატები" ტაბი — asset_class ფილტრით
   ✅ ამინდი → weather_analytics.js
   ============================================================ */

const OPENWEATHER_KEY = 'a155a131748709196243b52b5bf35b53';
let bdcOpen = true;

/* ── _doViewBranchDashboard (branch_ui.js wrapper გამოიძახებს) ── */
function _doViewBranchDashboard(b) {
    activeBranch = b;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-dashboard-view').classList.add('active');
    fillBdcHeader(b);
    loadBdcKPIs();
    loadBdcWeather();
    const firstTab = document.querySelector('#bdc-nav .bdc-tab');
    switchBdcTab('home', firstTab);
}

function backToBranches() {
    if(typeof backToCustomer==='function'){backToCustomer();return;}
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
}

function toggleBdcDetails() {
    bdcOpen=!bdcOpen;
    ['bdc-kpi-strip','bdc-weather-strip'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=bdcOpen?'':'none';});
    const ic=document.getElementById('bdc-chev');
    if(ic) ic.innerHTML=bdcOpen?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>';
}

/* ── fillBdcHeader ── */
function fillBdcHeader(b) {
    const av=document.getElementById('bdc-avatar');
    if(b.image_url){av.innerHTML=`<img src="${b.image_url}" class="w-full h-full object-cover">`;}
    else{av.textContent=(b.name||'BC').substring(0,2).toUpperCase();av.className='w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0';}
    document.getElementById('bdc-name').textContent=b.name||'---';
    const st=document.getElementById('bdc-status');
    st.textContent=b.is_active?'Active':'Inactive';
    st.className=`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active?'bg-green-100 text-green-800':'bg-red-100 text-red-700'}`;
    const bt=document.getElementById('bdc-btype');
    if(b.building_type){bt.textContent=b.building_type;bt.classList.remove('hidden');}else bt.classList.add('hidden');
    const pr=document.getElementById('bdc-priority');
    const pm={Critical:'bg-red-100 text-red-700',High:'bg-amber-100 text-amber-700',Standard:'bg-green-100 text-green-700',Low:'bg-slate-100 text-slate-500'};
    if(b.service_priority){pr.textContent=b.service_priority;pr.className=`text-[10px] font-bold px-2 py-0.5 rounded-full ${pm[b.service_priority]||'bg-slate-100 text-slate-500'}`;pr.classList.remove('hidden');}else pr.classList.add('hidden');
    document.getElementById('bdc-addr').textContent =b.address||'—';
    document.getElementById('bdc-phone').textContent=b.contact_phone||b.emergency_phone||'—';
    document.getElementById('bdc-sla').textContent  =b.sla_response_hours?b.sla_response_hours+'h':'—';
    document.getElementById('bdc-freq').textContent =b.service_frequency||'—';
    const w=document.getElementById('bdc-contract-warn');
    if(b.contract_end){const days=Math.ceil((new Date(b.contract_end)-new Date())/86400000);if(days<30){w.textContent=`⚠ ხელშ. ${days}დ`;w.classList.remove('hidden');}else w.classList.add('hidden');}else w.classList.add('hidden');
}

/* ── loadBdcKPIs ── */
async function loadBdcKPIs() {
    const {data:assets}=await _supabase.from('assets').select('status,asset_class').eq('branch_id',activeBranch.id);
    if(assets){
        document.getElementById('bdc-kpi-total').textContent=assets.length;
        document.getElementById('bdc-kpi-ok').textContent   =assets.filter(a=>a.status==='Operational').length;
        document.getElementById('bdc-kpi-maint').textContent=assets.filter(a=>a.status==='Maintenance_Required').length;
        document.getElementById('bdc-kpi-down').textContent =assets.filter(a=>a.status==='Down').length;
        document.getElementById('bdc-kpi-ac').textContent   =assets.filter(a=>a.asset_class==='AC').length;
        document.getElementById('bdc-kpi-ref').textContent  =assets.filter(a=>a.asset_class==='Refrigeration').length;
    }
    const {count}=await _supabase.from('service_logs').select('*',{count:'exact',head:true}).eq('branch_id',activeBranch.id);
    document.getElementById('bdc-kpi-svc').textContent=count??'0';
    const {data:last}=await _supabase.from('service_logs').select('service_date').eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(1);
    document.getElementById('bdc-kpi-last').textContent=last?.[0]?new Date(last[0].service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—';
}

/* ── loadBdcWeather ── */
async function loadBdcWeather() {
    const lat=activeBranch.lat,lng=activeBranch.lng;
    const loadEl=document.getElementById('bdc-w-loading'),dataEl=document.getElementById('bdc-w-data'),errEl=document.getElementById('bdc-w-error');
    const wLoad=document.getElementById('bdc-w-widget-loading'),wData=document.getElementById('bdc-w-widget'),wErr=document.getElementById('bdc-w-widget-err');
    if(!lat||!lng){loadEl?.classList.add('hidden');errEl?.classList.remove('hidden');wLoad?.classList.add('hidden');wErr?.classList.remove('hidden');return;}
    try{
        const res=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_KEY}&units=metric&lang=ka`);
        if(!res.ok) throw new Error(res.status);
        const w=await res.json();
        const temp=Math.round(w.main.temp),feels=Math.round(w.main.feels_like),hum=w.main.humidity,wind=w.wind.speed.toFixed(1);
        const vis=w.visibility?(w.visibility/1000).toFixed(1)+' km':'—',desc=w.weather[0].description;
        const icon=`https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;
        const aqi=hum<50?'კარგი':hum<70?'საშ.':'ცუდი',aqiC=hum<50?'#15803d':hum<70?'#b45309':'#dc2626';
        loadEl?.classList.add('hidden');dataEl?.classList.remove('hidden');
        document.getElementById('bdc-w-temp').textContent =temp+'°C';
        document.getElementById('bdc-w-hum').textContent  =hum+'%';
        document.getElementById('bdc-w-wind').textContent =wind+' m/s';
        document.getElementById('bdc-w-air').textContent  =aqi;
        document.getElementById('bdc-w-air').style.color  =aqiC;
        document.getElementById('bdc-w-feels').textContent=feels+'°C';
        document.getElementById('bdc-w-vis').textContent  =vis;
        wLoad?.classList.add('hidden');wData?.classList.remove('hidden');
        document.getElementById('bdc-w-widget-temp').textContent=temp;
        document.getElementById('bdc-w-widget-desc').textContent=desc;
        document.getElementById('bdc-w-widget-icon').src=icon;
        document.getElementById('bdc-w2-hum').textContent =hum+'%';
        document.getElementById('bdc-w2-wind').textContent=wind+' m/s';
        const wf=document.getElementById('bdc-weather-full');
        if(wf) wf.innerHTML=`<div class="flex items-center gap-4 mb-5"><img src="${icon}" class="w-16 h-16"><div><div class="text-4xl font-black text-slate-900">${temp}°C</div><p class="text-slate-500 capitalize">${desc}</p></div></div><div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm"><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ტენ.</div><div class="font-bold">${hum}%</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ქარი</div><div class="font-bold">${wind} m/s</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">შეგრ.</div><div class="font-bold">${feels}°C</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ხილვ.</div><div class="font-bold">${vis}</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ჰაერი</div><div class="font-bold" style="color:${aqiC}">${aqi}</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ლოკ.</div><div class="font-bold">${w.name||'—'}</div></div></div>`;
    }catch(e){loadEl?.classList.add('hidden');errEl?.classList.remove('hidden');wLoad?.classList.add('hidden');wErr?.classList.remove('hidden');}
}

/* ══════════════════════════════════════════════════════════════
   switchBdcTab — ✅ "fridge"/"ac"/"stats" ამოღ., "assets" დამატ.
   ══════════════════════════════════════════════════════════════ */
function switchBdcTab(name, btn) {
    document.querySelectorAll('#bdc-nav .bdc-tab').forEach(t=>{
        t.classList.remove('border-blue-600','text-blue-600','font-bold');
        t.classList.add('border-transparent','text-slate-400','font-medium');
    });
    if(btn?.classList){btn.classList.add('border-blue-600','text-blue-600','font-bold');btn.classList.remove('border-transparent','text-slate-400','font-medium');}
    document.querySelectorAll('.bdc-panel').forEach(p=>p.classList.add('hidden'));
    const panel=document.getElementById('bdcp-'+name);
    if(panel) panel.classList.remove('hidden');
    if(name==='home')    {loadBdcRecentServices();loadBdcAssetsMini();}
    if(name==='assets')  {loadBdcAssetsPanel();}
    if(name==='service') {loadBdcServices();}
    if(name==='weather') {if(typeof loadBdcWeatherAnalytics==='function')loadBdcWeatherAnalytics();}
}

/* ── HOME TAB ── */
async function loadBdcRecentServices() {
    const el=document.getElementById('bdc-recent-svc');
    const {data}=await _supabase.from('service_logs').select('service_date,service_type,technician_name,assets(name)').eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(5);
    if(!data?.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვ. არ არის</div>';return;}
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML=data.map(s=>`<div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0"><span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span><span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span><span class="text-xs text-slate-600 flex-1 truncate">${s.technician_name||'—'} · ${s.assets?.name||'—'}</span></div>`).join('');
}

async function loadBdcAssetsMini() {
    const {data}=await _supabase.from('assets').select('id,name,brand,model,status,asset_class,asset_type,cooling_capacity_kw,tag_number,last_service_date').eq('branch_id',activeBranch.id).order('name');
    if(!data) return;
    const ac =data.filter(a=>a.asset_class==='AC');
    const ref=data.filter(a=>a.asset_class==='Refrigeration');
    document.getElementById('bdc-ac-badge').textContent =ac.length;
    document.getElementById('bdc-ref-badge').textContent=ref.length;
    _bdcMiniList('bdc-ac-list',  ac);
    _bdcMiniList('bdc-ref-list', ref);
}

function _bdcMiniList(id, assets) {
    const el=document.getElementById(id);
    if(!assets.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-3">—</div>';return;}
    const sc={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const ss={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const dc={Operational:'#22c55e',Maintenance_Required:'#f59e0b',Down:'#ef4444'};
    el.innerHTML=assets.map(a=>`<div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer" onclick='openBdcAsset(${JSON.stringify(a)})'><div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${dc[a.status]||'#94a3b8'}"></div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-slate-900 truncate">${a.name}</div><div class="text-[10px] text-slate-400 truncate">${[a.brand,a.model].filter(Boolean).join(' ')||'—'}${a.cooling_capacity_kw?' · '+a.cooling_capacity_kw+' kW':''}</div></div><span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc[a.status]||'bg-slate-100 text-slate-500'}">${ss[a.status]||a.status}</span></div>`).join('');
}

/* ══════════════════════════════════════════════════════════════
   ASSETS TAB — სრული panel
   ══════════════════════════════════════════════════════════════ */
async function loadBdcAssetsPanel() {
    const panel=document.getElementById('bdcp-assets');if(!panel)return;
    panel.innerHTML=`<div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex gap-2 flex-wrap">
            <button onclick="bdcFilterA('all',this)" class="bdc-af px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white border border-slate-900">ყველა</button>
            <button onclick="bdcFilterA('AC',this)"            class="bdc-af px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-slate-200 hover:border-blue-400 transition">კონდ. AC</button>
            <button onclick="bdcFilterA('Refrigeration',this)" class="bdc-af px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-slate-200 hover:border-teal-400 transition">მაცივ.</button>
            <button onclick="bdcFilterA('Other',this)"         class="bdc-af px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-slate-200 hover:border-amber-400 transition">სხვა</button>
          </div>
          <div class="flex gap-2 flex-wrap">
            <select id="bdc-at-status" onchange="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
              <option value="">ყველა სტ.</option>
              <option value="Operational">Operational</option>
              <option value="Maintenance_Required">Maintenance</option>
              <option value="Down">Down</option>
            </select>
            <select id="bdc-at-type" onchange="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
              <option value="">ყველა ტიპი</option>
              <option value="Split">Split</option>
              <option value="Multi-Split">Multi-Split</option>
              <option value="Cassette">Cassette</option>
              <option value="VRF">VRF/VRV</option>
              <option value="Chiller">Chiller</option>
              <option value="Rooftop">Rooftop</option>
              <option value="AHU">AHU</option>
              <option value="Reach-in">Reach-in</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Display Case">Display Case</option>
              <option value="Condensing Unit">Cond. Unit</option>
              <option value="Blast Chiller">Blast Chiller</option>
              <option value="Boiler">Boiler</option>
              <option value="DHW">DHW</option>
              <option value="Fan">Fan</option>
              <option value="Pump">Pump</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" id="bdc-at-search" placeholder="ძებნა..." oninput="bdcLoadA()"
              class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600 w-32">
          </div>
          <button onclick="openAssetModal()" class="text-xs font-bold text-blue-600 border border-blue-200 px-4 py-1.5 rounded-xl hover:bg-blue-50 transition">+ ახალი</button>
        </div>
      </div>
      <div id="bdc-assets-kpi" class="grid grid-cols-5 gap-3"></div>
      <div id="bdc-assets-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="col-span-3 text-center py-10 text-xs text-slate-300 italic">იტვ...</div>
      </div>
    </div>`;
    window._bdcAC='all';
    await bdcLoadA();
}

function bdcFilterA(cls,btn) {
    window._bdcAC=cls;
    document.querySelectorAll('.bdc-af').forEach(b=>{b.className='bdc-af px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-slate-200 hover:border-slate-400 transition';});
    btn.className='bdc-af px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white border border-slate-900';
    bdcLoadA();
}

async function bdcLoadA() {
    const grid=document.getElementById('bdc-assets-grid'),kpiEl=document.getElementById('bdc-assets-kpi');
    if(!grid||!activeBranch)return;
    grid.innerHTML='<div class="col-span-3 text-center py-8 text-xs text-slate-300 italic">იტვ...</div>';
    let q=_supabase.from('assets').select('*').eq('branch_id',activeBranch.id);
    const cls=window._bdcAC||'all';
    const status=document.getElementById('bdc-at-status')?.value||'';
    const type  =document.getElementById('bdc-at-type')?.value||'';
    const search=(document.getElementById('bdc-at-search')?.value||'').toLowerCase().trim();
    if(cls!=='all') q=q.eq('asset_class',cls);
    if(status)      q=q.eq('status',status);
    if(type)        q=q.eq('asset_type',type);
    q=q.order('name');
    const {data:all,error}=await q;
    if(error){grid.innerHTML=`<div class="col-span-3 text-red-500 text-xs p-4">შეცდ: ${error.message}</div>`;return;}
    const filtered=search?(all||[]).filter(a=>(a.name||'').toLowerCase().includes(search)||(a.tag_number||'').toLowerCase().includes(search)||(a.brand||'').toLowerCase().includes(search)||(a.model||'').toLowerCase().includes(search)):(all||[]);
    /* KPI */
    const tot=all||[];
    if(kpiEl) kpiEl.innerHTML=[
        {v:tot.length,l:'სულ',c:'text-slate-900'},
        {v:tot.filter(a=>a.status==='Operational').length,l:'OK',c:'text-green-700'},
        {v:tot.filter(a=>a.status==='Maintenance_Required').length,l:'Maint.',c:'text-amber-600'},
        {v:tot.filter(a=>a.status==='Down').length,l:'Down',c:'text-red-600'},
        {v:tot.filter(a=>a.asset_class==='AC').length+' / '+tot.filter(a=>a.asset_class==='Refrigeration').length,l:'AC / Refrig.',c:'text-blue-700'},
    ].map(k=>`<div class="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm"><div class="text-2xl font-black ${k.c}">${k.v}</div><div class="text-[10px] text-slate-400 mt-1">${k.l}</div></div>`).join('');
    if(!filtered.length){grid.innerHTML='<div class="col-span-3 text-center py-10 text-xs text-slate-400 italic">ვ/მ</div>';return;}
    const sC={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const sL={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const clB={AC:'border-blue-200',Refrigeration:'border-teal-200',Other:'border-amber-200'};
    grid.innerHTML=filtered.map(a=>`
    <div class="bg-white rounded-2xl border ${clB[a.asset_class]||'border-slate-200'} shadow-sm overflow-hidden hover:shadow-md transition-all group">
      <div class="h-36 bg-slate-50 relative overflow-hidden border-b ${clB[a.asset_class]||'border-slate-100'}">
        ${a.image_url?`<img src="${a.image_url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">`:`<div class="w-full h-full flex items-center justify-center text-slate-200"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 11h12"/></svg></div>`}
        <div class="absolute top-2 left-2"><span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${sC[a.status]||'bg-slate-100 text-slate-500'}">${sL[a.status]||a.status}</span></div>
        <div class="absolute top-2 right-2"><span class="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200">${a.asset_type||'—'}</span></div>
        ${a.tag_number?`<div class="absolute bottom-2 left-2 text-[9px] font-black text-slate-500 bg-white/80 px-2 py-0.5 rounded">TAG: ${a.tag_number}</div>`:''}
      </div>
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <div><h4 class="text-sm font-black text-slate-900 leading-tight">${a.name}</h4><p class="text-[10px] text-slate-400 mt-0.5">${[a.brand,a.model].filter(Boolean).join(' · ')||'—'}</p></div>
          ${a.condition_score?`<div class="text-[9px] font-bold text-blue-600">${a.condition_score}/10</div>`:''}
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] mb-3 border-t border-slate-50 pt-3">
          ${a.cooling_capacity_kw?`<div class="text-slate-400">სიმ. <span class="text-slate-800 font-bold">${a.cooling_capacity_kw} kW</span></div>`:''}
          ${a.refrigerant_type?`<div class="text-slate-400">საფ. <span class="text-slate-800 font-bold">${a.refrigerant_type}</span></div>`:''}
          ${a.voltage?`<div class="text-slate-400">კვ. <span class="text-slate-800 font-bold">${a.voltage}V</span></div>`:''}
          ${a.last_service_date?`<div class="text-slate-400">სერვ. <span class="text-slate-800 font-bold">${new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span></div>`:''}
        </div>
        ${a.next_planned_service?`<div class="mb-3 px-2 py-1.5 rounded-lg ${new Date(a.next_planned_service)<new Date(Date.now()+30*86400000)?'bg-red-50 text-red-600':'bg-amber-50 text-amber-600'} text-[9px] font-bold">შემ. სერვ: ${new Date(a.next_planned_service).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'})}</div>`:''}
        <div class="flex gap-2">
          <button onclick='openBdcAsset(${JSON.stringify(a)})' class="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 transition">სერვ. ისტ.</button>
          <button onclick='openAssetModal(${JSON.stringify(a)})' class="flex-1 border border-slate-200 text-slate-500 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition">რედ.</button>
          <button onclick='deleteData("assets","${a.id}")' class="px-3 text-slate-300 hover:text-red-500 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');
    lucide.createIcons();
}

/* ── SERVICE TAB ── */
async function loadBdcServices() {
    const el=document.getElementById('bdc-service-full');
    const type=document.getElementById('bdc-svc-filter-type')?.value||'';
    el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-6">იტვ...</div>';
    let q=_supabase.from('service_logs').select('service_date,service_type,technician_name,job_description,assets(name)').eq('branch_id',activeBranch.id).order('service_date',{ascending:false});
    if(type) q=q.eq('service_type',type);
    const {data}=await q;
    if(!data?.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">სერვ. არ არის</div>';return;}
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">თარ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აგრ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აღწ.</th>
    </tr></thead><tbody>${data.map(s=>`<tr class="border-b border-slate-50 hover:bg-slate-50">
        <td class="py-2 px-2 text-slate-500">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td class="py-2 px-2"><span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
        <td class="py-2 px-2 font-medium text-slate-900">${s.technician_name||'—'}</td>
        <td class="py-2 px-2 text-slate-500">${s.assets?.name||'—'}</td>
        <td class="py-2 px-2 text-slate-400 truncate max-w-[180px]">${s.job_description?s.job_description.substring(0,50)+'...':'—'}</td>
    </tr>`).join('')}</tbody></table>`;
}

/* ── openBdcAsset ── */
function openBdcAsset(a) {
    activeAsset=a;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=a.name||'სერვ.';
    loadServiceLogs();
}

/* ── loadBdcAssets / renderBdcAssetMini (home-ტაბ-ის ძველი alias) ── */
function loadBdcAssets() { loadBdcAssetsMini(); }
