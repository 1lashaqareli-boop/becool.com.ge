/* ============================================================
   BECOOL CRM — ui.js
   აქ არის ყველა UI ლოგიკა:
   - ეკრანებს შორის გადართვა (customers → branches → assets...)
   - მოდალური ფანჯრების გახსნა და დახურვა
   - ფორმების შევსება რედაქტირებისას
   ============================================================ */


/* ============================================================
   ნავიგაცია: ეკრანებს შორის გადართვა
   ============================================================ */

/* showCustomers() — კლიენტების ეკრანზე დაბრუნება */
function showCustomers() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    loadCustomers(); /* კლიენტების სიის განახლება */
}

/* showBranches() — ფილიალების ეკრანზე დაბრუნება */
function showBranches() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('branch-view').classList.add('active');
}

/* showAssets() — აგრეგატების ეკრანზე დაბრუნება */
function showAssets() {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
}

/* viewBranches(c) — branch_ui.js-შია */

/* viewAssets(b) — ფილიალის ბარათიდან აგრეგატებზე გადასვლა
   b = ფილიალის ობიექტი */
function viewAssets(b) {
    activeBranch = b; /* გლობალური ცვლადის განახლება */
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('asset-view').classList.add('active');
    document.getElementById('asset-view-title').innerText = b.name; /* სათაური */
    loadAssets();
}

/* viewServiceLogs(asset) — აგრეგატიდან სერვის ლოგებზე გადასვლა
   asset = აგრეგატის ობიექტი */
async function viewServiceLogs(asset) {
    activeAsset = asset; /* გლობალური ცვლადის განახლება */
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('service-logs-view').classList.add('active');
    document.getElementById('service-view-title').innerText = asset.name; /* სათაური */
    loadServiceLogs();
}


/* ============================================================
   closeModals() — ყველა მოდალური ფანჯრის დახურვა
   რუკებიც იშლება რომ მეხსიერება გაათავისუფლოს
   ============================================================ */
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    /* მოდალის რუკა გასუფთავება */
    if (modalMap)  { modalMap.remove();  modalMap  = null; }
    /* ლაივ რუკა გასუფთავება */
    if (liveMap)   { liveMap.remove();   liveMap   = null; }
}


/* ============================================================
   openCustomerModal(c)
   კლიენტის დამატება / რედაქტირების მოდალის გახსნა.
   c = კლიენტის ობიექტი (null = ახალი კლიენტი)
   ============================================================ */
function openCustomerModal(c = null) {
    const isEdit = (c !== null);

    /* მოდალის სათაური */
    document.getElementById('c-modal-title').innerText = isEdit
        ? 'კლიენტის რედაქტირება'
        : 'კლიენტის დამატება';

    /* ფარული ველები */
    document.getElementById('c-id').value      = isEdit ? c.id             : '';
    document.getElementById('c-url').value     = isEdit ? (c.image_url||'') : '';
    document.getElementById('c-lat').value     = isEdit ? (c.lat      ||'') : '';
    document.getElementById('c-lng').value     = isEdit ? (c.lng      ||'') : '';
    document.getElementById('c-map-url').value = isEdit ? (c.map_url  ||'') : '';

    /* კლიენტის ტიპი */
    const type = isEdit ? (c.customer_type || 'Company') : 'Company';
    setCustomerType(type);

    /* სტატუსი, სფერო, ზომა */
    document.getElementById('c-status').value       = isEdit ? (c.status       ||'Potential') : 'Potential';
    document.getElementById('c-industry').value     = isEdit ? (c.industry     ||'')          : '';
    document.getElementById('c-company-size').value = isEdit ? (c.company_size ||'')          : '';

    /* შპს ველები */
    document.getElementById('c-name').value          = isEdit && type==='Company' ? (c.name          ||'') : '';
    document.getElementById('c-tax').value           = isEdit && type==='Company' ? (c.tax_id        ||'') : '';
    document.getElementById('c-legal-address').value = isEdit ? (c.legal_address ||'') : '';
    document.getElementById('c-website').value       = isEdit ? (c.website       ||'') : '';
    document.getElementById('c-bank').value          = isEdit ? (c.bank_name     ||'') : '';
    document.getElementById('c-account').value       = isEdit ? (c.account_number||'') : '';

    /* ფიზიკური პირის ველები */
    document.getElementById('c-person-name').value    = isEdit && type==='Person' ? (c.name   ||'') : '';
    document.getElementById('c-person-tax').value     = isEdit && type==='Person' ? (c.tax_id ||'') : '';
    document.getElementById('c-person-bank').value    = isEdit ? (c.bank_name     ||'') : '';
    document.getElementById('c-person-account').value = isEdit ? (c.account_number||'') : '';

    /* დღგ */
    setVat(isEdit ? (c.is_vat_payer || false) : false);

    /* მისამართის result ველების გასუფთავება */
    document.getElementById('c-address-result').classList.add('hidden');
    document.getElementById('c-person-address-result').classList.add('hidden');

    /* რედაქტირებისას ძველი მისამართის ჩვენება */
    if (isEdit && c.actual_address) {
        const isComp = (type === 'Company');
        document.getElementById(isComp ? 'c-address-result'        : 'c-person-address-result').classList.remove('hidden');
        document.getElementById(isComp ? 'c-address-result-text'   : 'c-person-address-result-text').innerText = c.actual_address;
        document.getElementById(isComp ? 'c-address-result-link'   : 'c-person-address-result-link').innerText = c.map_url || '';
    }

    /* საკონტაქტო პირები */
    document.getElementById('c-contact1-name').value  = isEdit ? (c.contact_person_1||'') : '';
    document.getElementById('c-contact1-pos').value   = isEdit ? (c.position_1      ||'') : '';
    document.getElementById('c-contact1-email').value = isEdit ? (c.email_1         ||'') : '';
    document.getElementById('c-contact1-phone').value = isEdit ? (c.phone_1         ||'') : '';
    document.getElementById('c-contact2-name').value  = isEdit ? (c.contact_person_2||'') : '';
    document.getElementById('c-contact2-pos').value   = isEdit ? (c.position_2      ||'') : '';
    document.getElementById('c-contact2-email').value = isEdit ? (c.email_2         ||'') : '';
    document.getElementById('c-contact2-phone').value = isEdit ? (c.phone_2         ||'') : '';

    /* ზოგადი */
    document.getElementById('c-phone').value = isEdit ? (c.phone       ||'') : '';
    document.getElementById('c-rate').value  = isEdit ? (c.hourly_rate || 0) : 0;
    document.getElementById('c-notes').value = isEdit ? (c.notes       ||'') : '';

    /* ფოტოს პრევიუ */
    const prev = document.getElementById('c-prev');
    if (isEdit && c.image_url) {
        prev.src = c.image_url;
        prev.classList.remove('hidden');
        document.getElementById('c-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden');
        document.getElementById('c-placeholder').classList.remove('hidden');
    }

    document.getElementById('c-modal').classList.add('active');
    lucide.createIcons();
}


/* ============================================================
   openBranchModal(b)
   ფილიალის დამატება / რედაქტირების მოდალის გახსნა.
   b = ფილიალის ობიექტი (null თუ ახალია)
   ============================================================ */
function openBranchModal(b = null) {
    document.getElementById('b-modal-title').innerText = b ? 'ფილიალის რედაქტირება' : 'ფილიალის დამატება';
    document.getElementById('b-id').value  = b ? b.id         : '';
    document.getElementById('b-url').value = b ? (b.image_url || '') : '';

    /* სექცია 1 */
    document.getElementById('b-name').value     = b ? (b.name             || '') : '';
    document.getElementById('b-active').value   = b ? b.is_active.toString()     : 'true';
    document.getElementById('b-type').value     = b ? (b.branch_type      || 'Commercial') : 'Commercial';
    document.getElementById('b-building').value = b ? (b.building_type    || '') : '';
    document.getElementById('b-priority').value = b ? (b.service_priority || 'Standard')   : 'Standard';

    /* სექცია 2: მდებარეობა */
    document.getElementById('b-address').value    = b ? (b.address    || '') : '';
    document.getElementById('b-lat').value        = b ? (b.lat        || '') : '';
    document.getElementById('b-lng').value        = b ? (b.lng        || '') : '';
    document.getElementById('b-floor-zone').value = b ? (b.floor_zone || 'Ground') : 'Ground';

    /* სექცია 3: ტექნიკური */
    document.getElementById('b-power').value  = b ? (b.power_supply_type  || '') : '';
    document.getElementById('b-refrig').value = b ? (b.refrigeration_type || '') : '';
    document.getElementById('b-sqm').value    = b ? (b.square_meters      || '') : '';
    document.getElementById('b-year').value   = b ? (b.year_built         || '') : '';
    document.getElementById('b-hours').value  = b ? (b.working_hours      || '') : '';
    document.getElementById('b-access').value = b ? (b.access_code        || '') : '';
    document.getElementById('b-parking').value= b ? (b.parking_details    || '') : '';

    /* სექცია 4: კონტაქტები */
    document.getElementById('b-pers').value          = b ? (b.contact_person     || '') : '';
    document.getElementById('b-phon').value          = b ? (b.contact_phone      || '') : '';
    document.getElementById('b-emerg-contact').value = b ? (b.emergency_contact  || '') : '';
    document.getElementById('b-emerg-phone').value   = b ? (b.emergency_phone    || '') : '';
    document.getElementById('b-after-contact').value = b ? (b.after_hours_contact|| '') : '';
    document.getElementById('b-after-phone').value   = b ? (b.after_hours_phone  || '') : '';

    /* სექცია 5: ხელშეკრულება */
    document.getElementById('b-freq').value           = b ? (b.service_frequency  || 'Quarterly') : 'Quarterly';
    document.getElementById('b-contract-type').value  = b ? (b.contract_type      || 'Full')      : 'Full';
    document.getElementById('b-sla').value            = b ? String(b.sla_response_hours || 4)      : '4';
    document.getElementById('b-contract-start').value = b ? (b.contract_start     || '') : '';
    document.getElementById('b-contract-end').value   = b ? (b.contract_end       || '') : '';

    /* სექცია 6 */
    document.getElementById('b-notes').value = b ? (b.notes || '') : '';

    /* ფოტო */
    const prev = document.getElementById('b-prev');
    if (b && b.image_url) {
        prev.src = b.image_url;
        prev.classList.remove('hidden');
        document.getElementById('b-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden');
        document.getElementById('b-placeholder').classList.remove('hidden');
    }

    document.getElementById('b-modal').classList.add('active');
    initMap(b ? b.lat : 41.7151, b ? b.lng : 44.8271);
}


/* ============================================================
   openAssetModal(a)
   აგრეგატის დამატება / რედაქტირების მოდალის გახსნა.
   a = აგრეგატის ობიექტი (null თუ ახალია)
   ============================================================ */
function openAssetModal(a = null) {
    document.getElementById('a-id').value  = a ? a.id        : '';
    document.getElementById('a-url').value = a ? a.image_url : '';

    document.getElementById('a-name').value       = a ? a.name               : '';
    document.getElementById('a-type').value       = a ? a.asset_type         : '';
    document.getElementById('a-category').value   = a ? a.category           : 'AC';
    document.getElementById('a-tag').value        = a ? a.tag_number         : '';
    document.getElementById('a-brand').value      = a ? a.brand              : '';
    document.getElementById('a-model').value      = a ? a.model              : '';
    document.getElementById('a-serial').value     = a ? a.serial_number      : '';
    document.getElementById('a-year').value       = a ? a.manufacture_year   : '';
    document.getElementById('a-capacity').value   = a ? a.cooling_capacity_kw : '';
    document.getElementById('a-refr-type').value  = a ? a.refrigerant_type   : '';
    document.getElementById('a-refr-charge').value = a ? a.refrigerant_charge_kg : '';
    document.getElementById('a-voltage').value    = a ? a.voltage            : 400;
    document.getElementById('a-phase').value      = a ? a.phase              : '3-Phase';
    document.getElementById('a-current').value    = a ? a.max_current_amp    : '';
    document.getElementById('a-loc').value        = a ? a.location_on_site   : '';
    document.getElementById('a-inst-date').value  = a ? a.installation_date  : '';
    document.getElementById('a-warn-date').value  = a ? a.warranty_until     : '';
    document.getElementById('a-status').value     = a ? a.status             : 'Operational';
    document.getElementById('a-score').value      = a ? a.condition_score    : 10;
    document.getElementById('a-qr').value         = a ? a.qr_code_id         : '';
    document.getElementById('a-iot').value        = a ? a.iot_device_id      : '';
    document.getElementById('a-interval').value   = a ? a.service_interval_days : 180;
    document.getElementById('a-last-serv').value  = a ? a.last_service_date  : '';
    document.getElementById('a-tech').value       = a ? JSON.stringify(a.technical_specs) : '';
    document.getElementById('a-manual').value     = a ? a.manual_url         : '';
    document.getElementById('a-wiring').value     = a ? a.wiring_diagram_url : '';

    /* ფოტოს პრევიუ */
    const prev = document.getElementById('a-prev');
    if (a && a.image_url) {
        prev.src = a.image_url;
        prev.classList.remove('hidden');
        document.getElementById('a-placeholder').classList.add('hidden');
    } else {
        prev.classList.add('hidden');
        document.getElementById('a-placeholder').classList.remove('hidden');
    }

    document.getElementById('a-modal').classList.add('active');
    lucide.createIcons();
}


/* ============================================================
   openServiceLogModal()
   ახალი სერვის ლოგის მოდალის გახსნა.
   ყოველთვის ახალია — რედაქტირება არ არის.
   ============================================================ */
function openServiceLogModal() {
    uploadedMediaUrls = []; /* მედია სიის გასუფთავება */

    document.getElementById('sl-id').value   = '';
    document.getElementById('sl-tech').value = '';

    /* თარიღი ავტომატურად — ამჟამინდელი */
    document.getElementById('sl-date').value = new Date().toISOString().slice(0, 16);

    /* მედია პრევიუს გასუფთავება */
    document.getElementById('sl-media-preview').innerHTML = '';

    document.getElementById('sl-modal').classList.add('active');
}