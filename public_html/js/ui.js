/* ============================================================
   BECOOL CRM — ui.js
   ============================================================ */

/* ------------------------------------------------------------
   DOM-ის სრული ჩატვირთვის შემდეგ
   ------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    initSupabase();
    attachEventListeners();
    lucide.createIcons();
    loadCustomers();
    loadBranches();
});


/* ------------------------------------------------------------
   Event Listeners
   ------------------------------------------------------------ */
function attachEventListeners() {
    const modals = document.querySelectorAll('.modal-view');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-view') || e.target.closest('.modal-close')) {
                closeModals();
            }
        });
    });
}


/* ------------------------------------------------------------
   მთავარი მოდალების დახურვა
   ------------------------------------------------------------ */
function closeModals() {
    const modals = document.querySelectorAll('.modal-view');
    modals.forEach(m => m.classList.remove('active'));
    document.getElementById('c-file').value = '';
    document.getElementById('b-file').value = '';
}


/* ============================================================
   Customers
   ============================================================ */

/* ------------------------------------------------------------
   viewCustomer
   ------------------------------------------------------------ */
function viewCustomer(c) {
    activeCustomer = c;
    document.getElementById('customer-view').classList.add('active');
    document.getElementById('main-view').classList.remove('active');
    
    // Add back button if it doesn't exist
    if (!document.getElementById('back-to-customers-btn')) {
        const backBtn = document.createElement('button');
        backBtn.id = 'back-to-customers-btn';
        backBtn.onclick = backToCustomers;
        backBtn.className = 'text-blue-600 font-black mb-6 hover:underline flex items-center gap-2 group text-xs uppercase tracking-widest';
        backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:-translate-x-1 transition' + '><polyline points="15 18 9 12 15 6"/></svg> უკან მომხმარებლებში';
        document.getElementById('customer-header').prepend(backBtn);
    }

    fillCustomerHeader(c);
    loadCustomerServices(c.id);
    loadCustomerBranches(c.id);
}

/* ------------------------------------------------------------
   backToCustomers
   ------------------------------------------------------------ */
function backToCustomers() {
    document.getElementById('customer-view').classList.remove('active');
    document.getElementById('main-view').classList.add('active');
}


/* ------------------------------------------------------------
   fillCustomerHeader
   ------------------------------------------------------------ */
function fillCustomerHeader(c) {
    document.getElementById('ch-img').src = c.image_url ? c.image_url : 'img/c-placeholder.svg';
    document.getElementById('ch-name').innerText = c.name;
    document.getElementById('ch-type').innerText = c.customer_type;
    document.getElementById('ch-status').innerText = c.status;
    document.getElementById('ch-status').className = 'status-' + c.status.toLowerCase();
    const editBtn = document.getElementById('ch-edit');
    editBtn.onclick = () => openCustomerModal(c);
    document.getElementById('ch-rate').innerText = c.hourly_rate + ' GEL';
}


/* ------------------------------------------------------------
   loadCustomers
   ------------------------------------------------------------ */
async function loadCustomers() {
    const { data, error } = await _supabase.from('customers').select('*');
    if (error) {
        console.error(error);
        return;
    }
    customers = data;
    renderCustomers(customers);
}


/* ------------------------------------------------------------
   renderCustomers
   ------------------------------------------------------------ */
function renderCustomers(data) {
    const list = document.getElementById('customer-list');
    list.innerHTML = '';
    data.forEach(c => {
        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <img src="${c.image_url ? c.image_url : 'img/c-placeholder.svg'}" class="w-12 h-12 rounded-full mr-4">
            <div class="flex-1">
                <div class="font-bold">${c.name}</div>
                <div class="text-xs text-gray-500">${c.customer_type}</div>
            </div>
            <div class="status-${c.status ? c.status.toLowerCase() : ''}">${c.status}</div>
        `;
        div.onclick = () => viewCustomer(c);
        list.appendChild(div);
    });
}



/* ============================================================
   Branches
   ============================================================ */

/* ------------------------------------------------------------
   viewBranch
   ------------------------------------------------------------ */
function viewBranch(b) {
    activeBranch = b;
    document.getElementById('branch-view').classList.add('active');
    document.getElementById('main-view').classList.remove('active');
    fillBranchHeader(b);
    // loadBranchServices(b.id);
}


/* ------------------------------------------------------------
   fillBranchHeader
   ------------------------------------------------------------ */
function fillBranchHeader(b) {
    document.getElementById('bh-img').src = b.image_url ? b.image_url : 'img/b-placeholder.svg';
    document.getElementById('bh-name').innerText = b.name;
    document.getElementById('bh-address').innerText = b.address;
    const editBtn = document.getElementById('bh-edit');
    editBtn.onclick = () => openBranchModal(b);
}


/* ------------------------------------------------------------
   loadBranches
   ------------------------------------------------------------ */
async function loadBranches() {
    const { data, error } = await _supabase.from('branches').select('*');
    if (error) {
        console.error(error);
        return;
    }
    branches = data;
    renderBranches(branches);
}


/* ------------------------------------------------------------
   renderBranches
   ------------------------------------------------------------ */
function renderBranches(data) {
    const list = document.getElementById('branch-list');
    list.innerHTML = '';
    data.forEach(b => {
        const div = document.createElement('div');
        div.className = 'branch-item';
        div.innerHTML = `
            <img src="${b.image_url ? b.image_url : 'img/b-placeholder.svg'}" class="w-16 h-16 rounded-xl mr-4">
            <div class="flex-1">
                <div class="font-bold">${b.name}</div>
                <div class="text-sm text-gray-500">${b.address}</div>
            </div>
            <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm" onclick="event.stopPropagation(); viewBranchDashboard(b);">
                დეტალები
            </button>
        `;
        div.onclick = () => openBranchModal(b);
        list.appendChild(div);
    });
}


/* ============================================================
   Customer View
   ============================================================ */

/* ------------------------------------------------------------
   viewService
   ------------------------------------------------------------ */
function viewService(s) {
    console.log('viewService', s);
    // TODO: Implement service view
}

/* ------------------------------------------------------------
   loadCustomerServices
   ------------------------------------------------------------ */
async function loadCustomerServices(customerId) {
    const { data, error } = await _supabase
        .from('services')
        .select('*, branches(*)')
        .eq('customer_id', customerId)
        .order('service_date', { ascending: false });
    if (error) {
        console.error(error);
        return;
    }
    renderCustomerServices(data);
}

/* ------------------------------------------------------------
   renderCustomerServices
   ------------------------------------------------------------ */
function renderCustomerServices(data) {
    const list = document.getElementById('cv-services');
    list.innerHTML = '';
    if (data.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-center p-8">მომსახურებები არ არის</div>';
        return;
    }
    data.forEach(s => {
        const div = document.createElement('div');
        div.className = 'cv-service';
        div.innerHTML = `
            <div class="font-bold">${s.branches.name}</div>
            <div class="text-xs text-gray-500">${s.service_date}</div>
            <div class="font-bold text-blue-600">${s.total_price} GEL</div>
        `;
        div.onclick = () => viewService(s);
        list.appendChild(div);
    });
}


/* ------------------------------------------------------------
   loadCustomerBranches
   ------------------------------------------------------------ */
async function loadCustomerBranches(customerId) {
    const { data, error } = await _supabase
        .from('customer_branches')
        .select('*, branches(*)')
        .eq('customer_id', customerId);
    if (error) {
        console.error(error);
        return;
    }
    renderCustomerBranches(data);
}


/* ------------------------------------------------------------
   renderCustomerBranches
   ------------------------------------------------------------ */
function renderCustomerBranches(data) {
    const list = document.getElementById('cv-branches');
    list.innerHTML = '';
    if (data.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-center p-8">ფილიალები არ არის</div>';
        return;
    }
    data.forEach(cb => {
        const b = cb.branches;
        const div = document.createElement('div');
        div.className = 'cv-branch';
        div.innerHTML = `
            <img src="${b.image_url ? b.image_url : 'img/b-placeholder.svg'}" class="w-12 h-12 rounded-xl mr-4">
            <div class="flex-1">
                <div class="font-bold">${b.name}</div>
                <div class="text-xs text-gray-500">${b.address}</div>
            </div>
        `;
        div.onclick = () => viewBranchDashboard(b);
        list.appendChild(div);
    });
}
