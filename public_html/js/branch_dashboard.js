/* ============================================================
   BECOOL CRM — branch_dashboard.js (სრული, ყველა fix)
   Fix 4: home tab — სრული ძველი სტრუქტურა
   Fix 5: service row click → modal (detail)
   Fix 6: asset card click → loadAssetView (asset_view.js)
   ============================================================ */

const OPENWEATHER_KEY = 'a155a131748709196243b52b5bf35b53';
let bdcOpen = true;

function _doViewBranchDashboard(b){
    activeBranch=b;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-dashboard-view').classList.add('active');
    fillBdcHeader(b);
    loadBdcKPIs();
    loadBdcWeather();
    const firstTab=document.querySelector('#bdc-nav .bdc-tab');
    switchBdcTab('home',firstTab);
}

function backToBranches(){
    if(typeof backToCustomer==='function'){backToCustomer();return;}
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
}
function toggleBdcDetails(){
    bdcOpen=!bdcOpen;
    ['bdc-kpi-strip','bdc-weather-strip'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=bdcOpen?'':'none';});
    const ic=document.getElementById('bdc-chev');
    if(ic)ic.innerHTML=bdcOpen?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>';
}

/* ── fillBdcHeader ── */
function fillBdcHeader(b){
    const av=document.getElementById('bdc-avatar');
    if(av){if(b.image_url){av.innerHTML=`<img src="${b.image_url}" class="w-full h-full object-cover">`;}else{av.textContent=(b.name||'BC').substring(0,2).toUpperCase();av.className='w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0';}}
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||'';};
    s('bdc-name',b.name||'---');
    const st=document.getElementById('bdc-status');
    if(st){st.textContent=b.is_active?'Active':'Inactive';st.className=`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active?'bg-green-100 text-green-800':'bg-red-100 text-red-700'}`;}
    const bt=document.getElementById('bdc-btype');
    if(bt){if(b.building_type){bt.textContent=b.building_type;bt.classList.remove('hidden');}else bt.classList.add('hidden');}
    const pr=document.getElementById('bdc-priority');
    const pm={Critical:'bg-red-100 text-red-700',High:'bg-amber-100 text-amber-700',Standard:'bg-green-100 text-green-700',Low:'bg-slate-100 text-slate-500'};
    if(pr){if(b.service_priority){pr.textContent=b.service_priority;pr.className=`text-[10px] font-bold px-2 py-0.5 rounded-full ${pm[b.service_priority]||'bg-slate-100 text-slate-500'}`;pr.classList.remove('hidden');}else pr.classList.add('hidden');}
    s('bdc-addr',b.address||'—');s('bdc-phone',b.contact_phone||b.emergency_phone||'—');
    s('bdc-sla',b.sla_response_hours?b.sla_response_hours+'h':'—');s('bdc-freq',b.service_frequency||'—');
    const w=document.getElementById('bdc-contract-warn');
    if(w){if(b.contract_end){const days=Math.ceil((new Date(b.contract_end)-new Date())/86400000);if(days<30){w.textContent=`⚠ ხელშ. ${days}დ`;w.classList.remove('hidden');}else w.classList.add('hidden');}else w.classList.add('hidden');}
}

/* ── loadBdcKPIs ── */
async function loadBdcKPIs(){
    const {data:assets}=await _supabase.from('assets').select('status,asset_class').eq('branch_id',activeBranch.id);
    if(assets){
        const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
        s('bdc-kpi-total',assets.length);s('bdc-kpi-ok',assets.filter(a=>a.status==='Operational').length);
        s('bdc-kpi-maint',assets.filter(a=>a.status==='Maintenance_Required').length);s('bdc-kpi-down',assets.filter(a=>a.status==='Down').length);
        s('bdc-kpi-ac',assets.filter(a=>a.asset_class==='AC').length);s('bdc-kpi-ref',assets.filter(a=>a.asset_class==='Refrigeration').length);
    }
    const {count}=await _supabase.from('service_logs').select('*',{count:'exact',head:true}).eq('branch_id',activeBranch.id);
    const ks=document.getElementById('bdc-kpi-svc');if(ks)ks.textContent=count??'0';
    const {data:last}=await _supabase.from('service_logs').select('service_date').eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(1);
    const kl=document.getElementById('bdc-kpi-last');if(kl)kl.textContent=last?.[0]?new Date(last[0].service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—';
}

/* ── loadBdcWeather ── */
async function loadBdcWeather(){
    const lat=activeBranch.lat,lng=activeBranch.lng;
    const sh=(id,show)=>{const e=document.getElementById(id);if(e){if(show)e.classList.remove('hidden');else e.classList.add('hidden');}};
    if(!lat||!lng){sh('bdc-w-loading',false);sh('bdc-w-error',true);sh('bdc-w-widget-loading',false);sh('bdc-w-widget-err',true);return;}
    try{
        const res=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_KEY}&units=metric&lang=ka`);
        if(!res.ok)throw new Error(res.status);
        const w=await res.json();
        const temp=Math.round(w.main.temp),feels=Math.round(w.main.feels_like),hum=w.main.humidity;
        const wind=w.wind.speed.toFixed(1),vis=w.visibility?(w.visibility/1000).toFixed(1)+' km':'—';
        const desc=w.weather[0].description,icon=`https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;
        const aqi=hum<50?'კარგი':hum<70?'საშ.':'ცუდი',aqiC=hum<50?'#15803d':hum<70?'#b45309':'#dc2626';
        const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
        sh('bdc-w-loading',false);sh('bdc-w-data',true);
        s('bdc-w-temp',temp+'°C');s('bdc-w-hum',hum+'%');s('bdc-w-wind',wind+' m/s');
        const aw=document.getElementById('bdc-w-air');if(aw){aw.textContent=aqi;aw.style.color=aqiC;}
        s('bdc-w-feels',feels+'°C');s('bdc-w-vis',vis);
        sh('bdc-w-widget-loading',false);sh('bdc-w-widget',true);
        s('bdc-w-widget-temp',temp);s('bdc-w-widget-desc',desc);
        const wi=document.getElementById('bdc-w-widget-icon');if(wi)wi.src=icon;
        s('bdc-w2-hum',hum+'%');s('bdc-w2-wind',wind+' m/s');
        const wf=document.getElementById('bdc-weather-full');
        if(wf)wf.innerHTML=`<div class="flex items-center gap-4 mb-5"><img src="${icon}" class="w-16 h-16"><div><div class="text-4xl font-black text-slate-900">${temp}°C</div><p class="text-slate-500 capitalize">${desc}</p></div></div><div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm"><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ტენ.</div><div class="font-bold">${hum}%</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ქარი</div><div class="font-bold">${wind} m/s</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">შეგრ.</div><div class="font-bold">${feels}°C</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ხილვ.</div><div class="font-bold">${vis}</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ჰაერი</div><div class="font-bold" style="color:${aqiC}">${aqi}</div></div><div class="bg-slate-50 rounded-xl p-3"><div class="text-[10px] text-slate-400 mb-1">ლოკ.</div><div class="font-bold">${w.name||'—'}</div></div></div>`;
    }catch(e){const sh2=(id,v)=>{const el=document.getElementById(id);if(el){if(v)el.classList.remove('hidden');else el.classList.add('hidden');}};sh2('bdc-w-loading',false);sh2('bdc-w-error',true);sh2('bdc-w-widget-loading',false);sh2('bdc-w-widget-err',true);}
}

/* ══════════════════════════════════════════════════════════════
   switchBdcTab
   ══════════════════════════════════════════════════════════════ */
function switchBdcTab(name,btn){
    document.querySelectorAll('#bdc-nav .bdc-tab').forEach(t=>{t.classList.remove('border-blue-600','text-blue-600','font-bold');t.classList.add('border-transparent','text-slate-400','font-medium');});
    if(btn?.classList){btn.classList.add('border-blue-600','text-blue-600','font-bold');btn.classList.remove('border-transparent','text-slate-400','font-medium');}
    document.querySelectorAll('.bdc-panel').forEach(p=>p.classList.add('hidden'));
    const panel=document.getElementById('bdcp-'+name);
    if(panel)panel.classList.remove('hidden');
    if(name==='home')    {loadBdcHome();}
    if(name==='plan')    {/* static */}
    if(name==='assets')  {loadBdcAssetsPanel();}
    if(name==='service') {loadBdcServices();}
    if(name==='weather') {if(typeof loadBdcWeatherAnalytics==='function')loadBdcWeatherAnalytics();}
}

/* ══════════════════════════════════════════════════════════════
   Fix 4: HOME TAB — ძველი სრული სტრუქტურა
   ══════════════════════════════════════════════════════════════ */
async function loadBdcHome(){
    await Promise.all([loadBdcRecentServices(), loadBdcAssetsMini()]);
}

async function loadBdcRecentServices(){
    const el=document.getElementById('bdc-recent-svc');if(!el)return;
    el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-3">იტვ...</div>';
    const {data,error}=await _supabase.from('service_logs')
        .select('id,service_date,service_type,technician_name,asset_id,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,ambient_temp,amp_draw_comp,amp_draw_fan,comp_current_a,fan_current_a,refrigerant_added_kg,refrigerant_recovered_kg,leak_test_performed,leak_test_result,filters_cleaned,coils_cleaned,oil_level_ok,electrical_connections_checked,drain_checked,defrost_checked,system_status_after,recommendations,job_description')
        .eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(5);
    if(error||!data?.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვ. არ არის</div>';return;}
    const ids=[...new Set(data.map(s=>s.asset_id).filter(Boolean))];
    let aMap={};
    if(ids.length){const {data:an}=await _supabase.from('assets').select('id,name').in('id',ids);aMap=Object.fromEntries((an||[]).map(a=>[a.id,a.name]));}
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    const enriched=data.map(s=>({...s,_asName:aMap[s.asset_id]||'—',_brName:activeBranch.name||'—'}));
    el.innerHTML=enriched.map(s=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer transition"
             onclick='_showServiceModal(${JSON.stringify(s)})'>
            <span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span>
            <span class="text-xs text-slate-600 flex-1 truncate">${s.technician_name||'—'} · ${s._asName}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');
}

async function loadBdcAssetsMini(){
    const {data}=await _supabase.from('assets').select('id,name,brand,model,status,asset_class,asset_type,cooling_capacity_kw,tag_number,last_service_date').eq('branch_id',activeBranch.id).order('name');
    if(!data)return;
    const ac=data.filter(a=>a.asset_class==='AC');
    const ref=data.filter(a=>a.asset_class==='Refrigeration');
    const ab=document.getElementById('bdc-ac-badge'),rb=document.getElementById('bdc-ref-badge');
    if(ab)ab.textContent=ac.length;if(rb)rb.textContent=ref.length;
    _bdcMiniList('bdc-ac-list', ac);
    _bdcMiniList('bdc-ref-list',ref);
}

function _bdcMiniList(id,assets){
    const el=document.getElementById(id);if(!el)return;
    if(!assets.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-3">—</div>';return;}
    const sc={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const ss={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const dc={Operational:'#22c55e',Maintenance_Required:'#f59e0b',Down:'#ef4444'};
    el.innerHTML=assets.map(a=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer transition"
             onclick='_openBdcAssetCard(${JSON.stringify(a)})'>
            <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${dc[a.status]||'#94a3b8'}"></div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-slate-900 truncate">${a.name}</div>
                <div class="text-[10px] text-slate-400 truncate">${[a.brand,a.model].filter(Boolean).join(' ')||'—'}${a.cooling_capacity_kw?' · '+a.cooling_capacity_kw+' kW':''}</div>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc[a.status]||'bg-slate-100 text-slate-500'}">${ss[a.status]||a.status}</span>
        </div>`).join('');
}

/* Fix 5+6: asset card click → asset_view.js dashboard with this specific asset */
function _openBdcAssetCard(a){
    activeAsset = a;
    /* _pendingAssetId → asset_view.js-ს ეტყვის რომელი asset გახსნას */
    window._pendingAssetId = a.id;
    /* breadcrumb-ი ფილიალზე განახლება */
    if (typeof _setNavBranch === 'function') _setNavBranch(activeBranch);
    /* asset_view.js loadAssetView ფუნქცია */
    if (typeof loadAssetView === 'function') {
        loadAssetView(activeBranch);
    } else {
        /* fallback: სერვ. ისტ. */
        openBdcAsset(a);
    }
}

/* ══════════════════════════════════════════════════════════════
   ASSETS TAB — sidebar + cards (Fix 6: card click → asset_view)
   ══════════════════════════════════════════════════════════════ */
async function loadBdcAssetsPanel(){
    const panel=document.getElementById('bdcp-assets');if(!panel)return;
    const {data:allAssets}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name');
    const al=allAssets||[];
    const acTypes=['Split','Multi-Split','Semi-Industrial','VRF','VRV','Chiller','Rooftop','Cassette','AHU','FCU','PTAC'];
    const refTypes=['Reach-in','Walk-in','Condensing Unit','Display Case','Blast Chiller','Ice Maker','Freezer Tunnel'];
    const countByType={};al.forEach(a=>{countByType[a.asset_type]=(countByType[a.asset_type]||0)+1;});
    const sbItem=(type,label)=>`
        <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer hover:bg-white/10 rounded transition _bdc-sb-item" data-type="${type}" onclick="_bdcSelectType('${type}',this)">
            <span class="text-slate-300">${label||type}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">${countByType[type]||0}</span>
        </div>`;
    panel.innerHTML=`
    <div class="flex gap-4" style="min-height:600px">
        <div class="flex-shrink-0 rounded-2xl overflow-hidden" style="width:200px;background:#0f2942">
            <div class="p-4 border-b border-white/10">
                <div class="text-sm font-bold text-white">${activeBranch.name||'ფილ.'}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">აგრეგატები</div>
            </div>
            <div class="py-2 overflow-y-auto" style="max-height:560px">
                <div class="px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">კონდიციონირება</div>
                <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer bg-white/10 rounded _bdc-sb-item _bdc-sb-active" data-type="__AC" onclick="_bdcSelectType('__AC',this)">
                    <span class="text-white font-medium">AC სისტ. ყველა</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">${al.filter(a=>a.asset_class==='AC').length}</span>
                </div>
                ${acTypes.map(t=>sbItem(t)).join('')}
                <div class="px-4 pt-3 pb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 mt-1">მაცივრები</div>
                <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer hover:bg-white/10 rounded transition _bdc-sb-item" data-type="__Refrigeration" onclick="_bdcSelectType('__Refrigeration',this)">
                    <span class="text-slate-300">Refrigeration ყველა</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">${al.filter(a=>a.asset_class==='Refrigeration').length}</span>
                </div>
                ${refTypes.map(t=>sbItem(t)).join('')}
                <div class="px-4 pt-3 pb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 mt-1">გათბობა / წყ.</div>
                ${['Boiler','DHW','Electric Heater','Pump','Heat Exchanger'].map(t=>sbItem(t)).join('')}
                <div class="px-4 pt-3 pb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 mt-1">ვენტ.</div>
                ${['Recuperator','AHU','Fan'].map(t=>sbItem(t)).join('')}
                ${sbItem('Other','სხვა')}
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm mb-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div class="flex gap-2">
                        <select id="bdc-at-status" onchange="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
                            <option value="">ყველა სტ.</option><option value="Operational">OK</option><option value="Maintenance_Required">Maint.</option><option value="Down">Down</option>
                        </select>
                        <input type="text" id="bdc-at-search" placeholder="ძებნა..." oninput="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600 w-32">
                    </div>
                    <button onclick="openAssetModal()" class="text-xs font-bold text-blue-600 border border-blue-200 px-4 py-1.5 rounded-xl hover:bg-blue-50">+ ახ.</button>
                </div>
            </div>
            <div id="bdc-assets-kpi" class="grid grid-cols-5 gap-3 mb-4"></div>
            <div id="bdc-assets-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div class="col-span-3 text-center py-10 text-xs text-slate-300 italic">კატეგ. აირჩ. მარცხნიდან</div>
            </div>
        </div>
    </div>`;
    window._bdcTypeFilter='__AC';
    window._bdcAllAssets=al;
    await bdcLoadA();
}

function _bdcSelectType(type,el){
    window._bdcTypeFilter=type;
    document.querySelectorAll('._bdc-sb-item').forEach(i=>i.classList.remove('bg-white/10','_bdc-sb-active'));
    el.classList.add('bg-white/10','_bdc-sb-active');
    bdcLoadA();
}

async function bdcLoadA(){
    const grid=document.getElementById('bdc-assets-grid'),kpiEl=document.getElementById('bdc-assets-kpi');
    if(!grid||!activeBranch)return;
    const typeF=window._bdcTypeFilter||'__AC';
    const status=document.getElementById('bdc-at-status')?.value||'';
    const search=(document.getElementById('bdc-at-search')?.value||'').toLowerCase().trim();
    let all=window._bdcAllAssets;
    if(!all){const {data}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name');all=data||[];window._bdcAllAssets=all;}
    const acT=['Split','Multi-Split','Semi-Industrial','VRF','VRV','Chiller','Rooftop','Cassette','AHU','FCU','PTAC'];
    const refT=['Reach-in','Walk-in','Condensing Unit','Display Case','Blast Chiller','Ice Maker','Freezer Tunnel'];
    let filtered=all;
    if(typeF==='__AC')           filtered=all.filter(a=>a.asset_class==='AC'||acT.includes(a.asset_type));
    else if(typeF==='__Refrigeration')filtered=all.filter(a=>a.asset_class==='Refrigeration'||refT.includes(a.asset_type));
    else filtered=all.filter(a=>a.asset_type===typeF);
    if(status)filtered=filtered.filter(a=>a.status===status);
    if(search)filtered=filtered.filter(a=>(a.name||'').toLowerCase().includes(search)||(a.tag_number||'').toLowerCase().includes(search)||(a.brand||'').toLowerCase().includes(search));
    if(kpiEl)kpiEl.innerHTML=[
        {v:filtered.length,l:'სულ',c:'text-slate-900'},{v:filtered.filter(a=>a.status==='Operational').length,l:'OK',c:'text-green-700'},
        {v:filtered.filter(a=>a.status==='Maintenance_Required').length,l:'Maint.',c:'text-amber-600'},{v:filtered.filter(a=>a.status==='Down').length,l:'Down',c:'text-red-600'},
        {v:all.filter(a=>a.asset_class==='AC').length+'/'+all.filter(a=>a.asset_class==='Refrigeration').length,l:'AC/Refrig.',c:'text-blue-700'},
    ].map(k=>`<div class="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm"><div class="text-xl font-black ${k.c}">${k.v}</div><div class="text-[10px] text-slate-400 mt-0.5">${k.l}</div></div>`).join('');
    if(!filtered.length){grid.innerHTML='<div class="col-span-3 text-center py-10 text-xs text-slate-400 italic">ვ/მ</div>';return;}
    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ძველი ბარათის სტილი — სრული asset_view.js კარტის მსგავსი.
       card-ზე ნებისმიერ ადგილას დაჭ. → _openBdcAssetCard(a)
         = window._pendingAssetId = a.id + loadAssetView(branch)
       ქვედა ღილაკები event.stopPropagation()-ით იცავს click-ს.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const sC={Operational:'bg-green-500 text-white',Maintenance_Required:'bg-amber-500 text-white',Down:'bg-red-500 text-white'};
    const sL={Operational:'Operational',Maintenance_Required:'Maintenance',Down:'Down'};

    grid.innerHTML = filtered.map(a => {
        const aJ = JSON.stringify(a).replace(/'/g,"&#39;");
        const lastSvc = a.last_service_date
            ? new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
            : '—';
        const nextSvcWarning = a.next_planned_service
            ? `<div class="mt-3 px-3 py-1.5 rounded-xl text-[9px] font-bold ${new Date(a.next_planned_service)<new Date(Date.now()+30*86400000)?'bg-red-50 text-red-600':'bg-amber-50 text-amber-600'}">
                    შემდ. სერვ: ${new Date(a.next_planned_service).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'})}
               </div>` : '';
        return `
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer"
             onclick='_openBdcAssetCard(${aJ})'>

            <!-- ზედა: ფოტო + badge-ები -->
            <div class="h-48 bg-slate-900 relative overflow-hidden">
                ${a.image_url
                    ? `<img src="${a.image_url}" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition duration-700">`
                    : `<div class="w-full h-full flex items-center justify-center text-slate-700 font-black italic text-sm">NO IMAGE</div>`
                }
                <!-- სტატუსი -->
                <div class="absolute top-4 left-4">
                    <span class="text-[10px] font-bold px-3 py-1 rounded-full ${sC[a.status]||'bg-slate-500 text-white'}">
                        ${sL[a.status]||a.status}
                    </span>
                </div>
                <!-- asset_type -->
                <div class="absolute bottom-4 right-4 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic">
                    ${a.asset_type||'—'}
                </div>
                <!-- TAG -->
                ${a.tag_number ? `<div class="absolute bottom-4 left-4 text-[9px] font-black text-white bg-black/30 px-2 py-0.5 rounded-full">TAG: ${a.tag_number}</div>` : ''}
            </div>

            <!-- ძირი: ინფო -->
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">${a.name}</h4>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">${[a.brand,a.model].filter(Boolean).join(' · ')||'—'}</p>
                    </div>
                    ${a.condition_score ? `<div class="text-right"><span class="text-lg font-black text-blue-600">${a.condition_score}</span><span class="text-[10px] text-slate-400">/10</span></div>` : ''}
                </div>

                <!-- ტექნიკური მახასიათებლები -->
                <div class="grid grid-cols-2 gap-y-2 mb-4 border-t border-slate-50 pt-4 text-[11px] font-bold">
                    ${a.cooling_capacity_kw ? `<div class="text-slate-400">სიმძლ.: <span class="text-slate-900 italic">${a.cooling_capacity_kw} kW</span></div>` : ''}
                    ${a.refrigerant_type    ? `<div class="text-slate-400">ფრეონი: <span class="text-slate-900 italic">${a.refrigerant_type}</span></div>` : ''}
                    ${a.serial_number       ? `<div class="text-slate-400">სერ.: <span class="text-slate-900 italic text-[9px]">${a.serial_number}</span></div>` : ''}
                    ${a.voltage             ? `<div class="text-slate-400">კვება: <span class="text-slate-900 italic">${a.voltage}V / ${a.phase||'3'}</span></div>` : ''}
                    ${a.location_on_site    ? `<div class="text-slate-400 col-span-2">ლოკ.: <span class="text-slate-900 italic">${a.location_on_site}</span></div>` : ''}
                    <div class="text-slate-400 col-span-2">ბოლო სერვ.: <span class="text-slate-900 italic">${lastSvc}</span></div>
                </div>

                ${nextSvcWarning}

                <!-- ღილაკები — event.stopPropagation() რომ card click-ს არ გადაფაროს -->
                <div class="flex flex-col gap-2 mt-4" onclick="event.stopPropagation()">
                    <!-- მთავარი: Asset Dashboard გახსნა -->
                    <button onclick='_openBdcAssetCard(${aJ})'
                        class="w-full bg-blue-600 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase hover:bg-blue-700 transition flex items-center justify-center gap-2 italic shadow-lg shadow-blue-100">
                        აგრეგატის დაშბორდი
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <!-- მეორადი: სერვ. ისტ. + რედ. + PDF + წაშლა -->
                    <div class="flex gap-2">
                        <button onclick='openBdcAsset(${aJ})'
                            class="flex-1 bg-orange-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-orange-600 transition flex items-center justify-center gap-1 italic">
                            სერვ. ისტ.
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button onclick='openAssetModal(${aJ})'
                            class="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-slate-700 transition">
                            რედ.
                        </button>
                        <button onclick='exportAssetPDF(${aJ})'
                            class="px-3 text-red-400 border border-red-200 rounded-2xl hover:bg-red-50 transition text-[9px] font-bold">
                            PDF
                        </button>
                        <button onclick='deleteData("assets","${a.id}")'
                            class="px-3 text-slate-300 hover:text-red-500 transition">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

/* ══════════════════════════════════════════════════════════════
   Fix 5: SERVICES TAB — row click → _showServiceModal
   ══════════════════════════════════════════════════════════════ */
async function loadBdcServices(){
    const el=document.getElementById('bdc-service-full');if(!el)return;
    el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-6">იტვ...</div>';
    const type=document.getElementById('bdc-svc-filter-type')?.value||'';
    let q=_supabase.from('service_logs')
        .select('id,service_date,service_type,technician_name,job_description,asset_id,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,ambient_temp,amp_draw_comp,amp_draw_fan,comp_current_a,fan_current_a,refrigerant_added_kg,refrigerant_recovered_kg,leak_test_performed,leak_test_result,filters_cleaned,coils_cleaned,oil_level_ok,electrical_connections_checked,drain_checked,defrost_checked,system_status_after,recommendations')
        .eq('branch_id',activeBranch.id).order('service_date',{ascending:false});
    if(type)q=q.eq('service_type',type);
    const {data,error}=await q;
    if(error){el.innerHTML=`<div class="text-xs text-red-400 italic text-center py-6">შეცდ: ${error.message}</div>`;return;}
    if(!data?.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">სერვ. არ არის</div>';return;}
    const ids=[...new Set(data.map(s=>s.asset_id).filter(Boolean))];
    let aMap={};
    if(ids.length){const {data:an}=await _supabase.from('assets').select('id,name').in('id',ids);aMap=Object.fromEntries((an||[]).map(a=>[a.id,a.name]));}
    const enriched=data.map(s=>({...s,_assetName:aMap[s.asset_id]||'—',_branchName:activeBranch.name||'—'}));
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">თარ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აგრ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აღწ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">PDF</th>
    </tr></thead><tbody>
    ${enriched.map(s=>`
    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer group">
        <td class="py-2 px-2 text-slate-500 whitespace-nowrap" onclick='_showServiceModal(${JSON.stringify(s)})'>${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td class="py-2 px-2" onclick='_showServiceModal(${JSON.stringify(s)})'><span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
        <td class="py-2 px-2 font-medium text-slate-900" onclick='_showServiceModal(${JSON.stringify(s)})'>${s.technician_name||'—'}</td>
        <td class="py-2 px-2 text-slate-500" onclick='_showServiceModal(${JSON.stringify(s)})'>${s._assetName}</td>
        <td class="py-2 px-2 text-slate-400 truncate max-w-[180px]" onclick='_showServiceModal(${JSON.stringify(s)})'>${s.job_description?s.job_description.substring(0,50)+'...':'—'}</td>
        <td class="py-2 px-2"><button onclick='exportServicePDF(${JSON.stringify(s)})' class="text-[9px] font-bold text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">PDF</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

/* ══════════════════════════════════════════════════════════════
   სერვ. დეტ. მოდალი — საერთო branch_ui.js-თვისაც
   ══════════════════════════════════════════════════════════════ */
function _showServiceModal(s){
    let modal=document.getElementById('_svc-modal');
    if(!modal){modal=document.createElement('div');modal.id='_svc-modal';modal.style.cssText='position:fixed;inset:0;background:rgba(10,18,35,0.75);z-index:2000;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem';modal.onclick=(e)=>{if(e.target===modal)modal.remove();};document.body.appendChild(modal);}
    const date=new Date(s.service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'long',year:'numeric'});
    const tc={PPM:'bg-blue-100 text-blue-800',Corrective:'bg-amber-100 text-amber-800',Emergency:'bg-red-100 text-red-800',Repair:'bg-purple-100 text-purple-800',Installation:'bg-green-100 text-green-800'};
    const row=(l,v)=>v!=null&&v!==''&&v!==false?`<tr><td class="py-1.5 px-3 text-[11px] text-slate-400 font-medium whitespace-nowrap">${l}</td><td class="py-1.5 px-3 text-[11px] text-slate-800 font-semibold">${v}</td></tr>`:'';
    const b=(v)=>v?'✓ დიახ':'✗ არა';
    const assetName=s._assetName||s._asName||activeAsset?.name||'—';
    const branchName=s._branchName||s._brName||activeBranch?.name||'—';
    modal.innerHTML=`
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-700'}">${s.service_type||'—'}</span>
                    <span class="text-xs text-slate-400">${date}</span>
                </div>
                <h3 class="text-lg font-black text-slate-900 mb-0.5">${s.technician_name||'—'}</h3>
                <div class="text-xs text-slate-400">${branchName} · ${assetName}</div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button onclick='exportServicePDF(${JSON.stringify(s)})' class="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50">PDF</button>
                <button onclick="document.getElementById('_svc-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 text-sm">✕</button>
            </div>
        </div>
        <div class="p-5 space-y-4">
            <div class="bg-slate-50 rounded-xl p-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">სამ. აღწ.</div>
                <p class="text-sm text-slate-800 leading-relaxed">${s.job_description||'—'}</p>
                ${s.recommendations?`<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">რეკომ.</div><p class="text-sm text-slate-600">${s.recommendations}</p>`:''}
                ${s.system_status_after?`<div class="mt-3 text-xs"><span class="font-bold text-slate-500">სისტ. სტ.:</span> ${s.system_status_after}</div>`:''}
            </div>
            ${(s.suction_pressure!=null||s.discharge_pressure!=null||s.superheat!=null||s.comp_current_a!=null||s.amp_draw_comp!=null)?`
            <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">სამაც. გაზომ.</div>
                <table class="w-full border border-slate-100 rounded-xl overflow-hidden text-xs">
                <tbody class="divide-y divide-slate-100">
                    ${row('LP Bar',s.suction_pressure)}${row('HP Bar',s.discharge_pressure)}
                    ${row('T შეწ. °C',s.suction_temp)}${row('T დაჭ. °C',s.discharge_temp)}
                    ${row('Superheat K',s.superheat)}${row('Subcooling K',s.subcooling)}
                    ${row('კომპ. A',s.comp_current_a??s.amp_draw_comp)}${row('ფენ. A',s.fan_current_a??s.amp_draw_fan)}
                    ${row('გარ. ტემ. °C',s.ambient_temp)}${row('საფ. დამ. kg',s.refrigerant_added_kg)}
                    ${row('საფ. ამ. kg',s.refrigerant_recovered_kg)}
                </tbody></table>
            </div>`:''}
            <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ჩეკლისტი</div>
                <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3">
                    ${[['გაჟ. ტესტი',s.leak_test_performed],['ფილტრი',s.filters_cleaned],['Coil',s.coils_cleaned],['ელ. კავშ.',s.electrical_connections_checked],['Drain',s.drain_checked],['Defrost',s.defrost_checked],['ზეთი OK',s.oil_level_ok]].map(([l,v])=>`<div class="flex items-center gap-1.5"><span class="${v?'text-green-600':'text-slate-300'}">${b(v)}</span><span class="text-slate-600">${l}</span></div>`).join('')}
                </div>
                ${s.leak_test_result?`<div class="mt-2 text-xs text-slate-500"><span class="font-medium">გაჟ. შედ.:</span> ${s.leak_test_result}</div>`:''}
            </div>
        </div>
    </div>`;
}

function openBdcAsset(a){
    activeAsset=a;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=a.name||'სერვ.';
    loadServiceLogs();
}
function loadBdcAssets(){loadBdcAssetsMini();}
