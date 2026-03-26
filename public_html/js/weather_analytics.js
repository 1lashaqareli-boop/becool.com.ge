/* ============================================================
   BECOOL CRM — weather_analytics.js
   ამინდის analytics გვერდი — სტატისტიკა ტაბი

   index.html-ში script tags-ში დაამატე branch_dashboard.js-ის შემდეგ:
   <script src="js/weather_analytics.js"></script>
   ============================================================ */

/* ── გლობალური Chart instance ── */
let _weatherChart = null;


/* ============================================================
   loadBdcStats()
   სტატისტიკა ტაბის მთავარი ჩამტვირთველი
   ============================================================ */
async function loadBdcStats() {
    const el = document.getElementById('bdcp-stats');
    if (!el) return;

    el.innerHTML = `
        <div class="space-y-4">

            <!-- ფილტრების ზოლი -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ამინდის ანალიტიკა — <span id="stats-branch-name" class="text-blue-500"></span></p>
                    <div class="flex gap-2 flex-wrap">
                        <!-- პერიოდი -->
                        <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
                            <button onclick="setStatsPeriod(7,this)"   class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">7დ</button>
                            <button onclick="setStatsPeriod(30,this)"  class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">30დ</button>
                            <button onclick="setStatsPeriod(90,this)"  class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">90დ</button>
                            <button onclick="setStatsPeriod(365,this)" class="stats-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">1წ</button>
                        </div>
                        <!-- მეტრიკა -->
                        <select id="stats-metric" onchange="refreshWeatherChart()"
                            class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 bg-slate-50">
                            <option value="temp_c">🌡 ტემპერატურა °C</option>
                            <option value="humidity">💧 ტენიანობა %</option>
                            <option value="wind_speed">💨 ქარი m/s</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- KPI ბარათები -->
            <div id="stats-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="col-span-4 text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>
            </div>

            <!-- გრაფიკი -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <p id="chart-title" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ტემპერატურა °C</p>
                    <p id="chart-subtitle" class="text-[10px] text-slate-300"></p>
                </div>
                <div style="position:relative;height:200px;">
                    <canvas id="weather-chart"></canvas>
                </div>
            </div>

            <!-- რისკის ანალიზი -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">რისკის ანალიზი</p>
                <div id="stats-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
            </div>

            <!-- დღიური summary ცხრილი -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">დღიური summary</p>
                    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
                        <button onclick="setSummaryView('daily',this)"  class="summary-view-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">დღე</button>
                        <button onclick="setSummaryView('weekly',this)" class="summary-view-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 transition">კვ.</button>
                    </div>
                </div>
                <div id="stats-summary" class="overflow-x-auto">
                    <div class="text-xs text-slate-300 italic text-center py-6">იტვირთება...</div>
                </div>
            </div>

        </div>
    `;

    /* branch სახელი */
    document.getElementById('stats-branch-name').textContent = activeBranch?.name || '';

    /* Chart.js CDN ჩატვირთვა */
    if (typeof Chart === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload = () => refreshWeatherChart();
        document.head.appendChild(s);
    } else {
        await refreshWeatherChart();
    }
}


/* ============================================================
   window._statsPeriod — ამჟამინდელი პერიოდი (დღეებში)
   ============================================================ */
window._statsPeriod = 30;

function setStatsPeriod(days, btn) {
    window._statsPeriod = days;
    /* ღილაკების სტილი */
    document.querySelectorAll('.stats-period-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    btn.classList.remove('text-slate-400');
    refreshWeatherChart();
}

let _summaryView = 'daily';
function setSummaryView(view, btn) {
    _summaryView = view;
    document.querySelectorAll('.summary-view-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-400');
    });
    btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    btn.classList.remove('text-slate-400');
    renderSummaryTable(window._statsData || []);
}


/* ============================================================
   refreshWeatherChart()
   Supabase-იდან მონაცემების წამოღება და ყველა სექციის განახლება
   ============================================================ */
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
        document.getElementById('stats-kpis').innerHTML =
            `<div class="col-span-4 text-center py-8">
                <div class="text-2xl mb-2">📭</div>
                <div class="text-sm font-medium text-slate-500">მონაცემები ჯერ არ არის</div>
                <div class="text-xs text-slate-400 mt-1">Edge Function ყოველ საათში ჩაწერს</div>
            </div>`;
        return;
    }

    window._statsData = data;

    renderKPIs(data);
    renderChart(data, metric);
    renderRisks(data);
    renderSummaryTable(data);
}


/* ============================================================
   renderKPIs(data)
   ============================================================ */
function renderKPIs(data) {
    const temps = data.map(d => d.temp_c).filter(v => v != null);
    const hums  = data.map(d => d.humidity).filter(v => v != null);
    const winds = data.map(d => d.wind_speed).filter(v => v != null);

    const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '—';
    const min = arr => arr.length ? Math.min(...arr).toFixed(1) : '—';
    const max = arr => arr.length ? Math.max(...arr).toFixed(1) : '—';

    document.getElementById('stats-kpis').innerHTML = `
        <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div class="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-2">ტემპერატურა</div>
            <div class="text-3xl font-black text-amber-800">${avg(temps)}°C</div>
            <div class="text-[10px] text-amber-500 mt-2 flex justify-between">
                <span>min ${min(temps)}°</span><span>max ${max(temps)}°</span>
            </div>
        </div>
        <div class="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div class="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">ტენიანობა</div>
            <div class="text-3xl font-black text-blue-800">${avg(hums)}%</div>
            <div class="text-[10px] text-blue-500 mt-2 flex justify-between">
                <span>min ${min(hums)}%</span><span>max ${max(hums)}%</span>
            </div>
        </div>
        <div class="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <div class="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-2">ქარი</div>
            <div class="text-3xl font-black text-teal-800">${avg(winds)}</div>
            <div class="text-[10px] text-teal-500 mt-2">m/s · max ${max(winds)}</div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">ჩანაწერები</div>
            <div class="text-3xl font-black text-slate-700">${data.length}</div>
            <div class="text-[10px] text-slate-400 mt-2">${window._statsPeriod} დღის განმ.</div>
        </div>
    `;
}


/* ============================================================
   renderChart(data, metric)
   ============================================================ */
function renderChart(data, metric) {
    const metricCfg = {
        temp_c:     { label: 'ტემპ. °C',   color: '#f97316', bg: '#f9731618' },
        humidity:   { label: 'ტენ. %',     color: '#3b82f6', bg: '#3b82f618' },
        wind_speed: { label: 'ქარი m/s',   color: '#14b8a6', bg: '#14b8a618' },
    };
    const cfg = metricCfg[metric] || metricCfg.temp_c;

    /* label-ები — თუ მონაცემი ბევრია, ყოველ N-ს ვაჩვენებ */
    const labels = data.map(d =>
        new Date(d.logged_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })
    );
    const values = data.map(d => d[metric] != null ? parseFloat(d[metric].toFixed(1)) : null);

    /* სათაური */
    const titleEl = document.getElementById('chart-title');
    const subEl   = document.getElementById('chart-subtitle');
    if (titleEl) titleEl.textContent = cfg.label;
    if (subEl)   subEl.textContent   = `${data.length} ჩანაწ. · ${window._statsPeriod} დღე`;

    /* ძველი chart გასუფთავება */
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
                borderColor:     cfg.color,
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
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${cfg.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 12,
                        font: { size: 10 },
                        color: '#94a3b8',
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        font: { size: 10 },
                        color: '#94a3b8',
                    },
                    grid: { color: '#f1f5f9' }
                }
            }
        }
    });
}


/* ============================================================
   renderRisks(data)
   ============================================================ */
function renderRisks(data) {
    const hotHours   = data.filter(d => d.temp_c > 35).length;
    const coldHours  = data.filter(d => d.temp_c < 0).length;
    const humidHours = data.filter(d => d.humidity > 80).length;

    const riskCard = (isRisk, icon, title, hours, desc, colors) => `
        <div class="border rounded-2xl p-4 ${isRisk ? colors.bg + ' ' + colors.border : 'border-slate-100'}">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-base">${icon}</span>
                <span class="text-[10px] font-black uppercase tracking-widest ${isRisk ? colors.text : 'text-slate-400'}">${title}</span>
            </div>
            <div class="text-2xl font-black ${isRisk ? colors.val : 'text-slate-300'} mb-1">${hours} სთ</div>
            <div class="text-[10px] text-slate-400">${desc}</div>
            ${isRisk ? `<div class="mt-2 text-[10px] font-bold ${colors.text}">⚠ ყურადღება საჭიროა</div>` : `<div class="mt-2 text-[10px] text-green-500">✓ ნორმა</div>`}
        </div>
    `;

    document.getElementById('stats-risks').innerHTML =
        riskCard(hotHours > 0,   '🌡', 'ექსტ. სიცხე (>35°C)', hotHours,
            'HVAC-ის გადატვირთვის რისკი',
            { bg:'bg-red-50', border:'border-red-200', text:'text-red-600', val:'text-red-700' }) +
        riskCard(coldHours > 0,  '❄', 'ყინვა (<0°C)', coldHours,
            'მილების და კომპრესორის დაზიანება',
            { bg:'bg-blue-50', border:'border-blue-200', text:'text-blue-600', val:'text-blue-700' }) +
        riskCard(humidHours > 0, '💧', 'მაღ. ტენ. (>80%)', humidHours,
            'კოროზია, მოლე, ფილტრების ჩახშობა',
            { bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-600', val:'text-amber-700' });
}


/* ============================================================
   renderSummaryTable(data)
   დღიური ან კვირეული summary ცხრილი
   ============================================================ */
function renderSummaryTable(data) {
    if (!data || data.length === 0) return;

    /* მონაცემების დაჯგუფება */
    const groups = {};
    data.forEach(d => {
        const date = new Date(d.logged_at);
        let key;
        if (_summaryView === 'weekly') {
            /* კვირის დასაწყისი (ორშაბათი) */
            const day = date.getDay();
            const diff = (day === 0 ? -6 : 1 - day);
            const mon = new Date(date); mon.setDate(date.getDate() + diff);
            key = mon.toISOString().slice(0, 10);
        } else {
            key = date.toISOString().slice(0, 10);
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
    });

    const avg  = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;
    const min  = arr => arr.length ? Math.min(...arr) : null;
    const max  = arr => arr.length ? Math.max(...arr) : null;
    const fmt  = v => v != null ? v.toFixed(1) : '—';

    const rows = Object.entries(groups)
        .sort(([a],[b]) => b.localeCompare(a))
        .slice(0, 30)
        .map(([key, items]) => {
            const temps  = items.map(i=>i.temp_c).filter(v=>v!=null);
            const hums   = items.map(i=>i.humidity).filter(v=>v!=null);
            const winds  = items.map(i=>i.wind_speed).filter(v=>v!=null);
            const hotH   = items.filter(i=>i.temp_c>35).length;
            const humH   = items.filter(i=>i.humidity>80).length;
            const label  = _summaryView === 'weekly'
                ? `კვ. ${new Date(key).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`
                : new Date(key).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'});
            return { label, temps, hums, winds, hotH, humH, count: items.length };
        });

    document.getElementById('stats-summary').innerHTML = `
        <table class="w-full text-xs border-collapse min-w-[600px]">
            <thead>
                <tr class="border-b border-slate-100">
                    <th class="text-left font-medium text-slate-400 py-2 px-3">${_summaryView==='weekly'?'კვირა':'თარიღი'}</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">საშ.ტ°C</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">მინ</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">მაქს</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">ტენ%</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">ქარი</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">🌡>35°</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">💧>80%</th>
                    <th class="text-center font-medium text-slate-400 py-2 px-3">ჩანაწ.</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => `
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
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}