/* ============================================================
   BECOOL CRM — api.js
   აქ არის ყველა Supabase-თან კომუნიკაცია:
   - ფაილების ატვირთვა (Storage)
   - მონაცემების კითხვა, ჩაწერა, განახლება, წაშლა
   ============================================================ */


/* ============================================================
   previewImg(input, previewId)
   ფოტოს ატვირთვამდე პრევიუს ჩვენება ეკრანზე.
   input     = file input ელემენტი
   previewId = <img> ელემენტის id, სადაც ფოტო გამოჩნდება
   ============================================================ */
function previewImg(input, previewId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader(); /* ფაილის წამკითხველი */
        reader.onload = e => {
            const img = document.getElementById(previewId);
            img.src = e.target.result;           /* ბაზა64 მისამართი */
            img.classList.remove('hidden');       /* ფოტო გაჩვენება */
            /* placeholder ტექსტი დამალვა */
            const placeholder = document.getElementById(previewId.charAt(0) + '-placeholder');
            if (placeholder) placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file); /* ფაილის წაკითხვა */
    }
}

/* ============================================================
   uploadToStorage(file, folder)
   ერთი ფაილის Supabase Storage-ში ატვირთვა.
   file   = ატვირთვის ფაილი
   folder = bucket-ში საქაღალდე (მაგ: 'customers', 'branches')
   აბრუნებს: public URL სტრიქონს, ან null შეცდომის შემთხვევაში
   ============================================================ */
async function uploadToStorage(file, folder) {
    if (!file) return null;

    /* "SYNCING..." ინდიკატორის ჩვენება */
    document.getElementById('loader').classList.remove('hidden');

    /* უნიკალური ფაილის სახელი: timestamp + ორიგინალი სახელი */
    const fName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

    /* Supabase Storage 'assets' bucket-ში ატვირთვა */
    const { error } = await _supabase.storage
        .from('assets')
        .upload(`${folder}/${fName}`, file);

    if (error) {
        alert("Upload error: " + error.message);
        document.getElementById('loader').classList.add('hidden');
        return null;
    }

    /* ატვირთული ფაილის საჯარო URL-ის მიღება */
    const { data } = _supabase.storage
        .from('assets')
        .getPublicUrl(`${folder}/${fName}`);

    document.getElementById('loader').classList.add('hidden');
    return data.publicUrl;
}

/* ============================================================
   handleMultipleFiles(input)
   სერვის ლოგის მრავალი ფოტო/ვიდეოს ატვირთვა.
   ყველა ფაილს ატვირთავს და uploadedMediaUrls მასივს ავსებს.
   ============================================================ */
async function handleMultipleFiles(input) {
    const files = Array.from(input.files);
    const previewCont = document.getElementById('sl-media-preview');
    document.getElementById('loader').classList.remove('hidden');

    /* თითოეული ფაილის ატვირთვა */
    for (const file of files) {
        const url = await uploadToStorage(file, 'service_logs');
        if (url) {
            uploadedMediaUrls.push(url); /* URL სიაში შენახვა */

            /* პრევიუ ელემენტის შექმნა */
            const item = document.createElement('div');
            item.className = "relative h-20 w-20 rounded-xl overflow-hidden border-2 border-white shadow";

            if (file.type.startsWith('video')) {
                /* ვიდეოს შემთხვევაში — play ღილაკი */
                item.innerHTML = `
                    <video src="${url}" class="h-full w-full object-cover"></video>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                        <i data-lucide="play" class="text-white w-4 h-4"></i>
                    </div>`;
            } else {
                /* სურათის შემთხვევაში — მარტო ფოტო */
                item.innerHTML = `<img src="${url}" class="h-full w-full object-cover">`;
            }
            previewCont.appendChild(item);
        }
    }

    lucide.createIcons(); /* Lucide იკონების განახლება */
    document.getElementById('loader').classList.add('hidden');
}


/* ============================================================
   loadCustomers()
   Supabase-იდან ყველა კლიენტის ჩამოტვირთვა და HTML-ში ჩვენება.
   გამოიძახება გვერდის ჩატვირთვისას და შენახვის შემდეგ.
   ============================================================ */
async function loadCustomers() {
    const { data, error } = await _supabase
        .from('customers')
        .select('*')
        .order('name'); /* სახელით დალაგება */

    if (error) return;

    /* კლიენტების ბარათების HTML გენერაცია */
    document.getElementById('customers-list').innerHTML = data.map(c => `
        <div onclick='viewBranches(${JSON.stringify(c)})'
            class="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm relative group overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
            <div class="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition duration-700 scale-150 rotate-12">
                <i data-lucide="building-2" class="w-32 h-32"></i>
            </div>
            <div class="flex justify-between items-start mb-8">
                <div class="w-24 h-24 rounded-[2rem] bg-slate-900 overflow-hidden border-8 border-slate-50 shadow-xl group-hover:scale-110 transition duration-500">
                    ${c.image_url
                        ? `<img src="${c.image_url}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center text-blue-400 font-black italic text-xl">BC</div>`
                    }
                </div>
            </div>
            <h3 class="text-3xl font-black text-slate-900 mb-2 truncate italic uppercase tracking-tighter">${c.name}</h3>
            <p class="text-xs text-slate-400 font-bold mb-10 uppercase tracking-widest flex items-center gap-2 italic">
                📍 ${c.legal_address || 'N/A'}
            </p>
            <div class="flex gap-4 relative" onclick="event.stopPropagation()">
                <button onclick='viewBranches(${JSON.stringify(c)})' class="flex-1 bg-slate-900 text-white font-black py-4 rounded-[1.5rem] text-[10px] hover:bg-blue-600 transition uppercase tracking-[0.1em]">
                    ფილიალები
                </button>
                <button onclick='openCustomerModal(${JSON.stringify(c)})' class="bg-blue-50 text-blue-600 px-6 rounded-[1.5rem] hover:bg-blue-600 transition shadow-sm">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick='deleteData("customers", "${c.id}")' class="text-slate-200 hover:text-red-500 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons(); /* Lucide იკონები განახლება */
}

/* ============================================================
   setCustomerType(type)
   შპს / ფიზიკური პირის toggle — ველების ჩვენება/დამალვა.
   type = 'Company' ან 'Person'
   გამოიძახება ტიპის ღილაკებიდან HTML-ში.
   ============================================================ */
function setCustomerType(type) {
    const isCompany = (type === 'Company');

    /* ღილაკების სტილის გადართვა */
    document.getElementById('c-btn-company').className = isCompany
        ? 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';

    document.getElementById('c-btn-person').className = !isCompany
        ? 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';

    /* შპს ველები — ჩვენება/დამალვა */
    document.getElementById('c-company-fields').classList.toggle('hidden', !isCompany);
    document.getElementById('c-person-fields').classList.toggle('hidden',   isCompany);

    /* საქმიანობის სფერო და ზომა — მხოლოდ შპს */
    document.getElementById('c-industry-wrap').classList.toggle('hidden', !isCompany);
    document.getElementById('c-size-wrap').classList.toggle('hidden',     !isCompany);
}

/* ============================================================
   setVat(isVat)
   დღგ გადამხდელის toggle — კი / არა ღილაკები.
   ============================================================ */
function setVat(isVat) {
    document.getElementById('c-vat').value = isVat.toString();

    document.getElementById('c-vat-yes').className = isVat
        ? 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-green-600 text-white border-green-600'
        : 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-green-400';

    document.getElementById('c-vat-no').className = !isVat
        ? 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-slate-900 text-white border-slate-900'
        : 'flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all bg-white text-slate-400 border-slate-200 hover:border-slate-400';
}

/* ============================================================
   searchCustomerAddress()
   შპს-ის ფაქტობრივი მისამართის ძებნა Nominatim API-ით.
   ინახავს: actual_address, lat, lng, map_url ფარულ ველებში.
   ============================================================ */
async function searchCustomerAddress() {
    const addr = document.getElementById('c-address-search').value.trim();
    if (!addr) return alert('ჩაწერეთ მისამართი');

    document.getElementById('loader').classList.remove('hidden');
    try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
        const data = await res.json();
        if (data.length === 0) {
            alert('მისამართი ვერ მოიძებნა. სცადეთ სხვა ფორმულირება.');
            document.getElementById('loader').classList.add('hidden');
            return;
        }
        const { lat, lon, display_name } = data[0];
        document.getElementById('c-lat').value     = parseFloat(lat).toFixed(6);
        document.getElementById('c-lng').value     = parseFloat(lon).toFixed(6);
        const mapUrl = `https://www.google.com/maps?q=${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;
        document.getElementById('c-map-url').value = mapUrl;
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
   ფიზიკური პირის მისამართის ძებნა — იგივე ლოგიკა,
   სხვა input/result ელემენტების id-ები.
   ============================================================ */
async function searchCustomerAddressPerson() {
    const addr = document.getElementById('c-person-address-search').value.trim();
    if (!addr) return alert('ჩაწერეთ მისამართი');

    document.getElementById('loader').classList.remove('hidden');
    try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
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
   saveCustomer()
   კლიენტის შენახვა ან განახლება Supabase-ში.
   შპს და ფიზიკური პირი — ერთ customers ცხრილში.
   ტიპის მიხედვით სწორი ველები ივსება.
   ============================================================ */
async function saveCustomer() {
    /* კლიენტის ტიპის განსაზღვრა ღილაკის კლასიდან */
    const isCompany = document.getElementById('c-btn-company').classList.contains('bg-slate-900');

    /* სახელი და tax_id ტიპის მიხედვით */
    const name  = isCompany
        ? document.getElementById('c-name').value.trim()
        : document.getElementById('c-person-name').value.trim();
    const taxId = isCompany
        ? document.getElementById('c-tax').value.trim()
        : document.getElementById('c-person-tax').value.trim();

    if (!name) { alert('სახელი სავალდებულოა!'); return; }

    /* ბანკის ინფო ტიპის მიხედვით */
    const bankName  = isCompany
        ? document.getElementById('c-bank').value.trim()
        : document.getElementById('c-person-bank').value.trim();
    const accountNr = isCompany
        ? document.getElementById('c-account').value.trim()
        : document.getElementById('c-person-account').value.trim();

    /* ფოტოს ატვირთვა */
    const id   = document.getElementById('c-id').value;
    const file = document.getElementById('c-file').files[0];
    let imageUrl = document.getElementById('c-url').value;
    if (file) imageUrl = await uploadToStorage(file, 'customers');

    /* actual_address — ძებნის შედეგიდან */
    const addrText = isCompany
        ? document.getElementById('c-address-result-text').innerText
        : document.getElementById('c-person-address-result-text').innerText;

    /* Supabase payload */
    const payload = {
        name:             name,
        tax_id:           taxId,
        customer_type:    isCompany ? 'Company' : 'Person',
        status:           document.getElementById('c-status').value,
        industry:         isCompany ? (document.getElementById('c-industry').value     || null) : null,
        company_size:     isCompany ? (document.getElementById('c-company-size').value  || null) : null,
        legal_address:    isCompany ? (document.getElementById('c-legal-address').value || null) : null,
        website:          isCompany ? (document.getElementById('c-website').value        || null) : null,
        is_vat_payer:     document.getElementById('c-vat').value === 'true',
        bank_name:        bankName   || null,
        account_number:   accountNr  || null,
        actual_address:   addrText   || null,
        map_url:          document.getElementById('c-map-url').value  || null,
        lat:              parseFloat(document.getElementById('c-lat').value)  || null,
        lng:              parseFloat(document.getElementById('c-lng').value)  || null,
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

    /* შენახვა ან განახლება */
    const { error } = id
        ? await _supabase.from('customers').update(payload).eq('id', id)
        : await _supabase.from('customers').insert([payload]);

    if (!error) {
        closeModals();
        loadCustomers();
    } else {
        alert('შეცდომა: ' + error.message);
    }
}

/* ============================================================
   loadBranches()
   Supabase-იდან ამ კლიენტის ფილიალების ჩამოტვირთვა.
   ყოველ ბარათს ახლავს მინი-რუკა (Leaflet).
   ============================================================ */
async function loadBranches() {
    const { data, error } = await _supabase
        .from('branches')
        .select('*')
        .eq('customer_id', activeCustomer.id)
        .order('created_at'); /* შექმნის თარიღით */

    if (error) return;

    /* ფილიალების ბარათების HTML გენერაცია */
    document.getElementById('branches-list').innerHTML = data.map((b, i) => `
        <div class="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px] group transition-all hover:shadow-2xl">
            <div class="w-full md:w-96 relative bg-slate-100 overflow-hidden border-r border-slate-50">
                ${b.image_url
                    ? `<img src="${b.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition duration-1000">`
                    : `<div class="h-full flex items-center justify-center italic text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">OB ფოტო არაა</div>`
                }
                <!-- მინი-რუკა ბარათის ქვედა ნაწილში -->
                <div id="map-${i}" class="absolute bottom-8 left-8 right-8 h-40 rounded-[2rem] shadow-2xl border-4 border-white overflow-hidden transition-transform group-hover:translate-y-2"></div>
            </div>
            <div class="p-12 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-8">
                    <span class="status-badge ${b.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                        ${b.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div class="flex gap-4">
                        <button onclick='openBranchModal(${JSON.stringify(b)})' class="text-blue-500 font-black text-[11px] uppercase hover:underline flex items-center gap-1 italic">
                            რედაქტირება <i data-lucide="chevron-right" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-5xl font-black text-slate-900 leading-none mb-3 italic tracking-tighter uppercase">${b.name}</h3>
                <p class="text-xs text-slate-400 font-bold mb-12 flex items-center gap-2 uppercase tracking-widest">
                    <i data-lucide="map-pin" class="w-4 h-4"></i> ${b.address || 'მისამართი არაა'}
                </p>
                <div class="grid grid-cols-2 gap-4 mb-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div class="border-b pb-2">ელ-კვება: <span class="text-slate-900">${b.power_supply_type || 'N/A'}</span></div>
                    <div class="border-b pb-2">ფართი: <span class="text-slate-900">${b.square_meters || 0} m²</span></div>
                    <div class="border-b pb-2">მენეჯერი: <span class="text-slate-900">${b.contact_person || 'N/A'}</span></div>
                    <div class="border-b pb-2">ტელეფონი: <span class="text-slate-900">${b.contact_phone || 'N/A'}</span></div>
                </div>
                <div class="flex gap-4 mt-auto">
                    <button onclick='viewAssets(${JSON.stringify(b)})' class="flex-[2] bg-slate-900 text-white font-black py-4 rounded-3xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition">
                        აგრეგატები (ASSETS) <i data-lucide="package" class="inline w-4 h-4 ml-1"></i>
                    </button>
                    <button onclick='deleteData("branches", "${b.id}")' class="bg-red-50 text-red-500 p-4 rounded-3xl hover:bg-red-500 hover:text-white transition">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    /* ყოველ ბარათში მინი-რუკის ინიციალიზაცია */
    data.forEach((b, i) => {
        if (b.lat && b.lng) {
            const m = L.map(`map-${i}`, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false
            }).setView([b.lat, b.lng], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);
            L.marker([b.lat, b.lng]).addTo(m);
        }
    });

    lucide.createIcons();
}

/* ============================================================
   saveBranch()
   ფილიალის შენახვა ან განახლება Supabase-ში.
   ============================================================ */
async function saveBranch() {
    const id   = document.getElementById('b-id').value;
    const file = document.getElementById('b-file').files[0];
    let imageUrl = document.getElementById('b-url').value;
    if (file) imageUrl = await uploadToStorage(file, 'branches');

    if (!document.getElementById('b-name').value.trim()) {
        alert('ფილიალის სახელი სავალდებულოა!'); return;
    }

    const payload = {
        customer_id:          activeCustomer.id,
        /* სექცია 1 */
        name:                 document.getElementById('b-name').value.trim(),
        is_active:            document.getElementById('b-active').value === 'true',
        branch_type:          document.getElementById('b-type').value,
        building_type:        document.getElementById('b-building').value         || null,
        service_priority:     document.getElementById('b-priority').value,
        /* სექცია 2 */
        address:              document.getElementById('b-address').value,
        lat:                  parseFloat(document.getElementById('b-lat').value)  || null,
        lng:                  parseFloat(document.getElementById('b-lng').value)  || null,
        floor_zone:           document.getElementById('b-floor-zone').value       || null,
        /* სექცია 3 */
        power_supply_type:    document.getElementById('b-power').value            || null,
        refrigeration_type:   document.getElementById('b-refrig').value           || null,
        square_meters:        parseFloat(document.getElementById('b-sqm').value)  || null,
        year_built:           parseInt(document.getElementById('b-year').value)   || null,
        working_hours:        document.getElementById('b-hours').value            || null,
        access_code:          document.getElementById('b-access').value           || null,
        parking_details:      document.getElementById('b-parking').value          || null,
        /* სექცია 4 */
        contact_person:       document.getElementById('b-pers').value             || null,
        contact_phone:        document.getElementById('b-phon').value             || null,
        emergency_contact:    document.getElementById('b-emerg-contact').value    || null,
        emergency_phone:      document.getElementById('b-emerg-phone').value      || null,
        after_hours_contact:  document.getElementById('b-after-contact').value    || null,
        after_hours_phone:    document.getElementById('b-after-phone').value      || null,
        /* სექცია 5 */
        service_frequency:    document.getElementById('b-freq').value             || null,
        contract_type:        document.getElementById('b-contract-type').value    || null,
        sla_response_hours:   parseInt(document.getElementById('b-sla').value)    || 4,
        contract_start:       document.getElementById('b-contract-start').value   || null,
        contract_end:         document.getElementById('b-contract-end').value     || null,
        /* სექცია 6 */
        notes:                document.getElementById('b-notes').value            || null,
        image_url:            imageUrl,
    };

    const { error } = id
        ? await _supabase.from('branches').update(payload).eq('id', id)
        : await _supabase.from('branches').insert([payload]);

    if (!error) {
        closeModals();
        loadBranches();
    } else {
        alert(error.message);
    }
}

/* ============================================================
   loadAssets()
   Supabase-იდან ამ ფილიალის აგრეგატების ჩამოტვირთვა.
   ============================================================ */
async function loadAssets() {
    if (!activeBranch) return;

    const { data, error } = await _supabase
        .from('assets')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .order('name');

    if (error) return;

    document.getElementById('assets-list').innerHTML = data.map(a => `
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:-translate-y-2 transition-all">
            <div class="h-48 bg-slate-900 relative overflow-hidden">
                ${a.image_url
                    ? `<img src="${a.image_url}" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition duration-700">`
                    : `<div class="w-full h-full flex items-center justify-center text-slate-700 font-black italic">NO IMAGE</div>`
                }
                <div class="absolute top-4 left-4">
                    <span class="status-badge ${a.status === 'Operational' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
                        ${a.status}
                    </span>
                </div>
                <div class="absolute bottom-4 right-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic">
                    ${a.asset_type}
                </div>
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">${a.name}</h4>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${a.brand} ${a.model || ''}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-black text-blue-600 block uppercase">TAG: ${a.tag_number || '---'}</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-y-3 mb-6 border-t border-slate-50 pt-6 text-[11px] font-bold">
                    <div class="text-slate-400">სიმძლავრე: <span class="text-slate-900 italic">${a.cooling_capacity_kw || 0} kW</span></div>
                    <div class="text-slate-400">ფრეონი: <span class="text-slate-900 italic">${a.refrigerant_type || '---'}</span></div>
                    <div class="text-slate-400">სერიული: <span class="text-slate-900 italic text-[9px]">${a.serial_number || '---'}</span></div>
                    <div class="text-slate-400">ელ-კვება: <span class="text-slate-900 italic">${a.voltage || 400}V / ${a.phase || '3'}</span></div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick='viewServiceLogs(${JSON.stringify(a)})' class="w-full bg-orange-500 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-orange-600 transition flex items-center justify-center gap-2 italic shadow-lg shadow-orange-100">
                        სერვისის ისტორია <i data-lucide="history" class="w-4 h-4"></i>
                    </button>
                    <div class="flex gap-2">
                        <button onclick='openAssetModal(${JSON.stringify(a)})' class="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-blue-600 transition">
                            რედაქტირება
                        </button>
                        <button onclick='deleteData("assets", "${a.id}")' class="px-4 text-slate-300 hover:text-red-500 transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

/* ============================================================
   saveAsset()
   აგრეგატის შენახვა ან განახლება Supabase-ში.
   technical_specs ველი JSON ფორმატშია.
   ============================================================ */
async function saveAsset() {
    const id   = document.getElementById('a-id').value;
    const file = document.getElementById('a-file').files[0];
    let imageUrl = document.getElementById('a-url').value;
    if (file) imageUrl = await uploadToStorage(file, 'assets_units');

    /* technical_specs JSON-ის პარსინგი */
    let techSpecs = {};
    try {
        const techVal = document.getElementById('a-tech').value;
        techSpecs = techVal ? JSON.parse(techVal) : {};
    } catch (e) {
        techSpecs = {}; /* JSON არასწორია — ცარიელ ობიექტს ვიყენებთ */
    }

    const payload = {
        branch_id:             activeBranch.id,
        customer_id:           activeCustomer.id,
        tag_number:            document.getElementById('a-tag').value,
        qr_code_id:            document.getElementById('a-qr').value,
        name:                  document.getElementById('a-name').value,
        asset_type:            document.getElementById('a-type').value,
        category:              document.getElementById('a-category').value,
        brand:                 document.getElementById('a-brand').value,
        model:                 document.getElementById('a-model').value,
        serial_number:         document.getElementById('a-serial').value,
        manufacture_year:      parseInt(document.getElementById('a-year').value) || null,
        cooling_capacity_kw:   parseFloat(document.getElementById('a-capacity').value) || null,
        refrigerant_type:      document.getElementById('a-refr-type').value,
        refrigerant_charge_kg: parseFloat(document.getElementById('a-refr-charge').value) || null,
        voltage:               parseInt(document.getElementById('a-voltage').value) || 400,
        phase:                 document.getElementById('a-phase').value,
        max_current_amp:       parseFloat(document.getElementById('a-current').value) || null,
        location_on_site:      document.getElementById('a-loc').value,
        installation_date:     document.getElementById('a-inst-date').value || null,
        warranty_until:        document.getElementById('a-warn-date').value || null,
        status:                document.getElementById('a-status').value,
        condition_score:       parseInt(document.getElementById('a-score').value) || 10,
        last_service_date:     document.getElementById('a-last-serv').value || null,
        service_interval_days: parseInt(document.getElementById('a-interval').value) || 180,
        iot_device_id:         document.getElementById('a-iot').value,
        manual_url:            document.getElementById('a-manual').value,
        wiring_diagram_url:    document.getElementById('a-wiring').value,
        technical_specs:       techSpecs,
        image_url:             imageUrl || null
    };

    const { error } = id
        ? await _supabase.from('assets').update(payload).eq('id', id)
        : await _supabase.from('assets').insert([payload]);

    if (!error) {
        closeModals();
        loadAssets();
    } else {
        alert(error.message);
    }
}

/* ============================================================
   loadServiceLogs()
   Supabase-იდან ამ აგრეგატის სერვის ლოგების ჩამოტვირთვა.
   უახლესი ჩანაწერი პირველია (descending).
   ============================================================ */
async function loadServiceLogs() {
    const { data, error } = await _supabase
        .from('service_logs')
        .select('*')
        .eq('asset_id', activeAsset.id)
        .order('service_date', { ascending: false });

    if (error) return;

    /* სიი ცარიელია — placeholder */
    if (data.length === 0) {
        document.getElementById('service-logs-list').innerHTML = `
            <div class="p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-black uppercase tracking-widest italic">
                ისტორია ცარიელია
            </div>`;
        return;
    }

    document.getElementById('service-logs-list').innerHTML = data.map(log => `
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-8 relative group">
            <!-- თარიღი და ტიპი -->
            <div class="md:w-48 text-center flex flex-col items-center justify-center border-r border-slate-50 pr-8">
                <span class="text-3xl font-black text-slate-900 italic leading-none">
                    ${new Date(log.service_date).toLocaleDateString('ka-GE', {day:'2-digit', month:'short'})}
                </span>
                <span class="text-[10px] font-black text-slate-400 uppercase mt-2">
                    ${new Date(log.service_date).getFullYear()}
                </span>
                <div class="mt-4 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase">
                    ${log.service_type}
                </div>
            </div>
            <!-- სერვის დეტალები -->
            <div class="flex-1">
                <div class="flex justify-between mb-4">
                    <h4 class="text-xl font-black italic text-slate-800 uppercase tracking-tighter">${log.technician_name}</h4>
                    <button onclick='deleteData("service_logs", "${log.id}")' class="text-slate-200 hover:text-red-500 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <p class="text-sm text-slate-600 font-medium mb-6 leading-relaxed">${log.job_description}</p>
                <!-- ზომები (წნევა, ტემპ) -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-black uppercase italic mb-6">
                    <div class="text-blue-500">P-Suc: <span class="text-slate-900">${log.suction_pressure || '-'} Bar</span></div>
                    <div class="text-red-500">P-Dis: <span class="text-slate-900">${log.discharge_pressure || '-'} Bar</span></div>
                    <div class="text-blue-500">T-Suc: <span class="text-slate-900">${log.suction_temp || '-'} °C</span></div>
                    <div class="text-red-500">T-Dis: <span class="text-slate-900">${log.discharge_temp || '-'} °C</span></div>
                </div>
                <!-- მედია ფაილები (ფოტო/ვიდეო) -->
                ${log.media_urls && log.media_urls.length > 0 ? `
                    <div class="flex gap-2 overflow-x-auto pb-2">
                        ${log.media_urls.map(url =>
                            (url.includes('.mp4') || url.includes('.mov'))
                                ? `<video src="${url}" class="h-16 w-16 rounded-xl object-cover border-2 border-slate-50"></video>`
                                : `<img src="${url}" class="h-16 w-16 rounded-xl object-cover border-2 border-slate-50">`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

/* ============================================================
   saveServiceLog()
   სერვის ლოგის შენახვა ან განახლება Supabase-ში.
   მოიცავს ყველა ტექნიკურ პარამეტრს + მედია ფაილებს.
   ============================================================ */
async function saveServiceLog() {
    const id = document.getElementById('sl-id').value;

    const payload = {
        asset_id:                        activeAsset.id,
        branch_id:                       activeBranch.id,
        technician_name:                 document.getElementById('sl-tech').value,
        service_date:                    document.getElementById('sl-date').value,
        service_type:                    document.getElementById('sl-type').value,
        job_description:                 document.getElementById('sl-desc').value,
        suction_pressure:                parseFloat(document.getElementById('sl-suction-p').value) || null,
        discharge_pressure:              parseFloat(document.getElementById('sl-disch-p').value) || null,
        suction_temp:                    parseFloat(document.getElementById('sl-suction-t').value) || null,
        discharge_temp:                  parseFloat(document.getElementById('sl-disch-t').value) || null,
        superheat:                       parseFloat(document.getElementById('sl-sh').value) || null,
        subcooling:                      parseFloat(document.getElementById('sl-sc').value) || null,
        ambient_temp:                    parseFloat(document.getElementById('sl-amb').value) || null,
        voltage_l1_l2:                   parseFloat(document.getElementById('sl-volt').value) || null,
        amp_draw_comp:                   parseFloat(document.getElementById('sl-amp-comp').value) || null,
        amp_draw_fan:                    parseFloat(document.getElementById('sl-amp-fan').value) || null,
        refrigerant_added_kg:            parseFloat(document.getElementById('sl-refr-add').value) || 0,
        refrigerant_recovered_kg:        parseFloat(document.getElementById('sl-refr-rec').value) || 0,
        leak_test_performed:             document.getElementById('sl-leak').checked,
        leak_test_result:                document.getElementById('sl-leak-res').value,
        filters_cleaned:                 document.getElementById('sl-filter').checked,
        coils_cleaned:                   document.getElementById('sl-coil').checked,
        electrical_connections_checked:  document.getElementById('sl-elec').checked,
        system_status_after:             document.getElementById('sl-status-after').value,
        recommendations:                 document.getElementById('sl-recom').value,
        media_urls:                      uploadedMediaUrls
    };

    const { error } = id
        ? await _supabase.from('service_logs').update(payload).eq('id', id)
        : await _supabase.from('service_logs').insert([payload]);

    if (!error) {
        closeModals();
        loadServiceLogs();
    } else {
        alert("შეცდომა შენახვისას: " + error.message);
    }
}

/* ============================================================
   deleteData(table, id)
   ნებისმიერი ჩანაწერის წაშლა Supabase-იდან.
   table = ცხრილის სახელი ('customers', 'branches', 'assets', 'service_logs')
   id    = ჩანაწერის უნიკალური ID
   ============================================================ */
async function deleteData(table, id) {
    if (confirm('ნამდვილად გსურთ წაშლა?')) {
        const { error } = await _supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (!error) {
            /* შესაბამისი სიის განახლება */
            if      (table === 'customers')    loadCustomers();
            else if (table === 'branches')     loadBranches();
            else if (table === 'assets')       loadAssets();
            else                               loadServiceLogs();
        } else {
            alert("Delete error: " + error.message);
        }
    }
}