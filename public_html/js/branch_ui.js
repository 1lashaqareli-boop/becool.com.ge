/* ============================================================
   BECOOL CRM — branch_ui.js (სრული ვერსია)
   ✅ ფილიალების სია: სორტი ანბანით/ზომით, განახ. badge, Excel
   ✅ Realtime subscription
   ✅ overview, live map, assets, services ტაბები
   ✅ loadAllAssets — customer-level (branch filter)
   ============================================================ */

let _branchesData = [];
let _branchRT     = null;
let overviewMap   = null;

/* ─── viewBranches ─── */
function viewBranches(c) {
    activeCustomer = c;
    window._nav = window._nav || {};
    window._nav.customer = c;
    window._nav.branch   = null;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
    fillCustomerCard(c);
    loadCustomerKPIs();
    switchBranchTab('overview', document.getElementById('tab-overview'));
    if (typeof _showBreadcrumb === 'function') { _showBreadcrumb(); _renderBreadcrumb(); }
}

/* ─── fillCustomerCard ─── */
function fillCustomerCard(c) {
    const av = document.getElementById('cv-avatar');
    if (c.image_url) {
        av.innerHTML = `<img src="${c.image_url}" class="w-full h-full object-cover">`;
    } else {
        av.textContent = (c.name||'BC').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
        av.className = 'w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0';
    }
    document.getElementById('cv-name').textContent = c.name||'---';
    const sc = {Active:'bg-green-100 text-green-800',Potential:'bg-amber-100 text-amber-800',Passive:'bg-slate-100 text-slate-500'};
    const sb = document.getElementById('cv-status-badge');
    sb.textContent = c.status||'Potential';
    sb.className   = `text-[10px] font-bold px-2 py-0.5 rounded-full ${sc[c.status]||'bg-slate-100 text-slate-500'}`;
    document.getElementById('cv-type-badge').textContent = c.customer_type==='Person'?'ფიზ. პირი':'შპს';
    const ib = document.getElementById('cv-industry-badge');
    if (c.industry){ib.textContent=c.industry;ib.classList.remove('hidden');}else ib.classList.add('hidden');
    document.getElementById('cv-tax').textContent   = c.tax_id  ?`TAX: ${c.tax_id}`:'';
    document.getElementById('cv-phone').textContent = c.phone||'';
    const wm = document.getElementById('cv-website');
    if (c.website){wm.textContent=c.website;wm.href=c.website.startsWith('http')?c.website:`https://${c.website}`;wm.classList.remove('hidden');}else wm.classList.add('hidden');
    document.getElementById('cv-legal').textContent = c.legal_address||'—';
    const ae = document.getElementById('cv-actual');
    ae.textContent=c.actual_address||'—'; ae.href=c.map_url||'#';
    const we=document.getElementById('cv-web'),wo=document.getElementById('cv-web-empty');
    if(c.website){we.textContent=c.website;we.href=c.website.startsWith('http')?c.website:`https://${c.website}`;we.classList.remove('hidden');wo.classList.add('hidden');}
    else{we.classList.add('hidden');wo.classList.remove('hidden');}
    document.getElementById('cv-vat').textContent=c.is_vat_payer?'✓ კი':'✗ არა';
    document.getElementById('cv-vat').style.color=c.is_vat_payer?'#15803d':'';
    document.getElementById('cv-contact1').textContent=c.contact_person_1||'—';
    document.getElementById('cv-pos1').textContent    =c.position_1||'—';
    document.getElementById('cv-phone1').textContent  =c.phone_1||'—';
    const e1=document.getElementById('cv-email1');
    if(c.email_1){e1.textContent=c.email_1;e1.href=`mailto:${c.email_1}`;}else{e1.textContent='—';e1.href='#';}
}

/* ─── KPIs ─── */
async function loadCustomerKPIs() {
    if (!activeCustomer) return;
    const [{ count:bc },{ count:ac },{ count:sc },{ data:ls }] = await Promise.all([
        _supabase.from('branches').select('*',{count:'exact',head:true}).eq('customer_id',activeCustomer.id),
        _supabase.from('assets').select('*',{count:'exact',head:true}).eq('customer_id',activeCustomer.id),
        _supabase.from('service_logs').select('*',{count:'exact',head:true}).eq('customer_id',activeCustomer.id),
        _supabase.from('service_logs').select('service_date').eq('customer_id',activeCustomer.id).order('service_date',{ascending:false}).limit(1),
    ]);
    document.getElementById('kpi-branches').textContent  = bc??'—';
    document.getElementById('kpi-assets').textContent    = ac??'—';
    document.getElementById('kpi-services').textContent  = sc??'—';
    document.getElementById('kpi-last-service').textContent = ls?.[0]
        ?new Date(ls[0].service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'}):'—';
}

/* ─── toggle / edit / delete ─── */
let _cvOpen = true;
function toggleCustomerDetails() {
    _cvOpen = !_cvOpen;
    document.getElementById('cv-details').style.display = _cvOpen?'':'none';
    document.getElementById('cv-toggle-icon').innerHTML = _cvOpen?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>';
}
function editActiveCustomer()   { if (activeCustomer) openCustomerModal(activeCustomer); }
async function deleteActiveCustomer() {
    if (!activeCustomer) return;
    if (!confirm(`წაშლა: "${activeCustomer.name}"?`)) return;
    const {error} = await _supabase.from('customers').delete().eq('id',activeCustomer.id);
    if (!error) showCustomers(); else alert('შეცდ: '+error.message);
}

/* ─── navigation helpers ─── */
function showCustomers() {
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    if (typeof _hideBreadcrumb==='function') _hideBreadcrumb();
    loadCustomers();
}
function showBranches() {
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
}
function showAssets() {
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
}
function viewAssets(b) {
    activeBranch = b;
    if (typeof loadAssetView==='function') { loadAssetView(b); return; }
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
    document.getElementById('asset-view-title').innerText = b.name;
    loadAssets();
}
async function viewServiceLogs(asset) {
    activeAsset = asset;
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText = asset.name;
    loadServiceLogs();
}

/* ─── switchBranchTab ─── */
function switchBranchTab(name, btn) {
    document.querySelectorAll('#branch-view .flex.gap-1 button').forEach(b=>{
        b.classList.remove('bg-white','text-slate-900','shadow-sm');
        b.classList.add('text-slate-400');
    });
    document.querySelectorAll('.branch-panel').forEach(p=>p.classList.add('hidden'));
    if (btn){btn.classList.add('bg-white','text-slate-900','shadow-sm');btn.classList.remove('text-slate-400');}
    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.remove('hidden');
    if (name==='overview') loadOverviewTab();
    if (name==='map')      loadLiveMapTab();
    if (name==='branches') loadBranches();
    if (name==='assets')   loadAllAssets();
    if (name==='services') loadAllServices();
}

/* ══════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════════════════════ */
async function loadOverviewTab() {
    if (overviewMap){overviewMap.remove();overviewMap=null;}
    const {data:branches} = await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id);

    setTimeout(()=>{
        const md = document.getElementById('overview-map-container');
        if (!md) return;
        overviewMap = L.map('overview-map-container',{zoomControl:true,attributionControl:false}).setView([41.7151,44.8271],11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(overviewMap);
        if (branches?.length){
            const mk=[];
            branches.forEach(b=>{
                if(b.lat&&b.lng){
                    const m=L.marker([b.lat,b.lng]).addTo(overviewMap);
                    m.bindPopup(`<b>${b.name}</b><br>${b.address||''}`);
                    m.on('click',()=>viewBranchDashboard(b));
                    mk.push(m);
                }
            });
            if(mk.length) overviewMap.fitBounds(new L.featureGroup(mk).getBounds().pad(0.3));
        }
        overviewMap.invalidateSize();
    },300);

    const {data:svc} = await _supabase.from('service_logs')
        .select('id,service_date,service_type,technician_name,branch_id,asset_id,job_description,assets(name,id),branches(name)')
        .eq('customer_id',activeCustomer.id).order('service_date',{ascending:false}).limit(5);
    const sEl = document.getElementById('overview-recent-services');
    const tc={PPM:'bg-blue-100 text-blue-700',Emergency:'bg-red-100 text-red-700',Corrective:'bg-amber-100 text-amber-700',Installation:'bg-green-100 text-green-700',Repair:'bg-purple-100 text-purple-700'};
    if (svc?.length){
        sEl.innerHTML = svc.map(s=>`
            <div class="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer" onclick='_openSvcDetail(${JSON.stringify(s)})'>
                <span class="text-[10px] text-slate-400 w-10 flex-shrink-0">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1 mb-0.5">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span>
                        <span class="text-xs text-slate-700 font-medium truncate">${s.technician_name||'—'}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 truncate">${s.branches?.name||''} · ${s.assets?.name||'—'}</div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" class="flex-shrink-0 mt-1"><polyline points="9 18 15 12 9 6"/></svg>
            </div>`).join('');
    } else sEl.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვ. ჩანაწ. არ არის</div>';

    const blEl = document.getElementById('overview-branches-list');
    if (branches?.length){
        blEl.innerHTML = branches.map(b=>`
            <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer" onclick='viewBranchDashboard(${JSON.stringify(b)})'>
                <div class="w-2 h-2 rounded-full flex-shrink-0 ${b.is_active?'bg-green-400':'bg-slate-300'}"></div>
                <div class="flex-1 min-w-0">
                    <div class="text-slate-800 font-medium text-sm truncate">${b.name}</div>
                    <div class="text-[10px] text-slate-400 truncate">${b.address||'—'}</div>
                </div>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.is_active?'bg-green-100 text-green-700':'bg-slate-100 text-slate-400'}">${b.is_active?'Active':'Inactive'}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>`).join('');
    } else blEl.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">ფილ. არ არის</div>';
}

async function _openSvcDetail(s) {
    const {data:br}=await _supabase.from('branches').select('*').eq('id',s.branch_id).single();
    const {data:as}=await _supabase.from('assets').select('*').eq('id',s.asset_id).single();
    if(br) activeBranch=br;
    activeAsset=as||{id:s.asset_id,name:s.assets?.name||'სერვ.'};
    document.querySelectorAll('.view-section').forEach(sec=>sec.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=activeAsset.name;
    loadServiceLogs();
}

/* ══════════════════════════════════════════════════════════════
   LIVE MAP
   ══════════════════════════════════════════════════════════════ */
async function loadLiveMapTab() {
    if(liveMap){liveMap.remove();liveMap=null;}
    const {data:branches}=await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id);
    const {data:assets}  =await _supabase.from('assets').select('branch_id').eq('customer_id',activeCustomer.id);
    if(!branches?.length) return;
    const ac={};if(assets)assets.forEach(a=>{ac[a.branch_id]=(ac[a.branch_id]||0)+1;});
    setTimeout(()=>{
        liveMap=L.map('live-map-container',{zoomControl:false}).setView([41.7151,44.8271],7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'&copy; CartoDB'}).addTo(liveMap);
        L.control.zoom({position:'bottomright'}).addTo(liveMap);
        const cls=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50});
        branches.forEach(b=>{
            if(b.lat&&b.lng){
                const m=L.marker([b.lat,b.lng]);
                m.bindPopup(`<div style="padding:8px;min-width:140px"><b>${b.name}</b><br><small>${b.address||'—'}</small><br><div style="margin-top:5px;background:#2563eb;color:white;padding:3px 8px;border-radius:6px;font-size:11px">აგრ: ${ac[b.id]||0}</div></div>`,{closeButton:false});
                cls.addLayer(m);
            }
        });
        liveMap.addLayer(cls);
        if(cls.getLayers().length) liveMap.fitBounds(cls.getBounds().pad(0.2));
        liveMap.invalidateSize();
    },400);
}

/* ══════════════════════════════════════════════════════════════
   BRANCHES TAB — სორტი, ფილტრი, ძებნა, Excel, Realtime
   ══════════════════════════════════════════════════════════════ */
async function loadBranches() {
    const {data,error}=await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id).order('created_at');
    if(error) return;
    _branchesData=data||[];

    /* filter selects შევსება */
    ['assets-filter-branch','services-filter-branch'].forEach(id=>{
        const sel=document.getElementById(id);if(!sel)return;
        const ex=Array.from(sel.options).map(o=>o.value);
        _branchesData.forEach(b=>{if(!ex.includes(b.id)){const o=document.createElement('option');o.value=b.id;o.textContent=b.name;sel.appendChild(o);}});
    });

    _injectBranchToolbar();
    _renderBranches(_branchesData);
    _setupBranchRT();
}

function _injectBranchToolbar() {
    const cont=document.getElementById('branches-list');if(!cont)return;
    let tb=document.getElementById('branches-toolbar');
    if(!tb){tb=document.createElement('div');tb.id='branches-toolbar';cont.parentNode.insertBefore(tb,cont);}
    tb.className='flex items-center gap-2 flex-wrap mb-4 p-3 bg-white border border-slate-200 rounded-2xl';
    tb.innerHTML=`
        <input type="text" id="br-search" placeholder="ძებნა სახ., მისამ..."
            oninput="_filterBranches()"
            class="flex-1 min-w-[140px] text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
        <select id="br-status" onchange="_filterBranches()"
            class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="">ყველა სტ.</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
        </select>
        <select id="br-priority" onchange="_filterBranches()"
            class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="">ყველა პრ.</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Standard">Standard</option>
            <option value="Low">Low</option>
        </select>
        <select id="br-sort" onchange="_filterBranches()"
            class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="created_at">შეიქ. ↑</option>
            <option value="name_asc">სახ. A→Z</option>
            <option value="name_desc">სახ. Z→A</option>
            <option value="size_desc">ზომა ↓</option>
            <option value="size_asc">ზომა ↑</option>
            <option value="priority">პრიორ.</option>
            <option value="updated">განახ. ↓</option>
        </select>
        <button onclick="exportBranchesExcel()"
            class="text-xs font-bold text-green-600 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Excel
        </button>
        <span id="br-count" class="text-[10px] text-slate-400 ml-auto"></span>`;
}

function _filterBranches() {
    const search  =(document.getElementById('br-search')?.value||'').toLowerCase();
    const status  = document.getElementById('br-status')?.value||'';
    const priority= document.getElementById('br-priority')?.value||'';
    const sort    = document.getElementById('br-sort')?.value||'created_at';
    let d=[..._branchesData];
    if(search)    d=d.filter(b=>(b.name||'').toLowerCase().includes(search)||(b.address||'').toLowerCase().includes(search)||(b.contact_person||'').toLowerCase().includes(search));
    if(status==='active')   d=d.filter(b=>b.is_active);
    if(status==='inactive') d=d.filter(b=>!b.is_active);
    if(priority)  d=d.filter(b=>b.service_priority===priority);
    const po={Critical:0,High:1,Standard:2,Low:3};
    if(sort==='name_asc')  d.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(sort==='name_desc') d.sort((a,b)=>(b.name||'').localeCompare(a.name||''));
    if(sort==='size_desc') d.sort((a,b)=>(b.square_meters||0)-(a.square_meters||0));
    if(sort==='size_asc')  d.sort((a,b)=>(a.square_meters||0)-(b.square_meters||0));
    if(sort==='priority')  d.sort((a,b)=>(po[a.service_priority]??9)-(po[b.service_priority]??9));
    if(sort==='updated')   d.sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
    const cnt=document.getElementById('br-count');
    if(cnt) cnt.textContent=`${d.length} / ${_branchesData.length} ფილ.`;
    _renderBranches(d);
}

function _renderBranches(data) {
    const cont=document.getElementById('branches-list');if(!cont)return;
    if(!data.length){cont.innerHTML='<div class="text-xs text-slate-300 text-center py-8 italic">ვ/მ</div>';return;}
    const now=Date.now();
    const prC={Critical:'bg-red-100 text-red-700',High:'bg-amber-100 text-amber-700',Standard:'bg-green-100 text-green-700',Low:'bg-slate-100 text-slate-500'};
    const prD={Critical:'#dc2626',High:'#f59e0b',Standard:'#22c55e',Low:'#94a3b8'};
    cont.innerHTML=data.map((b,i)=>{
        const isNew=b.updated_at&&(now-new Date(b.updated_at))<86400000*3;
        return `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-4 group hover:shadow-lg transition-all cursor-pointer"
             onclick='viewBranchDashboard(${JSON.stringify(b)})'>
            <div class="relative bg-slate-100 overflow-hidden flex-shrink-0" style="width:240px;min-height:170px">
                ${b.image_url?`<img src="${b.image_url}" class="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition duration-700">`
                    :`<div class="absolute inset-0 flex items-center justify-center text-slate-300 text-xs italic">ფოტო არ არის</div>`}
                <div id="bmap-${i}" class="absolute bottom-3 left-3 right-3 rounded-2xl overflow-hidden border-2 border-white shadow-lg" style="height:68px"></div>
            </div>
            <div class="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}">${b.is_active?'Active':'Inactive'}</span>
                            ${b.service_priority?`<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${prC[b.service_priority]||'bg-slate-100 text-slate-500'}"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${prD[b.service_priority]||'#94a3b8'};margin-right:3px;vertical-align:middle"></span>${b.service_priority}</span>`:''}
                            ${isNew?`<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">↑ განახ.</span>`:''}
                        </div>
                        <button onclick='event.stopPropagation();openBranchModal(${JSON.stringify(b)})' class="text-blue-500 text-[11px] font-bold hover:underline">რედ. →</button>
                    </div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight mb-1">${b.name}</h3>
                    <p class="text-xs text-slate-400 flex items-center gap-1 mb-3">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${b.address||'—'}${b.square_meters?' · '+b.square_meters+' m²':''}
                    </p>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-400">
                        <div>ელ-კვება: <span class="text-slate-700 font-bold">${b.power_supply_type||'—'}</span></div>
                        <div>ფართი: <span class="text-slate-700 font-bold">${b.square_meters?b.square_meters+' m²':'—'}</span></div>
                        <div>მენ.: <span class="text-slate-700 font-bold">${b.contact_person||'—'}</span></div>
                        <div>ტელ.: <span class="text-slate-700 font-bold">${b.contact_phone||'—'}</span></div>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button onclick='event.stopPropagation();viewAssets(${JSON.stringify(b)})' class="flex-1 bg-slate-900 text-white text-[10px] font-bold py-2 rounded-xl hover:bg-blue-600 transition">აგრ. →</button>
                    <button onclick='event.stopPropagation();deleteData("branches","${b.id}")' class="px-3 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                </div>
            </div>
        </div>`}).join('');
    data.forEach((b,i)=>{
        if(b.lat&&b.lng){try{const m=L.map(`bmap-${i}`,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false}).setView([b.lat,b.lng],15);L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);L.marker([b.lat,b.lng]).addTo(m);}catch(e){}}
    });
    lucide.createIcons();
}

function _setupBranchRT() {
    if(_branchRT){try{_supabase.removeChannel(_branchRT);}catch(e){}}
    _branchRT=_supabase.channel('br-rt-'+activeCustomer.id)
        .on('postgres_changes',{event:'*',schema:'public',table:'branches',filter:`customer_id=eq.${activeCustomer.id}`},
        async payload=>{
            const {eventType,new:nr,old:or}=payload;
            if(eventType==='INSERT')      _branchesData=[..._branchesData,nr];
            else if(eventType==='UPDATE') _branchesData=_branchesData.map(b=>b.id===nr.id?nr:b);
            else if(eventType==='DELETE') _branchesData=_branchesData.filter(b=>b.id!==or.id);
            await loadCustomerKPIs();
            _filterBranches();
        }).subscribe();
}

function exportBranchesExcel() {
    if(!_branchesData.length){alert('ჩატვირთეთ მონ.');return;}
    const hdr=['სახ.','მისამ.','სტ.','პრიორ.','ფართი m²','ელ-კვ.','კონტ.','ტელ.','SLA','სიხ.','შეიქ.','განახ.'];
    const rows=[hdr,..._branchesData.map(b=>[
        b.name||'',b.address||'',b.is_active?'Active':'Inactive',b.service_priority||'',
        b.square_meters||'',b.power_supply_type||'',b.contact_person||'',b.contact_phone||'',
        b.sla_response_hours?b.sla_response_hours+'h':'',b.service_frequency||'',
        b.created_at?new Date(b.created_at).toLocaleDateString('ka-GE'):'',
        b.updated_at?new Date(b.updated_at).toLocaleDateString('ka-GE'):'',
    ])];
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`branches_${activeCustomer?.name||'export'}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
    URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   ASSETS TAB (customer-level) — უცვლელი
   ══════════════════════════════════════════════════════════════ */
async function loadAllAssets() {
    if(!activeCustomer) return;
    const bF=document.getElementById('assets-filter-branch')?.value||'';
    const cont=document.getElementById('all-assets-table');
    if(cont) cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-8">იტვ...</div>';
    let q=_supabase.from('assets').select('*,branches(name)').eq('customer_id',activeCustomer.id);
    if(bF) q=q.eq('branch_id',bF);
    q=q.order('name');
    const {data,error}=await q;if(error||!cont)return;
    if(!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">ვ/მ</div>';return;}
    const sC={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const sL={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    cont.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">სახ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ფილ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">სტ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ბ. სერვ.</th>
    </tr></thead><tbody>
    ${data.map(a=>`<tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='viewAssetFromTable(${JSON.stringify(a)})'>
        <td class="py-2.5 px-2 font-medium text-slate-800">${a.name||'—'}</td>
        <td class="py-2.5 px-2 text-slate-500">${a.asset_type||'—'}</td>
        <td class="py-2.5 px-2 text-slate-500">${a.branches?.name||'—'}</td>
        <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${sC[a.status]||'bg-slate-100 text-slate-500'}">${sL[a.status]||a.status}</span></td>
        <td class="py-2.5 px-2 text-slate-400">${a.last_service_date?new Date(a.last_service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
    </tr>`).join('')}</tbody></table>`;
}

function viewAssetFromTable(a) {
    activeBranch={id:a.branch_id,name:a.branches?.name||''};
    if(typeof loadAssetView==='function'){loadAssetView(activeBranch);return;}
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
    document.getElementById('asset-view-title').innerText=a.branches?.name||'აგრ.';
    loadAssets();
}
function viewServiceFromTable(log) {
    activeBranch={id:log.branch_id,name:log.branches?.name||''};
    activeAsset ={id:log.asset_id, name:log.assets?.name||'სერვ.'};
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=activeAsset.name;
    loadServiceLogs();
}

/* ══════════════════════════════════════════════════════════════
   SERVICES TAB (customer-level)
   ══════════════════════════════════════════════════════════════ */
async function loadAllServices() {
    const tF=document.getElementById('services-filter-type')?.value||'';
    const bF=document.getElementById('services-filter-branch')?.value||'';
    let q=_supabase.from('service_logs').select('*,branches(name),assets(name)').eq('customer_id',activeCustomer.id).order('service_date',{ascending:false});
    if(tF) q=q.eq('service_type',tF);
    if(bF) q=q.eq('branch_id',bF);
    const {data,error}=await q;
    const cont=document.getElementById('all-services-table');if(!cont)return;
    if(error||!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">ვ/მ</div>';return;}
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Installation:'bg-green-100 text-green-700',Repair:'bg-purple-100 text-purple-700'};
    cont.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">თარ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ფილ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აგრ.</th>
    </tr></thead><tbody>
    ${data.map(s=>`<tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='viewServiceFromTable(${JSON.stringify(s)})'>
        <td class="py-2.5 px-2 text-slate-500">${new Date(s.service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td class="py-2.5 px-2 font-medium text-slate-800">${s.technician_name||'—'}</td>
        <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
        <td class="py-2.5 px-2 text-slate-500">${s.branches?.name||'—'}</td>
        <td class="py-2.5 px-2 text-slate-500">${s.assets?.name||'—'}</td>
    </tr>`).join('')}</tbody></table>`;
}
