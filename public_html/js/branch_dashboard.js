/* ============================================================
   BECOOL CRM — branch_dashboard.js (სრული, ყველა fix)
   FIX 3: home tab — სრული შიგთავსი (ფლანი + AC/Refrig widget)
   FIX 4: plan tab დაბრუნება
   FIX 5: services — row click opens detail
   FIX 6: PDF ბუტი სერვ. სტრიქონში
   FIX 8: assets tab — left sidebar + right cards (asset_view.js-ის მსგავსი)
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
        s('bdc-kpi-total',assets.length);
        s('bdc-kpi-ok',   assets.filter(a=>a.status==='Operational').length);
        s('bdc-kpi-maint',assets.filter(a=>a.status==='Maintenance_Required').length);
        s('bdc-kpi-down', assets.filter(a=>a.status==='Down').length);
        s('bdc-kpi-ac',   assets.filter(a=>a.asset_class==='AC').length);
        s('bdc-kpi-ref',  assets.filter(a=>a.asset_class==='Refrigeration').length);
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
   switchBdcTab — FIX 4: plan tab დაბრუნება
   ══════════════════════════════════════════════════════════════ */
function switchBdcTab(name,btn){
    document.querySelectorAll('#bdc-nav .bdc-tab').forEach(t=>{t.classList.remove('border-blue-600','text-blue-600','font-bold');t.classList.add('border-transparent','text-slate-400','font-medium');});
    if(btn?.classList){btn.classList.add('border-blue-600','text-blue-600','font-bold');btn.classList.remove('border-transparent','text-slate-400','font-medium');}
    document.querySelectorAll('.bdc-panel').forEach(p=>p.classList.add('hidden'));
    const panel=document.getElementById('bdcp-'+name);
    if(panel)panel.classList.remove('hidden');
    if(name==='home')    {loadBdcHome();}        /* FIX 3 */
    if(name==='plan')    {/* static */}           /* FIX 4 */
    if(name==='assets')  {loadBdcAssetsPanel();}  /* FIX 8 */
    if(name==='service') {loadBdcServices();}     /* FIX 5 */
    if(name==='weather') {if(typeof loadBdcWeatherAnalytics==='function')loadBdcWeatherAnalytics();}
}

/* ══════════════════════════════════════════════════════════════
   FIX 3: HOME TAB — სრული შიგთავსი (ძველი სტილი)
   ══════════════════════════════════════════════════════════════ */
async function loadBdcHome(){
    await loadBdcRecentServices();
    await loadBdcAssetsMini();
}

async function loadBdcRecentServices(){
    const el=document.getElementById('bdc-recent-svc');if(!el)return;
    el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-3">იტვ...</div>';
    const {data,error}=await _supabase.from('service_logs')
        .select('id,service_date,service_type,technician_name,asset_id')
        .eq('branch_id',activeBranch.id).order('service_date',{ascending:false}).limit(5);
    if(error||!data?.length){el.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვ. არ არის</div>';return;}
    const ids=[...new Set(data.map(s=>s.asset_id).filter(Boolean))];
    let aMap={};
    if(ids.length){const {data:an}=await _supabase.from('assets').select('id,name').in('id',ids);aMap=Object.fromEntries((an||[]).map(a=>[a.id,a.name]));}
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Repair:'bg-purple-100 text-purple-700',Installation:'bg-green-100 text-green-700'};
    el.innerHTML=data.map(s=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
            <span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span>
            <span class="text-xs text-slate-600 flex-1 truncate">${s.technician_name||'—'} · ${aMap[s.asset_id]||'—'}</span>
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
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer"
             onclick='openBdcAsset(${JSON.stringify(a)})'>
            <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${dc[a.status]||'#94a3b8'}"></div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-slate-900 truncate">${a.name}</div>
                <div class="text-[10px] text-slate-400 truncate">${[a.brand,a.model].filter(Boolean).join(' ')||'—'}${a.cooling_capacity_kw?' · '+a.cooling_capacity_kw+' kW':''}</div>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc[a.status]||'bg-slate-100 text-slate-500'}">${ss[a.status]||a.status}</span>
        </div>`).join('');
}

/* ══════════════════════════════════════════════════════════════
   FIX 8: ASSETS TAB — sidebar (სურ.3) + cards (სურ.2)
   ══════════════════════════════════════════════════════════════ */
async function loadBdcAssetsPanel(){
    const panel=document.getElementById('bdcp-assets');if(!panel)return;
    /* ყველა asset ჩატვირთვა sidebar badge-ებისთვის */
    const {data:allAssets}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name');
    const al=allAssets||[];

    /* sidebar კატეგორიები */
    const acTypes =['Split','Multi-Split','Semi-Industrial','VRF','VRV','Chiller','Rooftop','Cassette','AHU','FCU'];
    const refTypes=['Reach-in','Walk-in','Condensing Unit','Display Case','Blast Chiller','Ice Maker','Freezer Tunnel'];
    const hTypes  =['Boiler'];
    const wTypes  =['DHW','Electric Heater','Pump','Heat Exchanger'];
    const vTypes  =['Recuperator','AHU','Fan'];

    const countByType={};
    al.forEach(a=>{countByType[a.asset_type]=(countByType[a.asset_type]||0)+1;});

    const sidebarItem=(type,label)=>{
        const cnt=countByType[type]||0;
        return `<div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer hover:bg-white/10 rounded transition _bdc-sb-item" data-type="${type}" onclick="_bdcSelectType('${type}',this)">
            <span class="text-slate-300">${label||type}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">${cnt}</span>
        </div>`;
    };
    const sidebarCat=(icon,label,items)=>`
        <div>
            <div class="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">${label}</div>
            ${items.map(([t,l])=>sidebarItem(t,l)).join('')}
        </div>`;

    panel.innerHTML=`
    <div class="flex gap-0" style="min-height:600px">
        <!-- ══ SIDEBAR (სურ.3 — ლურჯი) ══ -->
        <div class="flex-shrink-0 rounded-2xl overflow-hidden mr-4" style="width:200px;background:#0f2942">
            <div class="p-4 border-b border-white/10">
                <div class="text-sm font-bold text-white">${activeBranch.name||'ფილ.'}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">აგრეგატები</div>
            </div>
            <div class="py-2 space-y-0 overflow-y-auto" style="max-height:560px">
                <div class="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">კონდიციონირება</div>
                <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer bg-white/10 rounded transition _bdc-sb-item _bdc-sb-active" data-type="__AC" onclick="_bdcSelectType('__AC',this)">
                    <span class="text-white font-medium">AC სისტ. ყველა</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">${al.filter(a=>a.asset_class==='AC').length}</span>
                </div>
                ${acTypes.map(t=>sidebarItem(t)).join('')}
                <div class="px-4 py-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-3">მაცივრები</div>
                <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer hover:bg-white/10 rounded transition _bdc-sb-item" data-type="__Refrigeration" onclick="_bdcSelectType('__Refrigeration',this)">
                    <span class="text-slate-300">Refrigeration ყველა</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">${al.filter(a=>a.asset_class==='Refrigeration').length}</span>
                </div>
                ${refTypes.map(t=>sidebarItem(t)).join('')}
                <div class="px-4 py-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-3">გათბობა</div>
                ${hTypes.map(t=>sidebarItem(t)).join('')}
                <div class="px-4 py-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-3">წყალი</div>
                ${wTypes.map(t=>sidebarItem(t)).join('')}
                <div class="px-4 py-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-3">ვენტილაცია</div>
                ${vTypes.map(t=>sidebarItem(t)).join('')}
                <div class="flex items-center justify-between px-4 py-1.5 text-[11px] cursor-pointer hover:bg-white/10 rounded transition _bdc-sb-item" data-type="Other" onclick="_bdcSelectType('Other',this)">
                    <span class="text-slate-300">სხვა</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">${countByType['Other']||0}</span>
                </div>
            </div>
        </div>

        <!-- ══ MAIN (right) ══ -->
        <div class="flex-1 min-w-0">
            <!-- filter bar -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm mb-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div class="flex gap-2 flex-wrap">
                        <select id="bdc-at-status" onchange="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
                            <option value="">ყველა სტ.</option>
                            <option value="Operational">Operational</option>
                            <option value="Maintenance_Required">Maintenance</option>
                            <option value="Down">Down</option>
                        </select>
                        <input type="text" id="bdc-at-search" placeholder="ძებნა..." oninput="bdcLoadA()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600 w-32">
                    </div>
                    <button onclick="openAssetModal()" class="text-xs font-bold text-blue-600 border border-blue-200 px-4 py-1.5 rounded-xl hover:bg-blue-50 transition">+ ახ. აგრ.</button>
                </div>
            </div>
            <!-- KPI strip -->
            <div id="bdc-assets-kpi" class="grid grid-cols-5 gap-3 mb-4"></div>
            <!-- cards -->
            <div id="bdc-assets-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div class="col-span-3 text-center py-10 text-xs text-slate-300 italic">კატეგ. აირჩ. მარცხნიდან</div>
            </div>
        </div>
    </div>`;

    /* default — ყველა AC */
    window._bdcTypeFilter = '__AC';
    window._bdcAllAssets  = al;
    await bdcLoadA();
}

function _bdcSelectType(type,el){
    window._bdcTypeFilter=type;
    document.querySelectorAll('._bdc-sb-item').forEach(i=>{
        i.classList.remove('bg-white/10','_bdc-sb-active');
        i.querySelector('span')?.classList.remove('text-white');
    });
    el.classList.add('bg-white/10','_bdc-sb-active');
    bdcLoadA();
}

async function bdcLoadA(){
    const grid   =document.getElementById('bdc-assets-grid');
    const kpiEl  =document.getElementById('bdc-assets-kpi');
    if(!grid||!activeBranch)return;
    grid.innerHTML='<div class="col-span-3 text-center py-8 text-xs text-slate-300 italic">იტვ...</div>';

    const typeF  =window._bdcTypeFilter||'__AC';
    const status =document.getElementById('bdc-at-status')?.value||'';
    const search =(document.getElementById('bdc-at-search')?.value||'').toLowerCase().trim();

    /* ყველა asset (cached ან fresh) */
    let all=window._bdcAllAssets;
    if(!all){const {data}=await _supabase.from('assets').select('*').eq('branch_id',activeBranch.id).order('name');all=data||[];window._bdcAllAssets=all;}

    /* type filter */
    const acTypes =['Split','Multi-Split','Semi-Industrial','VRF','VRV','Chiller','Rooftop','Cassette','AHU','FCU','PTAC'];
    const refTypes=['Reach-in','Walk-in','Condensing Unit','Display Case','Blast Chiller','Ice Maker','Freezer Tunnel'];
    let filtered=all;
    if(typeF==='__AC')          filtered=all.filter(a=>a.asset_class==='AC'||acTypes.includes(a.asset_type));
    else if(typeF==='__Refrigeration') filtered=all.filter(a=>a.asset_class==='Refrigeration'||refTypes.includes(a.asset_type));
    else filtered=all.filter(a=>a.asset_type===typeF);

    if(status) filtered=filtered.filter(a=>a.status===status);
    if(search) filtered=filtered.filter(a=>(a.name||'').toLowerCase().includes(search)||(a.tag_number||'').toLowerCase().includes(search)||(a.brand||'').toLowerCase().includes(search)||(a.model||'').toLowerCase().includes(search));

    /* KPI */
    if(kpiEl)kpiEl.innerHTML=[
        {v:filtered.length,l:'სულ',c:'text-slate-900'},
        {v:filtered.filter(a=>a.status==='Operational').length,l:'OK',c:'text-green-700'},
        {v:filtered.filter(a=>a.status==='Maintenance_Required').length,l:'Maint.',c:'text-amber-600'},
        {v:filtered.filter(a=>a.status==='Down').length,l:'Down',c:'text-red-600'},
        {v:all.filter(a=>a.asset_class==='AC').length+' / '+all.filter(a=>a.asset_class==='Refrigeration').length,l:'AC / Refrig.',c:'text-blue-700'},
    ].map(k=>`<div class="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm"><div class="text-xl font-black ${k.c}">${k.v}</div><div class="text-[10px] text-slate-400 mt-0.5">${k.l}</div></div>`).join('');

    if(!filtered.length){grid.innerHTML='<div class="col-span-3 text-center py-10 text-xs text-slate-400 italic">ამ კატეგ. ჩანაწ. ვ/მ</div>';return;}

    const sC={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const sL={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const clB={AC:'border-blue-200',Refrigeration:'border-teal-200',Other:'border-amber-200'};

    grid.innerHTML=filtered.map(a=>`
    <div class="bg-white rounded-2xl border ${clB[a.asset_class]||'border-slate-200'} shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer"
         onclick='_bdcOpenAsset(${JSON.stringify(a)})'>
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
        <div class="flex gap-2" onclick="event.stopPropagation()">
          <button onclick='openBdcAsset(${JSON.stringify(a)})' class="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 transition">სერვ. ისტ.</button>
          <button onclick='openAssetModal(${JSON.stringify(a)})' class="flex-1 border border-slate-200 text-slate-500 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition">რედ.</button>
          <button onclick='exportAssetPDF(${JSON.stringify(a)})' class="px-2 text-red-400 border border-red-200 rounded-xl hover:bg-red-50 transition text-[9px] font-bold">PDF</button>
          <button onclick='deleteData("assets","${a.id}")' class="px-2 text-slate-300 hover:text-red-500 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');
    lucide.createIcons();
}

/* ბარათზე დაჭ. → asset_view.js */
function _bdcOpenAsset(a){
    if(typeof loadAssetView==='function'){
        window._pendingAssetId=a.id;
        loadAssetView(activeBranch);
    } else {
        openBdcAsset(a);
    }
}

/* ══════════════════════════════════════════════════════════════
   FIX 5+6: SERVICES TAB — row click + PDF
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
    /* asset names */
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
    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
        <td class="py-2 px-2 text-slate-500 whitespace-nowrap" onclick='_openSvcRow(${JSON.stringify(s)})'>${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td class="py-2 px-2" onclick='_openSvcRow(${JSON.stringify(s)})'><span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
        <td class="py-2 px-2 font-medium text-slate-900" onclick='_openSvcRow(${JSON.stringify(s)})'>${s.technician_name||'—'}</td>
        <td class="py-2 px-2 text-slate-500" onclick='_openSvcRow(${JSON.stringify(s)})'>${s._assetName}</td>
        <td class="py-2 px-2 text-slate-400 truncate max-w-[180px]" onclick='_openSvcRow(${JSON.stringify(s)})'>${s.job_description?s.job_description.substring(0,50)+'...':'—'}</td>
        <td class="py-2 px-2"><button onclick='exportServicePDF(${JSON.stringify(s)})' class="text-[9px] font-bold text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">PDF</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

/* FIX 5 — სერვ. სტრიქონი → detail */
async function _openSvcRow(s){
    const {data:as}=await _supabase.from('assets').select('*').eq('id',s.asset_id).single().catch(()=>({data:null}));
    activeAsset=as||{id:s.asset_id,name:s._assetName||'სერვ.'};
    document.querySelectorAll('.view-section').forEach(v=>v.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=activeAsset.name||'სერვ.';
    loadServiceLogs();
}

function openBdcAsset(a){
    activeAsset=a;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=a.name||'სერვ.';
    loadServiceLogs();
}
function loadBdcAssets(){loadBdcAssetsMini();}
