/* ============================================================
   BECOOL CRM — branch_ui.js (სრული, ყველა fix)
   Fix 1: overview სერვ. ჩანაწ. click → detail
   Fix 2: services tab row → service log detail
   Fix 3: breadcrumb — asset/service view-ზეც სწორად
   Fix 7: ფილ. ბარათი "აგრ." → loadAssetView (asset_view.js)
   ============================================================ */

let _branchesData     = [];
let _branchRT         = null;
let overviewMap       = null;
let _overviewBranches = [];

/* ══════════════════════════════════════════════════════════════
   Fix 3: BREADCRUMB — ყველა view-ზე სწორი სტატუსი
   ══════════════════════════════════════════════════════════════ */
window._nav = window._nav || { customer: null, branch: null };

function _renderBreadcrumb() {
    let el = document.getElementById('_breadcrumb');
    if (!el) {
        el = document.createElement('div');
        el.id = '_breadcrumb';
        el.style.cssText = 'position:sticky;top:64px;z-index:40;background:rgba(15,23,42,0.97);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 1.5rem';
        const nav = document.querySelector('nav');
        if (nav && nav.nextSibling) nav.parentNode.insertBefore(el, nav.nextSibling);
        else if (nav) nav.after(el);
        else document.body.prepend(el);
    }
    const c = window._nav.customer;
    const b = window._nav.branch;
    const av = c ? (c.image_url
        ? `<img src="${c.image_url}" class="w-4 h-4 rounded object-cover flex-shrink-0">`
        : `<div class="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">${(c.name||'BC').substring(0,2).toUpperCase()}</div>`) : '';
    const sep = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
    let html = `<div class="container mx-auto flex items-center gap-2 h-9 overflow-x-auto" style="scrollbar-width:none">
        <button onclick="showCustomers()" class="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-medium whitespace-nowrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            მომხ.
        </button>`;
    if (c) {
        html += sep;
        if (b) {
            html += `<button onclick="backToCustomer()" class="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-medium truncate max-w-[140px]">${av}<span class="truncate">${c.name||'---'}</span></button>${sep}
            <span class="flex items-center gap-1.5 text-white font-bold text-xs truncate max-w-[180px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <button onclick="backToCustomer()" class="text-slate-400 hover:text-white transition truncate text-xs font-medium">${b.name||'---'}</button>
            </span>`;
        } else {
            html += `<span class="flex items-center gap-1.5 text-white font-bold text-xs truncate max-w-[200px]">${av}<span class="truncate">${c.name||'---'}</span></span>`;
        }
    }
    html += '</div>';
    el.innerHTML = html;
    el.style.display = '';
}

function _hideBreadcrumb() {
    const el = document.getElementById('_breadcrumb');
    if (el) el.style.display = 'none';
    window._nav.customer = null;
    window._nav.branch   = null;
}
function _showBreadcrumb() {
    const el = document.getElementById('_breadcrumb');
    if (el) el.style.display = '';
}

function backToCustomer() {
    if (!window._nav.customer) { showCustomers(); return; }
    window._nav.branch = null;
    activeCustomer = window._nav.customer;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
    fillCustomerCard(activeCustomer);
    loadCustomerKPIs();
    switchBranchTab('overview', document.getElementById('tab-overview'));
    _renderBreadcrumb();
}

function viewBranchDashboard(b) {
    window._nav.branch = b;
    activeBranch = b;
    _showBreadcrumb();
    _renderBreadcrumb();
    if (typeof _doViewBranchDashboard === 'function') _doViewBranchDashboard(b);
}

/* Fix 3: asset view-ში breadcrumb სწორი */
function _setNavBranch(b) {
    window._nav.branch = b;
    activeBranch = b;
    _showBreadcrumb();
    _renderBreadcrumb();
}

/* ══════════════════════════════════════════════════════════════
   viewBranches
   ══════════════════════════════════════════════════════════════ */
function viewBranches(c) {
    activeCustomer = c;
    window._nav.customer = c;
    window._nav.branch   = null;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
    fillCustomerCard(c);
    loadCustomerKPIs();
    switchBranchTab('overview', document.getElementById('tab-overview'));
    _showBreadcrumb();
    _renderBreadcrumb();
}

/* ══════════════════════════════════════════════════════════════
   fillCustomerCard
   ══════════════════════════════════════════════════════════════ */
function fillCustomerCard(c) {
    const av = document.getElementById('cv-avatar');
    if (!av) return;
    if (c.image_url) { av.innerHTML = `<img src="${c.image_url}" class="w-full h-full object-cover">`; }
    else { av.textContent = (c.name||'BC').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(); av.className='w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0'; }
    const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v||''; };
    s('cv-name', c.name||'---');
    const sc = {Active:'bg-green-100 text-green-800',Potential:'bg-amber-100 text-amber-800',Passive:'bg-slate-100 text-slate-500'};
    const sb = document.getElementById('cv-status-badge');
    if(sb){sb.textContent=c.status||'Potential';sb.className=`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc[c.status]||'bg-slate-100 text-slate-500'}`;}
    const tb = document.getElementById('cv-type-badge'); if(tb) tb.textContent=c.customer_type==='Person'?'ფიზ. პირი':'შპს';
    const ib = document.getElementById('cv-industry-badge');
    if(ib){if(c.industry){ib.textContent=c.industry;ib.classList.remove('hidden');}else ib.classList.add('hidden');}
    s('cv-tax', c.tax_id?`TAX: ${c.tax_id}`:''); s('cv-phone', c.phone||'');
    const wm=document.getElementById('cv-website');
    if(wm){if(c.website){wm.textContent=c.website;wm.href=c.website.startsWith('http')?c.website:`https://${c.website}`;wm.classList.remove('hidden');}else wm.classList.add('hidden');}
    s('cv-legal',c.legal_address||'—');
    const ae=document.getElementById('cv-actual'); if(ae){ae.textContent=c.actual_address||'—';ae.href=c.map_url||'#';}
    const we=document.getElementById('cv-web'),wo=document.getElementById('cv-web-empty');
    if(we&&wo){if(c.website){we.textContent=c.website;we.href=c.website.startsWith('http')?c.website:`https://${c.website}`;we.classList.remove('hidden');wo.classList.add('hidden');}else{we.classList.add('hidden');wo.classList.remove('hidden');}}
    const vat=document.getElementById('cv-vat'); if(vat){vat.textContent=c.is_vat_payer?'✓ კი':'✗ არა';vat.style.color=c.is_vat_payer?'#15803d':'';}
    s('cv-contact1',c.contact_person_1||'—'); s('cv-pos1',c.position_1||'—'); s('cv-phone1',c.phone_1||'—');
    const e1=document.getElementById('cv-email1');
    if(e1){if(c.email_1){e1.textContent=c.email_1;e1.href=`mailto:${c.email_1}`;}else{e1.textContent='—';e1.href='#';}}
}

/* ══════════════════════════════════════════════════════════════
   loadCustomerKPIs — branch_id IN (safe)
   ══════════════════════════════════════════════════════════════ */
async function loadCustomerKPIs() {
    if (!activeCustomer) return;
    const {data:branches,count:bc} = await _supabase.from('branches').select('id',{count:'exact'}).eq('customer_id',activeCustomer.id);
    const {count:ac} = await _supabase.from('assets').select('*',{count:'exact',head:true}).eq('customer_id',activeCustomer.id);
    const branchIds = (branches||[]).map(b=>b.id);
    let sc=0, lastDate='—';
    if(branchIds.length) {
        const {count:sc2} = await _supabase.from('service_logs').select('*',{count:'exact',head:true}).in('branch_id',branchIds);
        sc=sc2||0;
        const {data:ls} = await _supabase.from('service_logs').select('service_date').in('branch_id',branchIds).order('service_date',{ascending:false}).limit(1);
        if(ls?.[0]) lastDate=new Date(ls[0].service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'});
    }
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??'—';};
    set('kpi-branches',bc); set('kpi-assets',ac); set('kpi-services',sc); set('kpi-last-service',lastDate);
}

/* customer controls */
let _cvOpen=true;
function toggleCustomerDetails(){
    _cvOpen=!_cvOpen;
    const d=document.getElementById('cv-details'),i=document.getElementById('cv-toggle-icon');
    if(d)d.style.display=_cvOpen?'':'none';
    if(i)i.innerHTML=_cvOpen?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>';
}
function editActiveCustomer(){if(activeCustomer)openCustomerModal(activeCustomer);}
async function deleteActiveCustomer(){
    if(!activeCustomer||!confirm(`წაშლა: "${activeCustomer.name}"?`))return;
    const {error}=await _supabase.from('customers').delete().eq('id',activeCustomer.id);
    if(!error)showCustomers();else alert('შეცდ: '+error.message);
}

/* nav helpers */
function showCustomers(){document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));document.getElementById('customer-view').classList.add('active');_hideBreadcrumb();loadCustomers();}
function showBranches(){document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));document.getElementById('branch-view').classList.add('active');}
function showAssets(){document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));document.getElementById('asset-view').classList.add('active');}

/* Fix 7: viewAssets → loadAssetView */
function viewAssets(b) {
    activeBranch = b;
    _setNavBranch(b);  /* Fix 3 */
    if (typeof loadAssetView === 'function') { loadAssetView(b); return; }
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

/* switchBranchTab */
function switchBranchTab(name,btn){
    document.querySelectorAll('#branch-view .flex.gap-1 button').forEach(b=>{b.classList.remove('bg-white','text-slate-900','shadow-sm');b.classList.add('text-slate-400');});
    document.querySelectorAll('.branch-panel').forEach(p=>p.classList.add('hidden'));
    if(btn){btn.classList.add('bg-white','text-slate-900','shadow-sm');btn.classList.remove('text-slate-400');}
    const panel=document.getElementById(`panel-${name}`);
    if(panel)panel.classList.remove('hidden');
    if(name==='overview')loadOverviewTab();
    if(name==='map')     loadLiveMapTab();
    if(name==='branches')loadBranches();
    if(name==='assets')  loadAllAssets();
    if(name==='services')loadAllServices();
}

/* ══════════════════════════════════════════════════════════════
   Fix 1: OVERVIEW TAB — სერვ. click მუშაობს
   ══════════════════════════════════════════════════════════════ */
async function loadOverviewTab(){
    if(overviewMap){overviewMap.remove();overviewMap=null;}
    const {data:branches}=await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id);
    _overviewBranches=branches||[];
    setTimeout(()=>{
        const md=document.getElementById('overview-map-container');if(!md)return;
        overviewMap=L.map('overview-map-container',{zoomControl:true,attributionControl:false}).setView([41.7151,44.8271],11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(overviewMap);
        if(_overviewBranches.length){
            const mk=[];
            _overviewBranches.forEach(b=>{if(b.lat&&b.lng){const m=L.marker([b.lat,b.lng]).addTo(overviewMap);m.bindPopup(`<b>${b.name}</b><br>${b.address||''}`);m.on('click',()=>viewBranchDashboard(b));mk.push(m);}});
            if(mk.length)overviewMap.fitBounds(new L.featureGroup(mk).getBounds().pad(0.3));
        }
        overviewMap.invalidateSize();
    },300);

    const branchIds=_overviewBranches.map(b=>b.id);
    let svcEnriched=[];
    if(branchIds.length){
        const {data:svc}=await _supabase.from('service_logs')
            .select('id,service_date,service_type,technician_name,branch_id,asset_id,job_description,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,ambient_temp,amp_draw_comp,amp_draw_fan,comp_current_a,fan_current_a,refrigerant_added_kg,refrigerant_recovered_kg,leak_test_performed,leak_test_result,filters_cleaned,coils_cleaned,oil_level_ok,electrical_connections_checked,drain_checked,defrost_checked,system_status_after,recommendations')
            .in('branch_id',branchIds).order('service_date',{ascending:false}).limit(5);
        if(svc&&svc.length){
            const brMap=Object.fromEntries(_overviewBranches.map(b=>[b.id,b.name]));
            const aIds=[...new Set(svc.map(s=>s.asset_id).filter(Boolean))];
            let aMap={};
            if(aIds.length){const {data:an}=await _supabase.from('assets').select('id,name').in('id',aIds);aMap=Object.fromEntries((an||[]).map(a=>[a.id,a.name]));}
            svcEnriched=svc.map(s=>({...s,_brName:brMap[s.branch_id]||'—',_asName:aMap[s.asset_id]||'—'}));
        }
    }

    const sEl=document.getElementById('overview-recent-services');
    if(sEl){
        const tc={PPM:'bg-blue-100 text-blue-700',Emergency:'bg-red-100 text-red-700',Corrective:'bg-amber-100 text-amber-700',Installation:'bg-green-100 text-green-700',Repair:'bg-purple-100 text-purple-700'};
        if(svcEnriched.length){
            sEl.innerHTML=svcEnriched.map(s=>`
                <div class="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer transition"
                     onclick='_openSvcModal(${JSON.stringify(s)})'>
                    <span class="text-[10px] text-slate-400 w-10 flex-shrink-0 mt-0.5">${new Date(s.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1 mb-0.5">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span>
                            <span class="text-xs text-slate-700 font-medium truncate">${s.technician_name||'—'}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 truncate">${s._brName} · ${s._asName}</div>
                    </div>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" class="flex-shrink-0 mt-1"><polyline points="9 18 15 12 9 6"/></svg>
                </div>`).join('');
        } else sEl.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">სერვ. ჩანაწ. არ არის</div>';
    }

    _renderOverviewBranchList(_overviewBranches);
    _injectOverviewBranchToolbar();
}

/* Fix 1: სერვ. click → modal */
function _openSvcModal(s) {
    _showServiceModal(s);
}

/* ── სერვ. დეტ. მოდალი ── */
function _showServiceModal(s) {
    let modal = document.getElementById('_svc-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = '_svc-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,35,0.75);z-index:2000;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem';
        modal.onclick = (e) => { if(e.target===modal) modal.remove(); };
        document.body.appendChild(modal);
    }
    const date = new Date(s.service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'long',year:'numeric'});
    const tc = {PPM:'bg-blue-100 text-blue-800',Corrective:'bg-amber-100 text-amber-800',Emergency:'bg-red-100 text-red-800',Repair:'bg-purple-100 text-purple-800',Installation:'bg-green-100 text-green-800'};
    const row = (l,v) => v?`<tr><td class="py-1.5 px-3 text-[11px] text-slate-400 font-medium whitespace-nowrap">${l}</td><td class="py-1.5 px-3 text-[11px] text-slate-800 font-medium">${v}</td></tr>`:'';
    const bool = (v) => v ? '✓ დიახ' : '✗ არა';
    modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start p-5 border-b border-slate-100">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${tc[s.service_type]||'bg-slate-100 text-slate-700'}">${s.service_type||'—'}</span>
                    <span class="text-xs text-slate-400">${date}</span>
                </div>
                <h3 class="text-lg font-black text-slate-900">${s.technician_name||'—'}</h3>
                <div class="text-xs text-slate-400">${s._brName||'—'} · ${s._asName||'—'}</div>
            </div>
            <div class="flex gap-2">
                <button onclick='exportServicePDF(${JSON.stringify(s)})' class="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50">PDF</button>
                <button onclick="document.getElementById('_svc-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">✕</button>
            </div>
        </div>
        <div class="p-5">
            <div class="bg-slate-50 rounded-xl p-4 mb-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">სამ. აღწ.</div>
                <p class="text-sm text-slate-800">${s.job_description||'—'}</p>
                ${s.recommendations?`<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">რეკომ.</div><p class="text-sm text-slate-600">${s.recommendations}</p>`:''}
            </div>
            ${(s.suction_pressure||s.discharge_pressure||s.superheat||s.subcooling||s.comp_current_a||s.amp_draw_comp)?`
            <div class="mb-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">სამაც. გაზომ.</div>
                <table class="w-full border-collapse text-xs">
                <tbody class="divide-y divide-slate-100">
                    ${row('LP Bar',s.suction_pressure)}
                    ${row('HP Bar',s.discharge_pressure)}
                    ${row('T შეწ. °C',s.suction_temp)}
                    ${row('T დაჭ. °C',s.discharge_temp)}
                    ${row('Superheat K',s.superheat)}
                    ${row('Subcooling K',s.subcooling)}
                    ${row('კომპ. A',s.comp_current_a||s.amp_draw_comp)}
                    ${row('ფენ. A',s.fan_current_a||s.amp_draw_fan)}
                    ${row('გარ. °C',s.ambient_temp)}
                    ${row('საფ. დამ. kg',s.refrigerant_added_kg)}
                </tbody></table>
            </div>`:''}
            <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ჩეკლისტი</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center gap-1.5"><span class="${s.leak_test_performed?'text-green-600':'text-red-400'}">${bool(s.leak_test_performed)}</span><span class="text-slate-600">გაჟ. ტესტი</span></div>
                    <div class="flex items-center gap-1.5"><span class="${s.filters_cleaned?'text-green-600':'text-slate-400'}">${bool(s.filters_cleaned)}</span><span class="text-slate-600">ფილტრი</span></div>
                    <div class="flex items-center gap-1.5"><span class="${s.coils_cleaned?'text-green-600':'text-slate-400'}">${bool(s.coils_cleaned)}</span><span class="text-slate-600">Coil</span></div>
                    <div class="flex items-center gap-1.5"><span class="${s.electrical_connections_checked?'text-green-600':'text-slate-400'}">${bool(s.electrical_connections_checked)}</span><span class="text-slate-600">ელ. კავშ.</span></div>
                    <div class="flex items-center gap-1.5"><span class="${s.drain_checked?'text-green-600':'text-slate-400'}">${bool(s.drain_checked)}</span><span class="text-slate-600">Drain</span></div>
                    <div class="flex items-center gap-1.5"><span class="${s.defrost_checked?'text-green-600':'text-slate-400'}">${bool(s.defrost_checked)}</span><span class="text-slate-600">Defrost</span></div>
                </div>
                ${s.system_status_after?`<div class="mt-3 text-xs"><span class="font-medium text-slate-600">სტ. შემდეგ:</span> ${s.system_status_after}</div>`:''}
            </div>
        </div>
    </div>`;
    document.getElementById('_svc-modal') || document.body.appendChild(modal);
}

function _injectOverviewBranchToolbar(){
    const blEl=document.getElementById('overview-branches-list');if(!blEl)return;
    let tb=document.getElementById('overview-br-toolbar');
    if(!tb){tb=document.createElement('div');tb.id='overview-br-toolbar';tb.className='flex items-center gap-2 mb-3 flex-wrap';blEl.parentNode.insertBefore(tb,blEl);}
    tb.innerHTML=`
        <input type="text" id="ovbr-search" placeholder="ძებნა..." oninput="_filterOverviewBranches()"
            class="flex-1 min-w-[100px] text-xs border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50 text-slate-600">
        <select id="ovbr-status" onchange="_filterOverviewBranches()" class="text-xs border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50 text-slate-600">
            <option value="">ყველა</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select id="ovbr-sort" onchange="_filterOverviewBranches()" class="text-xs border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50 text-slate-600">
            <option value="default">სტანდ.</option><option value="name_asc">A→Z</option><option value="name_desc">Z→A</option>
            <option value="size_desc">ზომა ↓</option><option value="priority">პრიორ.</option>
        </select>`;
}
function _filterOverviewBranches(){
    const search=(document.getElementById('ovbr-search')?.value||'').toLowerCase();
    const status=document.getElementById('ovbr-status')?.value||'';
    const sort  =document.getElementById('ovbr-sort')?.value||'default';
    let d=[..._overviewBranches];
    if(search)d=d.filter(b=>(b.name||'').toLowerCase().includes(search)||(b.address||'').toLowerCase().includes(search));
    if(status==='active')  d=d.filter(b=>b.is_active);
    if(status==='inactive')d=d.filter(b=>!b.is_active);
    const po={Critical:0,High:1,Standard:2,Low:3};
    if(sort==='name_asc')  d.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(sort==='name_desc') d.sort((a,b)=>(b.name||'').localeCompare(a.name||''));
    if(sort==='size_desc') d.sort((a,b)=>(b.square_meters||0)-(a.square_meters||0));
    if(sort==='priority')  d.sort((a,b)=>(po[a.service_priority]??9)-(po[b.service_priority]??9));
    _renderOverviewBranchList(d);
}
function _renderOverviewBranchList(data){
    const blEl=document.getElementById('overview-branches-list');if(!blEl)return;
    if(!data.length){blEl.innerHTML='<div class="text-xs text-slate-300 italic text-center py-4">ვ/მ</div>';return;}
    const prC={Critical:'bg-red-100 text-red-700',High:'bg-amber-100 text-amber-700',Standard:'bg-green-100 text-green-700',Low:'bg-slate-100 text-slate-500'};
    blEl.innerHTML=data.map(b=>`
        <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 cursor-pointer transition"
             onclick='viewBranchDashboard(${JSON.stringify(b)})'>
            <div class="w-2 h-2 rounded-full flex-shrink-0 ${b.is_active?'bg-green-400':'bg-slate-300'}"></div>
            <div class="flex-1 min-w-0">
                <div class="text-slate-800 font-medium text-sm truncate">${b.name}</div>
                <div class="text-[10px] text-slate-400 truncate">${b.address||'—'}${b.square_meters?' · '+b.square_meters+' m²':''}</div>
            </div>
            <div class="flex items-center gap-1">
                ${b.service_priority?`<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${prC[b.service_priority]||'bg-slate-100 text-slate-500'}">${b.service_priority}</span>`:''}
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.is_active?'bg-green-100 text-green-700':'bg-slate-100 text-slate-400'}">${b.is_active?'Active':'Inactive'}</span>
            </div>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');
}

/* ══════════════════════════════════════════════════════════════
   LIVE MAP
   ══════════════════════════════════════════════════════════════ */
async function loadLiveMapTab(){
    if(typeof liveMap!=='undefined'&&liveMap){liveMap.remove();liveMap=null;}
    const {data:branches}=await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id);
    const {data:assets}  =await _supabase.from('assets').select('branch_id').eq('customer_id',activeCustomer.id);
    if(!branches?.length)return;
    const ac={};if(assets)assets.forEach(a=>{ac[a.branch_id]=(ac[a.branch_id]||0)+1;});
    setTimeout(()=>{
        const cont=document.getElementById('live-map-container');if(!cont)return;
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
        if(cls.getLayers().length)liveMap.fitBounds(cls.getBounds().pad(0.2));
        liveMap.invalidateSize();
    },400);
}

/* ══════════════════════════════════════════════════════════════
   BRANCHES TAB
   ══════════════════════════════════════════════════════════════ */
async function loadBranches(){
    const {data,error}=await _supabase.from('branches').select('*').eq('customer_id',activeCustomer.id).order('created_at');
    if(error)return;
    _branchesData=data||[];
    ['assets-filter-branch','services-filter-branch'].forEach(id=>{
        const sel=document.getElementById(id);if(!sel)return;
        const ex=Array.from(sel.options).map(o=>o.value);
        _branchesData.forEach(b=>{if(!ex.includes(b.id)){const o=document.createElement('option');o.value=b.id;o.textContent=b.name;sel.appendChild(o);}});
    });
    _injectBranchToolbar();
    _renderBranches(_branchesData);
    _setupBranchRT();
}
function _injectBranchToolbar(){
    const cont=document.getElementById('branches-list');if(!cont)return;
    let tb=document.getElementById('branches-toolbar');
    if(!tb){tb=document.createElement('div');tb.id='branches-toolbar';cont.parentNode.insertBefore(tb,cont);}
    tb.className='flex items-center gap-2 flex-wrap mb-4 p-3 bg-white border border-slate-200 rounded-2xl';
    tb.innerHTML=`
        <input type="text" id="br-search" placeholder="ძებნა სახ., მისამ..." oninput="_filterBranches()"
            class="flex-1 min-w-[140px] text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
        <select id="br-status" onchange="_filterBranches()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="">ყველა სტ.</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select id="br-priority" onchange="_filterBranches()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="">ყველა პრ.</option><option value="Critical">Critical</option><option value="High">High</option><option value="Standard">Standard</option><option value="Low">Low</option>
        </select>
        <select id="br-sort" onchange="_filterBranches()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600">
            <option value="created_at">შეიქ. ↑</option><option value="name_asc">სახ. A→Z</option><option value="name_desc">სახ. Z→A</option>
            <option value="size_desc">ზომა ↓</option><option value="size_asc">ზომა ↑</option><option value="priority">პრიორ.</option><option value="updated">განახ. ↓</option>
        </select>
        <button onclick="exportBranchesExcel()" class="text-xs font-bold text-green-600 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Excel
        </button>
        <span id="br-count" class="text-[10px] text-slate-400 ml-auto"></span>`;
}
function _filterBranches(){
    const search=(document.getElementById('br-search')?.value||'').toLowerCase();
    const status=document.getElementById('br-status')?.value||'';
    const priority=document.getElementById('br-priority')?.value||'';
    const sort=document.getElementById('br-sort')?.value||'created_at';
    let d=[..._branchesData];
    if(search)d=d.filter(b=>(b.name||'').toLowerCase().includes(search)||(b.address||'').toLowerCase().includes(search)||(b.contact_person||'').toLowerCase().includes(search));
    if(status==='active')  d=d.filter(b=>b.is_active);
    if(status==='inactive')d=d.filter(b=>!b.is_active);
    if(priority)d=d.filter(b=>b.service_priority===priority);
    const po={Critical:0,High:1,Standard:2,Low:3};
    if(sort==='name_asc')  d.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(sort==='name_desc') d.sort((a,b)=>(b.name||'').localeCompare(a.name||''));
    if(sort==='size_desc') d.sort((a,b)=>(b.square_meters||0)-(a.square_meters||0));
    if(sort==='size_asc')  d.sort((a,b)=>(a.square_meters||0)-(b.square_meters||0));
    if(sort==='priority')  d.sort((a,b)=>(po[a.service_priority]??9)-(po[b.service_priority]??9));
    if(sort==='updated')   d.sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
    const cnt=document.getElementById('br-count');if(cnt)cnt.textContent=`${d.length}/${_branchesData.length} ფილ.`;
    _renderBranches(d);
}
function _renderBranches(data){
    const cont=document.getElementById('branches-list');if(!cont)return;
    if(!data.length){cont.innerHTML='<div class="text-xs text-slate-300 text-center py-8 italic">ვ/მ</div>';return;}
    const now=Date.now();
    const prC={Critical:'bg-red-100 text-red-700',High:'bg-amber-100 text-amber-700',Standard:'bg-green-100 text-green-700',Low:'bg-slate-100 text-slate-500'};
    const prD={Critical:'#dc2626',High:'#f59e0b',Standard:'#22c55e',Low:'#94a3b8'};
    cont.innerHTML=data.map((b,i)=>{
        const isNew=b.updated_at&&(now-new Date(b.updated_at))<86400000*3;
        const bJ=JSON.stringify(b);
        return `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-4 group hover:shadow-lg transition-all cursor-pointer"
             onclick='viewBranchDashboard(${bJ})'>
            <div class="relative bg-slate-100 overflow-hidden flex-shrink-0" style="width:240px;min-height:170px">
                ${b.image_url?`<img src="${b.image_url}" class="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition duration-700">`:`<div class="absolute inset-0 flex items-center justify-center text-slate-300 text-xs italic">ფოტო არ არის</div>`}
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
                        <button onclick='event.stopPropagation();openBranchModal(${bJ})' class="text-blue-500 text-[11px] font-bold hover:underline">რედ. →</button>
                    </div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight mb-1">${b.name}</h3>
                    <p class="text-xs text-slate-400 flex items-center gap-1 mb-3">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${b.address||'—'}${b.square_meters?' · '+b.square_meters+' m²':''}
                    </p>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-400">
                        <div>ელ-კვ.: <span class="text-slate-700 font-bold">${b.power_supply_type||'—'}</span></div>
                        <div>ფართი: <span class="text-slate-700 font-bold">${b.square_meters?b.square_meters+' m²':'—'}</span></div>
                        <div>მენ.: <span class="text-slate-700 font-bold">${b.contact_person||'—'}</span></div>
                        <div>ტელ.: <span class="text-slate-700 font-bold">${b.contact_phone||'—'}</span></div>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button onclick='event.stopPropagation();viewAssets(${bJ})'
                        class="flex-1 bg-slate-900 text-white text-[10px] font-bold py-2 rounded-xl hover:bg-blue-600 transition">
                        აგრ. →
                    </button>
                    <button onclick='event.stopPropagation();deleteData("branches","${b.id}")'
                        class="px-3 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                </div>
            </div>
        </div>`}).join('');
    data.forEach((b,i)=>{if(b.lat&&b.lng){try{const m=L.map(`bmap-${i}`,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false}).setView([b.lat,b.lng],15);L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);L.marker([b.lat,b.lng]).addTo(m);}catch(e){}}});
    lucide.createIcons();
}
function _setupBranchRT(){
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
function exportBranchesExcel(){
    if(!_branchesData.length){alert('ჩატვ. მონ.');return;}
    const hdr=['სახ.','მისამ.','სტ.','პრიორ.','ფართი m²','ელ-კვ.','კონტ.','ტელ.','SLA','სიხ.','შეიქ.','განახ.'];
    const rows=[hdr,..._branchesData.map(b=>[b.name||'',b.address||'',b.is_active?'Active':'Inactive',b.service_priority||'',b.square_meters||'',b.power_supply_type||'',b.contact_person||'',b.contact_phone||'',b.sla_response_hours?b.sla_response_hours+'h':'',b.service_frequency||'',b.created_at?new Date(b.created_at).toLocaleDateString('ka-GE'):'',b.updated_at?new Date(b.updated_at).toLocaleDateString('ka-GE'):''])];
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`branches_${activeCustomer?.name||'export'}_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   Fix 3: ASSETS TAB — breadcrumb branch განახლება
   ══════════════════════════════════════════════════════════════ */
async function loadAllAssets(){
    if(!activeCustomer)return;
    const bF=document.getElementById('assets-filter-branch')?.value||'';
    const cont=document.getElementById('all-assets-table');
    if(cont)cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-8">იტვ...</div>';
    let q=_supabase.from('assets')
        .select('id,name,asset_type,asset_class,brand,model,tag_number,status,condition_score,last_service_date,branch_id,branches(id,name,lat,lng,image_url,address,is_active,contact_person,contact_phone,power_supply_type,square_meters,service_priority,sla_response_hours,service_frequency,contract_end,building_type,floor_zone,working_hours,access_code,parking_details,emergency_contact,emergency_phone,after_hours_contact,after_hours_phone,contract_type,contract_start,notes,created_at,updated_at,branch_type,year_built,refrigeration_type)')
        .eq('customer_id',activeCustomer.id);
    if(bF)q=q.eq('branch_id',bF);
    q=q.order('name');
    const {data,error}=await q;
    if(error||!cont){if(error)console.error(error);return;}
    if(!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">ვ/მ</div>';return;}
    const sC={Operational:'bg-green-100 text-green-700',Maintenance_Required:'bg-amber-100 text-amber-700',Down:'bg-red-100 text-red-700'};
    const sL={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    const clC={AC:'bg-blue-50 text-blue-700',Refrigeration:'bg-teal-50 text-teal-700',Other:'bg-amber-50 text-amber-700'};
    cont.innerHTML=`<table class="w-full text-xs border-collapse">
    <thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">სახ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">კლასი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ფილ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">სტ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ბ. სერვ.</th>
    </tr></thead>
    <tbody>${data.map(a=>`
    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='_openAssetFromTable(${JSON.stringify(a)})'>
        <td class="py-2.5 px-2 font-medium text-slate-800">${a.name||'—'}</td>
        <td class="py-2.5 px-2 text-slate-500">${a.asset_type||'—'}</td>
        <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded-full font-bold text-[9px] ${clC[a.asset_class]||'bg-slate-100 text-slate-500'}">${a.asset_class||'—'}</span></td>
        <td class="py-2.5 px-2 text-slate-500">${a.branches?.name||'—'}</td>
        <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${sC[a.status]||'bg-slate-100 text-slate-500'}">${sL[a.status]||a.status}</span></td>
        <td class="py-2.5 px-2 text-slate-400">${a.last_service_date?new Date(a.last_service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
    </tr>`).join('')}
    </tbody></table>
    <div class="mt-3 flex justify-end">
        <button onclick="exportAllAssetsExcel()" class="text-xs font-bold text-green-600 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Excel
        </button>
    </div>`;
    window._allAssetsCache=data;
}

/* Fix 3: asset row → loadAssetView + breadcrumb */
async function _openAssetFromTable(a){
    const branch=a.branches;
    if(!branch){alert('ფილ. ვ/მ');return;}
    activeBranch=branch;
    _setNavBranch(branch);  /* Fix 3 */
    window._pendingAssetId=a.id;
    if(typeof _doViewBranchDashboard==='function'){
        _doViewBranchDashboard(branch);
        setTimeout(()=>{
            const btn=[...document.querySelectorAll('#bdc-nav .bdc-tab')].find(t=>t.textContent.trim().includes('აგრეგ'));
            if(btn)switchBdcTab('assets',btn);
        },350);
    }
}
function viewAssetFromTable(a){_openAssetFromTable(a);}

function viewServiceFromTable(log){
    activeBranch={id:log.branch_id,name:log._branchName||''};
    activeAsset ={id:log.asset_id, name:log._assetName||'სერვ.'};
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText=activeAsset.name;
    loadServiceLogs();
}

function exportAllAssetsExcel(){
    const data=window._allAssetsCache;
    if(!data?.length){alert('ჯერ ჩატვ.');return;}
    const hdr=['სახ.','ტიპი','კლასი','ბრენდი','მოდ.','TAG','ფილ.','სტ.','Cond.','სიმძლ.kW','საფ.','ბ.სერვ.'];
    const rows=[hdr,...data.map(a=>[a.name||'',a.asset_type||'',a.asset_class||'',a.brand||'',a.model||'',a.tag_number||'',a.branches?.name||'',a.status||'',a.condition_score||'',a.cooling_capacity_kw||'',a.refrigerant_type||'',a.last_service_date?new Date(a.last_service_date).toLocaleDateString('ka-GE'):''])];
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a2=document.createElement('a');a2.href=url;a2.download=`assets_${activeCustomer?.name||'export'}_${new Date().toISOString().slice(0,10)}.csv`;a2.click();URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   Fix 2: SERVICES TAB — row click → modal
   ══════════════════════════════════════════════════════════════ */
async function loadAllServices(){
    if(!activeCustomer)return;
    const tF=document.getElementById('services-filter-type')?.value||'';
    const bF=document.getElementById('services-filter-branch')?.value||'';
    const cont=document.getElementById('all-services-table');
    if(cont)cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-8">იტვ...</div>';
    const {data:branches}=await _supabase.from('branches').select('id,name').eq('customer_id',activeCustomer.id);
    const allBranchIds=(branches||[]).map(b=>b.id);
    const brMap=Object.fromEntries((branches||[]).map(b=>[b.id,b.name]));
    let branchIds=allBranchIds;
    if(bF)branchIds=[bF];
    if(!branchIds.length){if(cont)cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">ვ/მ</div>';return;}
    let q=_supabase.from('service_logs')
        .select('id,service_date,service_type,technician_name,job_description,branch_id,asset_id,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,ambient_temp,amp_draw_comp,amp_draw_fan,comp_current_a,fan_current_a,refrigerant_added_kg,refrigerant_recovered_kg,leak_test_performed,leak_test_result,filters_cleaned,coils_cleaned,oil_level_ok,electrical_connections_checked,drain_checked,defrost_checked,system_status_after,recommendations')
        .in('branch_id',branchIds).order('service_date',{ascending:false});
    if(tF)q=q.eq('service_type',tF);
    const {data,error}=await q;
    if(!cont)return;
    if(error){cont.innerHTML=`<div class="text-xs text-red-400 italic text-center py-8">შეცდ: ${error.message}</div>`;return;}
    if(!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">სერვ. ჩანაწ. ვ/მ</div>';return;}
    const aIds=[...new Set(data.map(s=>s.asset_id).filter(Boolean))];
    let aMap={};
    if(aIds.length){const {data:an}=await _supabase.from('assets').select('id,name').in('id',aIds);aMap=Object.fromEntries((an||[]).map(a=>[a.id,a.name]));}
    const enriched=data.map(s=>({...s,_assetName:aMap[s.asset_id]||'—',_branchName:brMap[s.branch_id]||'—'}));
    const tc={PPM:'bg-blue-100 text-blue-700',Corrective:'bg-amber-100 text-amber-700',Emergency:'bg-red-100 text-red-700',Installation:'bg-green-100 text-green-700',Repair:'bg-purple-100 text-purple-700'};
    cont.innerHTML=`<table class="w-full text-xs border-collapse">
    <thead><tr class="border-b border-slate-100">
        <th class="text-left font-medium text-slate-400 py-2 px-2">თარ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">ფილ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">აგრ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">სამ.</th>
        <th class="text-left font-medium text-slate-400 py-2 px-2">PDF</th>
    </tr></thead>
    <tbody>${enriched.map(s=>`
    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
        <td class="py-2.5 px-2 text-slate-500 whitespace-nowrap" onclick='_openSvcModal(${JSON.stringify(s)})'>${new Date(s.service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td class="py-2.5 px-2 font-medium text-slate-800" onclick='_openSvcModal(${JSON.stringify(s)})'>${s.technician_name||'—'}</td>
        <td class="py-2.5 px-2" onclick='_openSvcModal(${JSON.stringify(s)})'><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${tc[s.service_type]||'bg-slate-100 text-slate-500'}">${s.service_type||'—'}</span></td>
        <td class="py-2.5 px-2 text-slate-500" onclick='_openSvcModal(${JSON.stringify(s)})'>${s._branchName}</td>
        <td class="py-2.5 px-2 text-slate-500" onclick='_openSvcModal(${JSON.stringify(s)})'>${s._assetName}</td>
        <td class="py-2.5 px-2 text-slate-400 truncate max-w-[150px]" onclick='_openSvcModal(${JSON.stringify(s)})'>${s.job_description?s.job_description.substring(0,40)+'...':'—'}</td>
        <td class="py-2.5 px-2"><button onclick='exportServicePDF(${JSON.stringify(s)})' class="text-[9px] font-bold text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">PDF</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}
