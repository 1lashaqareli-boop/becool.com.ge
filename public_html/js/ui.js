/* ============================================================
   BECOOL CRM — ui.js (COMPLETE SYNCHRONIZED VERSION)
   ============================================================ */

let activeCustomer = null;
let activeBranch = null;
let activeAsset = null;
let uploadedMediaUrls = [];
let modalMap = null;
let liveMap = null;

/* ── ნავიგაცია ── */

function showCustomers() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    if (typeof _hideBreadcrumb === 'function') _hideBreadcrumb();
    loadCustomers();
}

function showBranches() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
}

function showAssets() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
}

/* ერთიანი ფუნქცია ნებისმიერი ადგილიდან აგრეგატის დაშბორდზე გადასასვლელად */
async function navigateToAsset(asset, branch = null) {
    if (!asset) return;
    const targetBranch = branch || activeBranch || (asset.branches ? asset.branches : null);
    
    activeBranch = targetBranch;
    activeAsset = asset;

    if (typeof loadAssetView === 'function') {
        await loadAssetView(targetBranch);
        if (typeof avOpenAsset === 'function') {
            await avOpenAsset(asset);
        }
    }
}

/* აგრეგატის ბარათზე დაჭერის დამუშავება ID-ით (api.js-ისთვის) */
function handleAssetClick(assetId) {
    if (window._av && window._av.branchAssets) {
        const asset = window._av.branchAssets.find(x => x.id === assetId);
        if (asset) {
            navigateToAsset(asset, activeBranch);
        }
    }
}

function viewAssets(b) {
    activeBranch = b;
    if (typeof _setNavBranch === 'function') _setNavBranch(b);
    if (typeof loadAssetView === 'function') {
        loadAssetView(b);
    }
}

async function viewServiceLogs(asset) {
    activeAsset = asset;
    await navigateToAsset(asset);
    if (typeof avSwitchTab === 'function') {
        avSwitchTab('svc', null);
    }
}

/* ── მოდალები (ყველა ორიგინალი ველით [cite: 1434-1486]) ── */

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    if (typeof modalMap !== 'undefined' && modalMap) { modalMap.remove(); modalMap = null; }
    if (typeof liveMap !== 'undefined' && liveMap) { liveMap.remove(); liveMap = null; }
}

function openCustomerModal(c = null) {
    const isEdit = (c !== null);
    document.getElementById('c-modal-title').innerText = isEdit ? 'კლიენტის რედაქტირება' : 'კლიენტის დამატება';
    document.getElementById('c-id').value = isEdit ? c.id : '';
    document.getElementById('c-url').value = isEdit ? (c.image_url || '') : '';
    document.getElementById('c-lat').value = isEdit ? (c.lat || '') : '';
    document.getElementById('c-lng').value = isEdit ? (c.lng || '') : '';
    document.getElementById('c-map-url').value = isEdit ? (c.map_url || '') : '';

    const type = isEdit ? (c.customer_type || 'Company') : 'Company';
    setCustomerType(type);

    document.getElementById('c-status').value = isEdit ? (c.status || 'Potential') : 'Potential';
    document.getElementById('c-industry').value = isEdit ? (c.industry || '') : '';
    document.getElementById('c-company-size').value = isEdit ? (c.company_size || '') : '';
    document.getElementById('c-name').value = isEdit ? (c.name || '') : '';
    document.getElementById('c-tax').value = isEdit ? (c.tax_id || '') : '';
    document.getElementById('c-legal-address').value = isEdit ? (c.legal_address || '') : '';
    document.getElementById('c-website').value = isEdit ? (c.website || '') : '';
    document.getElementById('c-bank').value = isEdit ? (c.bank_name || '') : '';
    document.getElementById('c-account').value = isEdit ? (c.account_number || '') : '';
    document.getElementById('c-person-name').value = isEdit && type === 'Person' ? (c.name || '') : '';
    document.getElementById('c-person-tax').value = isEdit && type === 'Person' ? (c.tax_id || '') : '';

    setVat(isEdit ? (c.is_vat_payer || false) : false);

    document.getElementById('c-contact1-name').value = isEdit ? (c.contact_person_1 || '') : '';
    document.getElementById('c-contact1-pos').value = isEdit ? (c.position_1 || '') : '';
    document.getElementById('c-contact1-email').value = isEdit ? (c.email_1 || '') : '';
    document.getElementById('c-contact1-phone').value = isEdit ? (c.phone_1 || '') : '';
    document.getElementById('c-phone').value = isEdit ? (c.phone || '') : '';
    document.getElementById('c-rate').value = isEdit ? (c.hourly_rate || 0) : 0;
    document.getElementById('c-notes').value = isEdit ? (c.notes || '') : '';

    const prev = document.getElementById('c-prev');
    if (isEdit && c.image_url) {
        prev.src = c.image_url; prev.classList.remove('hidden');
        document.getElementById('c-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden'); document.getElementById('c-placeholder').classList.remove('hidden');
    }
    document.getElementById('c-modal').classList.add('active');
    lucide.createIcons();
}

function openBranchModal(b = null) {
    document.getElementById('b-modal-title').innerText = b ? 'ფილიალის რედაქტირება' : 'ფილიალის დამატება';
    document.getElementById('b-id').value = b ? b.id : '';
    document.getElementById('b-url').value = b ? (b.image_url || '') : '';
    document.getElementById('b-name').value = b ? (b.name || '') : '';
    document.getElementById('b-active').value = b ? b.is_active.toString() : 'true';
    document.getElementById('b-type').value = b ? (b.branch_type || 'Commercial') : 'Commercial';
    document.getElementById('b-priority').value = b ? (b.service_priority || 'Standard') : 'Standard';
    document.getElementById('b-address').value = b ? (b.address || '') : '';
    document.getElementById('b-lat').value = b ? (b.lat || '') : '';
    document.getElementById('b-lng').value = b ? (b.lng || '') : '';
    document.getElementById('b-pers').value = b ? (b.contact_person || '') : '';
    document.getElementById('b-phon').value = b ? (b.contact_phone || '') : '';

    const prev = document.getElementById('b-prev');
    if (b && b.image_url) {
        prev.src = b.image_url; prev.classList.remove('hidden');
        document.getElementById('b-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden'); document.getElementById('b-placeholder').classList.remove('hidden');
    }
    document.getElementById('b-modal').classList.add('active');
    if (typeof initMap === 'function') initMap(b ? b.lat : 41.7151, b ? b.lng : 44.8271);
}

function openAssetModal(a = null) {
    document.getElementById('a-id').value = a ? a.id : '';
    document.getElementById('a-url').value = a ? a.image_url : '';
    document.getElementById('a-name').value = a ? a.name : '';
    document.getElementById('a-type').value = a ? a.asset_type : '';
    document.getElementById('a-brand').value = a ? a.brand : '';
    document.getElementById('a-model').value = a ? a.model : '';
    document.getElementById('a-serial').value = a ? a.serial_number : '';
    document.getElementById('a-status').value = a ? a.status : 'Operational';
    document.getElementById('a-score').value = a ? a.condition_score : 10;
    try {
        document.getElementById('a-tech').value = (a && a.technical_specs) ? JSON.stringify(a.technical_specs, null, 2) : '';
    } catch(e) { document.getElementById('a-tech').value = ''; }

    const prev = document.getElementById('a-prev');
    if (a && a.image_url) {
        prev.src = a.image_url; prev.classList.remove('hidden');
        document.getElementById('a-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden'); document.getElementById('a-placeholder').classList.remove('hidden');
    }
    document.getElementById('a-modal').classList.add('active');
    lucide.createIcons();
}

function openServiceLogModal() {
    uploadedMediaUrls = [];
    document.getElementById('sl-id').value = '';
    document.getElementById('sl-tech').value = '';
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('sl-date').value = now.toISOString().slice(0, 16);
    document.getElementById('sl-media-preview').innerHTML = '';
    document.getElementById('sl-modal').classList.add('active');
}
