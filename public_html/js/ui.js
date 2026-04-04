/* ============================================================
   BECOOL CRM — ui.js (სრული ვერსია - ნავიგაციის Fix)
   ============================================================ */

let activeCustomer = null;
let activeBranch = null;
let activeAsset = null;
let uploadedMediaUrls = [];
let modalMap = null;
let liveMap = null;

/* ── ეკრანების გადართვა ── */

function showCustomers() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    if (typeof _hideBreadcrumb === 'function') _hideBreadcrumb(); [cite: 560]
    loadCustomers(); [cite: 678]
}

function showBranches() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active'); [cite: 679]
}

function showAssets() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active'); [cite: 680]
}

/* ── ერთიანი ნავიგაცია აგრეგატის დაშბორდზე ── */

async function navigateToAsset(asset, branch = null) {
    if (!asset) return;
    
    // ვადგენთ ფილიალს
    const targetBranch = branch || activeBranch || (asset.branches ? asset.branches : null);
    if (!targetBranch) {
        console.error("ფილიალის მონაცემები ვერ მოიძებნა");
        return;
    }

    activeBranch = targetBranch;
    activeAsset = asset;

    // 1. ვამზადებთ Asset View-ს (sidebar, კატეგორიები)
    if (typeof loadAssetView === 'function') {
        await loadAssetView(targetBranch); [cite: 681]
        
        // 2. ვხსნით კონკრეტული აგრეგატის დაშბორდს
        if (typeof avOpenAsset === 'function') {
            await avOpenAsset(asset); [cite: 685]
        }
    }
}

/* აგრეგატის ბარათზე დაჭერა ID-ით (გამოიყენება api.js-ში) */
function handleAssetClick(assetId) {
    if (window._av && window._av.branchAssets) {
        const asset = window._av.branchAssets.find(x => x.id === assetId); [cite: 743]
        if (asset) {
            navigateToAsset(asset, activeBranch);
        }
    }
}

function viewAssets(b) {
    activeBranch = b;
    if (typeof _setNavBranch === 'function') _setNavBranch(b); [cite: 565]
    if (typeof loadAssetView === 'function') {
        loadAssetView(b); [cite: 681]
    }
}

async function viewServiceLogs(asset) {
    activeAsset = asset; [cite: 684]
    await navigateToAsset(asset);
    if (typeof avSwitchTab === 'function') {
        avSwitchTab('svc', null); [cite: 686]
    }
}

/* ── მოდალების მართვა (არაფერია ამოკლებული) ── */

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); [cite: 688]
    if (modalMap) { modalMap.remove(); modalMap = null; }
    if (liveMap) { liveMap.remove(); liveMap = null; }
}

function openCustomerModal(c = null) {
    const isEdit = (c !== null);
    document.getElementById('c-modal-title').innerText = isEdit ? 'კლიენტის რედაქტირება' : 'კლიენტის დამატება'; [cite: 692]
    document.getElementById('c-id').value = isEdit ? c.id : '';
    document.getElementById('c-url').value = isEdit ? (c.image_url || '') : '';
    document.getElementById('c-lat').value = isEdit ? (c.lat || '') : '';
    document.getElementById('c-lng').value = isEdit ? (c.lng || '') : '';
    document.getElementById('c-map-url').value = isEdit ? (c.map_url || '') : '';
    const type = isEdit ? (c.customer_type || 'Company') : 'Company';
    setCustomerType(type); [cite: 697]
    document.getElementById('c-status').value = isEdit ? (c.status || 'Potential') : 'Potential';
    document.getElementById('c-name').value = isEdit ? (c.name || '') : '';
    document.getElementById('c-tax').value = isEdit ? (c.tax_id || '') : '';
    document.getElementById('c-legal-address').value = isEdit ? (c.legal_address || '') : '';
    document.getElementById('c-website').value = isEdit ? (c.website || '') : '';
    document.getElementById('c-bank').value = isEdit ? (c.bank_name || '') : '';
    document.getElementById('c-account').value = isEdit ? (c.account_number || '') : '';
    setVat(isEdit ? (c.is_vat_payer || false) : false); [cite: 707]
    document.getElementById('c-modal').classList.add('active'); [cite: 715]
    lucide.createIcons();
}

function openBranchModal(b = null) {
    document.getElementById('b-modal-title').innerText = b ? 'ფილიალის რედაქტირება' : 'ფილიალის დამატება'; [cite: 716]
    document.getElementById('b-id').value = b ? b.id : '';
    document.getElementById('b-url').value = b ? (b.image_url || '') : '';
    document.getElementById('b-name').value = b ? (b.name || '') : '';
    document.getElementById('b-active').value = b ? b.is_active.toString() : 'true'; [cite: 719]
    document.getElementById('b-address').value = b ? (b.address || '') : '';
    document.getElementById('b-lat').value = b ? (b.lat || '') : '';
    document.getElementById('b-lng').value = b ? (b.lng || '') : '';
    document.getElementById('b-modal').classList.add('active'); [cite: 726]
    if (typeof initMap === 'function') initMap(b ? b.lat : 41.7151, b ? b.lng : 44.8271); [cite: 727]
}

function openAssetModal(a = null) {
    document.getElementById('a-id').value = a ? a.id : ''; [cite: 729]
    document.getElementById('a-url').value = a ? a.image_url : '';
    document.getElementById('a-name').value = a ? a.name : '';
    document.getElementById('a-type').value = a ? a.asset_type : '';
    document.getElementById('a-brand').value = a ? a.brand : '';
    document.getElementById('a-model').value = a ? a.model : '';
    document.getElementById('a-serial').value = a ? a.serial_number : '';
    document.getElementById('a-status').value = a ? a.status : 'Operational'; [cite: 733]
    try {
        document.getElementById('a-tech').value = (a && a.technical_specs) ? JSON.stringify(a.technical_specs, null, 2) : ''; [cite: 735]
    } catch(e) { document.getElementById('a-tech').value = ''; }
    document.getElementById('a-modal').classList.add('active'); [cite: 738]
    lucide.createIcons();
}

function openServiceLogModal() {
    uploadedMediaUrls = []; [cite: 740]
    document.getElementById('sl-id').value = '';
    document.getElementById('sl-tech').value = '';
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('sl-date').value = now.toISOString().slice(0, 16); [cite: 742]
    document.getElementById('sl-modal').classList.add('active');
}/* ============================================================
   BECOOL CRM — ui.js (სრული, დაუკლებელი ვერსია)
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

/* ერთიანი ფუნქცია აგრეგატის დაშბორდზე გადასვლისთვის */
async function navigateToAsset(asset, branch = null) {
    if (!asset) return;
    
    // ვპოულობთ ფილიალს
    const targetBranch = branch || activeBranch || (asset.branches ? asset.branches : null);
    
    if (!targetBranch) {
        console.error("ფილიალის მონაცემები ვერ მოიძებნა");
        return;
    }

    activeBranch = targetBranch;
    activeAsset = asset;

    // 1. ვამზადებთ Asset View-ს (sidebar, კატეგორიები და ა.შ.)
    if (typeof loadAssetView === 'function') {
        await loadAssetView(targetBranch);
        
        // 2. ვხსნით კონკრეტულ აგრეგატს
        if (typeof avOpenAsset === 'function') {
            await avOpenAsset(asset);
        }
    }
}

/* აგრეგატის ბარათზე დაჭერა ID-ით */
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

/* ── მოდალების მართვა (ყველა ველი შენარჩუნებულია) ── */

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
    
    document.getElementById('c-address-result').classList.add('hidden');
    document.getElementById('c-person-address-result').classList.add('hidden');
    
    if (isEdit && c.actual_address) {
        const isComp = (type === 'Company');
        document.getElementById(isComp ? 'c-address-result' : 'c-person-address-result').classList.remove('hidden');
        document.getElementById(isComp ? 'c-address-result-text' : 'c-person-address-result-text').innerText = c.actual_address;
    }

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
    document.getElementById('b-building').value = b ? (b.building_type || '') : '';
    document.getElementById('b-priority').value = b ? (b.service_priority || 'Standard') : 'Standard';
    document.getElementById('b-address').value = b ? (b.address || '') : '';
    document.getElementById('b-lat').value = b ? (b.lat || '') : '';
    document.getElementById('b-lng').value = b ? (b.lng || '') : '';
    document.getElementById('b-power').value = b ? (b.power_supply_type || '') : '';
    document.getElementById('b-refrig').value = b ? (b.refrigeration_type || '') : '';
    document.getElementById('b-sqm').value = b ? (b.square_meters || '') : '';
    document.getElementById('b-year').value = b ? (b.year_built || '') : '';
    document.getElementById('b-hours').value = b ? (b.working_hours || '') : '';
    document.getElementById('b-access').value = b ? (b.access_code || '') : '';
    document.getElementById('b-parking').value = b ? (b.parking_details || '') : '';
    document.getElementById('b-pers').value = b ? (b.contact_person || '') : '';
    document.getElementById('b-phon').value = b ? (b.contact_phone || '') : '';
    document.getElementById('b-emerg-contact').value = b ? (b.emergency_contact || '') : '';
    document.getElementById('b-emerg-phone').value = b ? (b.emergency_phone || '') : '';
    document.getElementById('b-after-contact').value = b ? (b.after_hours_contact || '') : '';
    document.getElementById('b-after-phone').value = b ? (b.after_hours_phone || '') : '';
    document.getElementById('b-freq').value = b ? (b.service_frequency || 'Quarterly') : 'Quarterly';
    document.getElementById('b-contract-type').value = b ? (b.contract_type || 'Full') : 'Full';
    document.getElementById('b-sla').value = b ? String(b.sla_response_hours || 4) : '4';
    document.getElementById('b-contract-start').value = b ? (b.contract_start || '') : '';
    document.getElementById('b-contract-end').value = b ? (b.contract_end || '') : '';
    document.getElementById('b-notes').value = b ? (b.notes || '') : '';

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
    document.getElementById('a-category').value = a ? a.category : 'AC';
    document.getElementById('a-tag').value = a ? a.tag_number : '';
    document.getElementById('a-brand').value = a ? a.brand : '';
    document.getElementById('a-model').value = a ? a.model : '';
    document.getElementById('a-serial').value = a ? a.serial_number : '';
    document.getElementById('a-year').value = a ? a.manufacture_year : '';
    document.getElementById('a-capacity').value = a ? a.cooling_capacity_kw : '';
    document.getElementById('a-refr-type').value = a ? a.refrigerant_type : '';
    document.getElementById('a-refr-charge').value = a ? a.refrigerant_charge_kg : '';
    document.getElementById('a-voltage').value = a ? a.voltage : 400;
    document.getElementById('a-phase').value = a ? a.phase : '3-Phase';
    document.getElementById('a-current').value = a ? a.max_current_amp : '';
    document.getElementById('a-loc').value = a ? a.location_on_site : '';
    document.getElementById('a-inst-date').value = a ? a.installation_date : '';
    document.getElementById('a-warn-date').value = a ? a.warranty_until : '';
    document.getElementById('a-status').value = a ? a.status : 'Operational';
    document.getElementById('a-score').value = a ? a.condition_score : 10;
    document.getElementById('a-qr').value = a ? a.qr_code_id : '';
    document.getElementById('a-iot').value = a ? a.iot_device_id : '';
    document.getElementById('a-interval').value = a ? a.service_interval_days : 180;
    document.getElementById('a-last-serv').value = a ? a.last_service_date : '';
    document.getElementById('a-manual').value = a ? a.manual_url : '';
    document.getElementById('a-wiring').value = a ? a.wiring_diagram_url : '';

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
