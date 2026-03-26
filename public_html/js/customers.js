/* ============================================================
   BECOOL CRM — customers.js
   
   ეს ფაილი შეიცავს მხოლოდ კლიენტების ლოგიკას.
   
   გამოყენება: js/api.js და js/ui.js-ში შეცვალე
   saveCustomer() და openCustomerModal() ფუნქციები ამით.
   ასევე დაამატე ახალი ფუნქციები:
   setCustomerType(), setVat(),
   searchCustomerAddress(), searchCustomerAddressPerson()
   ============================================================ */


/* ============================================================
   setCustomerType(type)
   შპს / ფიზიკური პირის toggle — ველების ჩვენება/დამალვა
   type = 'Company' ან 'Person'
   გამოიძახება ტიპის ღილაკებიდან
   ============================================================ */
function setCustomerType(type) {

    /* ღილაკების სტილი */
    const isCompany = (type === 'Company');

    document.getElementById('c-btn-company').className = isCompany
        ? 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';

    document.getElementById('c-btn-person').className = !isCompany
        ? 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';

    /* ველების ჩვენება / დამალვა */
    document.getElementById('c-company-fields').classList.toggle('hidden', !isCompany);
    document.getElementById('c-person-fields').classList.toggle('hidden',   isCompany);

    /* საქმიანობის სფერო და ზომა — მხოლოდ შპს-ისთვის */
    document.getElementById('c-industry-wrap').classList.toggle('hidden', !isCompany);
    document.getElementById('c-size-wrap').classList.toggle('hidden',     !isCompany);
}


/* ============================================================
   setVat(isVat)
   დღგ გადამხდელის toggle
   isVat = true ან false
   ============================================================ */
function setVat(isVat) {
    document.getElementById('c-vat').value = isVat.toString();

    /* "კი" ღილაკი */
    document.getElementById('c-vat-yes').className = isVat
        ? 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-green-600 text-white border-green-600'
        : 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-green-400';

    /* "არა" ღილაკი */
    document.getElementById('c-vat-no').className = !isVat
        ? 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';
}


/* ============================================================
   searchCustomerAddress()
   შპს-ის ფაქტობრივი მისამართის ძებნა Nominatim-ით
   ეძებს მისამართს, ინახავს: actual_address, lat, lng, map_url
   ============================================================ */
async function searchCustomerAddress() {
    const addr = document.getElementById('c-address-search').value.trim();
    if (!addr) return alert('ჩაწერეთ მისამართი');

    document.getElementById('loader').classList.remove('hidden');

    try {
        /* Nominatim geocoding API */
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
        );
        const data = await res.json();

        if (data.length === 0) {
            alert('მისამართი ვერ მოიძებნა. სცადეთ სხვა ფორმულირება.');
            document.getElementById('loader').classList.add('hidden');
            return;
        }

        const { lat, lon, display_name } = data[0];

        /* კოორდინატების შენახვა ფარულ ველებში */
        document.getElementById('c-lat').value     = parseFloat(lat).toFixed(6);
        document.getElementById('c-lng').value     = parseFloat(lon).toFixed(6);

        /* Google Maps ლინკის გენერაცია */
        const mapUrl = `https://www.google.com/maps?q=${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;
        document.getElementById('c-map-url').value = mapUrl;

        /* შედეგის ჩვენება მომხმარებელს */
        document.getElementById('c-address-result').classList.remove('hidden');
        document.getElementById('c-address-result-text').innerText = display_name;
        document.getElementById('c-address-result-link').innerText = mapUrl;

    } catch (err) {
        alert('ძებნის შეცდომა: ' + err.message);
    }

    document.getElementById('loader').classList.add('hidden');
}


/* ============================================================
   searchCustomerAddressPerson()
   ფიზიკური პირის მისამართის ძებნა
   იგივე ლოგიკა, სხვა input/result ელემენტები
   ============================================================ */
async function searchCustomerAddressPerson() {
    const addr = document.getElementById('c-person-address-search').value.trim();
    if (!addr) return alert('ჩაწერეთ მისამართი');

    document.getElementById('loader').classList.remove('hidden');

    try {
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
        );
        const data = await res.json();

        if (data.length === 0) {
            alert('მისამართი ვერ მოიძებნა.');
            document.getElementById('loader').classList.add('hidden');
            return;
        }

        const { lat, lon, display_name } = data[0];

        document.getElementById('c-lat').value     = parseFloat(lat).toFixed(6);
        document.getElementById('c-lng').value     = parseFloat(lon).toFixed(6);

        const mapUrl = `https://www.google.com/maps?q=${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;
        document.getElementById('c-map-url').value = mapUrl;

        document.getElementById('c-person-address-result').classList.remove('hidden');
        document.getElementById('c-person-address-result-text').innerText = display_name;
        document.getElementById('c-person-address-result-link').innerText = mapUrl;

    } catch (err) {
        alert('ძებნის შეცდომა: ' + err.message);
    }

    document.getElementById('loader').classList.add('hidden');
}


/* ============================================================
   openCustomerModal(c)
   კლიენტის მოდალის გახსნა.
   c = კლიენტის ობიექტი (null = ახალი კლიენტი)
   ============================================================ */
function openCustomerModal(c = null) {

    const isEdit = (c !== null); /* რედაქტირება თუ ახალი? */

    /* მოდალის სათაური */
    document.getElementById('c-modal-title').innerText = isEdit
        ? 'კლიენტის რედაქტირება'
        : 'კლიენტის დამატება';

    /* ფარული ველები */
    document.getElementById('c-id').value      = isEdit ? c.id        : '';
    document.getElementById('c-url').value     = isEdit ? (c.image_url || '') : '';
    document.getElementById('c-lat').value     = isEdit ? (c.lat      || '') : '';
    document.getElementById('c-lng').value     = isEdit ? (c.lng      || '') : '';
    document.getElementById('c-map-url').value = isEdit ? (c.map_url  || '') : '';

    /* კლიენტის ტიპი */
    const type = isEdit ? (c.customer_type || 'Company') : 'Company';
    setCustomerType(type);

    /* სტატუსი */
    document.getElementById('c-status').value       = isEdit ? (c.status       || 'Potential') : 'Potential';
    document.getElementById('c-industry').value     = isEdit ? (c.industry     || '')           : '';
    document.getElementById('c-company-size').value = isEdit ? (c.company_size || '')           : '';

    /* შპს ველები */
    document.getElementById('c-name').value         = isEdit ? (c.name          || '') : '';
    document.getElementById('c-tax').value          = isEdit ? (c.tax_id        || '') : '';
    document.getElementById('c-legal-address').value= isEdit ? (c.legal_address || '') : '';
    document.getElementById('c-website').value      = isEdit ? (c.website       || '') : '';
    document.getElementById('c-bank').value         = isEdit ? (c.bank_name     || '') : '';
    document.getElementById('c-account').value      = isEdit ? (c.account_number|| '') : '';

    /* ფიზიკური პირის ველები */
    document.getElementById('c-person-name').value    = isEdit && type==='Person' ? (c.name   || '') : '';
    document.getElementById('c-person-tax').value     = isEdit && type==='Person' ? (c.tax_id || '') : '';
    document.getElementById('c-person-bank').value    = isEdit ? (c.bank_name     || '') : '';
    document.getElementById('c-person-account').value = isEdit ? (c.account_number|| '') : '';

    /* დღგ */
    setVat(isEdit ? (c.is_vat_payer || false) : false);

    /* მისამართის result ველების გასუფთავება */
    document.getElementById('c-address-result').classList.add('hidden');
    document.getElementById('c-person-address-result').classList.add('hidden');

    /* თუ რედაქტირებაა — ძველი მისამართი ვაჩვენოთ */
    if (isEdit && c.actual_address) {
        const resultEl = type === 'Person'
            ? document.getElementById('c-person-address-result')
            : document.getElementById('c-address-result');
        const textEl = type === 'Person'
            ? document.getElementById('c-person-address-result-text')
            : document.getElementById('c-address-result-text');
        const linkEl = type === 'Person'
            ? document.getElementById('c-person-address-result-link')
            : document.getElementById('c-address-result-link');

        resultEl.classList.remove('hidden');
        textEl.innerText = c.actual_address;
        linkEl.innerText = c.map_url || '';
    }

    /* საკონტაქტო პირები */
    document.getElementById('c-contact1-name').value  = isEdit ? (c.contact_person_1 || '') : '';
    document.getElementById('c-contact1-pos').value   = isEdit ? (c.position_1       || '') : '';
    document.getElementById('c-contact1-email').value = isEdit ? (c.email_1          || '') : '';
    document.getElementById('c-contact1-phone').value = isEdit ? (c.phone_1          || '') : '';
    document.getElementById('c-contact2-name').value  = isEdit ? (c.contact_person_2 || '') : '';
    document.getElementById('c-contact2-pos').value   = isEdit ? (c.position_2       || '') : '';
    document.getElementById('c-contact2-email').value = isEdit ? (c.email_2          || '') : '';
    document.getElementById('c-contact2-phone').value = isEdit ? (c.phone_2          || '') : '';

    /* ზოგადი */
    document.getElementById('c-phone').value  = isEdit ? (c.phone       || '') : '';
    document.getElementById('c-rate').value   = isEdit ? (c.hourly_rate || 0)  : 0;
    document.getElementById('c-notes').value  = isEdit ? (c.notes       || '') : '';

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
   saveCustomer()
   კლიენტის შენახვა Supabase-ში.
   შპს და ფიზიკური პირი ერთ ცხრილში ინახება.
   type-ის მიხედვით სწორი ველები ივსება.
   ============================================================ */
async function saveCustomer() {

    /* კლიენტის ტიპის განსაზღვრა */
    const isCompany = document.getElementById('c-btn-company').classList.contains('bg-slate-900')
        && !document.getElementById('c-btn-company').classList.contains('hidden');

    /* სახელის და tax_id-ის წყარო ტიპის მიხედვით */
    const name  = isCompany
        ? document.getElementById('c-name').value.trim()
        : document.getElementById('c-person-name').value.trim();

    const taxId = isCompany
        ? document.getElementById('c-tax').value.trim()
        : document.getElementById('c-person-tax').value.trim();

    /* სავალდებულო ველის შემოწმება */
    if (!name) {
        alert('სახელი სავალდებულოა!');
        return;
    }

    /* ბანკის ინფო ტიპის მიხედვით */
    const bankName  = isCompany
        ? document.getElementById('c-bank').value.trim()
        : document.getElementById('c-person-bank').value.trim();

    const accountNr = isCompany
        ? document.getElementById('c-account').value.trim()
        : document.getElementById('c-person-account').value.trim();

    /* ფოტოს ატვირთვა (თუ ახალია) */
    const id   = document.getElementById('c-id').value;
    const file = document.getElementById('c-file').files[0];
    let imageUrl = document.getElementById('c-url').value;
    if (file) imageUrl = await uploadToStorage(file, 'customers');

    /* მისამართი — actual_address ველი ძებნის შედეგიდან */
    const addrResultEl = isCompany
        ? document.getElementById('c-address-result-text')
        : document.getElementById('c-person-address-result-text');
    const actualAddress = addrResultEl.innerText || '';

    /* Supabase-ში შესანახი payload */
    const payload = {
        name:             name,
        tax_id:           taxId,
        customer_type:    isCompany ? 'Company' : 'Person',
        status:           document.getElementById('c-status').value,
        industry:         isCompany ? document.getElementById('c-industry').value     : null,
        company_size:     isCompany ? document.getElementById('c-company-size').value  : null,
        legal_address:    isCompany ? document.getElementById('c-legal-address').value : null,
        website:          isCompany ? document.getElementById('c-website').value        : null,
        is_vat_payer:     document.getElementById('c-vat').value === 'true',
        bank_name:        bankName,
        account_number:   accountNr,
        actual_address:   actualAddress,
        map_url:          document.getElementById('c-map-url').value  || null,
        lat:              parseFloat(document.getElementById('c-lat').value) || null,
        lng:              parseFloat(document.getElementById('c-lng').value) || null,
        contact_person_1: document.getElementById('c-contact1-name').value  || null,
        position_1:       document.getElementById('c-contact1-pos').value   || null,
        email_1:          document.getElementById('c-contact1-email').value  || null,
        phone_1:          document.getElementById('c-contact1-phone').value  || null,
        contact_person_2: document.getElementById('c-contact2-name').value  || null,
        position_2:       document.getElementById('c-contact2-pos').value   || null,
        email_2:          document.getElementById('c-contact2-email').value  || null,
        phone_2:          document.getElementById('c-contact2-phone').value  || null,
        phone:            document.getElementById('c-phone').value           || null,
        hourly_rate:      parseFloat(document.getElementById('c-rate').value) || 0,
        notes:            document.getElementById('c-notes').value           || null,
        image_url:        imageUrl                                            || null,
    };

    /* Supabase-ში შენახვა ან განახლება */
    const { error } = id
        ? await _supabase.from('customers').update(payload).eq('id', id)
        : await _supabase.from('customers').insert([payload]);

    if (!error) {
        closeModals();
        loadCustomers(); /* სიის განახლება */
    } else {
        alert('შეცდომა: ' + error.message);
    }
}