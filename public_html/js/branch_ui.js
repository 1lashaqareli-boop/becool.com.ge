/* ============================================================
   BECOOL CRM — branch_ui.js
   კლიენტის დეტალების გვერდის სრული ლოგიკა:
   - კლიენტის ინფო ბარათი (KPI, დეტალები)
   - ტაბების გადართვა
   - ფილიალების სია
   - ყველა აგრეგატის ცხრილი
   - ყველა სერვისის ცხრილი
   - Overview (რუკა + ბოლო სერვისები + ფილიალები)

   index.html-ში <script> ტეგებში დაამატე:
   <script src="js/branch_ui.js"></script>
   api.js-ის შემდეგ, ui.js-ის წინ.
   ============================================================ */


/* ============================================================
   viewBranches(c)
   კლიენტის ბარათზე "ფილიალები" ღილაკის დაჭერისას.
   c = კლიენტის ობიექტი
   ============================================================ */
function viewBranches(c) {
    activeCustomer = c;

    /* ეკრანის გადართვა */
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');

    /* კლიენტის ინფო ბარათის შევსება */
    fillCustomerCard(c);

    /* KPI-ების ჩატვირთვა Supabase-იდან */
    loadCustomerKPIs();

    /* პირველი ტაბი — მთავარი */
    switchBranchTab('overview', document.getElementById('tab-overview'));
}


/* ============================================================
   fillCustomerCard(c)
   კლიენტის ინფო ბარათის ყველა ველის შევსება.
   ============================================================ */
function fillCustomerCard(c) {

    /* ავატარი — ლოგო ან ინიციალები */
    const avatarEl = document.getElementById('cv-avatar');
    if (c.image_url) {
        avatarEl.innerHTML = `<img src="${c.image_url}" class="w-full h-full object-cover">`;
    } else {
        const initials = (c.name || 'BC').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.className = 'w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0';
    }

    /* სახელი */
    document.getElementById('cv-name').textContent = c.name || '---';

    /* სტატუსის badge */
    const statusBadge = document.getElementById('cv-status-badge');
    const statusColors = {
        'Active':    'bg-green-100 text-green-800',
        'Potential': 'bg-amber-100 text-amber-800',
        'Passive':   'bg-slate-100 text-slate-500'
    };
    statusBadge.textContent = c.status || 'Potential';
    statusBadge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-slate-100 text-slate-500'}`;

    /* ტიპის badge */
    document.getElementById('cv-type-badge').textContent = c.customer_type === 'Person' ? 'ფიზ. პირი' : 'შპს';

    /* სფეროს badge */
    const indBadge = document.getElementById('cv-industry-badge');
    if (c.industry) {
        indBadge.textContent = c.industry;
        indBadge.classList.remove('hidden');
    } else {
        indBadge.classList.add('hidden');
    }

    /* meta ხაზი */
    document.getElementById('cv-tax').textContent   = c.tax_id   ? `TAX: ${c.tax_id}`   : '';
    document.getElementById('cv-phone').textContent = c.phone    ? c.phone               : '';
    const webMeta = document.getElementById('cv-website');
    if (c.website) {
        webMeta.textContent = c.website;
        webMeta.href = c.website.startsWith('http') ? c.website : `https://${c.website}`;
        webMeta.classList.remove('hidden');
    } else {
        webMeta.classList.add('hidden');
    }

    /* დეტალები — მარცხენა სვეტი */
    document.getElementById('cv-legal').textContent = c.legal_address || '—';

    const actualEl = document.getElementById('cv-actual');
    if (c.actual_address && c.map_url) {
        actualEl.textContent = c.actual_address;
        actualEl.href = c.map_url;
    } else if (c.actual_address) {
        actualEl.textContent = c.actual_address;
        actualEl.href = '#';
    } else {
        actualEl.textContent = '—';
        actualEl.href = '#';
    }

    const webEl    = document.getElementById('cv-web');
    const webEmpty = document.getElementById('cv-web-empty');
    if (c.website) {
        webEl.textContent = c.website;
        webEl.href = c.website.startsWith('http') ? c.website : `https://${c.website}`;
        webEl.classList.remove('hidden');
        webEmpty.classList.add('hidden');
    } else {
        webEl.classList.add('hidden');
        webEmpty.classList.remove('hidden');
    }

    document.getElementById('cv-vat').textContent = c.is_vat_payer ? '✓ კი' : '✗ არა';
    document.getElementById('cv-vat').style.color = c.is_vat_payer ? '#15803d' : '';

    /* დეტალები — მარჯვენა სვეტი */
    document.getElementById('cv-contact1').textContent = c.contact_person_1 || '—';
    document.getElementById('cv-pos1').textContent     = c.position_1       || '—';
    document.getElementById('cv-phone1').textContent   = c.phone_1          || '—';

    const email1El = document.getElementById('cv-email1');
    if (c.email_1) {
        email1El.textContent = c.email_1;
        email1El.href = `mailto:${c.email_1}`;
    } else {
        email1El.textContent = '—';
        email1El.href = '#';
    }
}


/* ============================================================
   loadCustomerKPIs()
   Supabase-იდან KPI-ების ჩატვირთვა:
   ფილიალების რაოდენობა, აგრეგატები, სერვისები, ბოლო სერვისი
   ============================================================ */
async function loadCustomerKPIs() {
    if (!activeCustomer) return;

    /* ფილიალების რაოდენობა */
    const { count: branchCount } = await _supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', activeCustomer.id);

    /* აგრეგატების რაოდენობა */
    const { count: assetCount } = await _supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', activeCustomer.id);

    /* სერვის ლოგების რაოდენობა */
    const { count: serviceCount } = await _supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', activeCustomer.id);

    /* ბოლო სერვისის თარიღი */
    const { data: lastSvc } = await _supabase
        .from('service_logs')
        .select('service_date')
        .eq('customer_id', activeCustomer.id)
        .order('service_date', { ascending: false })
        .limit(1);

    /* KPI ველების განახლება */
    document.getElementById('kpi-branches').textContent  = branchCount  ?? '—';
    document.getElementById('kpi-assets').textContent    = assetCount   ?? '—';
    document.getElementById('kpi-services').textContent  = serviceCount ?? '—';

    if (lastSvc && lastSvc.length > 0) {
        const d = new Date(lastSvc[0].service_date);
        document.getElementById('kpi-last-service').textContent = d.toLocaleDateString('ka-GE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } else {
        document.getElementById('kpi-last-service').textContent = '—';
    }
}


/* ============================================================
   toggleCustomerDetails()
   კლიენტის დეტალების სექციის ჩამოშლა / გაშლა
   ============================================================ */
let customerDetailsOpen = true;
function toggleCustomerDetails() {
    customerDetailsOpen = !customerDetailsOpen;
    const details = document.getElementById('cv-details');
    const icon    = document.getElementById('cv-toggle-icon');

    details.style.display = customerDetailsOpen ? '' : 'none';
    /* ▲ ნიშნავს "დაკეცე" (ჩანს), ▼ ნიშნავს "გაშალე" (დაკეცილია) */
    icon.innerHTML = customerDetailsOpen
        ? '<polyline points="18 15 12 9 6 15"/>'
        : '<polyline points="6 9 12 15 18 9"/>';
}


/* ============================================================
   editActiveCustomer()
   კლიენტის რედაქტირება — ახლანდელი activeCustomer
   ============================================================ */
function editActiveCustomer() {
    if (activeCustomer) openCustomerModal(activeCustomer);
}


/* ============================================================
   deleteActiveCustomer()
   კლიენტის წაშლა — ახლანდელი activeCustomer
   ============================================================ */
async function deleteActiveCustomer() {
    if (!activeCustomer) return;
    if (confirm(`ნამდვილად გსურთ "${activeCustomer.name}"-ის წაშლა?`)) {
        const { error } = await _supabase
            .from('customers')
            .delete()
            .eq('id', activeCustomer.id);
        if (!error) {
            /* კლიენტების სიაზე დაბრუნება */
            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById('customer-view').classList.add('active');
            loadCustomers();
        } else {
            alert('წაშლის შეცდომა: ' + error.message);
        }
    }
}


/* ============================================================
   switchBranchTab(name, btn)
   ტაბებს შორის გადართვა
   name = 'overview' | 'map' | 'branches' | 'assets' | 'services'
   ============================================================ */
function switchBranchTab(name, btn) {
    /* ყველა ტაბის სტილის გასუფთავება */
    document.querySelectorAll('.tabs button, #branch-view .flex.gap-1 button').forEach(b => {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-400');
    });

    /* ყველა პანელის დამალვა */
    document.querySelectorAll('.branch-panel').forEach(p => p.classList.add('hidden'));

    /* არჩეული ტაბის გააქტიურება */
    btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    btn.classList.remove('text-slate-400');

    /* შესაბამისი პანელის გახსნა */
    document.getElementById(`panel-${name}`).classList.remove('hidden');

    /* ტაბის შიგთავსის ჩატვირთვა */
    if (name === 'overview')  loadOverviewTab();
    if (name === 'map')       loadLiveMapTab();
    if (name === 'branches')  loadBranches();
    if (name === 'assets')    loadAllAssets();
    if (name === 'services')  loadAllServices();
}


/* ============================================================
   loadOverviewTab()
   მთავარი ტაბი: მინი-რუკა + ბოლო სერვისები + ფილიალების მოკლე სია
   ============================================================ */
let overviewMap = null;
async function loadOverviewTab() {
    /* მინი-რუკა */
    if (overviewMap) { overviewMap.remove(); overviewMap = null; }

    const { data: branches } = await _supabase
        .from('branches')
        .select('*')
        .eq('customer_id', activeCustomer.id);

    setTimeout(() => {
        const mapDiv = document.getElementById('overview-map-container');
        if (!mapDiv) return;
        overviewMap = L.map('overview-map-container', { zoomControl: true, attributionControl: false })
            .setView([41.7151, 44.8271], 11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(overviewMap);

        if (branches && branches.length > 0) {
            const markers = [];
            branches.forEach(b => {
                if (b.lat && b.lng) {
                    const m = L.marker([b.lat, b.lng]).addTo(overviewMap);
                    m.bindPopup(`<b>${b.name}</b><br>${b.address || ''}`);
                    markers.push(m);
                }
            });
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                overviewMap.fitBounds(group.getBounds().pad(0.3));
            }
        }
        overviewMap.invalidateSize();
    }, 300);

    /* ბოლო 5 სერვისი */
    const { data: recentSvc } = await _supabase
        .from('service_logs')
        .select('service_date, service_type, technician_name, branch_id')
        .eq('customer_id', activeCustomer.id)
        .order('service_date', { ascending: false })
        .limit(5);

    const svcEl = document.getElementById('overview-recent-services');
    if (recentSvc && recentSvc.length > 0) {
        svcEl.innerHTML = recentSvc.map(s => `
            <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span class="text-slate-300">${new Date(s.service_date).toLocaleDateString('ka-GE', {day:'2-digit', month:'short'})}</span>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${s.service_type === 'Emergency' ? 'bg-red-100 text-red-700' : s.service_type === 'PPM' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}">${s.service_type}</span>
                <span class="text-slate-600 flex-1">${s.technician_name || '—'}</span>
            </div>
        `).join('');
    } else {
        svcEl.innerHTML = '<div class="text-xs text-slate-300 text-center py-4 italic">სერვის ჩანაწერები არ არის</div>';
    }

    /* ფილიალების მოკლე სია */
    const branchListEl = document.getElementById('overview-branches-list');
    if (branches && branches.length > 0) {
        branchListEl.innerHTML = branches.map(b => `
            <div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                <div class="w-2 h-2 rounded-full flex-shrink-0 ${b.is_active ? 'bg-green-400' : 'bg-slate-300'}"></div>
                <div class="flex-1">
                    <div class="text-slate-800 font-medium">${b.name}</div>
                    <div class="text-[10px] text-slate-400">${b.address || '—'}</div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}">${b.is_active ? 'Active' : 'Inactive'}</span>
            </div>
        `).join('');
    } else {
        branchListEl.innerHTML = '<div class="text-xs text-slate-300 text-center py-4 italic">ფილიალები არ არის</div>';
    }
}


/* ============================================================
   viewBranchDashboard(b)
   ფილიალის ბარათზე დაჭერისას — branch dashboard-ზე გადასვლა.
   b = ფილიალის ობიექტი
   ============================================================ */
/* viewBranchDashboard — branch_dashboard.js-შია განსაზღვრული */

/* ============================================================
   loadLiveMapTab()
   ლაივ რუკა ტაბი — Leaflet ClusterMap
   ============================================================ */
async function loadLiveMapTab() {
    if (liveMap) { liveMap.remove(); liveMap = null; }

    const { data: branches } = await _supabase
        .from('branches').select('*').eq('customer_id', activeCustomer.id);
    const { data: assets } = await _supabase
        .from('assets').select('branch_id').eq('customer_id', activeCustomer.id);

    if (!branches || branches.length === 0) return;

    const assetCounts = {};
    if (assets) assets.forEach(a => {
        assetCounts[a.branch_id] = (assetCounts[a.branch_id] || 0) + 1;
    });

    setTimeout(() => {
        liveMap = L.map('live-map-container', { zoomControl: false }).setView([41.7151, 44.8271], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }).addTo(liveMap);
        L.control.zoom({ position: 'bottomright' }).addTo(liveMap);

        const clusters = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
        branches.forEach(b => {
            if (b.lat && b.lng) {
                const count = assetCounts[b.id] || 0;
                const marker = L.marker([b.lat, b.lng]);
                marker.bindPopup(`
                    <div class="p-2 min-w-[160px]">
                        <div class="font-bold text-slate-900 mb-1">${b.name}</div>
                        <div class="text-xs text-slate-400 mb-2">${b.address || '—'}</div>
                        <div class="bg-blue-600 text-white rounded-lg px-3 py-1.5 flex justify-between text-xs">
                            <span>აგრეგატები</span><span class="font-bold">${count}</span>
                        </div>
                    </div>
                `, { closeButton: false });
                clusters.addLayer(marker);
            }
        });
        liveMap.addLayer(clusters);
        if (clusters.getLayers().length > 0) liveMap.fitBounds(clusters.getBounds().pad(0.2));
        liveMap.invalidateSize();
    }, 400);
}


/* ============================================================
   loadBranches()
   ფილიალები ტაბი — ბარათების სია (ძველი სტილი)
   ============================================================ */
async function loadBranches() {
    const { data, error } = await _supabase
        .from('branches')
        .select('*')
        .eq('customer_id', activeCustomer.id)
        .order('created_at');

    if (error) return;

    /* overview-ს filter select-ების შევსება */
    ['assets-filter-branch', 'services-filter-branch'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const existing = Array.from(sel.options).map(o => o.value);
        data.forEach(b => {
            if (!existing.includes(b.id)) {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.name;
                sel.appendChild(opt);
            }
        });
    });

    const container = document.getElementById('branches-list');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-300 text-center py-8 italic">ფილიალები არ არის</div>';
        return;
    }

    /* priority ფერები */
    const prioColor = {
        'Critical': 'bg-red-100 text-red-700',
        'High':     'bg-amber-100 text-amber-700',
        'Standard': 'bg-green-100 text-green-700',
        'Low':      'bg-slate-100 text-slate-500',
    };
    const prioDot = {
        'Critical': '#dc2626',
        'High':     '#f59e0b',
        'Standard': '#22c55e',
        'Low':      '#94a3b8',
    };

    container.innerHTML = data.map((b, i) => `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-4 group hover:shadow-lg transition-all cursor-pointer"
             onclick='viewBranchDashboard(${JSON.stringify(b)})'>

            <!-- ფოტო + მინი-რუკა -->
            <div class="relative bg-slate-100 overflow-hidden flex-shrink-0" style="width:260px; min-height:200px;">
                ${b.image_url
                    ? `<img src="${b.image_url}" class="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition duration-700">`
                    : `<div class="absolute inset-0 flex items-center justify-center text-slate-300 text-xs italic">ფოტო არ არის</div>`
                }
                <div id="bmap-${i}" class="absolute bottom-3 left-3 right-3 rounded-2xl overflow-hidden border-2 border-white shadow-lg" style="height:80px;"></div>
            </div>

            <!-- ინფო -->
            <div class="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}">${b.is_active ? 'Active' : 'Inactive'}</span>
                            ${b.service_priority ? `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${prioColor[b.service_priority] || 'bg-slate-100 text-slate-500'}"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${prioDot[b.service_priority] || '#94a3b8'};margin-right:3px;vertical-align:middle;"></span>${b.service_priority}</span>` : ''}
                        </div>
                        <button onclick='event.stopPropagation(); openBranchModal(${JSON.stringify(b)})'
                            class="text-blue-500 text-[11px] font-bold hover:underline flex items-center gap-1">
                            რედაქტირება →
                        </button>
                    </div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-1">${b.name}</h3>
                    <p class="text-xs text-slate-400 flex items-center gap-1 mb-4">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${b.address || '—'} ${b.branch_type ? '· ' + b.branch_type : ''}
                    </p>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-400">
                        <div>ელ-კვება: <span class="text-slate-700 font-medium">${b.power_supply_type || '—'}</span></div>
                        <div>ფართი: <span class="text-slate-700 font-medium">${b.square_meters ? b.square_meters + ' m²' : '—'}</span></div>
                        <div>მენეჯერი: <span class="text-slate-700 font-medium">${b.contact_person || '—'}</span></div>
                        <div>ტელეფონი: <span class="text-slate-700 font-medium">${b.contact_phone || '—'}</span></div>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button onclick='event.stopPropagation(); viewAssets(${JSON.stringify(b)})'
                        class="flex-1 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-600 transition">
                        აგრეგატები →
                    </button>
                    <button onclick='event.stopPropagation(); deleteData("branches", "${b.id}")'
                        class="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                </div>
            </div>

        </div>
    `).join('');

    /* მინი-რუკები */
    data.forEach((b, i) => {
        if (b.lat && b.lng) {
            const m = L.map(`bmap-${i}`, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false })
                .setView([b.lat, b.lng], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);
            L.marker([b.lat, b.lng]).addTo(m);
        }
    });

    lucide.createIcons();
}


/* ============================================================
   loadAllAssets()
   აგრეგატები ტაბი — ყველა ფილიალის აგრეგატები ცხრილად
   ============================================================ */
async function loadAllAssets() {
    const branchFilter = document.getElementById('assets-filter-branch')?.value || '';

    let query = _supabase
        .from('assets')
        .select('*, branches(name)')
        .eq('customer_id', activeCustomer.id)
        .order('name');

    if (branchFilter) query = query.eq('branch_id', branchFilter);

    const { data, error } = await query;
    const container = document.getElementById('all-assets-table');
    if (error || !data) return;

    if (data.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-300 text-center py-10 italic">აგრეგატები არ არის</div>';
        return;
    }

    container.innerHTML = `
        <table class="w-full text-xs border-collapse">
            <thead>
                <tr class="border-b border-slate-100">
                    <th class="text-left font-medium text-slate-400 py-2 px-2">დასახელება</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ფილიალი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">სტატუსი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ბოლო სერვ.</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(a => `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onclick='viewAssetFromTable(${JSON.stringify(a)})'>
                        <td class="py-2.5 px-2 font-medium text-slate-800">${a.name || '—'}</td>
                        <td class="py-2.5 px-2 text-slate-500">${a.asset_type || '—'}</td>
                        <td class="py-2.5 px-2 text-slate-500">${a.branches?.name || '—'}</td>
                        <td class="py-2.5 px-2">
                            <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                a.status === 'Operational' ? 'bg-green-100 text-green-700' :
                                a.status === 'Down'        ? 'bg-red-100 text-red-700'     :
                                                             'bg-amber-100 text-amber-700'
                            }">${a.status || '—'}</span>
                        </td>
                        <td class="py-2.5 px-2 text-slate-400">${a.last_service_date ? new Date(a.last_service_date).toLocaleDateString('ka-GE', {day:'2-digit', month:'short', year:'numeric'}) : '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* viewAssetFromTable — asset-view-ზე გადასვლა (არა service-logs) */
function viewAssetFromTable(asset) {
    activeBranch = { id: asset.branch_id, name: asset.branches?.name || '' };
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
    document.getElementById('asset-view-title').innerText = asset.branches?.name || 'აგრეგატები';
    loadAssets();
}

/* viewServiceFromTable — სერვის ლოგებზე გადასვლა ცხრილიდან */
function viewServiceFromTable(log) {
    activeBranch = { id: log.branch_id, name: log.branches?.name || '' };
    activeAsset  = { id: log.asset_id,  name: log.assets?.name   || 'სერვისი' };
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText = activeAsset.name;
    loadServiceLogs();
}


/* ============================================================
   loadAllServices()
   სერვისები ტაბი — ყველა ფილიალის სერვის ლოგები ცხრილად
   ============================================================ */
async function loadAllServices() {
    const typeFilter   = document.getElementById('services-filter-type')?.value   || '';
    const branchFilter = document.getElementById('services-filter-branch')?.value || '';

    let query = _supabase
        .from('service_logs')
        .select('*, branches(name), assets(name)')
        .eq('customer_id', activeCustomer.id)
        .order('service_date', { ascending: false });

    if (typeFilter)   query = query.eq('service_type', typeFilter);
    if (branchFilter) query = query.eq('branch_id', branchFilter);

    const { data, error } = await query;
    const container = document.getElementById('all-services-table');
    if (error || !data) return;

    if (data.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-300 text-center py-10 italic">სერვის ჩანაწერები არ არის</div>';
        return;
    }

    const typeColors = {
        'PPM':          'bg-blue-100 text-blue-700',
        'Corrective':   'bg-amber-100 text-amber-700',
        'Emergency':    'bg-red-100 text-red-700',
        'Installation': 'bg-green-100 text-green-700',
        'Repair':       'bg-purple-100 text-purple-700',
    };

    container.innerHTML = `
        <table class="w-full text-xs border-collapse">
            <thead>
                <tr class="border-b border-slate-100">
                    <th class="text-left font-medium text-slate-400 py-2 px-2">თარიღი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ტექნიკოსი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ტიპი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">ფილიალი</th>
                    <th class="text-left font-medium text-slate-400 py-2 px-2">აგრეგატი</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(s => `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                        onclick='viewServiceFromTable(${JSON.stringify(s)})'>
                        <td class="py-2.5 px-2 text-slate-500">${new Date(s.service_date).toLocaleDateString('ka-GE', {day:'2-digit', month:'short', year:'numeric'})}</td>
                        <td class="py-2.5 px-2 font-medium text-slate-800">${s.technician_name || '—'}</td>
                        <td class="py-2.5 px-2">
                            <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${typeColors[s.service_type] || 'bg-slate-100 text-slate-500'}">${s.service_type || '—'}</span>
                        </td>
                        <td class="py-2.5 px-2 text-slate-500">${s.branches?.name || '—'}</td>
                        <td class="py-2.5 px-2 text-slate-500">${s.assets?.name   || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}