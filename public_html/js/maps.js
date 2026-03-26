// --- რუკების ლოგიკა (Leaflet.js) ---

// გლობალური ცვლადები რუკის ობიექტებისთვის
let modalMap = null, modalMarker = null; // მოდალის რუკა და მარკერი
let liveMap = null; // ლაივ რუკა (კლასტერებით)

/**
 * არენდერებს რუკას მოდალის ფანჯარაში (#modal-map).
 * @param {number} lat - საწყისი განედი
 * @param {number} lng - საწყისი გრძედი
 */
function initMap(lat, lng) {
    // თუ რუკა უკვე არსებობს, ვშლით და ვქმნით თავიდან
    if (modalMap) { modalMap.remove(); modalMap = null; }

    // საწყისი კოორდინატების განსაზღვრა (თუ არ მოყვება, თბილისის ცენტრი)
    const fLat = (lat && !isNaN(parseFloat(lat))) ? parseFloat(lat) : 41.7151;
    const fLng = (lng && !isNaN(parseFloat(lng))) ? parseFloat(lng) : 44.8271;

    // მცირე პაუზა, რათა მოდალის HTML ელემენტი მოესწროს გამოჩენას
    setTimeout(() => {
        const mapDiv = document.getElementById('modal-map');
        if (!mapDiv) return; // თუ რუკის კონტეინერი ვერ მოიძებნა, ვჩერდებით

        // Leaflet რუკის ინიციალიზაცია
        modalMap = L.map('modal-map').setView([fLat, fLng], 14);
        // რუკის ვიზუალური სტილის (tile layer) დამატება
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(modalMap);
        // რუკაზე მარკერის დამატება, რომლის გადაადგილებაც შესაძლებელია
        modalMarker = L.marker([fLat, fLng], { draggable: true }).addTo(modalMap);

        // მარკერის გადაადგილების დასრულებისას...
        modalMarker.on('dragend', e => {
            const pos = e.target.getLatLng(); // ვიღებთ ახალ კოორდინატებს
            // ვავსებთ ფორმის ველებს ახალი კოორდინატებით
            document.getElementById('b-lat').value = pos.lat.toFixed(6);
            document.getElementById('b-lng').value = pos.lng.toFixed(6);
        });

        modalMap.invalidateSize(); // რუკის ზომის განახლება, რომ სწორად გამოჩნდეს
    }, 500);
}

/**
 * ხსნის ლაივ რუკის მოდალს და აჩვენებს ყველა ფილიალს კლასტერებად.
 */
async function openLiveMap() {
    document.getElementById('lm-modal').classList.add('active'); // ვაჩენთ რუკის მოდალს
    if (liveMap) { liveMap.remove(); liveMap = null; } // ძველის წაშლა
    
    // აქტიური მომხმარებლის ყველა ფილიალის და აგრეგატის ჩატვირთვა
    const { data: branches, error: bErr } = await _supabase.from('branches').select('*').eq('customer_id', activeCustomer.id);
    const { data: assets, error: aErr } = await _supabase.from('assets').select('branch_id').eq('customer_id', activeCustomer.id);
    
    if (bErr || !branches.length) return; // თუ ფილიალები არ მოიძებნა, ვჩერდებით

    // ვითვლით, რომელ ფილიალში რამდენი აგრეგატია
    const assetCounts = {};
    if (assets) assets.forEach(a => { assetCounts[a.branch_id] = (assetCounts[a.branch_id] || 0) + 1; });

    setTimeout(() => {
        // ლაივ რუკის ინიციალიზაცია
        liveMap = L.map('live-map-container', { zoomControl: false }).setView([41.7151, 44.8271], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }).addTo(liveMap);
        L.control.zoom({ position: 'bottomright' }).addTo(liveMap);

        // კლასტერების ჯგუფის შექმნა (მარკერების დასაჯგუფებლად)
        const clusters = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50, spiderfyOnMaxZoom: true });
        
        branches.forEach(b => {
            if (b.lat && b.lng) { // თუ ფილიალს აქვს კოორდინატები
                const count = assetCounts[b.id] || 0; // აგრეგატების რაოდენობა
                const marker = L.marker([b.lat, b.lng]); // მარკერის შექმნა
                
                // მარკერზე დაკლიკებისას გამოსაჩენი ინფორმაცია (Popup)
                marker.bindPopup(`
                    <div class="p-3 min-w-[200px]">
                        <div class="flex items-center gap-3 mb-3">
                            ${b.image_url ? `<img src="${b.image_url}" class="w-12 h-12 rounded-lg object-cover">` : `<div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 italic">BC</div>`}
                            <div>
                                <h4 class="font-black italic uppercase text-slate-900 leading-tight">${b.name}</h4>
                                <p class="text-[8px] text-slate-400 font-bold uppercase tracking-widest">${b.address || 'მისამართი...'}</p>
                            </div>
                        </div>
                        <div class="bg-blue-600 text-white rounded-xl p-3 flex justify-between items-center shadow-lg shadow-blue-100">
                            <span class="text-[9px] uppercase font-black tracking-widest italic">აგრეგატები</span>
                            <span class="text-xl font-black">${count}</span>
                        </div>
                    </div>
                `, { closeButton: false, className: 'custom-popup' });
                
                clusters.addLayer(marker); // მარკერის დამატება კლასტერში
            }
        });
        
        liveMap.addLayer(clusters); // კლასტერების დამატება რუკაზე
        if (clusters.getLayers().length > 0) liveMap.fitBounds(clusters.getBounds().pad(0.2)); // რუკის მასშტაბირება, რომ ყველა მარკერი გამოჩნდეს
        liveMap.invalidateSize();
    }, 400);
}

/**
 * ეძებს მისამართს OpenStreetMap-ის გამოყენებით და განაახლებს კოორდინატებს ფორმაში.
 */
async function searchAddress() {
    const addr = document.getElementById('b-address').value;
    if (!addr) return alert('ჩაწერეთ მისამართი');

    // Nominatim API-ს გამოძახება მისამართის მოსაძებნად
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`);
    const data = await res.json();
    
    if (data.length > 0) {
        const { lat, lon } = data[0]; // ვიღებთ პირველი შედეგის კოორდინატებს
        // ვავსებთ ფორმის ველებს და ვამოძრავებთ რუკას/მარკერს
        document.getElementById('b-lat').value = parseFloat(lat).toFixed(6);
        document.getElementById('b-lng').value = parseFloat(lon).toFixed(6);
        modalMap.setView([lat, lon], 16);
        modalMarker.setLatLng([lat, lon]);
    }
}
