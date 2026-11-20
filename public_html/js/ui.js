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
    activeBranch = b;
    loadAssetView(b);  // ← asset_view.js-ის ფუნქცია
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
function openAssetModal(a = null) {
    /* a.id არსებობს → რედაქტირება; სხვა შემთხვევაში → ახალი აგრეგატი.
       a შეიძლება იყოს მხოლოდ { asset_type: 'Split' } — წინასწარ არჩეული ტიპი */
    const src = a || {};
    const g   = (key, def = '') => src[key] ?? def;
    const set = (id, v) => { document.getElementById(id).value = v; };

    set('a-id',          g('id'));
    set('a-url',         g('image_url'));
    set('a-name',        g('name'));
    set('a-type',        g('asset_type'));
    set('a-category',    g('category', src.asset_type === 'Generator' ? 'Energy' : 'AC'));
    set('a-tag',         g('tag_number'));
    set('a-brand',       g('brand'));
    set('a-model',       g('model'));
    set('a-serial',      g('serial_number'));
    set('a-year',        g('manufacture_year'));
    set('a-capacity',    g('cooling_capacity_kw'));
    set('a-refr-type',   g('refrigerant_type'));
    set('a-refr-charge', g('refrigerant_charge_kg'));
    set('a-voltage',     g('voltage', 400));
    set('a-phase',       g('phase', '3-Phase'));
    set('a-current',     g('max_current_amp'));
    set('a-loc',         g('location_on_site'));
    set('a-inst-date',   g('installation_date'));
    set('a-warn-date',   g('warranty_until'));
    set('a-status',      g('status', 'Operational'));
    set('a-score',       g('condition_score', 10));
    set('a-qr',          g('qr_code_id'));
    set('a-iot',         g('iot_device_id'));
    set('a-interval',    g('service_interval_days', 180));
    set('a-last-serv',   g('last_service_date'));
    set('a-tech',        src.technical_specs ? JSON.stringify(src.technical_specs) : '');
    set('a-manual',      g('manual_url'));
    set('a-wiring',      g('wiring_diagram_url'));

    /* წინა მოდალში არჩეული ფაილის გასუფთავება */
    document.getElementById('a-file').value = '';

    /* ფოტოს პრევიუ */
    const prev = document.getElementById('a-prev');
    if (src.image_url) {
        prev.src = src.image_url;
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
/* ============================================================
   სერვისის ფორმა — ერთი ფუნქცია ახალისთვისაც და რედაქტირებისთვისაც
   ============================================================ */

/* ISO დრო (ბაზიდან) → datetime-local ველის ფორმატი, ადგილობრივი დროით */
function _toLocalInput(iso) {
    const d = iso ? new Date(iso) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

/* ფორმის შევსება: log = ჩანაწერი (რედაქტირება) ან {} (ახალი) */
function _fillServiceForm(log) {
    const v   = (key, def = '') => log[key] ?? def;
    const set = (id, val) => { document.getElementById(id).value = val; };
    const chk = (id, val) => { document.getElementById(id).checked = !!val; };

    set('sl-id',          v('id'));
    set('sl-tech',        v('technician_name'));
    set('sl-date',        _toLocalInput(log.service_date));
    set('sl-type',        v('service_type', document.getElementById('sl-type').options[0]?.value || ''));
    set('sl-desc',        v('job_description'));
    set('sl-suction-p',   v('suction_pressure'));
    set('sl-disch-p',     v('discharge_pressure'));
    set('sl-suction-t',   v('suction_temp'));
    set('sl-disch-t',     v('discharge_temp'));
    set('sl-sh',          v('superheat'));
    set('sl-sc',          v('subcooling'));
    set('sl-amb',         v('ambient_temp'));
    set('sl-volt',        v('voltage_l1_l2'));
    set('sl-amp-comp',    v('amp_draw_comp'));
    set('sl-amp-fan',     v('amp_draw_fan'));
    set('sl-refr-add',    v('refrigerant_added_kg'));
    set('sl-refr-rec',    v('refrigerant_recovered_kg'));
    chk('sl-leak',        log.leak_test_performed);
    set('sl-leak-res',    v('leak_test_result'));
    chk('sl-filter',      log.filters_cleaned);
    chk('sl-coil',        log.coils_cleaned);
    chk('sl-elec',        log.electrical_connections_checked);
    set('sl-status-after',v('system_status_after'));
    set('sl-recom',       v('recommendations'));

    /* მედია: რედაქტირებისას არსებული ფაილები რჩება */
    uploadedMediaUrls = Array.isArray(log.media_urls) ? [...log.media_urls] : [];
    document.getElementById('sl-files').value = '';
    document.getElementById('sl-media-preview').innerHTML = uploadedMediaUrls.length
        ? `<div class="text-[10px] text-slate-400">მიმაგრებულია ${uploadedMediaUrls.length} ფაილი</div>` : '';
}

/* ახალი სერვისი */
function openServiceLogModal() {
    _fillServiceForm({});
    document.getElementById('sl-modal-title').innerText = 'სერვისის რეპორტი';
    document.getElementById('sl-modal').classList.add('active');
}


/* არსებული სერვისის რედაქტირება — სრული ჩანაწერი ბაზიდან იტვირთება */
async function editServiceLog(log) {
    const { data, error } = await _supabase.from('service_logs').select('*').eq('id', log.id).maybeSingle();
    if (error || !data) { alert('სერვისის ჩანაწერი ვერ მოიძებნა'); return; }

    /* saveServiceLog იყენებს activeAsset / activeBranch-ს — ჩანაწერისას უნდა იყოს */
    if (!activeAsset  || activeAsset.id  !== data.asset_id)  activeAsset  = { id: data.asset_id,  name: log._assetName  || '' };
    if (!activeBranch || activeBranch.id !== data.branch_id) activeBranch = { id: data.branch_id, name: log._branchName || '' };

    _fillServiceForm(data);
    document.getElementById('sl-modal-title').innerText = 'სერვისის რედაქტირება';
    document.getElementById('sl-modal').classList.add('active');
}

/* სერვისის შენახვის შემდეგ — ეკრანზე არსებული სიის განახლება */
function _refreshServiceViews() {
    const dashActive = document.getElementById('branch-dashboard-view')?.classList.contains('active');
    const custActive = document.getElementById('branch-view')?.classList.contains('active');
    const shown = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden') && !e.classList.contains('av-hidden'); };

    /* აგრეგატის დეტალური გვერდი → მიმდინარე ჩანართის თავიდან დახატვა */
    if (dashActive && shown('bdcp-assets') && shown('av-detail-panel')) {
        const t = document.querySelector('.av-tab.active');
        if (!t || t.getAttribute('onclick')?.includes("'home'")) avOpenAsset(window._av.currentAsset);
        else t.click();
    }
    /* ფილიალის სერვისების ჩანართი */
    if (dashActive && shown('bdcp-service') && typeof loadBdcServices === 'function') loadBdcServices();
    /* კლიენტის საერთო სერვისების ცხრილი */
    if (custActive && document.getElementById('all-services-table') && typeof loadAllServices === 'function') loadAllServices();
}
