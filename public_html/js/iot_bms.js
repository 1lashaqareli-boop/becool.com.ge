/* ============================================================
   BECOOL CMMS — iot_bms.js
   ფილიალის IoT/BMS ჩანართი: გენერატორების ცოცხალი სტატუსი,
   ავარიები, ანალიტიკა (7 დღე), მართვის პანელი (ჯერ გამორთული)

   მონაცემები: generator_specs / generator_status /
               generator_alarms / generator_telemetry
   გამოძახება: switchBdcTab('iot') → loadBdcIot()
   ============================================================ */

const IOT_REFRESH_MS   = 10000;   // ცოცხალი სტატუსის განახლება
const IOT_OFFLINE_SEC  = 60;      // ამაზე ძველი მონაცემი = „კავშირი არ არის"
const IOT_MAINS_MIN_V  = 100;     // ქსელი „გათიშულია", თუ საშ. ძაბვა ამაზე ნაკლებია
const IOT_DAYS         = 7;       // ანალიტიკის პერიოდი

let _iotTimer = null;

/* ── ტექსტები ── */
const IOT_MODES = {
    0: { t: 'STOP',   c: 'bg-red-100 text-red-700' },
    1: { t: 'AUTO',   c: 'bg-green-100 text-green-700' },
    2: { t: 'MANUAL', c: 'bg-amber-100 text-amber-700' },
    3: { t: 'TEST',   c: 'bg-blue-100 text-blue-700' },
};
const IOT_OPSTATUS = [
    'მოსვენებაში', 'საწვავის მოლოდინი', 'ძრავის წინასწარი გახურება', 'ზეთის მოლოდინი', 'ქოქვის პაუზა',
    'ქოქვა', 'უქმი ბრუნები', 'ძრავის გათბობა', 'მუშაობს დატვირთვის გარეშე', 'ქსელთან სინქრონიზაცია',
    'დატვირთვის გადატანა გენერატორზე', 'გენ. ამომრთველის ჩართვა', 'გენ. ამომრთველის ტაიმერი',
    'გენერატორი დატვირთვაზე', 'პიკის შემცირება', 'ენერგიის ექსპორტი', 'slave დატვირთვაზე',
    'ქსელთან უკან სინქრონიზაცია', 'დატვირთვის გადატანა ქსელზე', 'ქსელის ამომრთველის ჩართვა',
    'ქსელის ამომრთველის ტაიმერი', 'გაჩერება გაგრილებით', 'გაგრილება', 'გაჩერება უქმ ბრუნებზე',
    'დაუყოვნებლივი გაჩერება', 'ძრავა ჩერდება'
];
const IOT_ALARM_KIND = {
    shutdown: { t: 'გაჩერება',            c: 'bg-red-100 text-red-700' },
    loaddump: { t: 'დატვირთვის მოხსნა',   c: 'bg-orange-100 text-orange-700' },
    warning:  { t: 'გაფრთხილება',         c: 'bg-amber-100 text-amber-700' },
};

/* ── დამხმარეები ── */
const _iotEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const _iotNum = (v, d = 1) => (v === null || v === undefined || isNaN(v)) ? '—' : Number(v).toFixed(d);
const _iotAgo = sec => sec < 60 ? `${Math.round(sec)} წმ წინ` : sec < 3600 ? `${Math.round(sec / 60)} წთ წინ`
                     : sec < 86400 ? `${Math.round(sec / 3600)} სთ წინ` : `${Math.round(sec / 86400)} დღის წინ`;
const _iotDur = ms => { const m = Math.round(ms / 60000); return m < 60 ? `${m} წთ` : `${Math.floor(m / 60)} სთ ${m % 60} წთ`; };
const _iotDate = ts => new Date(ts).toLocaleString('ka-GE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/* Supabase აბრუნებს მაქს. 1000 სტრიქონს — გვერდებად ჩამოტვირთვა */
async function _iotFetchAll(build) {
    const page = 1000; let from = 0, out = [];
    for (;;) {
        const { data, error } = await build().range(from, from + page - 1);
        if (error) { console.error(error); break; }
        out = out.concat(data || []);
        if (!data || data.length < page) break;
        from += page;
    }
    return out;
}

/* ── ანალიტიკა: გათიშვები ტელემეტრიიდან ── */
function _iotOutages(rows) {
    const list = []; let cur = null;
    for (const r of rows) {
        const out = r.mains_v_avg !== null && r.mains_v_avg < IOT_MAINS_MIN_V;
        if (out && !cur) cur = { start: r.ts, maxKw: 0, genOn: false };
        if (out && cur) { cur.maxKw = Math.max(cur.maxKw, r.gen_kw || 0); if ((r.gen_v_avg || 0) > IOT_MAINS_MIN_V) cur.genOn = true; }
        if (!out && cur) { cur.end = r.ts; list.push(cur); cur = null; }
    }
    if (cur) { cur.end = null; list.push(cur); }   // მიმდინარე გათიშვა
    return list;
}
function _iotRunMs(rows) {
    let ms = 0;
    for (let i = 1; i < rows.length; i++) {
        if ((rows[i - 1].gen_v_avg || 0) > IOT_MAINS_MIN_V) {
            const gap = new Date(rows[i].ts) - new Date(rows[i - 1].ts);
            if (gap < 15 * 60000) ms += gap;   // დიდი პაუზა = კავშირის დაკარგვა, არ ვითვლით
        }
    }
    return ms;
}

/* ── მარტივი SVG გრაფიკი ── */
function _iotChart(rows, series, opts = {}) {
    const W = 640, H = 150, P = { l: 34, r: 8, t: 10, b: 20 };
    if (rows.length < 2) return '<div class="text-xs text-slate-300 italic text-center py-8">მონაცემი არ არის</div>';
    const t0 = new Date(rows[0].ts).getTime(), t1 = new Date(rows[rows.length - 1].ts).getTime();
    const vals = rows.flatMap(r => series.map(s => r[s.key]).filter(v => v !== null && v !== undefined));
    const yMax = opts.yMax ?? Math.max(1, ...vals) * 1.1, yMin = opts.yMin ?? 0;
    const x = t => P.l + (t - t0) / (t1 - t0 || 1) * (W - P.l - P.r);
    const y = v => H - P.b - (v - yMin) / (yMax - yMin || 1) * (H - P.t - P.b);
    const grid = [0, 0.5, 1].map(f => { const v = yMin + f * (yMax - yMin); return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#f1f5f9"/><text x="${P.l - 4}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${Math.round(v)}</text>`; }).join('');
    const days = []; for (let d = new Date(t0); d.getTime() <= t1; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    const xlab = days.map(d => `<text x="${x(d.getTime())}" y="${H - 5}" font-size="9" fill="#94a3b8" text-anchor="middle">${d.toLocaleDateString('ka-GE', { day: '2-digit', month: 'short' })}</text>`).join('');
    const lines = series.map(s => {
        const pts = rows.filter(r => r[s.key] !== null && r[s.key] !== undefined).map(r => `${x(new Date(r.ts).getTime()).toFixed(1)},${y(r[s.key]).toFixed(1)}`).join(' ');
        return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }).join('');
    const legend = series.map(s => `<span class="inline-flex items-center gap-1 mr-3"><i class="inline-block w-3 h-0.5" style="background:${s.color}"></i>${s.label}</span>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto">${grid}${xlab}${lines}</svg><div class="text-[10px] text-slate-500 mt-1">${legend}</div>`;
}

/* ════════════════════════════════════════════════════════════
   მთავარი: ჩანართის ჩატვირთვა
   ════════════════════════════════════════════════════════════ */
async function loadBdcIot() {
    /* პანელი — თუ HTML-ში არ არის, ვქმნით სერვისების პანელის შემდეგ */
    let panel = document.getElementById('bdcp-iot');
    if (!panel) {
        const svc = document.getElementById('bdcp-service');
        panel = document.createElement('div');
        panel.id = 'bdcp-iot';
        panel.className = 'bdc-panel';
        svc.parentNode.insertBefore(panel, svc.nextSibling);
    }
    document.querySelectorAll('.bdc-panel').forEach(p => p.classList.add('hidden'));
    panel.classList.remove('hidden');

    panel.innerHTML = '<div class="text-xs text-slate-300 italic text-center py-10">იტვირთება...</div>';

    const { data: gens, error } = await _supabase.from('assets')
        .select('id,name,brand,model,status').eq('branch_id', activeBranch.id).eq('asset_type', 'Generator').order('name');
    if (error) { panel.innerHTML = `<div class="text-xs text-red-500 p-4">შეცდომა: ${_iotEsc(error.message)}</div>`; return; }
    if (!gens?.length) {
        panel.innerHTML = `<div class="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <p class="text-sm text-slate-400 font-medium">ამ ფილიალში IoT მოწყობილობა არ არის</p>
            <p class="text-xs text-slate-300 mt-1">დაამატე გენერატორი: აგრეგატები → ენერგია → გენერატორები</p></div>`;
        return;
    }

    panel.innerHTML = gens.map(g => `<div id="iot-gen-${g.id}" class="mb-4"></div>`).join('');
    for (const g of gens) await _iotRenderGenerator(g, true);

    /* ავტომატური განახლება, სანამ ჩანართი ღიაა */
    clearInterval(_iotTimer);
    _iotTimer = setInterval(async () => {
        const p = document.getElementById('bdcp-iot');
        const dash = document.getElementById('branch-dashboard-view');
        if (!p || p.classList.contains('hidden') || !dash?.classList.contains('active')) { clearInterval(_iotTimer); return; }
        for (const g of gens) await _iotRenderGenerator(g, false);
    }, IOT_REFRESH_MS);
}

/* ── ერთი გენერატორის ბლოკი ── */
async function _iotRenderGenerator(g, withAnalytics) {
    const box = document.getElementById(`iot-gen-${g.id}`);
    if (!box) return;

    const [{ data: st }, { data: spec }, { data: alarms }] = await Promise.all([
        _supabase.from('generator_status').select('*').eq('asset_id', g.id).maybeSingle(),
        _supabase.from('generator_specs').select('*').eq('asset_id', g.id).maybeSingle(),
        _supabase.from('generator_alarms').select('*').eq('asset_id', g.id).order('started_at', { ascending: false }).limit(20),
    ]);

    const live = _iotLiveHtml(g, st, spec);
    const ctrl = _iotControlHtml(st, spec);
    const alm  = _iotAlarmsHtml(alarms || []);

    if (withAnalytics || !box.querySelector('[data-iot-analytics]')) {
        box.innerHTML = `${live}<div class="grid md:grid-cols-2 gap-3 mt-3">${ctrl}${alm}</div>
            <div data-iot-analytics class="mt-3"><div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs text-slate-300 italic text-center">ანალიტიკა იტვირთება...</div></div>`;
        _iotAnalytics(g, spec);
    } else {
        /* განახლებისას ანალიტიკას არ ვეხებით — მხოლოდ ცოცხალ ნაწილს */
        const keep = box.querySelector('[data-iot-analytics]');
        box.innerHTML = `${live}<div class="grid md:grid-cols-2 gap-3 mt-3">${ctrl}${alm}</div>`;
        box.appendChild(keep);
    }
}

/* ── ცოცხალი სტატუსი ── */
function _iotLiveHtml(g, st, spec) {
    const head = (badges) => `<div class="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div><div class="text-base font-bold text-slate-900">${_iotEsc(g.name)}</div>
        <div class="text-[11px] text-slate-400">${_iotEsc([g.brand, g.model, spec?.ctrl_brand && `${spec.ctrl_brand} ${spec.ctrl_model || ''}`].filter(Boolean).join(' · '))}</div></div>
        <div class="flex items-center gap-2 flex-wrap">${badges}</div></div>`;

    if (!st) return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">${head('<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">მონაცემი ჯერ არ მოსულა</span>')}
        <p class="text-xs text-slate-400">ESP32 ჯერ არ ჩაურთავს ან Supabase-ში არ წერს.</p></div>`;

    const ageSec  = (Date.now() - new Date(st.updated_at).getTime()) / 1000;
    const online  = ageSec <= IOT_OFFLINE_SEC;
    const mode    = IOT_MODES[st.unit_mode] || { t: '?', c: 'bg-slate-100 text-slate-500' };
    const mainsV  = [st.mains_v_l1, st.mains_v_l2, st.mains_v_l3];
    const mainsOk = mainsV.every(v => (v ?? 0) > IOT_MAINS_MIN_V);
    const genOn   = (st.rpm ?? 0) > 0 || [st.gen_v_l1, st.gen_v_l2, st.gen_v_l3].some(v => (v ?? 0) > IOT_MAINS_MIN_V);
    const onLoad  = st.op_status === 13 || st.op_status === 16;
    const alarmOn = ['alarm_shutdown', 'alarm_loaddump', 'alarm_warning'].some(k => st[k] && /[1-9A-F]/i.test(st[k]));

    const badges = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${online ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}">${online ? '● ონლაინ' : '○ კავშირი არ არის'} · ${_iotAgo(ageSec)}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${mode.c}">${mode.t}</span>
        ${alarmOn ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ ავარია</span>' : ''}`;

    /* საწვავი → ლიტრი და დარჩენილი საათები */
    const tank = spec?.tank_capacity, cons = spec?.consumption_75, fuel = st.fuel_pct;
    const liters = (tank && fuel !== null) ? tank * fuel / 100 : null;
    const hoursLeft = (liters !== null && cons) ? liters / cons : null;
    const fuelColor = fuel === null ? '#cbd5e1' : fuel < 20 ? '#dc2626' : fuel < 40 ? '#f59e0b' : '#16a34a';

    /* აკუმულატორის ზღვარი სისტემის ძაბვის მიხედვით */
    const batNom = spec?.battery_voltage || ((st.battery_v ?? 0) > 18 ? 24 : 12);
    const batLow = (st.battery_v ?? 99) < (batNom === 24 ? 24.0 : 12.0);

    const tile = (label, value, unit, warn = false) => `<div class="rounded-xl p-3 ${warn ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}">
        <div class="text-[10px] text-slate-400 mb-0.5">${label}</div>
        <div class="text-lg font-bold ${warn ? 'text-red-600' : 'text-slate-900'}">${value}<span class="text-[11px] font-medium text-slate-400 ml-1">${unit}</span></div></div>`;

    const flow = `<div class="flex items-center justify-between gap-2 bg-slate-50 rounded-xl p-3 mb-3 text-center text-[11px]">
        <div class="flex-1"><div class="text-xl">${mainsOk ? '🔌' : '⛔'}</div><div class="font-bold ${mainsOk ? 'text-green-700' : 'text-red-600'}">${mainsOk ? 'ქსელი არის' : 'ქსელი გათიშულია'}</div>
            <div class="text-slate-400">${mainsV.map(v => _iotNum(v, 0)).join(' / ')} V</div></div>
        <div class="text-slate-300 text-lg">${onLoad ? '⟵' : mainsOk ? '⟶' : '·'}</div>
        <div class="flex-1"><div class="text-xl">🏬</div><div class="font-bold text-slate-700">დატვირთვა</div>
            <div class="text-slate-400">${onLoad ? 'გენერატორზე' : mainsOk ? 'ქსელზე' : 'უდენოდ'}</div></div>
        <div class="text-slate-300 text-lg">${onLoad ? '⟵' : '·'}</div>
        <div class="flex-1"><div class="text-xl">${genOn ? '⚙️' : '⏸️'}</div><div class="font-bold ${genOn ? 'text-blue-700' : 'text-slate-500'}">${genOn ? 'გენერატორი მუშაობს' : 'გენერატორი გაჩერებულია'}</div>
            <div class="text-slate-400">${_iotEsc(IOT_OPSTATUS[st.op_status] ?? `სტატუსი ${st.op_status ?? '—'}`)}</div></div>
    </div>`;

    const fuelBar = `<div class="rounded-xl p-3 bg-slate-50 col-span-2">
        <div class="flex justify-between text-[10px] text-slate-400 mb-1"><span>საწვავი</span>
        <span>${liters !== null ? `~${_iotNum(liters, 0)} L` : ''}${hoursLeft !== null ? ` · ~${_iotNum(hoursLeft, 1)} სთ (75%-ზე)` : ''}</span></div>
        <div class="text-lg font-bold text-slate-900">${_iotNum(fuel, 1)}<span class="text-[11px] font-medium text-slate-400 ml-1">%</span></div>
        <div class="h-2 rounded-full bg-slate-200 mt-1 overflow-hidden"><div class="h-2 rounded-full" style="width:${Math.max(0, Math.min(100, fuel ?? 0))}%;background:${fuelColor}"></div></div></div>`;

    return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${online ? '' : 'opacity-80'}">
        ${head(badges)}${flow}
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
            ${fuelBar}
            ${tile('დატვირთვა', _iotNum(genOn ? st.gen_kw : st.mains_kw, 1), 'kW')}
            ${tile('სიხშირე', _iotNum(genOn ? st.gen_hz : st.mains_hz, 2), 'Hz')}
            ${tile('აკუმულატორი', _iotNum(st.battery_v, 2), 'V', batLow)}
            ${tile('ძრავის ტემპ.', _iotNum(st.engine_temp_c, 0), '°C', (st.engine_temp_c ?? 0) > 95)}
            ${tile('ზეთის წნევა', _iotNum(st.oil_bar, 1), 'bar', genOn && (st.oil_bar ?? 9) < 1.5)}
            ${tile('ბრუნები', _iotNum(st.rpm, 0), 'rpm')}
            ${tile('გენ. დენი', [st.gen_i_l1, st.gen_i_l2, st.gen_i_l3].map(v => _iotNum(v, 0)).join('/'), 'A')}
            ${tile('მუშა საათები', _iotNum(st.engine_hours, 1), 'სთ')}
            ${tile('სერვისამდე', `${_iotNum(st.service_hours_left, 0)} სთ`, `/ ${_iotNum(st.service_days_left, 0)} დღე`, (st.service_hours_left ?? 999) < 20)}
            ${tile('გაშვებები', _iotNum(st.genset_runs, 0), '')}
        </div></div>`;
}

/* ── მართვის პანელი (ჯერ გამორთული) ── */
function _iotControlHtml(st, spec) {
    const enabled = spec?.remote_control_enabled === true;
    const btn = (t, cls) => `<button disabled class="text-xs font-bold px-3 py-2 rounded-xl border ${cls} opacity-40 cursor-not-allowed">${t}</button>`;
    return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">დისტანციური მართვა</p>
        <div class="flex flex-wrap gap-2 mb-3">
            ${btn('AUTO', 'border-green-300 text-green-700')}
            ${btn('ტესტი → AUTO', 'border-blue-300 text-blue-700')}
            ${btn('გაჩერება → AUTO', 'border-slate-300 text-slate-700')}
            ${btn('STOP რეჟიმი', 'border-red-300 text-red-700')}
        </div>
        <div class="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3">
            ${enabled ? 'მართვა პასპორტში ჩართულია, მაგრამ ბრძანებების სისტემა ჯერ არ არის აწყობილი.'
                      : '🔒 მართვა გამორთულია. ჩაირთვება ავტორიზაციის (Supabase Auth) და უსაფრთხოების შემოწმებების შემდეგ.'}
            ${spec?.manual_override_switches ? '<div class="mt-2 text-amber-700">⚠ პანელზე ხელის გადამრთველებია — ადგილზე შეიძლება კონტროლერის გვერდის ავლით იყოს გადართული.</div>' : ''}
            ${st && st.unit_mode !== 1 ? `<div class="mt-2 text-amber-700">⚠ კონტროლერი არ არის AUTO რეჟიმში — ავარიული გაშვება ავტომატურად არ მოხდება.</div>` : ''}
        </div></div>`;
}

/* ── ავარიები ── */
function _iotAlarmsHtml(alarms) {
    const active = alarms.filter(a => !a.cleared_at);
    const past   = alarms.filter(a => a.cleared_at).slice(0, 5);
    const row = (a, isActive) => {
        const k = IOT_ALARM_KIND[a.kind] || { t: a.kind, c: 'bg-slate-100 text-slate-500' };
        const dur = isActive ? _iotDur(Date.now() - new Date(a.started_at)) : _iotDur(new Date(a.cleared_at) - new Date(a.started_at));
        return `<div class="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 text-[11px]">
            <span class="flex items-center gap-2"><span class="font-bold px-1.5 py-0.5 rounded-full text-[9px] ${k.c}">${k.t}</span>ბიტი ${a.bit}</span>
            <span class="text-slate-400 whitespace-nowrap">${_iotDate(a.started_at)} · ${isActive ? 'აქტიური ' : ''}${dur}</span></div>`;
    };
    return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ავარიები</p>
        ${active.length ? active.map(a => row(a, true)).join('') : '<div class="text-[11px] text-green-700 bg-green-50 rounded-xl p-2 mb-2">✓ აქტიური ავარია არ არის</div>'}
        ${past.length ? `<div class="text-[10px] text-slate-400 mt-3 mb-1">ბოლო გასწორებული</div>${past.map(a => row(a, false)).join('')}` : ''}
        <div class="text-[10px] text-slate-300 mt-2">ბიტების სახელები დაემატება Datakom-ის დოკუმენტაციიდან</div></div>`;
}

/* ── ანალიტიკა: 7 დღე ── */
async function _iotAnalytics(g, spec) {
    const box = document.querySelector(`#iot-gen-${g.id} [data-iot-analytics]`);
    if (!box) return;
    const since = new Date(Date.now() - IOT_DAYS * 86400000).toISOString();
    const rows = await _iotFetchAll(() => _supabase.from('generator_telemetry')
        .select('ts,mains_v_avg,gen_v_avg,gen_kw,fuel_pct,engine_temp_c,battery_v')
        .eq('asset_id', g.id).gte('ts', since).order('ts', { ascending: true }));

    const outages = _iotOutages(rows);
    const totalOutMs = outages.reduce((s, o) => s + ((o.end ? new Date(o.end) : new Date()) - new Date(o.start)), 0);
    const runMs = _iotRunMs(rows);
    const fuelVals = rows.map(r => r.fuel_pct).filter(v => v !== null);
    const fuelUsedPct = fuelVals.length > 1 ? Math.max(0, fuelVals[0] - fuelVals[fuelVals.length - 1]) : null;
    const fuelUsedL = (fuelUsedPct !== null && spec?.tank_capacity) ? spec.tank_capacity * fuelUsedPct / 100 : null;
    const noStart = outages.filter(o => !o.genOn).length;

    const kpi = (l, v, warn = false) => `<div class="rounded-xl p-3 ${warn ? 'bg-red-50' : 'bg-slate-50'}"><div class="text-[10px] text-slate-400">${l}</div><div class="text-base font-bold ${warn ? 'text-red-600' : 'text-slate-900'}">${v}</div></div>`;

    box.innerHTML = `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ანალიტიკა · ბოლო ${IOT_DAYS} დღე</p>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            ${kpi('ქსელის გათიშვები', outages.length)}
            ${kpi('სულ უდენობა', outages.length ? _iotDur(totalOutMs) : '—')}
            ${kpi('გენერატორი იმუშავა', runMs ? _iotDur(runMs) : '—')}
            ${kpi('საწვავის ხარჯი', fuelUsedL !== null ? `~${_iotNum(fuelUsedL, 0)} L` : fuelUsedPct !== null ? `${_iotNum(fuelUsedPct, 1)} %` : '—')}
            ${kpi('გაშვება ვერ მოხერხდა', noStart, noStart > 0)}
        </div>
        <div class="mb-4"><div class="text-[11px] font-bold text-slate-600 mb-1">ქსელი და გენერატორი</div>
            ${_iotChart(rows, [{ key: 'mains_v_avg', label: 'ქსელი, V', color: '#16a34a' }, { key: 'gen_v_avg', label: 'გენერატორი, V', color: '#2563eb' }], { yMax: 260 })}</div>
        <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div><div class="text-[11px] font-bold text-slate-600 mb-1">დატვირთვა</div>${_iotChart(rows, [{ key: 'gen_kw', label: 'გენ. kW', color: '#7c3aed' }])}</div>
            <div><div class="text-[11px] font-bold text-slate-600 mb-1">საწვავი</div>${_iotChart(rows, [{ key: 'fuel_pct', label: 'საწვავი, %', color: '#f59e0b' }], { yMax: 100 })}</div>
        </div>
        <div class="text-[11px] font-bold text-slate-600 mb-1">გათიშვების ჟურნალი</div>
        ${outages.length ? `<table class="w-full text-[11px]"><thead><tr class="text-slate-400 text-left"><th class="py-1 font-medium">დაწყება</th><th class="font-medium">ხანგრძლივობა</th><th class="font-medium">მაქს. kW</th><th class="font-medium">გენერატორი</th></tr></thead><tbody>
            ${outages.slice().reverse().map(o => `<tr class="border-t border-slate-50"><td class="py-1.5">${_iotDate(o.start)}</td>
                <td>${o.end ? _iotDur(new Date(o.end) - new Date(o.start)) : '<b class="text-red-600">მიმდინარე</b>'}</td>
                <td>${_iotNum(o.maxKw, 1)}</td><td>${o.genOn ? '<span class="text-green-700">✓ ჩაირთო</span>' : '<span class="text-red-600">✗ არ ჩაირთო</span>'}</td></tr>`).join('')}
        </tbody></table>` : '<div class="text-[11px] text-slate-400">გათიშვა არ დაფიქსირებულა</div>'}
    </div>`;
}
