/* ============================================================
   BECOOL CRM — api.js (COMPLETE VERSION)
   ============================================================ */

function previewImg(input, previewId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.getElementById(previewId);
            img.src = e.target.result;
            img.classList.remove('hidden');
            const placeholder = document.getElementById(previewId.charAt(0) + '-placeholder');
            if (placeholder) placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

async function uploadToStorage(file, folder) {
    if (!file) return null;
    document.getElementById('loader').classList.remove('hidden');
    const fName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await _supabase.storage.from('assets').upload(`${folder}/${fName}`, file);
    if (error) {
        alert("Upload error: " + error.message);
        document.getElementById('loader').classList.add('hidden');
        return null;
    }
    const { data } = _supabase.storage.from('assets').getPublicUrl(`${folder}/${fName}`);
    document.getElementById('loader').classList.add('hidden');
    return data.publicUrl;
}

async function handleMultipleFiles(input) {
    const files = Array.from(input.files);
    const previewCont = document.getElementById('sl-media-preview');
    document.getElementById('loader').classList.remove('hidden');
    for (const file of files) {
        const url = await uploadToStorage(file, 'service_logs');
        if (url) {
            uploadedMediaUrls.push(url);
            const item = document.createElement('div');
            item.className = "relative h-20 w-20 rounded-xl overflow-hidden border-2 border-white shadow";
            if (file.type.startsWith('video')) {
                item.innerHTML = `<video src=\"${url}\" class=\"h-full w-full object-cover\"></video><div class=\"absolute inset-0 flex items-center justify-center bg-black/20\"><i data-lucide=\"play\" class=\"text-white w-4 h-4\"></i></div>`;
            } else {
                item.innerHTML = `<img src=\"${url}\" class=\"h-full w-full object-cover\">`;
            }
            previewCont.appendChild(item);
        }
    }
    lucide.createIcons();
    document.getElementById('loader').classList.add('hidden');
}

async function loadCustomers() {
    const { data, error } = await _supabase.from('customers').select('*').order('name');
    if (error) return;
    document.getElementById('customers-list').innerHTML = data.map(c => `
        <div onclick='viewBranches(${JSON.stringify(c)})' class="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm relative group overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
            <div class="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition duration-700 scale-150 rotate-12"><i data-lucide="building-2" class="w-32 h-32"></i></div>
            <div class="flex justify-between items-start mb-8">
                <div class="w-24 h-24 rounded-[2rem] bg-slate-900 overflow-hidden border-8 border-slate-50 shadow-xl group-hover:scale-110 transition duration-500">
                    ${c.image_url ? `<img src="${c.image_url}" class="w-full h-full object-cover">` : `<div class=\"w-full h-full flex items-center justify-center text-blue-400 font-black italic text-xl\">BC</div>`}
                </div>
            </div>
            <h3 class="text-3xl font-black text-slate-900 mb-2 truncate italic uppercase tracking-tighter">${c.name}</h3>
            <p class="text-xs text-slate-400 font-bold mb-10 uppercase tracking-widest flex items-center gap-2 italic">📍 ${c.legal_address || 'N/A'}</p>
            <div class="flex gap-4 relative" onclick="event.stopPropagation()">
                <button onclick='viewBranches(${JSON.stringify(c)})' class="flex-1 bg-slate-900 text-white font-black py-4 rounded-[1.5rem] text-[10px] hover:bg-blue-600 transition uppercase tracking-[0.1em]">ფილიალები</button>
                <button onclick='openCustomerModal(${JSON.stringify(c)})' class="bg-blue-50 text-blue-600 px-6 rounded-[1.5rem] hover:bg-blue-600 transition shadow-sm"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button onclick='deleteData(\"customers\", \"${c.id}\")' class=\"text-slate-200 hover:text-red-500 transition\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button>
            </div>
        </div>`).join('');
    lucide.createIcons();
}

/* ფილიალის ქვეშ აგრეგატების ჩატვირთვა */
async function loadAssets() {
    if (!activeBranch) return;
    const { data, error } = await _supabase.from('assets').select('*').eq('branch_id', activeBranch.id).order('name');
    if (error) return;

    if (!window._av) window._av = {};
    window._av.branchAssets = data || [];

    document.getElementById('assets-list').innerHTML = data.map(a => `
        <div onclick="handleAssetClick('${a.id}')" 
             class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer">
            <div class="h-48 bg-slate-900 relative overflow-hidden">
                ${a.image_url ? `<img src="${a.image_url}" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition duration-700">` : `<div class=\"w-full h-full flex items-center justify-center text-slate-700 font-black italic\">NO IMAGE</div>`}
                <div class="absolute top-4 left-4"><span class="status-badge ${a.status === 'Operational' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">${a.status}</span></div>
                <div class="absolute bottom-4 right-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic">${a.asset_type}</div>
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class=\"text-2xl font-black text-slate-900 tracking-tighter italic uppercase\">${a.name}</h4>
                        <p class=\"text-[10px] font-black text-slate-400 uppercase tracking-widest\">${a.brand} ${a.model || ''}</p>
                    </div>
                    <div class=\"text-right\"><span class=\"text-[10px] font-black text-blue-600 block uppercase\">TAG: ${a.tag_number || '---'}</span></div>
                </div>
                <div class=\"flex flex-col gap-2\" onclick=\"event.stopPropagation()\">
                    <button onclick='viewServiceLogs(${JSON.stringify(a)})' class=\"w-full bg-orange-500 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-orange-600 transition flex items-center justify-center gap-2 italic shadow-lg shadow-orange-100\">სერვისის ისტორია <i data-lucide=\"history\" class=\"w-4 h-4\"></i></button>
                </div>
            </div>
        </div>`).join('');
    lucide.createIcons();
}

/* (saveCustomer, loadBranches, saveBranch, saveAsset, loadServiceLogs, saveServiceLog, deleteData ფუნქციები სრულად თქვენი ორიგინალი კოდიდან) */
async function saveCustomer() { const isCompany = document.getElementById('c-btn-company').classList.contains('bg-slate-900'); const name = isCompany ? document.getElementById('c-name').value.trim() : document.getElementById('c-person-name').value.trim(); if (!name) { alert('სახელი სავალდებულოა!'); return; } const id = document.getElementById('c-id').value; const file = document.getElementById('c-file').files[0]; let imageUrl = document.getElementById('c-url').value; if (file) imageUrl = await uploadToStorage(file, 'customers'); const payload = { name, customer_type: isCompany ? 'Company' : 'Person', status: document.getElementById('c-status').value, legal_address: document.getElementById('c-legal-address').value, website: document.getElementById('c-website').value, bank_name: document.getElementById('c-bank').value, account_number: document.getElementById('c-account').value, image_url: imageUrl, phone: document.getElementById('c-phone').value, notes: document.getElementById('c-notes').value }; const { error } = id ? await _supabase.from('customers').update(payload).eq('id', id) : await _supabase.from('customers').insert([payload]); if (!error) { closeModals(); loadCustomers(); } else { alert(error.message); } }
async function loadBranches() { const { data, error } = await _supabase.from('branches').select('*').eq('customer_id', activeCustomer.id).order('created_at'); if (error) return; document.getElementById('branches-list').innerHTML = data.map((b, i) => `<div class=\"bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px] group transition-all hover:shadow-2xl\"><div class=\"w-full md:w-96 relative bg-slate-100 overflow-hidden border-r border-slate-50\">${b.image_url ? `<img src=\"${b.image_url}\" class=\"w-full h-full object-cover\">` : `<div class=\"h-full flex items-center justify-center italic text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]\">OB ფოტო არაა</div>`}<div id=\"map-${i}\" class=\"absolute bottom-8 left-8 right-8 h-40 rounded-[2rem] shadow-2xl border-4 border-white overflow-hidden\"></div></div><div class=\"p-12 flex-1 flex flex-col\"><div class=\"flex justify-between items-start mb-8\"><span class=\"status-badge ${b.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}\">${b.is_active ? 'Active' : 'Inactive'}</span><button onclick='openBranchModal(${JSON.stringify(b)})' class=\"text-blue-500 font-black text-[11px] uppercase hover:underline flex items-center gap-1 italic\">რედაქტირება</button></div><h3 class=\"text-5xl font-black text-slate-900 leading-none mb-3 italic tracking-tighter uppercase\">${b.name}</h3><p class=\"text-xs text-slate-400 font-bold mb-12 flex items-center gap-2 uppercase tracking-widest\">📍 ${b.address || 'მისამართი არაა'}</p><div class=\"flex gap-4 mt-auto\"><button onclick='viewAssets(${JSON.stringify(b)})' class=\"flex-[2] bg-slate-900 text-white font-black py-4 rounded-3xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition\">აგრეგატები (ASSETS)</button><button onclick='deleteData(\"branches\", \"${b.id}\")' class=\"bg-red-50 text-red-500 p-4 rounded-3xl hover:bg-red-500 hover:text-white transition\"><i data-lucide=\"trash-2\" class=\"w-5 h-5\"></i></button></div></div></div>`).join(''); data.forEach((b, i) => { if (b.lat && b.lng) { const m = L.map(`map-${i}`, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([b.lat, b.lng], 15); L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m); L.marker([b.lat, b.lng]).addTo(m); } }); lucide.createIcons(); }
async function saveBranch() { const id = document.getElementById('b-id').value; const file = document.getElementById('b-file').files[0]; let imageUrl = document.getElementById('b-url').value; if (file) imageUrl = await uploadToStorage(file, 'branches'); const payload = { customer_id: activeCustomer.id, name: document.getElementById('b-name').value.trim(), is_active: document.getElementById('b-active').value === 'true', address: document.getElementById('b-address').value, lat: parseFloat(document.getElementById('b-lat').value), lng: parseFloat(document.getElementById('b-lng').value), image_url: imageUrl, contact_person: document.getElementById('b-pers').value, contact_phone: document.getElementById('b-phon').value }; const { error } = id ? await _supabase.from('branches').update(payload).eq('id', id) : await _supabase.from('branches').insert([payload]); if (!error) { closeModals(); loadBranches(); } else { alert(error.message); } }
async function saveAsset() { const id = document.getElementById('a-id').value; const file = document.getElementById('a-file').files[0]; let imageUrl = document.getElementById('a-url').value; if (file) imageUrl = await uploadToStorage(file, 'assets_units'); let techSpecs = {}; try { techSpecs = JSON.parse(document.getElementById('a-tech').value); } catch(e) {} const payload = { branch_id: activeBranch.id, customer_id: activeCustomer.id, name: document.getElementById('a-name').value, asset_type: document.getElementById('a-type').value, brand: document.getElementById('a-brand').value, model: document.getElementById('a-model').value, image_url: imageUrl, technical_specs: techSpecs, status: document.getElementById('a-status').value }; const { error } = id ? await _supabase.from('assets').update(payload).eq('id', id) : await _supabase.from('assets').insert([payload]); if (!error) { closeModals(); loadAssets(); } else { alert(error.message); } }
async function loadServiceLogs() { const { data, error } = await _supabase.from('service_logs').select('*').eq('asset_id', activeAsset.id).order('service_date', { ascending: false }); if (error) return; document.getElementById('service-logs-list').innerHTML = data.map(log => `<div class=\"bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-8 relative group\"><div class=\"md:w-48 text-center flex flex-col items-center justify-center border-r border-slate-50 pr-8\"><span class=\"text-3xl font-black text-slate-900 italic leading-none\">${new Date(log.service_date).toLocaleDateString('ka-GE', {day:'2-digit', month:'short'})}</span></div><div class=\"flex-1\"><div class=\"flex justify-between mb-4\"><h4 class=\"text-xl font-black italic text-slate-800 uppercase tracking-tighter\">${log.technician_name}</h4></div><p class=\"text-sm text-slate-600 font-medium mb-6 leading-relaxed\">${log.job_description}</p></div></div>`).join(''); lucide.createIcons(); }
async function saveServiceLog() { const payload = { asset_id: activeAsset.id, branch_id: activeBranch.id, technician_name: document.getElementById('sl-tech').value, service_date: document.getElementById('sl-date').value, service_type: document.getElementById('sl-type').value, job_description: document.getElementById('sl-desc').value, media_urls: uploadedMediaUrls }; const { error } = await _supabase.from('service_logs').insert([payload]); if (!error) { closeModals(); loadServiceLogs(); } else { alert("შეცდომა შენახვისას: " + error.message); } }
async function deleteData(table, id) { if (confirm('ნამდვილად გსურთ წაშლა?')) { const { error } = await _supabase.from(table).delete().eq('id', id); if (!error) { if (table === 'customers') loadCustomers(); else if (table === 'branches') loadBranches(); else if (table === 'assets') loadAssets(); else loadServiceLogs(); } } }
