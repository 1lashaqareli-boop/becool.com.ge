/* ============================================================
   BECOOL CRM — asset_view.js  DEBUG VERSION
   ეკრანზე გამოჩნდება დიაგნოსტიკური პანელი
   ============================================================ */

function _avDebug(msg, type) {
    type = type || 'info';
    var colors = { info:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444' };
    var panel = document.getElementById('_av-debug-panel');
    if (!panel) return;
    var line = document.createElement('div');
    line.style.cssText = 'color:'+( colors[type]||'#fff')+';font-size:11px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.06)';
    line.textContent = new Date().toLocaleTimeString('en',{hour12:false}) + ' › ' + msg;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
    console.log('[AV]', msg);
}

function _avShowDebugPanel() {
    var old = document.getElementById('_av-debug-wrap');
    if (old) old.remove();
    var panel = document.createElement('div');
    panel.id = '_av-debug-wrap';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0f172a;border-top:3px solid #3b82f6;font-family:monospace;';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid rgba(255,255,255,.1)">'
        +'<span style="color:#60a5fa;font-size:12px;font-weight:bold">🔍 BECOOL DEBUG — asset_view.js</span>'
        +'<div style="display:flex;gap:8px">'
        +'<button onclick="_avRunFix()" style="background:#10b981;color:#fff;border:none;padding:3px 12px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:bold">▶ FIX გაშვება</button>'
        +'<button onclick="_avScanDOM()" style="background:#3b82f6;color:#fff;border:none;padding:3px 12px;border-radius:4px;font-size:11px;cursor:pointer">🔍 DOM სკანი</button>'
        +'<button onclick="document.getElementById(\'_av-debug-wrap\').remove()" style="background:#475569;color:#fff;border:none;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer">✕</button>'
        +'</div></div>'
        +'<div id="_av-debug-panel" style="height:140px;overflow-y:auto;padding:6px 12px;"></div>'
        +'<div id="_av-debug-status" style="padding:6px 12px;font-size:10px;color:#64748b;border-top:1px solid rgba(255,255,255,.08)">DOM scan-ი: FIX-ის შემდეგ დააჭირე 🔍 DOM სკანი</div>';
    document.body.appendChild(panel);
}

function _avScanDOM() {
    var checks = [
        ['#asset-view',     document.getElementById('asset-view')],
        ['.av-layout',      document.querySelector('.av-layout')],
        ['.av-sb',          document.querySelector('.av-sb')],
        ['.av-main',        document.querySelector('.av-main')],
        ['#av-list-panel',  document.getElementById('av-list-panel')],
        ['#av-detail-panel',document.getElementById('av-detail-panel')],
        ['#av-hdr-name',    document.getElementById('av-hdr-name')],
        ['#av-tc-home',     document.getElementById('av-tc-home')],
        ['#av-kpi-strip',   document.getElementById('av-kpi-strip')],
        ['#av-styles(CSS)', document.getElementById('av-styles')],
    ];
    var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:3px;font-size:10px">';
    checks.forEach(function(c) {
        var name = c[0], el = c[1];
        if (!el) {
            _avDebug('❌ '+name+' — DOM-ში არ არის', 'err');
            html += '<span style="color:#ef4444">❌ '+name+' — არ არის</span>';
            return;
        }
        var cs = window.getComputedStyle(el);
        var display = cs.display;
        var height  = el.offsetHeight;
        var width   = el.offsetWidth;
        var overflow= cs.overflow;
        var bad = (display === 'none' || height === 0);
        var info = display+' h:'+height+'px w:'+width+'px ov:'+overflow;
        _avDebug((bad?'⚠':'✓')+' '+name+' → '+info, bad?'warn':'ok');
        html += '<span style="color:'+(bad?'#f59e0b':'#10b981')+'">'+(bad?'⚠':'✓')+' '+name+': '+info+'</span>';
    });
    html += '</div>';
    var st = document.getElementById('_av-debug-status');
    if (st) st.innerHTML = html;
}

function _avRunFix() {
    _avDebug('▶ FORCE FIX დაიწყო', 'info');

    var oldStyle = document.getElementById('av-styles');
    if (oldStyle) { oldStyle.remove(); _avDebug('ძველი CSS წაიშალა', 'info'); }
    injectAssetViewCSS();
    _avDebug('ახალი CSS ჩასმულია ✓', 'ok');

    var avSection = document.getElementById('asset-view');
    if (avSection) {
        avSection.style.cssText = 'display:block !important;min-height:600px !important;visibility:visible !important;opacity:1 !important;';
        _avDebug('asset-view inline style ✓', 'ok');
    } else {
        _avDebug('asset-view ვერ ვიპოვე!', 'err');
    }

    var layout = document.querySelector('.av-layout');
    if (layout) {
        layout.style.cssText = 'display:grid !important;grid-template-columns:210px 1fr;min-height:600px;border:1px solid #e2e8f0;border-radius:1rem;overflow:visible !important;background:#fff;margin-bottom:2rem;';
        _avDebug('av-layout inline fix ✓', 'ok');
    } else {
        _avDebug('av-layout ვერ ვიპოვე — HTML inject...', 'warn');
        injectAssetViewHTML();
        _avDebug('HTML inject გაკეთდა ✓', 'ok');
    }

    var main = document.querySelector('.av-main');
    if (main) {
        main.style.cssText = 'display:flex !important;flex-direction:column;overflow:visible !important;min-width:0;';
        _avDebug('av-main inline fix ✓', 'ok');
    }

    var detailPanel = document.getElementById('av-detail-panel');
    if (detailPanel) {
        detailPanel.classList.remove('av-hidden');
        detailPanel.style.cssText = 'display:block !important;visibility:visible !important;opacity:1 !important;';
        _avDebug('av-detail-panel force visible ✓', 'ok');
    } else {
        _avDebug('av-detail-panel ვერ ვიპოვე', 'err');
    }

    var listPanel = document.getElementById('av-list-panel');
    if (listPanel) {
        listPanel.classList.add('av-hidden');
        listPanel.style.display = 'none';
    }

    var homeTab = document.getElementById('av-tc-home');
    if (homeTab) {
        homeTab.classList.remove('av-hidden');
        homeTab.style.cssText = 'display:block !important;visibility:visible !important;padding:16px 18px;';
        _avDebug('av-tc-home force visible ✓', 'ok');
    } else {
        _avDebug('av-tc-home ვერ ვიპოვე', 'err');
    }

    setTimeout(function() {
        _avDebug('── FIX შემდეგ სკანი ──', 'info');
        _avScanDOM();
    }, 300);
}


function injectAssetViewCSS() {
    var old = document.getElementById('av-styles');
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = 'av-styles';
    style.textContent = [
        '#asset-view { display:block !important; min-height:600px !important; visibility:visible !important; opacity:1 !important; }',
        '#asset-view.view-section { display:block !important; }',
        '.av-layout { display:grid !important; grid-template-columns:210px 1fr; min-height:600px; border:1px solid #e2e8f0; border-radius:1rem; overflow:visible !important; background:#fff; margin-bottom:2rem; }',
        '.av-main { display:flex !important; flex-direction:column; overflow:visible !important; min-width:0; }',
        '.av-tab-content { padding:16px 18px; overflow-y:auto; display:block; }',
        '.av-sb { background:#0f2942; overflow-y:auto; border-radius:1rem 0 0 1rem; }',
        '.av-sb-header { padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.07); }',
        '.av-sb-branch-name { font-size:13px; font-weight:700; color:#fff; }',
        '.av-sb-sub { font-size:10px; color:rgba(255,255,255,.4); margin-top:2px; }',
        '.av-sb-section-label { font-size:9px; font-weight:700; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:.1em; padding:14px 16px 5px; }',
        '.av-cat { display:flex; align-items:center; gap:8px; padding:8px 16px; cursor:pointer; color:rgba(255,255,255,.55); font-size:11.5px; font-weight:600; user-select:none; transition:background .12s; }',
        '.av-cat:hover { background:rgba(255,255,255,.06); color:rgba(255,255,255,.9); }',
        '.av-cat.open { color:#fff; }',
        '.av-arrow { margin-left:auto; transition:transform .2s; opacity:.5; flex-shrink:0; }',
        '.av-cat.open .av-arrow { transform:rotate(90deg); opacity:1; }',
        '.av-sub { display:none; }',
        '.av-cat.open + .av-sub { display:block; }',
        '.av-item { display:flex; align-items:center; gap:6px; padding:6px 16px 6px 34px; font-size:11px; color:rgba(255,255,255,.4); cursor:pointer; transition:background .12s; }',
        '.av-item:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.75); }',
        '.av-item.active { background:rgba(29,158,117,.2); color:#5DCAA5; font-weight:600; }',
        '.av-badge { margin-left:auto; background:rgba(255,255,255,.08); border-radius:8px; padding:1px 6px; font-size:9px; color:rgba(255,255,255,.35); }',
        '.av-item.active .av-badge { background:rgba(29,158,117,.3); color:#9FE1CB; }',
        '.av-list-panel { padding:18px 20px; }',
        '.av-list-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }',
        '.av-list-title { font-size:15px; font-weight:700; color:#0f172a; }',
        '.av-list-sub { font-size:11px; color:#64748b; margin-top:2px; }',
        '.av-btn-add { font-size:11px; padding:6px 14px; border:1.5px solid #1D9E75; border-radius:8px; color:#1D9E75; cursor:pointer; background:transparent; font-weight:600; }',
        '.av-btn-add:hover { background:#E1F5EE; }',
        '.av-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }',
        '.av-empty { font-size:12px; color:#94a3b8; font-style:italic; grid-column:1/-1; padding:40px 0; text-align:center; }',
        '.av-card { border:1px solid #e2e8f0; border-radius:10px; padding:14px; cursor:pointer; transition:all .15s; background:#fff; }',
        '.av-card:hover { border-color:#1D9E75; box-shadow:0 2px 8px rgba(29,158,117,.1); transform:translateY(-1px); }',
        '.av-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }',
        '.av-card-name { font-size:12px; font-weight:700; color:#0f172a; }',
        '.av-card-sub { font-size:10px; color:#64748b; margin-top:2px; }',
        '.av-card-rows { font-size:11px; }',
        '.av-card-row { display:flex; justify-content:space-between; padding:3px 0; color:#64748b; border-bottom:1px solid #f1f5f9; }',
        '.av-card-row:last-child { border:none; }',
        '.av-card-val { font-weight:600; color:#0f172a; }',
        '.av-card-actions { display:flex; gap:6px; margin-top:10px; }',
        '.av-card-btn { flex:1; padding:5px; border:1px solid #e2e8f0; border-radius:6px; font-size:10px; text-align:center; cursor:pointer; background:#fff; color:#475569; }',
        '.av-card-btn.pri { background:#1D9E75; border-color:#1D9E75; color:#fff; font-weight:600; }',
        '.av-s-ok    { background:#dcfce7; color:#166534; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; }',
        '.av-s-maint { background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; }',
        '.av-s-down  { background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; }',
        '.av-header { border-bottom:1px solid #e2e8f0; }',
        '.av-header-top { padding:14px 18px; display:grid; grid-template-columns:150px 1fr auto; gap:14px; align-items:start; }',
        '.av-header-img { width:150px; height:100px; border-radius:8px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }',
        '.av-header-img img { width:100%; height:100%; object-fit:cover; }',
        '.av-hdr-name  { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:3px; }',
        '.av-hdr-model { font-size:11px; color:#64748b; margin-bottom:8px; }',
        '.av-hdr-specs { display:grid; grid-template-columns:1fr 1fr; gap:2px 16px; }',
        '.av-spec-row  { display:flex; gap:5px; font-size:11px; }',
        '.av-spec-l    { color:#64748b; min-width:80px; }',
        '.av-spec-v    { color:#0f172a; font-weight:600; }',
        '.av-header-right { display:flex; flex-direction:column; align-items:flex-end; gap:7px; }',
        '.av-status-badge { padding:3px 11px; border-radius:14px; font-size:10.5px; font-weight:700; }',
        '.av-hdr-kpis { display:flex; gap:6px; }',
        '.av-hdr-kpi  { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:5px 10px; text-align:center; }',
        '.av-hdr-kpi-v { font-size:14px; font-weight:700; color:#0f172a; line-height:1; }',
        '.av-hdr-kpi-l { font-size:9px; color:#64748b; margin-top:2px; }',
        '.av-hdr-btns  { display:flex; gap:6px; }',
        '.av-btn-pri   { font-size:11px; padding:5px 10px; border-radius:6px; background:#1D9E75; border:none; color:#fff; cursor:pointer; font-weight:600; }',
        '.av-btn-sec   { font-size:11px; padding:5px 10px; border-radius:6px; background:#fff; border:1px solid #e2e8f0; color:#475569; cursor:pointer; }',
        '.av-btn-back  { font-size:11px; padding:5px 10px; border-radius:6px; background:#fff; border:1px solid #e2e8f0; color:#1D9E75; cursor:pointer; font-weight:600; }',
        '.av-toggle-row { display:flex; align-items:center; gap:7px; padding:6px 18px; cursor:pointer; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:10.5px; color:#64748b; user-select:none; }',
        '.av-details-panel { border-top:1px solid #e2e8f0; padding:12px 18px; background:#f8fafc; }',
        '.av-details-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }',
        '.av-det-card  { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; }',
        '.av-det-label { font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; font-weight:600; }',
        '.av-det-val   { font-size:12px; font-weight:700; color:#0f172a; }',
        '.av-kpi-strip { display:flex; border-bottom:1px solid #e2e8f0; background:#f8fafc; overflow-x:auto; }',
        '.av-ks-cell   { flex:1; min-width:80px; padding:8px 6px; text-align:center; border-right:1px solid #e2e8f0; }',
        '.av-ks-cell:last-child { border-right:none; }',
        '.av-ks-v { font-size:15px; font-weight:700; color:#0f172a; }',
        '.av-ks-l { font-size:9px; color:#94a3b8; margin-top:1px; }',
        '.av-ks-ok { color:#166534 !important; } .av-ks-warn { color:#92400e !important; } .av-ks-down { color:#991b1b !important; }',
        '.av-tabs { display:flex; border-bottom:1px solid #e2e8f0; padding:0 18px; background:#fff; overflow-x:auto; }',
        '.av-tab  { padding:9px 14px; font-size:11.5px; font-weight:600; color:#94a3b8; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; white-space:nowrap; }',
        '.av-tab:hover { color:#64748b; }',
        '.av-tab.active { color:#1D9E75; border-bottom-color:#1D9E75; }',
        '.av-tcard { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px; }',
        '.av-tcard-h { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; }',
        '.av-tcard-ha { font-size:10px; color:#1D9E75; cursor:pointer; font-weight:600; text-transform:none; letter-spacing:0; }',
        '.av-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }',
        '.av-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }',
        '.av-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }',
        '.av-log-head { display:grid; grid-template-columns:68px 1fr 72px 56px 50px; gap:4px; padding:4px 0; font-size:9px; color:#94a3b8; border-bottom:1px solid #f1f5f9; font-weight:600; }',
        '.av-log-row  { display:grid; grid-template-columns:68px 1fr 72px 56px 50px; gap:4px; padding:7px 0; border-bottom:1px solid #f1f5f9; align-items:center; font-size:11px; }',
        '.av-log-row:last-child { border:none; }',
        '.av-log-date { color:#94a3b8; font-size:10px; } .av-log-tech { color:#94a3b8; font-size:10px; } .av-log-cost { font-weight:700; text-align:right; color:#0f172a; }',
        '.av-pill { padding:2px 7px; border-radius:10px; font-size:9px; font-weight:700; text-align:center; }',
        '.av-ppm { background:#dbeafe; color:#1e40af; } .av-cor { background:#fef3c7; color:#92400e; } .av-emr { background:#fee2e2; color:#991b1b; } .av-inst { background:#dcfce7; color:#166534; }',
        '.av-meas { background:#f8fafc; border-radius:6px; padding:8px 10px; border-left:3px solid; }',
        '.av-meas.g { border-color:#10b981; } .av-meas.y { border-color:#f59e0b; } .av-meas.r { border-color:#ef4444; }',
        '.av-meas-l { font-size:9px; color:#94a3b8; margin-bottom:2px; font-weight:600; }',
        '.av-meas-v { font-size:18px; font-weight:700; color:#0f172a; line-height:1.2; }',
        '.av-meas-u { font-size:10px; color:#94a3b8; margin-left:2px; }',
        '.av-sched-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #f1f5f9; font-size:11px; }',
        '.av-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }',
        '.av-sched-date { min-width:66px; color:#94a3b8; font-size:10px; } .av-sched-task { flex:1; color:#0f172a; }',
        '.av-days { font-size:9px; padding:2px 7px; border-radius:10px; font-weight:700; }',
        '.av-days.warn { background:#fef3c7; color:#92400e; } .av-days.ok { background:#dcfce7; color:#166534; } .av-days.soon { background:#fee2e2; color:#991b1b; }',
        '.av-hbar { height:7px; background:#f1f5f9; border-radius:4px; overflow:hidden; margin:4px 0; }',
        '.av-hbar-fill { height:100%; border-radius:4px; }',
        '.av-iot-cell { background:#f8fafc; border-radius:8px; padding:10px; position:relative; border:1px solid #e2e8f0; }',
        '.av-iot-l { font-size:9px; color:#94a3b8; margin-bottom:3px; font-weight:600; } .av-iot-v { font-size:20px; font-weight:700; color:#0f172a; } .av-iot-u { font-size:10px; color:#94a3b8; }',
        '.av-live { position:absolute; top:8px; right:8px; width:6px; height:6px; border-radius:50%; }',
        '.av-live.ok { background:#10b981; } .av-live.warn { background:#f59e0b; }',
        '.av-lib-card { border:1px solid #e2e8f0; border-radius:8px; padding:14px; text-align:center; cursor:pointer; }',
        '.av-lib-card:hover { background:#f8fafc; border-color:#1D9E75; }',
        '.av-lib-name { font-size:11px; font-weight:700; color:#0f172a; } .av-lib-type { font-size:9px; color:#94a3b8; margin-top:2px; }',
        '.av-hidden { display:none !important; }'
    ].join('\n');
    document.head.appendChild(style);
    _avDebug('CSS injected (' + style.textContent.length + ' chars)', 'ok');
}


function injectAssetViewHTML() {
    var section = document.getElementById('asset-view');
    if (!section) { _avDebug('FATAL: #asset-view ვერ ვიპოვე!', 'err'); return; }
    section.innerHTML = '<div class="av-layout">'
    +'<div class="av-sb" id="av-sidebar">'
    +'<div class="av-sb-header"><div class="av-sb-branch-name" id="av-branch-label">ფილიალი</div><div class="av-sb-sub">აგრეგატები</div></div>'
    +'<div class="av-sb-section-label">კონდ.</div>'
    +'<div class="av-cat-wrap"><div class="av-cat open" onclick="avToggleCat(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 11h12"/></svg>AC სისტ.<svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>'
    +'<div class="av-sub">'
    +'<div class="av-item" data-type="Split" onclick="avSelectType(this)">Split<span class="av-badge" id="badge-Split">0</span></div>'
    +'<div class="av-item" data-type="Multi-Split" onclick="avSelectType(this)">Multi-Split<span class="av-badge" id="badge-Multi-Split">0</span></div>'
    +'<div class="av-item" data-type="Semi-Industrial" onclick="avSelectType(this)">ნახ.-სამრ.<span class="av-badge" id="badge-Semi-Industrial">0</span></div>'
    +'<div class="av-item" data-type="VRF" onclick="avSelectType(this)">VRV/VRF<span class="av-badge" id="badge-VRF">0</span></div>'
    +'<div class="av-item" data-type="Chiller" onclick="avSelectType(this)">Chiller<span class="av-badge" id="badge-Chiller">0</span></div>'
    +'<div class="av-item" data-type="Rooftop" onclick="avSelectType(this)">Rooftop<span class="av-badge" id="badge-Rooftop">0</span></div>'
    +'</div></div>'
    +'<div class="av-sb-section-label">მაცივ.</div>'
    +'<div class="av-cat-wrap"><div class="av-cat" onclick="avToggleCat(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 6v4M8 8h8M12 14v4M8 16h8"/></svg>Refrig.<svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>'
    +'<div class="av-sub">'
    +'<div class="av-item" data-type="Reach-in" onclick="avSelectType(this)">Reach-in<span class="av-badge" id="badge-Reach-in">0</span></div>'
    +'<div class="av-item" data-type="Walk-in" onclick="avSelectType(this)">Walk-in<span class="av-badge" id="badge-Walk-in">0</span></div>'
    +'<div class="av-item" data-type="Display Case" onclick="avSelectType(this)">Display case<span class="av-badge" id="badge-Display Case">0</span></div>'
    +'<div class="av-item" data-type="Blast Chiller" onclick="avSelectType(this)">Blast chiller<span class="av-badge" id="badge-Blast Chiller">0</span></div>'
    +'<div class="av-item" data-type="Condensing Unit" onclick="avSelectType(this)">Cond. unit<span class="av-badge" id="badge-Condensing Unit">0</span></div>'
    +'</div></div>'
    +'<div class="av-sb-section-label">სხვა</div>'
    +'<div class="av-cat-wrap"><div class="av-cat" onclick="avToggleCat(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c-4 4-6 7-6 10a6 6 0 0 0 12 0c0-3-2-6-6-10z"/></svg>Heating/Water<svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>'
    +'<div class="av-sub">'
    +'<div class="av-item" data-type="Boiler" onclick="avSelectType(this)">Boiler<span class="av-badge" id="badge-Boiler">0</span></div>'
    +'<div class="av-item" data-type="DHW" onclick="avSelectType(this)">DHW<span class="av-badge" id="badge-DHW">0</span></div>'
    +'<div class="av-item" data-type="Pump" onclick="avSelectType(this)">ტუმბო<span class="av-badge" id="badge-Pump">0</span></div>'
    +'<div class="av-item" data-type="AHU" onclick="avSelectType(this)">AHU<span class="av-badge" id="badge-AHU">0</span></div>'
    +'<div class="av-item" data-type="Fan" onclick="avSelectType(this)">გამწოვი<span class="av-badge" id="badge-Fan">0</span></div>'
    +'<div class="av-item" data-type="Other" onclick="avSelectType(this)">სხვა<span class="av-badge" id="badge-Other">0</span></div>'
    +'</div></div>'
    +'</div>'
    +'<div class="av-main" id="av-main">'
    +'<div id="av-list-panel" class="av-list-panel">'
    +'<div class="av-list-header"><div><div class="av-list-title" id="av-list-title">კატეგ. აირჩ.</div><div class="av-list-sub" id="av-list-sub"></div></div><button class="av-btn-add" onclick="avOpenNewAsset()">+ ახალი</button></div>'
    +'<div class="av-cards-grid" id="av-cards-grid"><div class="av-empty">მარცხნივ კატეგ. აირჩ.</div></div>'
    +'</div>'
    +'<div id="av-detail-panel" class="av-hidden">'
    +'<div class="av-header" id="av-detail-header">'
    +'<div class="av-header-top">'
    +'<div class="av-header-img" id="av-hdr-img"><svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".2" width="60" height="60"><rect x="4" y="4" width="72" height="32" rx="4"/><rect x="8" y="38" width="64" height="14" rx="2"/><circle cx="22" cy="20" r="9"/><circle cx="22" cy="20" r="4"/><line x1="38" y1="14" x2="70" y2="14"/><line x1="38" y1="20" x2="70" y2="20"/><line x1="38" y1="26" x2="70" y2="26"/></svg></div>'
    +'<div class="av-header-info"><div class="av-hdr-name" id="av-hdr-name">—</div><div class="av-hdr-model" id="av-hdr-model">—</div><div class="av-hdr-specs" id="av-hdr-specs"></div></div>'
    +'<div class="av-header-right"><span class="av-status-badge" id="av-hdr-status">—</span><div class="av-hdr-kpis" id="av-hdr-kpis"></div><div class="av-hdr-btns"><button class="av-btn-pri" onclick="avAddService()">+ სერვ.</button><button class="av-btn-sec" onclick="avEditAsset()">რედ.</button><button class="av-btn-back" onclick="avBackToList()">← სია</button></div></div>'
    +'</div>'
    +'<div class="av-toggle-row" onclick="avToggleDetails()"><span>▸ ტექნ. მონაც.</span><svg id="av-toggle-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:auto"><polyline points="6 9 12 15 18 9"/></svg></div>'
    +'<div class="av-details-panel av-hidden" id="av-details-panel"><div class="av-details-grid" id="av-details-grid"></div></div>'
    +'</div>'
    +'<div class="av-kpi-strip" id="av-kpi-strip"></div>'
    +'<div class="av-tabs" id="av-tabs">'
    +'<div class="av-tab active" data-tab="home" onclick="avSwitchTab(\'home\',this)">მთავარი</div>'
    +'<div class="av-tab" data-tab="svc" onclick="avSwitchTab(\'svc\',this)">სერვ. ისტ.</div>'
    +'<div class="av-tab" data-tab="status" onclick="avSwitchTab(\'status\',this)">მდგ.</div>'
    +'<div class="av-tab" data-tab="inv" onclick="avSwitchTab(\'inv\',this)">ინვ.</div>'
    +'<div class="av-tab" data-tab="iot" onclick="avSwitchTab(\'iot\',this)">IoT</div>'
    +'<div class="av-tab" data-tab="lib" onclick="avSwitchTab(\'lib\',this)">ბიბლ.</div>'
    +'</div>'
    +'<div class="av-tab-content" id="av-tc-home"></div>'
    +'<div class="av-tab-content av-hidden" id="av-tc-svc"></div>'
    +'<div class="av-tab-content av-hidden" id="av-tc-status"></div>'
    +'<div class="av-tab-content av-hidden" id="av-tc-inv"></div>'
    +'<div class="av-tab-content av-hidden" id="av-tc-iot"></div>'
    +'<div class="av-tab-content av-hidden" id="av-tc-lib"></div>'
    +'</div></div></div>';
    _avDebug('HTML inject ✓', 'ok');
}

window._av = { branchAssets:[], currentType:null, currentAsset:null, detailsOpen:false };

async function loadAssetView(branch) {
    _avShowDebugPanel();
    _avDebug('loadAssetView: ' + branch.name, 'info');
    activeBranch = branch;
    window._av.currentAsset = null;
    window._av.currentType  = null;
    injectAssetViewCSS();
    injectAssetViewHTML();
    document.querySelectorAll('.view-section').forEach(function(s){ s.classList.remove('active'); });
    var avSection = document.getElementById('asset-view');
    if (!avSection) { _avDebug('FATAL: #asset-view ვერ ვიპოვე!', 'err'); return; }
    avSection.classList.add('active');
    avSection.style.cssText = 'display:block !important;min-height:600px !important;visibility:visible !important;';
    _avDebug('asset-view active ✓', 'ok');
    setTimeout(function(){
        var layout = document.querySelector('.av-layout');
        var main   = document.querySelector('.av-main');
        if(layout){ layout.style.cssText='display:grid !important;grid-template-columns:210px 1fr;min-height:600px;overflow:visible !important;background:#fff;border:1px solid #e2e8f0;border-radius:1rem;margin-bottom:2rem;'; _avDebug('av-layout fix ✓','ok'); }
        if(main)  { main.style.cssText='display:flex !important;flex-direction:column;overflow:visible !important;min-width:0;'; }
        var lbl = document.getElementById('av-branch-label');
        if(lbl) lbl.textContent = branch.name || 'ფილიალი';
        _avScanDOM();
    }, 150);
    _avDebug('Supabase query...', 'info');
    var res = await _supabase.from('assets').select('*').eq('branch_id', branch.id).order('name');
    if (res.error) { _avDebug('Supabase ERROR: ' + res.error.message, 'err'); return; }
    window._av.branchAssets = res.data || [];
    _avDebug('Assets ჩატვ.: ' + window._av.branchAssets.length, 'ok');
    _avUpdateBadges();
    var pendingId = window._pendingAssetId;
    _avDebug('pendingId: ' + (pendingId ? pendingId.slice(0,8) : 'null'), 'info');
    if (pendingId) {
        window._pendingAssetId = null;
        var target = window._av.branchAssets.find(function(a){ return a.id === pendingId; });
        if (target) {
            _avDebug('target: ' + target.name + ' / ' + target.asset_type, 'ok');
            window._av.currentType = target.asset_type || 'Other';
            var typeEl = document.querySelector('.av-item[data-type="' + target.asset_type + '"]');
            if (typeEl) {
                document.querySelectorAll('.av-item').forEach(function(i){ i.classList.remove('active'); });
                typeEl.classList.add('active');
                var catWrap = typeEl.closest('.av-cat-wrap');
                if (catWrap){ var catEl = catWrap.querySelector('.av-cat'); if(catEl) catEl.classList.add('open'); }
                _avDebug('sidebar selected: ' + target.asset_type, 'ok');
            } else { _avDebug('sidebar item ვერ ვიპოვე: ' + target.asset_type, 'warn'); }
            await avOpenAsset(target);
            return;
        } else { _avDebug('target ვერ ვიპოვე: ' + pendingId.slice(0,8), 'err'); }
    }
    _avShowListPanel();
}

function avToggleCat(el){ el.classList.toggle('open'); }
function avSelectType(el){
    document.querySelectorAll('.av-item').forEach(function(i){ i.classList.remove('active'); });
    el.classList.add('active');
    window._av.currentType  = el.dataset.type;
    window._av.currentAsset = null;
    _avShowListPanel();
}
function _avUpdateBadges(){
    var counts = {};
    window._av.branchAssets.forEach(function(a){ var t = a.asset_type||'Other'; counts[t]=(counts[t]||0)+1; });
    document.querySelectorAll('[id^="badge-"]').forEach(function(el){ var type=el.id.replace('badge-',''); el.textContent=counts[type]||0; });
}

function _avShowListPanel(){
    var lp=document.getElementById('av-list-panel'), dp=document.getElementById('av-detail-panel');
    if(!lp||!dp){ _avDebug('_avShowListPanel: panels ვერ ვიპოვე', 'err'); return; }
    lp.classList.remove('av-hidden'); lp.style.display='';
    dp.classList.add('av-hidden');
    var type=window._av.currentType;
    var te=document.getElementById('av-list-title'), se=document.getElementById('av-list-sub'), gr=document.getElementById('av-cards-grid');
    if(!type){ if(te)te.textContent='კატეგ. აირჩ.'; if(se)se.textContent=''; if(gr)gr.innerHTML='<div class="av-empty">კატეგ. აირჩ.</div>'; return; }
    var filtered=window._av.branchAssets.filter(function(a){ return a.asset_type===type; });
    if(te)te.textContent=type; if(se)se.textContent=filtered.length+' აგრ.';
    if(!filtered.length){ if(gr)gr.innerHTML='<div class="av-empty">'+type+' — ჩანაწ. არ არის</div>'; return; }
    var stC={Operational:'av-s-ok',Maintenance_Required:'av-s-maint',Down:'av-s-down'};
    var stL={Operational:'OK',Maintenance_Required:'Maint.',Down:'Down'};
    if(gr)gr.innerHTML=filtered.map(function(a){ return '<div class="av-card" onclick=\'avOpenAsset('+JSON.stringify(a)+')\'>'
        +'<div class="av-card-top"><div><div class="av-card-name">'+(a.name||'—')+'</div><div class="av-card-sub">'+[a.brand,a.model].filter(Boolean).join(' · ')+'</div></div>'
        +'<span class="'+(stC[a.status]||'av-s-ok')+'">'+(stL[a.status]||a.status)+'</span></div>'
        +'<div class="av-card-rows">'
        +'<div class="av-card-row"><span>TAG</span><span class="av-card-val">'+(a.tag_number||'—')+'</span></div>'
        +'<div class="av-card-row"><span>kW</span><span class="av-card-val">'+(a.cooling_capacity_kw||'—')+'</span></div>'
        +'<div class="av-card-row"><span>საფ.</span><span class="av-card-val">'+(a.refrigerant_type||'—')+'</span></div>'
        +'<div class="av-card-row"><span>სერვ.</span><span class="av-card-val">'+(a.last_service_date?new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—')+'</span></div>'
        +'</div>'
        +'<div class="av-card-actions">'
        +'<div class="av-card-btn" onclick=\'event.stopPropagation();avOpenAsset('+JSON.stringify(a)+');avSwitchTab("svc",null)\'>სერვ.</div>'
        +'<div class="av-card-btn pri" onclick=\'event.stopPropagation();avOpenAsset('+JSON.stringify(a)+')\'>გახ. →</div>'
        +'</div></div>'; }).join('');
}

async function avOpenAsset(asset){
    _avDebug('avOpenAsset: '+(asset&&asset.name), 'info');
    if(!asset){ _avDebug('asset null!','err'); return; }
    window._av.currentAsset=asset;
    window._av.detailsOpen=false;
    var lp=document.getElementById('av-list-panel'), dp=document.getElementById('av-detail-panel');
    if(!lp||!dp){ _avDebug('panels ვერ ვიპოვე — re-inject','warn'); injectAssetViewCSS(); injectAssetViewHTML(); lp=document.getElementById('av-list-panel'); dp=document.getElementById('av-detail-panel'); }
    if(!lp||!dp){ _avDebug('re-inject შემდეგაც panels ვერ!','err'); return; }
    lp.classList.add('av-hidden'); lp.style.display='none';
    dp.classList.remove('av-hidden');
    dp.style.cssText='display:block !important;visibility:visible !important;opacity:1 !important;';
    var layout=document.querySelector('.av-layout'), main=document.querySelector('.av-main');
    if(layout){ layout.style.overflow='visible'; layout.style.display='grid'; }
    if(main)  { main.style.overflow='visible'; main.style.display='flex'; }
    _avDebug('panels switched ✓','ok');
    _avFillHeader(asset);
    _avFillKpiStrip(asset);
    document.querySelectorAll('.av-tab').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.av-tab-content').forEach(function(c){ c.classList.add('av-hidden'); c.style.display=''; });
    var ft=document.querySelector('.av-tab');
    if(ft) ft.classList.add('active');
    var tch=document.getElementById('av-tc-home');
    if(tch){ tch.classList.remove('av-hidden'); tch.style.cssText='display:block !important;padding:16px 18px;'; _avDebug('av-tc-home visible ✓','ok'); }
    else{ _avDebug('av-tc-home ვერ ვიპოვე!','err'); }
    await _avRenderHome(asset);
    _avDebug('avOpenAsset DONE ✓','ok');
    setTimeout(function(){ _avScanDOM(); }, 400);
    var pt=window._pendingAssetTab;
    if(pt){ window._pendingAssetTab=null; var te2=document.querySelector('.av-tab[data-tab="'+pt+'"]'); if(te2) avSwitchTab(pt,te2); }
}

function avBackToList(){ window._av.currentAsset=null; _avShowListPanel(); }

function _avFillHeader(a){
    var s=function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    var imgEl=document.getElementById('av-hdr-img');
    if(imgEl){ if(a.image_url){ imgEl.innerHTML='<img src="'+a.image_url+'" style="width:100%;height:100%;object-fit:cover">'; } else{ imgEl.innerHTML='<svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".2" width="60" height="60"><rect x="4" y="4" width="72" height="32" rx="4"/><rect x="8" y="38" width="64" height="14" rx="2"/><circle cx="22" cy="20" r="9"/><circle cx="22" cy="20" r="4"/><line x1="38" y1="14" x2="70" y2="14"/><line x1="38" y1="20" x2="70" y2="20"/><line x1="38" y1="26" x2="70" y2="26"/></svg>'; } }
    s('av-hdr-name', a.name||'—');
    s('av-hdr-model', [a.brand,a.model,a.serial_number?'S/N:'+a.serial_number:'',a.tag_number?'TAG:'+a.tag_number:''].filter(Boolean).join(' · '));
    var specs=[ ['სიმძლ.',a.cooling_capacity_kw?a.cooling_capacity_kw+' kW':null], ['საფ.',a.refrigerant_type||null], ['კვება',a.voltage?a.voltage+'V/'+(a.phase||'3Ph'):null], ['ლოკ.',a.location_on_site||null] ].filter(function(x){ return x[1]; });
    var sp=document.getElementById('av-hdr-specs');
    if(sp) sp.innerHTML=specs.map(function(x){ return '<div class="av-spec-row"><span class="av-spec-l">'+x[0]+'</span><span class="av-spec-v">'+x[1]+'</span></div>'; }).join('');
    var stC={Operational:'av-s-ok',Maintenance_Required:'av-s-maint',Down:'av-s-down'};
    var stL={Operational:'Operational',Maintenance_Required:'Maintenance',Down:'Down'};
    var badge=document.getElementById('av-hdr-status');
    if(badge){ badge.textContent=stL[a.status]||a.status; badge.className='av-status-badge '+(stC[a.status]||'av-s-ok'); }
    var ns=a.last_service_date&&a.service_interval_days?Math.ceil(a.service_interval_days-(Date.now()-new Date(a.last_service_date))/86400000):null;
    var kp=document.getElementById('av-hdr-kpis');
    if(kp) kp.innerHTML='<div class="av-hdr-kpi"><div class="av-hdr-kpi-v">'+(a.condition_score||'—')+'/10</div><div class="av-hdr-kpi-l">condition</div></div>'+(ns!==null?'<div class="av-hdr-kpi"><div class="av-hdr-kpi-v" style="color:'+(ns<30?'#991b1b':ns<90?'#92400e':'#166534')+'">'+ns+'დ</div><div class="av-hdr-kpi-l">შემ. სერვ.</div></div>':'');
    var det=document.getElementById('av-details-panel'), ico=document.getElementById('av-toggle-icon');
    if(det){ det.classList.add('av-hidden'); det.style.display='none'; }
    if(ico) ico.style.transform='rotate(0deg)';
    window._av.detailsOpen=false;
    _avDebug('Header ✓','ok');
}

function avToggleDetails(){
    window._av.detailsOpen=!window._av.detailsOpen;
    var det=document.getElementById('av-details-panel'), ico=document.getElementById('av-toggle-icon');
    if(det){ det.classList.toggle('av-hidden',!window._av.detailsOpen); det.style.display=window._av.detailsOpen?'block':'none'; }
    if(ico) ico.style.transform=window._av.detailsOpen?'rotate(180deg)':'rotate(0deg)';
}

function _avFillKpiStrip(a){
    var strip=document.getElementById('av-kpi-strip'); if(!strip) return;
    var items=[
        {v:a.status==='Operational'?'OK':a.status==='Maintenance_Required'?'Maint.':'Down', l:'სტ.', cls:a.status==='Operational'?'av-ks-ok':'av-ks-warn'},
        {v:a.condition_score?a.condition_score+'/10':'—', l:'Cond.', cls:''},
        {v:a.cooling_capacity_kw?a.cooling_capacity_kw+' kW':'—', l:'kW', cls:''},
        {v:a.refrigerant_type||'—', l:'საფ.', cls:''},
        {v:a.refrigerant_charge_kg?a.refrigerant_charge_kg+' kg':'—', l:'kg', cls:''},
        {v:a.last_service_date?new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—', l:'სერვ.', cls:''},
    ];
    strip.innerHTML=items.map(function(i){ return '<div class="av-ks-cell"><div class="av-ks-v '+i.cls+'">'+i.v+'</div><div class="av-ks-l">'+i.l+'</div></div>'; }).join('');
}

function avSwitchTab(name, btn){
    document.querySelectorAll('.av-tab').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.av-tab-content').forEach(function(c){ c.classList.add('av-hidden'); c.style.display=''; });
    if(btn) btn.classList.add('active');
    else{ var t=document.querySelector('.av-tab[data-tab="'+name+'"]'); if(t) t.classList.add('active'); }
    var tc=document.getElementById('av-tc-'+name);
    if(tc){ tc.classList.remove('av-hidden'); tc.style.cssText='display:block !important;padding:16px 18px;'; }
    if(name==='svc')    _avRenderSvc();
    else if(name==='status') _avRenderStatus();
    else if(name==='inv')    _avRenderInv();
    else if(name==='iot')    _avRenderIot();
    else if(name==='lib')    _avRenderLib();
}

async function _avRenderHome(a){
    var tc=document.getElementById('av-tc-home');
    if(!tc){ _avDebug('av-tc-home ვერ ვიპოვე!','err'); return; }
    var res=await _supabase.from('service_logs').select('service_date,service_type,technician_name,job_description,suction_pressure,discharge_pressure,superheat,subcooling,comp_current_a').eq('asset_id',a.id).order('service_date',{ascending:false}).limit(5);
    var logs=res.data||[];
    _avDebug('Home tab logs: '+logs.length,'info');
    var tC={PPM:'av-ppm',Corrective:'av-cor',Emergency:'av-emr',Installation:'av-inst'};
    var lm=logs[0];
    tc.innerHTML='<div class="av-grid-2">'
    +'<div class="av-tcard"><div class="av-tcard-h">ბოლო სერვ. <span class="av-tcard-ha" onclick="avSwitchTab(\'svc\',null)">ყველა →</span></div>'
    +'<div class="av-log-head"><div>თარ.</div><div>სამ.</div><div>ტექ.</div><div>ტიპი</div><div>₾</div></div>'
    +(logs.map(function(l){ return '<div class="av-log-row"><span class="av-log-date">'+new Date(l.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})+'</span><span>'+(l.job_description||'').substring(0,20)+'</span><span class="av-log-tech">'+(l.technician_name||'—')+'</span><span class="av-pill '+(tC[l.service_type]||'av-cor')+'">'+(l.service_type||'—')+'</span><span class="av-log-cost">—</span></div>'; }).join('')||'<div class="av-empty">სერვ. არ არის</div>')
    +'</div>'
    +'<div class="av-tcard"><div class="av-tcard-h">Unit Health</div>'
    +'<div class="av-sched-row"><span class="av-dot" style="background:#f59e0b"></span><span class="av-sched-date">PPM ინტ.</span><span class="av-sched-task">ფილტ. + SH/SC + leak test</span><span class="av-days warn">'+(a.service_interval_days||90)+'დ</span></div>'
    +'<div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9"><div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-bottom:5px"><span>Condition</span><span style="color:'+((a.condition_score||5)>=7?'#166534':'#92400e')+';font-weight:700">'+(a.condition_score||'—')+'/10</span></div>'
    +'<div class="av-hbar"><div class="av-hbar-fill" style="width:'+((a.condition_score||0)*10)+'%;background:'+((a.condition_score||0)>=7?'#10b981':'#f59e0b')+'"></div></div></div></div>'
    +(lm?'<div class="av-tcard"><div class="av-tcard-h">ბოლო გაზომვ. <span class="av-tcard-ha" onclick="avSwitchTab(\'status\',null)">→</span></div><div class="av-grid-2" style="gap:6px">'
    +'<div class="av-meas '+((lm.suction_pressure||0)<10?'g':'y')+'"><div class="av-meas-l">LP</div><div class="av-meas-v">'+(lm.suction_pressure||'—')+'<span class="av-meas-u">Bar</span></div></div>'
    +'<div class="av-meas '+((lm.discharge_pressure||0)<30?'g':'y')+'"><div class="av-meas-l">HP</div><div class="av-meas-v">'+(lm.discharge_pressure||'—')+'<span class="av-meas-u">Bar</span></div></div>'
    +'<div class="av-meas '+(lm.superheat>=4&&lm.superheat<=8?'g':'y')+'"><div class="av-meas-l">SH</div><div class="av-meas-v">'+(lm.superheat||'—')+'<span class="av-meas-u">K</span></div></div>'
    +'<div class="av-meas g"><div class="av-meas-l">კომპ.A</div><div class="av-meas-v">'+(lm.comp_current_a||'—')+'<span class="av-meas-u">A</span></div></div>'
    +'</div></div>':'<div class="av-tcard"><div class="av-tcard-h">ბოლო გაზომვ.</div><div class="av-empty">გაზომვ. არ არის</div></div>')
    +'<div class="av-tcard"><div class="av-tcard-h">ინვ. <span class="av-tcard-ha" onclick="avSwitchTab(\'inv\',null)">→</span></div><div class="av-empty" style="padding:20px 0">მომავ. ვერს.</div></div>'
    +'</div>';
    _avDebug('Home tab render ✓','ok');
}

async function _avRenderSvc(){
    var tc=document.getElementById('av-tc-svc'); if(!tc||!window._av.currentAsset) return;
    tc.innerHTML='<div class="av-tcard"><div style="text-align:center;padding:20px;color:#94a3b8">იტვ...</div></div>';
    var res=await _supabase.from('service_logs').select('*').eq('asset_id',window._av.currentAsset.id).order('service_date',{ascending:false});
    var logs=res.data||[];
    var tC={PPM:'av-ppm',Corrective:'av-cor',Emergency:'av-emr',Installation:'av-inst'};
    tc.innerHTML='<div class="av-tcard"><div class="av-tcard-h">სერვ. ისტ. <span class="av-tcard-ha" onclick="avAddService()">+ სერვ.</span></div>'
    +'<div class="av-log-head"><div>თარ.</div><div>სამ.</div><div>ტექ.</div><div>ტიპი</div><div>₾</div></div>'
    +(logs.map(function(l){ return '<div class="av-log-row"><span class="av-log-date">'+new Date(l.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+'</span><span>'+(l.job_description||'—')+'</span><span class="av-log-tech">'+(l.technician_name||'—')+'</span><span class="av-pill '+(tC[l.service_type]||'av-cor')+'">'+(l.service_type||'—')+'</span><span class="av-log-cost">—</span></div>'; }).join('')||'<div class="av-empty">ჩანაწ. არ არის</div>')
    +'</div>';
}

async function _avRenderStatus(){
    var tc=document.getElementById('av-tc-status'); if(!tc||!window._av.currentAsset) return;
    var res=await _supabase.from('service_logs').select('service_date,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,comp_current_a,fan_current_a,technician_name').eq('asset_id',window._av.currentAsset.id).order('service_date',{ascending:false}).limit(1);
    var m=res.data&&res.data[0], a=window._av.currentAsset;
    tc.innerHTML='<div class="av-grid-2">'
    +'<div class="av-tcard"><div class="av-tcard-h">ბოლო გაზომვ.</div>'+(m?'<div class="av-grid-2" style="gap:6px"><div class="av-meas g"><div class="av-meas-l">LP</div><div class="av-meas-v">'+(m.suction_pressure||'—')+'<span class="av-meas-u">Bar</span></div></div><div class="av-meas '+((m.discharge_pressure||0)>28?'y':'g')+'"><div class="av-meas-l">HP</div><div class="av-meas-v">'+(m.discharge_pressure||'—')+'<span class="av-meas-u">Bar</span></div></div><div class="av-meas '+(m.superheat>=4&&m.superheat<=8?'g':'y')+'"><div class="av-meas-l">SH</div><div class="av-meas-v">'+(m.superheat||'—')+'<span class="av-meas-u">K</span></div></div><div class="av-meas g"><div class="av-meas-l">SC</div><div class="av-meas-v">'+(m.subcooling||'—')+'<span class="av-meas-u">K</span></div></div></div>':'<div class="av-empty">გაზომვ. არ არის</div>')+'</div>'
    +'<div class="av-tcard"><div class="av-tcard-h">Condition</div><div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-bottom:5px"><span>Health</span><span style="font-weight:700">'+(a.condition_score||'—')+'/10</span></div><div class="av-hbar"><div class="av-hbar-fill" style="width:'+((a.condition_score||0)*10)+'%;background:'+((a.condition_score||0)>=7?'#10b981':'#f59e0b')+'"></div></div><div style="margin-top:10px;font-size:11px;color:#64748b">ინტ.: <b>'+(a.service_interval_days||90)+' დღ.</b></div></div>'
    +'</div>';
}

function _avRenderInv(){ var tc=document.getElementById('av-tc-inv'); if(!tc) return; tc.innerHTML='<div class="av-tcard"><div class="av-tcard-h">ინვოისები</div><div class="av-empty" style="padding:30px 0">მომავ. ვერს.</div></div>'; }
function _avRenderIot(){ var tc=document.getElementById('av-tc-iot'); if(!tc) return; var a=window._av.currentAsset; tc.innerHTML='<div class="av-tcard"><div class="av-tcard-h">IoT / BMS</div><div style="font-size:12px;color:#64748b">Device ID: <b>'+(a&&a.iot_device_id||'—')+'</b></div></div>'; }
function _avRenderLib(){ var tc=document.getElementById('av-tc-lib'); if(!tc) return; var a=window._av.currentAsset; tc.innerHTML='<div class="av-grid-4"><div class="av-lib-card" onclick="'+(a&&a.manual_url?'window.open(\''+a.manual_url+'\',\'_blank\')':'alert(\'ფაილი არ არის\')')+'"><div class="av-lib-name">სამ. სახ.</div><div class="av-lib-type">'+(a&&a.manual_url?'PDF':'—')+'</div></div><div class="av-lib-card" onclick="'+(a&&a.wiring_diagram_url?'window.open(\''+a.wiring_diagram_url+'\',\'_blank\')':'alert(\'ფაილი არ არის\')')+'"><div class="av-lib-name">Wiring</div><div class="av-lib-type">'+(a&&a.wiring_diagram_url?'PDF':'—')+'</div></div></div>'; }

function avOpenNewAsset(){ openAssetModal(window._av.currentType?{asset_type:window._av.currentType}:null); }
function avEditAsset()    { if(window._av.currentAsset) openAssetModal(window._av.currentAsset); }
function avAddService()   { if(window._av.currentAsset){ activeAsset=window._av.currentAsset; openServiceLogModal(); } }

injectAssetViewCSS();
