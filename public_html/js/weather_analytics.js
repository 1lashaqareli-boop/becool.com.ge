/* ============================================================
   BECOOL CRM — weather_analytics.js v2
   
   ✅ loadBdcStats() → სტატისტიკა ტაბი (Supabase weather_logs)
   ✅ loadBdcWeatherAnalytics() → ამინდი ტაბი (OpenWeather API
      + ისტორიული მონაცემები + პროგნოზი + HVAC რისკი)
   
   branch_dashboard.js-ში switchBdcTab-ს დაამატეთ:
   if (name==='weather') loadBdcWeatherAnalytics();
   ============================================================ */


/* ──────────────────────────────────────────────────────────────
   გლობალური Chart instances
   ────────────────────────────────────────────────────────────── */
let _weatherChart  = null;
let _forecastChart = null;


/* ══════════════════════════════════════════════════════════════
   loadBdcWeatherAnalytics()
   "ამინდი" ტაბის მთავარი ჩამტვირთველი
   ══════════════════════════════════════════════════════════════ */
async function loadBdcWeatherAnalytics() {
    const panel = document.getElementById('bdcp-weather');
    if (!panel) return;

    panel.innerHTML = `<div class="space-y-4">

        <!-- ═══ HERO: მიმდინარე ამინდი ═══ -->
        <div id="wa-hero" class="relative rounded-[1.5rem] overflow-hidden shadow-lg" style="min-height:160px;">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900"></div>
            <div id="wa-hero-bg" class="absolute inset-0 opacity-20" style="background-image:url('');background-size:cover;background-position:center;"></div>
            <div class="relative z-10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <!-- მარცხენა: ტემპ + desc -->
                <div class="flex items-center gap-4">
                    <img id="wa-icon" src="" class="w-20 h-20 drop-shadow-xl" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
                    <div>
                        <div class="flex items-baseline gap-2">
                            <span id="wa-temp" class="text-6xl font-black text-white" style="letter-spacing:-3px;">—</span>
                            <span class="text-2xl text-blue-300 font-light">°C</span>
                        </div>
                        <p id="wa-desc" class="text-blue-200 capitalize font-medium text-sm mt-1">იტვირთება...</p>
                        <p id="wa-loc-name" class="text-blue-400 text-[10px] uppercase tracking-widest mt-1"></p>
                    </div>
                </div>
                <!-- მარჯვენა: მეტრიკები -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="text-center">
                        <div id="wa-feels" class="text-xl font-black text-white">—°</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">შეგრძ.</div>
                    </div>
                    <div class="text-center">
                        <div id="wa-hum" class="text-xl font-black text-white">—%</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">ტენ.</div>
                    </div>
                    <div class="text-center">
                        <div id="wa-wind-hero" class="text-xl font-black text-white">— m/s</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">ქარი</div>
                    </div>
                    <div class="text-center">
                        <div id="wa-pressure" class="text-xl font-black text-white">— hPa</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">წნევა</div>
                    </div>
                    <div class="text-center">
                        <div id="wa-vis" class="text-xl font-black text-white">— km</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">ხილვ.</div>
                    </div>
                    <div class="text-center">
                        <div id="wa-clouds" class="text-xl font-black text-white">—%</div>
                        <div class="text-[9px] text-blue-300 uppercase tracking-widest mt-0.5">ღრ.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══ HVAC რისკის ანალიზი ═══ -->
        <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">⚡ HVAC/R რისკის შეფასება — მიმდინარე</p>
            <div id="wa-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="text-xs text-slate-300 italic text-center py-4 col-span-3">იტვირთება...</div>
            </div>
        </div>

        <!-- ═══ 5-დღიანი პროგნოზი ═══ -->
        <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <div class="flex justify-between items-center mb-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">5-დღიანი პროგნოზი</p>
                <span class="text-[10px] text-slate-300">OpenWeatherMap</span>
            </div>
            <!-- დღეების ბარათები -->
            <div id="wa-forecast-cards" class="grid grid-cols-5 gap-2 mb-5">
                ${Array(5).fill(0).map(()=>`
                    <div class="bg-slate-50 rounded-2xl p-3 text-center animate-pulse">
                        <div class="h-3 bg-slate-200 rounded mb-2 mx-auto w-3/4"></div>
                        <div class="h-8 bg-slate-200 rounded mb-2 mx-auto w-8"></div>
                        <div class="h-4 bg-slate-200 rounded mx-auto w-2/3"></div>
                    </div>
                `).join('')}
            </div>
            <!-- პროგნოზის გრაფიკი -->
            <div style="position:relative;height:180px;">
                <canvas id="forecast-chart"></canvas>
            </div>
        </div>

        <!-- ═══ ისტორიული ანალიტიკა (Supabase weather_logs) ═══ -->
        <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">📊 ისტორიული ამინდი — <span id="wa-branch-name" class="text-blue-500"></span></p>
                <div class="flex gap-2 flex-wrap">
                    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
                        <button onclick="setWaPeriod(7,this)"  class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">7დ</button>
                        <button onclick="setWaPeriod(30,this)" class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">30დ</button>
                        <button onclick="setWaPeriod(90,this)" class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">90დ</button>
                    </div>
                    <select id="wa-metric" onchange="refreshWaChart()"
                        class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 bg-slate-50">
                        <option value="temp_c">🌡 ტემპ. °C</option>
                        <option value="humidity">💧 ტენ. %</option>
                        <option value="wind_speed">💨 ქარი m/s</option>
                    </select>
                </div>
            </div>

            <!-- KPI -->
            <div id="wa-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div class="col-span-4 text-xs text-slate-300 italic text-center py-4">weather_logs ჩაიტვირთება...</div>
            </div>

            <!-- ისტორიის გრაფიკი -->
            <div style="position:relative;height:200px;" class="mb-5">
                <canvas id="weather-chart"></canvas>
            </div>

            <!-- ისტ. რისკი -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ისტორიული რისკის ანალიზი</p>
                <div id="wa-hist-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
            </div>
        </div>

        <!-- ═══ HVAC/R ექსპლუატაციის რჩევები ═══ -->
        <div id="wa-tips" class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">🛠 HVAC/R ექსპლუატაციის რეკომენდაციები</p>
            <div id="wa-tips-content" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 italic">
                იტვირთება...
            </div>
        </div>

    </div>`;

    document.getElementById('wa-branch-name').textContent = activeBranch?.name || '';

    /* Chart.js */
    if (typeof Chart === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload = () => _initWaAll();
        document.head.appendChild(s);
    } else {
        await _initWaAll();
    }
}


/* ──────────────────────────────────────────────────────────────
   _initWaAll() — ყველაფრის ინიციალიზაცია
   ────────────────────────────────────────────────────────────── */
async function _initWaAll() {
    const lat = activeBranch?.lat;
    const lng = activeBranch?.lng;

    if (!lat || !lng) {
        document.getElementById('wa-risks').innerHTML =
            '<div class="col-span-3 text-xs text-amber-500 italic text-center py-4">⚠ ფილიალს კოორდინატები არ აქვს. მისამართის ველში ჩაწერეთ და შეინახეთ.</div>';
        return;
    }

    /* პარალელურად: მიმდინარე + პროგნოზი + ისტორია */
    await Promise.all([
        _loadCurrentWeather(lat, lng),
        _loadForecast(lat, lng),
        refreshWaChart(),
    ]);
}


/* ──────────────────────────────────────────────────────────────
   _loadCurrentWeather(lat, lng)
   ────────────────────────────────────────────────────────────── */
const _OWK = 'a155a131748709196243b52b5bf35b53';

async function _loadCurrentWeather(lat, lng) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${_OWK}&units=metric&lang=ka`
        );
        if (!res.ok) throw new Error(res.status);
        const w = await res.json();

        const temp   = Math.round(w.main.temp);
        const feels  = Math.round(w.main.feels_like);
        const hum    = w.main.humidity;
        const wind   = w.wind.speed.toFixed(1);
        const pres   = w.main.pressure;
        const vis    = w.visibility ? (w.visibility/1000).toFixed(1) : '—';
        const clouds = w.clouds?.all ?? '—';
        const desc   = w.weather[0].description;
        const icon   = `https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;

        document.getElementById('wa-temp').textContent     = temp;
        document.getElementById('wa-feels').textContent    = feels+'°';
        document.getElementById('wa-hum').textContent      = hum+'%';
        document.getElementById('wa-wind-hero').textContent= wind+' m/s';
        document.getElementById('wa-pressure').textContent = pres+' hPa';
        document.getElementById('wa-vis').textContent      = vis+' km';
        document.getElementById('wa-clouds').textContent   = clouds+'%';
        document.getElementById('wa-desc').textContent     = desc;
        document.getElementById('wa-loc-name').textContent = w.name || '';
        document.getElementById('wa-icon').src             = icon;

        /* hero ფერი ტემპერატურის მიხედვით */
        const hero = document.getElementById('wa-hero');
        if (temp >= 35)       hero.style.background = 'linear-gradient(135deg,#7f1d1d,#991b1b,#1e293b)';
        else if (temp >= 25)  hero.style.background = 'linear-gradient(135deg,#92400e,#b45309,#1e293b)';
        else if (temp >= 15)  hero.style.background = 'linear-gradient(135deg,#1e3a5f,#1d4ed8,#0f172a)';
        else if (temp >= 5)   hero.style.background = 'linear-gradient(135deg,#164e63,#0891b2,#0f172a)';
        else                  hero.style.background = 'linear-gradient(135deg,#1e3a5f,#312e81,#0f172a)';

        /* HVAC რისკის ანალიზი */
        _renderCurrentRisks(temp, hum, wind, pres);
        /* რეკომენდაციები */
        _renderHvacTips(temp, hum, parseFloat(wind));

    } catch(e) {
        document.getElementById('wa-desc').textContent = 'ამინდი მიუწვდომელია';
    }
}


/* ──────────────────────────────────────────────────────────────
   _renderCurrentRisks — მიმდინარე ამინდის HVAC/R რისკები
   ────────────────────────────────────────────────────────────── */
function _renderCurrentRisks(temp, hum, wind, pres) {
    const risks = [];

    /* კომპრესორის გადატვირთვა */
    const compRisk = temp >= 38 ? 'critical' : temp >= 32 ? 'high' : temp >= 25 ? 'medium' : 'ok';
    risks.push({
        icon: '🌡',
        title: 'კომპრესორის დატვირთვა',
        level: compRisk,
        detail: temp >= 38
            ? `${temp}°C — გადახურების საფრთხე! კონდენსაციის ტემპ. ↑↑`
            : temp >= 32
            ? `${temp}°C — მაღალი დატვირთვა, EER ↓ ~${Math.round((temp-25)*0.8)}%`
            : temp >= 25
            ? `${temp}°C — ნორმალური სამუშაო რეჟიმი`
            : `${temp}°C — ოპტიმალური პირობები`,
        action: temp >= 32 ? 'კონდენსატორის გამწმენდი ვენტილატორი შეამოწმეთ' : null,
    });

    /* ტენიანობა / კოროზია */
    const humRisk = hum >= 85 ? 'critical' : hum >= 70 ? 'high' : hum >= 55 ? 'medium' : 'ok';
    risks.push({
        icon: '💧',
        title: 'ტენიანობის რისკი',
        level: humRisk,
        detail: hum >= 85
            ? `${hum}% — კოროზიის, მოლეს, ელ. გაბინძურების საფრთხე`
            : hum >= 70
            ? `${hum}% — გაზრდილი ტენი, დრენაჟი შეამოწმეთ`
            : hum >= 55
            ? `${hum}% — ოდნავ მომატებული, მონიტორინგი`
            : `${hum}% — ნორმა`,
        action: hum >= 70 ? 'კონდენსატის სადრენაჟე სისტემა, ფილტრები' : null,
    });

    /* ყინვის/გაყინვის საფრთხე */
    const frostRisk = temp <= -5 ? 'critical' : temp <= 0 ? 'high' : temp <= 5 ? 'medium' : 'ok';
    risks.push({
        icon: '❄',
        title: 'ყინვის რისკი',
        level: frostRisk,
        detail: temp <= -5
            ? `${temp}°C — გაყინვის საფრთხე! მილები, ექსპ. ვალვები`
            : temp <= 0
            ? `${temp}°C — ყინვა! Anti-freeze შეამოწმეთ`
            : temp <= 5
            ? `${temp}°C — გაყინვის ზღვარი, ყურადღება`
            : 'ყინვის საფრთხე არ არის',
        action: temp <= 5 ? 'Crankcase heater, ანტიფრიზი, მილის იზოლაცია' : null,
    });

    const levelCfg = {
        critical: { bg:'bg-red-50',   border:'border-red-300',   text:'text-red-700',   badge:'bg-red-600 text-white',   label:'⛔ კრიტიკული' },
        high:     { bg:'bg-amber-50', border:'border-amber-300', text:'text-amber-700', badge:'bg-amber-500 text-white', label:'⚠ მაღალი' },
        medium:   { bg:'bg-yellow-50',border:'border-yellow-200',text:'text-yellow-700',badge:'bg-yellow-400 text-white',label:'🔶 საშუალო' },
        ok:       { bg:'bg-green-50', border:'border-green-200', text:'text-green-700', badge:'bg-green-500 text-white', label:'✓ ნორმა' },
    };

    document.getElementById('wa-risks').innerHTML = risks.map(r => {
        const cfg = levelCfg[r.level];
        return `
            <div class="border rounded-2xl p-4 ${cfg.bg} ${cfg.border}">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${r.icon}</span>
                        <span class="text-[10px] font-black uppercase tracking-widest ${cfg.text}">${r.title}</span>
                    </div>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}">${cfg.label}</span>
                </div>
                <p class="text-xs font-medium ${cfg.text} mb-${r.action?'2':'0'}">${r.detail}</p>
                ${r.action ? `<div class="text-[10px] text-slate-500 bg-white/60 rounded-lg p-2 border border-white">🔧 ${r.action}</div>` : ''}
            </div>
        `;
    }).join('');
}


/* ──────────────────────────────────────────────────────────────
   _renderHvacTips — ექსპლუატაციის რეკომენდაციები
   ────────────────────────────────────────────────────────────── */
function _renderHvacTips(temp, hum, wind) {
    const tips = [];

    if (temp >= 30) tips.push({
        cat: '🌡 კონდენსატორი',
        tip: `${temp}°C-ზე კონდენსაციის ტემპ. იზრდება ~${Math.round(temp*1.2+5)}°C-მდე. შეამოწმეთ fin-ების სისუფთავე და air flow. dirty condenser-ზე EER 20-40%-ით იკლებს.`,
        urgent: temp >= 35,
    });

    if (hum >= 65) tips.push({
        cat: '💧 დრენაჟი',
        tip: `${hum}% ტენიანობაზე კონდენსატის დებიტი მნიშვნელოვნად იზრდება. condensate pan-ი და drain line-ი შეამოწმეთ막막막 막 막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막막მდე. Biofilm-ის, მოლეს ზრდის თავიდან ასაცილებლად UV lamp-ი ან biocide tablets.`,
        urgent: hum >= 70,
    });

    if (temp >= 28 || temp <= 5) tips.push({
        cat: '🔧 სამუშაო წნევა',
        tip: `${temp}°C ტემპ-ზე: R410A-სთვის კონდ. წნევა ≈ ${Math.round(temp * 0.42 + 10)} Bar(g). შეუდარეთ პ-ენტალპიის დიაგრამას — ნებისმიერი გადახრა 10%-ზე მეტი ნიშნავს გაჟონვას ან dirty coil-ს.`,
        urgent: false,
    });

    if (parseFloat(wind) >= 8) tips.push({
        cat: '💨 ქარის გავლენა',
        tip: `${wind} m/s ქარი — roof-mounted unit-ებზე air flow-ი შეიცვლება. Coil-ის ეფექტურობა ↑ (cold), მაგრამ ვიბრაცია ↑↑. Anti-vibration mount-ები შეამოწმეთ, გამოდის outlet-ები wind direction-ის წინ.`,
        urgent: parseFloat(wind) >= 12,
    });

    tips.push({
        cat: '📋 ზოგადი',
        tip: 'ყოველი PPM-ის წინ: superheating 4-8K, subcooling 4-6K, compressor amp draw ±10% nameplate-ისა. ამინდის ცვლილება ±10°C 24სთ-ში ნიშნავს pressure ratio-ს მკვეთრ ცვლილებას.',
        urgent: false,
    });

    document.getElementById('wa-tips-content').innerHTML = tips.map(t => `
        <div class="rounded-2xl border p-4 ${t.urgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}">
            <div class="text-[10px] font-black uppercase tracking-widest ${t.urgent ? 'text-red-600' : 'text-slate-500'} mb-2">${t.cat}${t.urgent ? ' ⚠' : ''}</div>
            <p class="text-[11px] leading-relaxed ${t.urgent ? 'text-red-700' : 'text-slate-600'}">${t.tip}</p>
        </div>
    `).join('');
}


/* ──────────────────────────────────────────────────────────────
   _loadForecast — 5-დღიანი პროგნოზი
   ────────────────────────────────────────────────────────────── */
async function _loadForecast(lat, lng) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${_OWK}&units=metric&lang=ka&cnt=40`
        );
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        /* ვჯგუფავთ დღის მიხედვით (00:00 UTC) */
        const days = {};
        data.list.forEach(item => {
            const d = item.dt_txt.split(' ')[0];
            if (!days[d]) days[d] = [];
            days[d].push(item);
        });

        const dayKeys = Object.keys(days).slice(0, 5);

        /* დღეების ბარათები */
        const dayNames = ['კვი','ორშ','სამ','ოთხ','ხუთ','პარ','შაბ'];
        const cardsHTML = dayKeys.map(dk => {
            const items   = days[dk];
            const temps   = items.map(i => i.main.temp);
            const tMax    = Math.round(Math.max(...temps));
            const tMin    = Math.round(Math.min(...temps));
            const hum     = Math.round(items.reduce((s,i) => s+i.main.humidity, 0) / items.length);
            const icon    = items[Math.floor(items.length/2)].weather[0].icon;
            const dayNum  = new Date(dk).getDay();
            const dayLabel = dayNames[dayNum];
            const dateLabel = new Date(dk).toLocaleDateString('ka-GE',{day:'2-digit',month:'short'});

            /* ვიზუალური სიგრძე კასდომობისთვის */
            const riskColor = tMax >= 35 ? 'bg-red-100 border-red-200' : tMax >= 25 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100';

            return `
                <div class="rounded-2xl border p-3 text-center ${riskColor}">
                    <div class="text-[10px] font-black text-slate-500 uppercase">${dayLabel}</div>
                    <div class="text-[9px] text-slate-400 mb-2">${dateLabel}</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-10 h-10 mx-auto">
                    <div class="font-black text-slate-900 text-sm">${tMax}°</div>
                    <div class="text-slate-400 text-[10px]">${tMin}°</div>
                    <div class="text-[9px] text-blue-500 mt-1">💧${hum}%</div>
                </div>
            `;
        }).join('');
        document.getElementById('wa-forecast-cards').innerHTML = cardsHTML;

        /* პროგნოზის გრაფიკი — ყოველ 3სთ */
        const chartItems = data.list.slice(0, 16); /* 48სთ */
        const labels = chartItems.map(i =>
            new Date(i.dt_txt).toLocaleString('ka-GE', {day:'2-digit', hour:'2-digit', minute:'2-digit'})
        );
        const tempData = chartItems.map(i => i.main.temp.toFixed(1));
        const humData  = chartItems.map(i => i.main.humidity);

        if (_forecastChart) { _forecastChart.destroy(); _forecastChart = null; }

        const ctx = document.getElementById('forecast-chart');
        if (ctx && typeof Chart !== 'undefined') {
            _forecastChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'ტემპ. °C',
                            data: tempData,
                            borderColor: '#f97316',
                            backgroundColor: '#f9731618',
                            borderWidth: 2.5,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y',
                        },
                        {
                            label: 'ტენ. %',
                            data: humData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            pointRadius: 0,
                            tension: 0.4,
                            yAxisID: 'y1',
                            borderDash: [4,3],
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position:'top', labels:{ font:{size:10}, boxWidth:12 } },
                        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y?.toFixed(1)}` } }
                    },
                    scales: {
                        x: { ticks:{ maxTicksLimit:8, font:{size:9}, color:'#94a3b8' }, grid:{ display:false } },
                        y: {
                            type:'linear', position:'left',
                            ticks:{ font:{size:10}, color:'#f97316' },
                            grid:{ color:'#f1f5f9' }
                        },
                        y1: {
                            type:'linear', position:'right',
                            min:0, max:100,
                            ticks:{ font:{size:10}, color:'#3b82f6' },
                            grid:{ display:false }
                        }
                    }
                }
            });
        }

    } catch(e) {
        console.warn('forecast error:', e);
    }
}


/* ══════════════════════════════════════════════════════════════
   ისტორიული ანალიტიკა (Supabase weather_logs)
   ══════════════════════════════════════════════════════════════ */
window._waPeriod = 30;

function setWaPeriod(days, btn) {
    window._waPeriod = days;
    document.querySelectorAll('.wa-period-btn').forEach(b => {
        b.classList.remove('bg-white','text-slate-900','shadow-sm');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('bg-white','text-slate-900','shadow-sm');
    btn.classList.remove('text-slate-400');
    refreshWaChart();
}

async function refreshWaChart() {
    const days   = window._waPeriod || 30;
    const metric = document.getElementById('wa-metric')?.value || 'temp_c';
    const since  = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await _supabase
        .from('weather_logs')
        .select('logged_at,temp_c,feels_like,humidity,wind_speed,weather_main,pressure')
        .eq('branch_id', activeBranch.id)
        .gte('logged_at', since)
        .order('logged_at', { ascending: true });

    if (error || !data) return;

    if (!data || data.length === 0) {
        document.getElementById('wa-kpis').innerHTML = `
            <div class="col-span-4 text-center py-8">
                <div class="text-2xl mb-2">📭</div>
                <p class="text-sm font-medium text-slate-500">weather_logs ცარიელია</p>
                <p class="text-xs text-slate-400 mt-1">Supabase Edge Function ყოველ საათში ჩაწერს</p>
            </div>`;
        return;
    }

    window._waData = data;
    _renderWaKPIs(data);
    _renderWaChart(data, metric);
    _renderHistRisks(data);
}


function _renderWaKPIs(data) {
    const temps = data.map(d=>d.temp_c).filter(v=>v!=null);
    const hums  = data.map(d=>d.humidity).filter(v=>v!=null);
    const winds = data.map(d=>d.wind_speed).filter(v=>v!=null);

    const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '—';
    const min = arr => arr.length ? Math.min(...arr).toFixed(1) : '—';
    const max = arr => arr.length ? Math.max(...arr).toFixed(1) : '—';

    document.getElementById('wa-kpis').innerHTML = `
        <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div class="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">ტემპ. საშ.</div>
            <div class="text-3xl font-black text-amber-800">${avg(temps)}°C</div>
            <div class="text-[10px] text-amber-500 mt-1 flex justify-between"><span>↓${min(temps)}°</span><span>↑${max(temps)}°</span></div>
        </div>
        <div class="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div class="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">ტენ. საშ.</div>
            <div class="text-3xl font-black text-blue-800">${avg(hums)}%</div>
            <div class="text-[10px] text-blue-500 mt-1 flex justify-between"><span>↓${min(hums)}%</span><span>↑${max(hums)}%</span></div>
        </div>
        <div class="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <div class="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1">ქარი საშ.</div>
            <div class="text-3xl font-black text-teal-800">${avg(winds)}</div>
            <div class="text-[10px] text-teal-500 mt-1">m/s · max ${max(winds)}</div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">ჩანაწ.</div>
            <div class="text-3xl font-black text-slate-700">${data.length}</div>
            <div class="text-[10px] text-slate-400 mt-1">${window._waPeriod}დ განმ.</div>
        </div>
    `;
}

function _renderWaChart(data, metric) {
    const cfg = {
        temp_c:     { label:'ტემპ. °C',  color:'#f97316', bg:'#f9731618' },
        humidity:   { label:'ტენ. %',    color:'#3b82f6', bg:'#3b82f618' },
        wind_speed: { label:'ქარი m/s',  color:'#14b8a6', bg:'#14b8a618' },
    }[metric] || { label:'ტემპ. °C', color:'#f97316', bg:'#f9731618' };

    const labels = data.map(d =>
        new Date(d.logged_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
    );
    const values = data.map(d => d[metric] != null ? parseFloat(d[metric].toFixed(1)) : null);

    if (_weatherChart) { _weatherChart.destroy(); _weatherChart = null; }

    const ctx = document.getElementById('weather-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    _weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: cfg.label,
                data: values,
                borderColor: cfg.color,
                backgroundColor: cfg.bg,
                borderWidth: 2,
                pointRadius: data.length > 200 ? 0 : 2,
                pointHoverRadius: 4,
                tension: 0.4,
                fill: true,
                spanGaps: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { display:false },
                tooltip: { callbacks: { label: c => `${cfg.label}: ${c.parsed.y?.toFixed(1)??'—'}` } }
            },
            scales: {
                x: { ticks:{ maxTicksLimit:10, font:{size:10}, color:'#94a3b8' }, grid:{ display:false } },
                y: { ticks:{ font:{size:10}, color:'#94a3b8' }, grid:{ color:'#f1f5f9' } }
            }
        }
    });
}

function _renderHistRisks(data) {
    const hotH  = data.filter(d=>d.temp_c>35).length;
    const coldH = data.filter(d=>d.temp_c<0).length;
    const humH  = data.filter(d=>d.humidity>80).length;

    const card = (isRisk, icon, title, hours, desc, c) => `
        <div class="border rounded-2xl p-4 ${isRisk?c.bg+' '+c.border:'border-slate-100'}">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-base">${icon}</span>
                <span class="text-[10px] font-black uppercase tracking-widest ${isRisk?c.text:'text-slate-400'}">${title}</span>
            </div>
            <div class="text-2xl font-black ${isRisk?c.val:'text-slate-300'} mb-1">${hours} სთ</div>
            <div class="text-[10px] text-slate-400">${desc}</div>
            ${isRisk?`<div class="mt-2 text-[10px] font-bold ${c.text}">⚠ ანალიზი საჭირო</div>`:`<div class="mt-2 text-[10px] text-green-500">✓ ნორმა</div>`}
        </div>`;

    document.getElementById('wa-hist-risks').innerHTML =
        card(hotH>0,  '🌡','ექსტ. სიცხე >35°C', hotH,  'HVAC გადატვირთვის ისტ.',{bg:'bg-red-50',border:'border-red-200',text:'text-red-600',val:'text-red-700'}) +
        card(coldH>0, '❄', 'ყინვა <0°C',         coldH, 'ანტიფრიზის/მილების ისტ.',{bg:'bg-blue-50',border:'border-blue-200',text:'text-blue-600',val:'text-blue-700'}) +
        card(humH>0,  '💧','მაღ. ტენ. >80%',     humH,  'კოროზია/მოლე ისტ.',{bg:'bg-amber-50',border:'border-amber-200',text:'text-amber-600',val:'text-amber-700'});
}


/* ══════════════════════════════════════════════════════════════
   loadBdcStats() — სტატისტიკა ტაბი (Supabase weather_logs)
   ══════════════════════════════════════════════════════════════ */
async function loadBdcStats() {
    const el = document.getElementById('bdcp-stats');
    if (!el) return;

    el.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ამინდის სტატისტიკა — <span id="stats-branch-name" class="text-blue-500"></span>
                    </p>
                    <div class="flex gap-2 flex-wrap">
                        <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
                            <button onclick="setStatsPeriod(7,this)"   class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">7დ</button>
                            <button onclick="setStatsPeriod(30,this)"  class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">30დ</button>
                            <button onclick="setStatsPeriod(90,this)"  class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">90დ</button>
                            <button onclick="setStatsPeriod(365,this)" class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">1წ</button>
                        </div>
                        <select id="stats-metric" onchange="refreshWeatherChart()"
                            class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 bg-slate-50">
                            <option value="temp_c">🌡 ტემპ. °C</option>
                            <option value="humidity">💧 ტენ. %</option>
                            <option value="wind_speed">💨 ქარი m/s</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="stats-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="col-span-4 text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>
            </div>
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <p id="chart-title" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ტემპ. °C</p>
                    <p id="chart-subtitle" class="text-[10px] text-slate-300"></p>
                </div>
                <div style="position:relative;height:200px;">
                    <canvas id="weather-chart"></canvas>
                </div>
            </div>
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">რისკის ანალიზი</p>
                <div id="stats-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
            </div>
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">დღიური summary</p>
                    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
                        <button onclick="setSummaryView('daily',this)"  class="summary-view-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">დღე</button>
                        <button onclick="setSummaryView('weekly',this)" class="summary-view-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">კვ.</button>
                    </div>
                </div>
                <div id="stats-summary" class="overflow-x-auto">
                    <div class="text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>
                </div>
            </div>
        </div>`;

    document.getElementById('stats-branch-name').textContent = activeBranch?.name || '';

    if (typeof Chart === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload = () => refreshWeatherChart();
        document.head.appendChild(s);
    } else {
        await refreshWeatherChart();
    }
}


/* ── კოპია ძველი weather_analytics.js-იდან (stats ტაბისთვის) ── */
window._statsPeriod = 30;

function setStatsPeriod(days, btn) {
    window._statsPeriod = days;
    document.querySelectorAll('.stats-period-btn').forEach(b => {
        b.classList.remove('bg-white','text-slate-900','shadow-sm');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('bg-white','text-slate-900','shadow-sm');
    btn.classList.remove('text-slate-400');
    refreshWeatherChart();
}

let _summaryView = 'daily';
function setSummaryView(view, btn) {
    _summaryView = view;
    document.querySelectorAll('.summary-view-btn').forEach(b => {
        b.classList.remove('bg-white','text-slate-900','shadow-sm');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('bg-white','text-slate-900','shadow-sm');
    btn.classList.remove('text-slate-400');
    renderSummaryTable(window._statsData || []);
}

async function refreshWeatherChart() {
    const days   = window._statsPeriod || 30;
    const metric = document.getElementById('stats-metric')?.value || 'temp_c';
    const since  = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await _supabase
        .from('weather_logs')
        .select('logged_at,temp_c,feels_like,humidity,wind_speed,weather_main,pressure')
        .eq('branch_id', activeBranch.id)
        .gte('logged_at', since)
        .order('logged_at', { ascending: true });

    if (error) {
        document.getElementById('stats-kpis').innerHTML =
            `<div class="col-span-4 text-xs text-red-400 text-center py-4">შეცდომა: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        document.getElementById('stats-kpis').innerHTML = `
            <div class="col-span-4 text-center py-8">
                <div class="text-2xl mb-2">📭</div>
                <p class="text-sm font-medium text-slate-500">მონაცემები ჯერ არ არის</p>
                <p class="text-xs text-slate-400 mt-1">Edge Function ყოველ საათში ჩაწერს</p>
            </div>`;
        return;
    }

    window._statsData = data;
    renderKPIs(data);
    renderChart(data, metric);
    renderRisks(data);
    renderSummaryTable(data);
}

function renderKPIs(data) {
    const temps = data.map(d=>d.temp_c).filter(v=>v!=null);
    const hums  = data.map(d=>d.humidity).filter(v=>v!=null);
    const winds = data.map(d=>d.wind_speed).filter(v=>v!=null);
    const avg = arr => arr.length?(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1):'—';
    const min = arr => arr.length?Math.min(...arr).toFixed(1):'—';
    const max = arr => arr.length?Math.max(...arr).toFixed(1):'—';
    document.getElementById('stats-kpis').innerHTML = `
        <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div class="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-2">ტემპ.</div>
            <div class="text-3xl font-black text-amber-800">${avg(temps)}°C</div>
            <div class="text-[10px] text-amber-500 mt-2 flex justify-between"><span>min ${min(temps)}°</span><span>max ${max(temps)}°</span></div>
        </div>
        <div class="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div class="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">ტენ.</div>
            <div class="text-3xl font-black text-blue-800">${avg(hums)}%</div>
            <div class="text-[10px] text-blue-500 mt-2 flex justify-between"><span>min ${min(hums)}%</span><span>max ${max(hums)}%</span></div>
        </div>
        <div class="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <div class="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-2">ქარი</div>
            <div class="text-3xl font-black text-teal-800">${avg(winds)}</div>
            <div class="text-[10px] text-teal-500 mt-2">m/s · max ${max(winds)}</div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">ჩანაწ.</div>
            <div class="text-3xl font-black text-slate-700">${data.length}</div>
            <div class="text-[10px] text-slate-400 mt-2">${window._statsPeriod}დ განმ.</div>
        </div>`;
}

function renderChart(data, metric) {
    const cfg = {
        temp_c:    {label:'ტემპ. °C',color:'#f97316',bg:'#f9731618'},
        humidity:  {label:'ტენ. %', color:'#3b82f6',bg:'#3b82f618'},
        wind_speed:{label:'ქარი m/s',color:'#14b8a6',bg:'#14b8a618'},
    }[metric]||{label:'ტემპ. °C',color:'#f97316',bg:'#f9731618'};

    const labels = data.map(d=>new Date(d.logged_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}));
    const values = data.map(d=>d[metric]!=null?parseFloat(d[metric].toFixed(1)):null);

    const titleEl = document.getElementById('chart-title');
    const subEl   = document.getElementById('chart-subtitle');
    if (titleEl) titleEl.textContent = cfg.label;
    if (subEl)   subEl.textContent   = `${data.length} ჩანაწ. · ${window._statsPeriod}დ`;

    if (_weatherChart) { _weatherChart.destroy(); _weatherChart = null; }

    const ctx = document.getElementById('weather-chart');
    if (!ctx || typeof Chart==='undefined') return;

    _weatherChart = new Chart(ctx, {
        type:'line',
        data:{labels,datasets:[{label:cfg.label,data:values,borderColor:cfg.color,backgroundColor:cfg.bg,borderWidth:2,pointRadius:data.length>200?0:2,pointHoverRadius:4,tension:0.4,fill:true,spanGaps:true}]},
        options:{
            responsive:true,maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${cfg.label}: ${c.parsed.y?.toFixed(1)??'—'}`}}},
            scales:{
                x:{ticks:{maxTicksLimit:12,font:{size:10},color:'#94a3b8'},grid:{display:false}},
                y:{ticks:{font:{size:10},color:'#94a3b8'},grid:{color:'#f1f5f9'}}
            }
        }
    });
}

function renderRisks(data) {
    const hotH  = data.filter(d=>d.temp_c>35).length;
    const coldH = data.filter(d=>d.temp_c<0).length;
    const humH  = data.filter(d=>d.humidity>80).length;
    const rc = (isR,icon,title,h,desc,c) => `
        <div class="border rounded-2xl p-4 ${isR?c.bg+' '+c.border:'border-slate-100'}">
            <div class="flex items-center gap-2 mb-2"><span class="text-base">${icon}</span>
                <span class="text-[10px] font-black uppercase tracking-widest ${isR?c.text:'text-slate-400'}">${title}</span>
            </div>
            <div class="text-2xl font-black ${isR?c.val:'text-slate-300'} mb-1">${h} სთ</div>
            <div class="text-[10px] text-slate-400">${desc}</div>
            ${isR?`<div class="mt-2 text-[10px] font-bold ${c.text}">⚠ ყურადღება</div>`:`<div class="mt-2 text-[10px] text-green-500">✓ ნორმა</div>`}
        </div>`;
    document.getElementById('stats-risks').innerHTML =
        rc(hotH>0,'🌡','ექსტ. სიცხე (>35°C)',hotH,'HVAC გადატვირთ. ისტ.',{bg:'bg-red-50',border:'border-red-200',text:'text-red-600',val:'text-red-700'})+
        rc(coldH>0,'❄','ყინვა (<0°C)',coldH,'მილები/კომპ. ისტ.',{bg:'bg-blue-50',border:'border-blue-200',text:'text-blue-600',val:'text-blue-700'})+
        rc(humH>0,'💧','მაღ. ტენ. (>80%)',humH,'კოროზია/მოლე ისტ.',{bg:'bg-amber-50',border:'border-amber-200',text:'text-amber-600',val:'text-amber-700'});
}

function renderSummaryTable(data) {
    if (!data||!data.length) return;
    const groups = {};
    data.forEach(d=>{
        const date=new Date(d.logged_at);
        let key;
        if (_summaryView==='weekly') {
            const day=date.getDay(),diff=(day===0?-6:1-day);
            const mon=new Date(date);mon.setDate(date.getDate()+diff);
            key=mon.toISOString().slice(0,10);
        } else key=date.toISOString().slice(0,10);
        if(!groups[key])groups[key]=[];
        groups[key].push(d);
    });
    const avg=arr=>arr.length?(arr.reduce((a,b)=>a+b,0)/arr.length):null;
    const min=arr=>arr.length?Math.min(...arr):null;
    const max=arr=>arr.length?Math.max(...arr):null;
    const fmt=v=>v!=null?v.toFixed(1):'—';
    const rows=Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).slice(0,30)
        .map(([key,items])=>{
            const temps=items.map(i=>i.temp_c).filter(v=>v!=null);
            const hums=items.map(i=>i.humidity).filter(v=>v!=null);
            const winds=items.map(i=>i.wind_speed).filter(v=>v!=null);
            const hotH=items.filter(i=>i.temp_c>35).length;
            const humH=items.filter(i=>i.humidity>80).length;
            const label=_summaryView==='weekly'
                ?`კვ. ${new Date(key).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`
                :new Date(key).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'});
            return {label,temps,hums,winds,hotH,humH,count:items.length};
        });
    document.getElementById('stats-summary').innerHTML=`
        <table class="w-full text-xs border-collapse min-w-[600px]">
            <thead><tr class="border-b border-slate-100">
                <th class="text-left font-medium text-slate-400 py-2 px-3">${_summaryView==='weekly'?'კვირა':'თარიღი'}</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">საშ.°C</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">მინ</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">მაქს</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">ტენ%</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">ქარი</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">🌡>35°</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">💧>80%</th>
                <th class="text-center font-medium text-slate-400 py-2 px-3">ჩანაწ.</th>
            </tr></thead>
            <tbody>${rows.map(r=>`
                <tr class="border-b border-slate-50 hover:bg-slate-50">
                    <td class="py-2 px-3 font-medium text-slate-800">${r.label}</td>
                    <td class="py-2 px-3 text-center ${avg(r.temps)>35?'text-red-600 font-bold':avg(r.temps)<0?'text-blue-600 font-bold':'text-slate-700'}">${fmt(avg(r.temps))}</td>
                    <td class="py-2 px-3 text-center text-slate-500">${fmt(min(r.temps))}</td>
                    <td class="py-2 px-3 text-center text-slate-500">${fmt(max(r.temps))}</td>
                    <td class="py-2 px-3 text-center ${avg(r.hums)>80?'text-amber-600 font-bold':'text-slate-500'}">${fmt(avg(r.hums))}</td>
                    <td class="py-2 px-3 text-center text-slate-500">${fmt(avg(r.winds))}</td>
                    <td class="py-2 px-3 text-center ${r.hotH>0?'text-red-500 font-bold':'text-slate-300'}">${r.hotH||'—'}</td>
                    <td class="py-2 px-3 text-center ${r.humH>0?'text-amber-500 font-bold':'text-slate-300'}">${r.humH||'—'}</td>
                    <td class="py-2 px-3 text-center text-slate-400">${r.count}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}
