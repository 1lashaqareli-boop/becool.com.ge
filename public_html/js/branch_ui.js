/* ============================================================
   BECOOL CRM — branch_ui.js
   Fix: Breadcrumb, Table redirects, KPI loading
   ============================================================ */

let _branchesData     = [];
let _branchRT         = null;
let overviewMap       = null;
let _overviewBranches = [];

window._nav = window._nav || { customer: null, branch: null };

function _renderBreadcrumb() {
    let el = document.getElementById('_breadcrumb');
    if (!el) {
        el = document.createElement('div');
        el.id = '_breadcrumb';
        el.style.cssText = 'position:sticky;top:64px;z-index:40;background:rgba(15,23,42,0.97);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 1.5rem';
        const nav = document.querySelector('nav');
        if (nav && nav.nextSibling) nav.parentNode.insertBefore(el, nav.nextSibling);
        else if (nav) nav.after(el); else document.body.prepend(el);
    }
    const c = window._nav.customer; const b = window._nav.branch;
    const av = c ? (c.image_url ? `<img src="${c.image_url}" class="w-4 h-4 rounded object-cover flex-shrink-0">` : `<div class="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">${(c.name||'BC').substring(0,2).toUpperCase()}</div>`) : '';
    const sep = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
    let html = `<div class="container mx-auto flex items-center gap-2 h-9 overflow-x-auto" style="scrollbar-width:none"><button onclick="showCustomers()" class="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-medium whitespace-nowrap"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>მომხ.</button>`;
    if (c) {
        html += sep;
        if (b) { html += `<button onclick="backToCustomer()" class="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-medium truncate max-w-[140px]">${av}<span class="truncate">${c.name||'---'}</span></button>${sep}<span class="flex items-center gap-1.5 text-white font-bold text-xs truncate max-w-[180px]"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${b.name||'---'}</span>`; }
        else { html += `<span class="flex items-center gap-1.5 text-white font-bold text-xs truncate max-w-[200px]">${av}<span class="truncate">${c.name||'---'}</span></span>`; }
    }
    html += '</div>'; el.innerHTML = html; el.style.display = '';
}

function _hideBreadcrumb() { const el = document.getElementById('_breadcrumb'); if (el) el.style.display = 'none'; window._nav.customer = null; window._nav.branch = null; }
function _showBreadcrumb() { const el = document.getElementById('_breadcrumb'); if (el) el.style.display = ''; }

function backToCustomer() {
    if (!window._nav.customer) { showCustomers(); return; }
    window._nav.branch = null; activeCustomer = window._nav.customer;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
    fillCustomerCard(activeCustomer); loadCustomerKPIs(); switchBranchTab('overview', document.getElementById('tab-overview')); _renderBreadcrumb();
}

function viewBranchDashboard(b) { window._nav.branch = b; activeBranch = b; _showBreadcrumb(); _renderBreadcrumb(); if (typeof _doViewBranchDashboard === 'function') _doViewBranchDashboard(b); }
function _setNavBranch(b) { window._nav.branch = b; activeBranch = b; _showBreadcrumb(); _renderBreadcrumb(); }

function viewBranches(c) {
    activeCustomer = c; window._nav.customer = c; window._nav.branch = null;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
    fillCustomerCard(c); loadCustomerKPIs(); switchBranchTab('overview', document.getElementById('tab-overview')); _showBreadcrumb(); _renderBreadcrumb();
}

function fillCustomerCard(c) {
    const av = document.getElementById('cv-avatar'); if (!av) return;
    if (c.image_url) { av.innerHTML = `<img src="${c.image_url}" class="w-full h-full object-cover">`; }
    else { av.textContent = (c.name||'BC').substring(0,2).toUpperCase(); av.className='w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0'; }
    const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v||''; };
    s('cv-name', c.name||'---'); s('cv-tax', c.tax_id?`TAX: ${c.tax_id}`:''); s('cv-phone', c.phone||''); s('cv-legal',c.legal_address||'—');
    const ae=document.getElementById('cv-actual'); if(ae){ae.textContent=c.actual_address||'—';ae.href=c.map_url||'#';}
    const vat=document.getElementById('cv-vat'); if(vat){vat.textContent=c.is_vat_payer?'✓ კი':'✗ არა';}
    s('cv-contact1',c.contact_person_1||'—'); s('cv-pos1',c.position_1||'—'); s('cv-phone1',c.phone_1||'—');
}

async function loadCustomerKPIs() {
    if (!activeCustomer) return;
    const {data:branches,count:bc} = await _supabase.from('branches').select('id',{count:'exact'}).eq('customer_id',activeCustomer.id);
    const {count:ac} = await _supabase.from('assets').select('*',{count:'exact',head:true}).eq('customer_id',activeCustomer.id);
    const branchIds = (branches||[]).map(b=>b.id);
    let sc=0, lastDate='—';
    if(branchIds.length) {
        const {count:sc2} = await _supabase.from('service_logs').select('*',{count:'exact',head:true}).in('branch_id',branchIds); sc=sc2||0;
        const {data:ls} = await _supabase.from('service_logs').select('service_date').in('branch_id',branchIds).order('service_date',{ascending:false}).limit(1);
        if(ls?.[0]) lastDate=new Date(ls[0].service_date).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'});
    }
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??'—';};
    set('kpi-branches',bc); set('kpi-assets',ac); set('kpi-services',sc); set('kpi-last-service',lastDate);
}

function switchBranchTab(name,btn){
    document.querySelectorAll('#branch-view .flex.gap-1 button').forEach(b=>{b.classList.remove('bg-white','text-slate-900','shadow-sm');b.classList.add('text-slate-400');});
    document.querySelectorAll('.branch-panel').forEach(p=>p.classList.add('hidden'));
    if(btn){btn.classList.add('bg-white','text-slate-900','shadow-sm');btn.classList.remove('text-slate-400');}
    const panel=document.getElementById(`panel-${name}`); if(panel)panel.classList.remove('hidden');
    if(name==='overview')loadOverviewTab(); if(name==='map')loadLiveMapTab(); if(name==='branches')loadBranches(); if(name==='assets')loadAllAssets(); if(name==='services')loadAllServices();
}

/* FIX: Table row click -> open asset dashboard  */
async function _openAssetFromTable(a) {
    const branch = a.branches || activeBranch;
    if (!branch) { alert('ფილიალი ვერ მოიძებნა'); return; }
    if (typeof navigateToAsset === 'function') {
        navigateToAsset(a, branch);
    }
}

async function loadAllAssets(){
    if(!activeCustomer)return;
    const bF=document.getElementById('assets-filter-branch')?.value||'';
    const cont=document.getElementById('all-assets-table'); if(cont)cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-8">იტვ...</div>';
    let q=_supabase.from('assets').select('id,name,asset_type,brand,model,status,branch_id,branches(id,name,address,is_active)').eq('customer_id',activeCustomer.id);
    if(bF)q=q.eq('branch_id',bF);
    const {data,error}=await q.order('name');
    if(!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">ვ/მ</div>';return;}
    cont.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100"><th class="text-left py-2 px-2">სახ.</th><th class="text-left py-2 px-2">ტიპი</th><th class="text-left py-2 px-2">ფილ.</th><th class="text-left py-2 px-2">სტ.</th></tr></thead><tbody>${data.map(a=>`<tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='_openAssetFromTable(${JSON.stringify(a)})'><td class="py-2.5 px-2 font-medium text-slate-800">${a.name||'—'}</td><td class="py-2.5 px-2 text-slate-500">${a.asset_type||'—'}</td><td class="py-2.5 px-2 text-slate-500">${a.branches?.name||'—'}</td><td class="py-2.5 px-2">OK</td></tr>`).join('')}</tbody></table>`;
}

async function loadAllServices(){
    const cont=document.getElementById('all-services-table'); if(cont)cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-8">იტვ...</div>';
    const {data:branches}=await _supabase.from('branches').select('id,name').eq('customer_id',activeCustomer.id);
    const branchIds=(branches||[]).map(b=>b.id); if(!branchIds.length)return;
    const {data}=await _supabase.from('service_logs').select('*').in('branch_id',branchIds).order('service_date',{ascending:false});
    if(!data?.length){cont.innerHTML='<div class="text-xs text-slate-300 italic text-center py-10">სერვ. ვ/მ</div>';return;}
    cont.innerHTML=`<table class="w-full text-xs border-collapse"><thead><tr class="border-b border-slate-100"><th class="text-left py-2 px-2">თარ.</th><th class="text-left py-2 px-2">ტექნ.</th><th class="text-left py-2 px-2">ტიპი</th></tr></thead><tbody>${data.map(s=>`<tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='_showServiceModal(${JSON.stringify(s)})'><td class="py-2.5 px-2 text-slate-500">${new Date(s.service_date).toLocaleDateString()}</td><td class="py-2.5 px-2 font-medium text-slate-800">${s.technician_name}</td><td class="py-2.5 px-2">${s.service_type}</td></tr>`).join('')}</tbody></table>`;
}
