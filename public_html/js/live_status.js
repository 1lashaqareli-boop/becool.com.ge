/* ============================================================
   BECOOL CRM — live_status.js
   "Live მდგომარეობა" ტაბის სრული მოდული

   გამოყენება:
   1. index.html-ში დაამატე: <script src="js/live_status.js"></script>
   2. asset_view.js-ში _avRenderStatus() ფუნქცია შეცვალე:
         async function _avRenderStatus() { await lsRender(); }
   3. asset_view.js HTML-ში tab სახელი შეცვალე:
         "მდგ. & გეგმა"  →  "Live მდგომარეობა"
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   CSS — ერთხელ ინჯექცია
   ══════════════════════════════════════════════════════════════ */
(function injectLiveStatusCSS() {
    if (document.getElementById('ls-styles')) return;
    const s = document.createElement('style');
    s.id = 'ls-styles';
    s.textContent = `
/* ── Layout ── */
.ls-wrap { font-family: inherit; }
.ls-top  { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
.ls-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-bottom:14px; }
.ls-met { background:#f8fafc; border-radius:8px; padding:10px 14px; }
.ls-mv  { font-size:20px; font-weight:700; color:#0f172a; line-height:1.1; }
.ls-ml  { font-size:10px; color:#94a3b8; margin-top:3px; }
.ls-mv-red   { color:#dc2626; }
.ls-mv-amber { color:#d97706; }
.ls-mv-green { color:#059669; }

/* Live dot */
.ls-live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; margin-right:5px; vertical-align:middle; animation:ls-pulse 1.8s infinite; }
@keyframes ls-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* ── Add button ── */
.ls-btn-add { display:flex; align-items:center; gap:6px; font-size:12px; padding:7px 14px; border-radius:8px; border:1.5px solid #1D9E75; background:#fff; color:#0F6E56; cursor:pointer; font-weight:600; flex-shrink:0; }
.ls-btn-add:hover { background:#E1F5EE; }

/* ── Tabs ── */
.ls-tabs { display:flex; gap:2px; margin-bottom:14px; background:#f1f5f9; border-radius:8px; padding:3px; }
.ls-tab  { flex:1; text-align:center; font-size:12px; padding:6px 4px; border-radius:6px; cursor:pointer; color:#64748b; border:none; background:transparent; font-weight:600; }
.ls-tab.on { background:#fff; color:#0f172a; border:1px solid #e2e8f0; }

/* ── Section label ── */
.ls-sec { margin-bottom:14px; }
.ls-sec-lbl { display:flex; align-items:center; gap:7px; font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; }
.ls-sec-cnt { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:99px; padding:1px 7px; font-size:9px; letter-spacing:0; text-transform:none; font-weight:600; color:#64748b; }

/* ── Entry card ── */
.ls-card { display:flex; align-items:flex-start; gap:10px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:11px 14px; margin-bottom:7px; }
.ls-card:last-child { margin-bottom:0; }
.ls-stripe { width:3px; border-radius:2px; flex-shrink:0; align-self:stretch; min-height:36px; }
.ls-str-c { background:#dc2626; }
.ls-str-h { background:#d97706; }
.ls-str-s { background:#059669; }
.ls-str-r { background:#2563eb; }
.ls-cbody { flex:1; min-width:0; }
.ls-ctop  { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:3px; flex-wrap:wrap; }
.ls-ctitle { font-size:12.5px; font-weight:700; color:#0f172a; }
.ls-badges { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
.ls-sev  { font-size:10px; padding:2px 8px; border-radius:99px; font-weight:700; }
.ls-sev-c { background:#fee2e2; color:#991b1b; }
.ls-sev-h { background:#fef3c7; color:#92400e; }
.ls-sev-s { background:#dcfce7; color:#166534; }
.ls-sev-r { background:#dbeafe; color:#1e40af; }
.ls-due   { font-size:10px; padding:2px 8px; border-radius:99px; font-weight:600; }
.ls-due-od { background:#fee2e2; color:#991b1b; }
.ls-due-sn { background:#fef3c7; color:#92400e; }
.ls-due-ok { background:#f1f5f9; color:#64748b; }
.ls-meta  { font-size:10px; color:#94a3b8; margin-bottom:3px; }
.ls-note  { font-size:11.5px; color:#475569; line-height:1.45; margin-bottom:7px; }
.ls-cfoot { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; }
.ls-src   { display:flex; align-items:center; gap:5px; font-size:10px; padding:2px 8px; border-radius:6px; border:1px solid #e2e8f0; color:#94a3b8; background:#f8fafc; }
.ls-cbtn  { font-size:11px; padding:4px 10px; border-radius:6px; border:1px solid #2563eb; background:transparent; color:#2563eb; cursor:pointer; }
.ls-cbtn:hover { background:#dbeafe; }

/* ── Action bar ── */
.ls-abar { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-top:4px; gap:10px; flex-wrap:wrap; }
.ls-abar-t { font-size:12px; color:#64748b; }
.ls-abar-t strong { color:#0f172a; }
.ls-inv-btn { font-size:12px; padding:7px 14px; border-radius:8px; background:#0f172a; color:#fff; border:none; cursor:pointer; font-weight:600; }
.ls-inv-btn:hover { opacity:.85; }
.ls-empty { padding:24px; text-align:center; color:#94a3b8; font-size:12px; }

/* ── Modal overlay ── */
.ls-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:9999; align-items:flex-start; justify-content:center; padding-top:60px; }
.ls-overlay.open { display:flex; }
.ls-modal { background:#fff; border-radius:12px; border:1px solid #e2e8f0; width:100%; max-width:520px; overflow:hidden; max-height:calc(100vh - 80px); display:flex; flex-direction:column; }
.ls-mhdr { padding:12px 16px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; flex-shrink:0; }
.ls-mhdr-l { display:flex; align-items:center; gap:9px; }
.ls-rtog { display:flex; background:#f1f5f9; border-radius:7px; padding:3px; gap:2px; }
.ls-rbtn { font-size:11px; padding:4px 10px; border-radius:5px; border:none; background:transparent; color:#64748b; cursor:pointer; font-weight:600; }
.ls-rbtn.on { background:#fff; color:#0f172a; border:1px solid #e2e8f0; }
.ls-rbadge { font-size:10px; padding:2px 9px; border-radius:99px; font-weight:600; }
.ls-rb-t { background:#dbeafe; color:#1e40af; }
.ls-rb-m { background:#dcfce7; color:#166534; }
.ls-mclose { font-size:20px; cursor:pointer; color:#94a3b8; background:none; border:none; line-height:1; padding:2px 7px; border-radius:6px; }
.ls-mclose:hover { background:#f1f5f9; color:#0f172a; }
.ls-mbody { padding:14px 16px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex:1; }
.ls-flbl  { font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:.07em; text-transform:uppercase; margin-bottom:5px; }

/* Status grid */
.ls-sgrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
.ls-sopt  { border:1px solid #e2e8f0; border-radius:8px; padding:8px 5px; cursor:pointer; background:#fff; text-align:center; }
.ls-sopt:hover { border-color:#94a3b8; background:#f8fafc; }
.ls-sopt.on-c { border-color:#dc2626; background:#fee2e2; }
.ls-sopt.on-h { border-color:#d97706; background:#fef3c7; }
.ls-sopt.on-s { border-color:#059669; background:#dcfce7; }
.ls-sopt.on-r { border-color:#2563eb; background:#dbeafe; }
.ls-sdot  { width:8px; height:8px; border-radius:50%; margin:0 auto 4px; }
.ls-st    { font-size:11px; font-weight:700; color:#0f172a; }
.ls-ss2   { font-size:9px; color:#94a3b8; margin-top:1px; }

/* Problem picker */
.ls-pw    { border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; }
.ls-psh   { display:flex; align-items:center; gap:7px; padding:7px 11px; border-bottom:1px solid #f1f5f9; }
.ls-psh input { flex:1; border:none; outline:none; font-size:12px; background:transparent; color:#0f172a; }
.ls-psh input::placeholder { color:#94a3b8; }
.ls-plist { max-height:160px; overflow-y:auto; }
.ls-pi    { display:flex; align-items:center; gap:9px; padding:7px 11px; cursor:pointer; border-bottom:1px solid #f1f5f9; }
.ls-pi:last-child { border-bottom:none; }
.ls-pi:hover { background:#f8fafc; }
.ls-pck   { width:15px; height:15px; border:1px solid #cbd5e1; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:#fff; }
.ls-pck.on { background:#2563eb; border-color:#2563eb; }
.ls-pck.on::after { content:''; display:block; width:8px; height:4px; border-left:1.5px solid #fff; border-bottom:1.5px solid #fff; transform:rotate(-45deg) translate(1px,-1px); }
.ls-ptxt  { font-size:12px; color:#0f172a; flex:1; }
.ls-pcat  { font-size:10px; color:#94a3b8; }
.ls-padd-row { display:flex; align-items:center; gap:7px; padding:6px 11px; background:#f8fafc; border-top:1px solid #f1f5f9; }
.ls-padd-btn { font-size:11px; padding:4px 10px; border-radius:6px; border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:4px; }
.ls-padd-btn:hover { color:#0f172a; }
.ls-np-row { display:flex; align-items:center; gap:6px; padding:7px 11px; background:#f8fafc; border-top:1px solid #f1f5f9; }
.ls-np-in  { flex:1; border:1px solid #e2e8f0; border-radius:6px; padding:5px 9px; font-size:12px; background:#fff; color:#0f172a; outline:none; }
.ls-np-in:focus { border-color:#2563eb; }
.ls-np-ok  { font-size:11px; padding:5px 11px; border-radius:6px; border:none; background:#0f172a; color:#fff; cursor:pointer; }

/* Chips */
.ls-chips { display:flex; flex-wrap:wrap; gap:5px; }
.ls-chip  { display:flex; align-items:center; gap:4px; font-size:11px; padding:3px 9px; border-radius:99px; background:#f1f5f9; border:1px solid #e2e8f0; color:#475569; }
.ls-chip-x { cursor:pointer; font-size:13px; color:#94a3b8; line-height:1; margin-left:2px; }
.ls-chip-x:hover { color:#0f172a; }

/* Textarea & date */
.ls-textarea { width:100%; border:1px solid #e2e8f0; border-radius:8px; padding:9px 11px; font-size:12px; color:#0f172a; background:#fff; resize:vertical; min-height:68px; font-family:inherit; outline:none; }
.ls-textarea:focus { border-color:#2563eb; }
.ls-textarea::placeholder { color:#94a3b8; }
.ls-date-in { padding:7px 11px; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; background:#fff; color:#0f172a; outline:none; }

/* Footer */
.ls-mftr { padding:10px 16px; border-top:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; flex-shrink:0; }
.ls-mftr-m { font-size:10px; color:#94a3b8; }
.ls-mftr-a { display:flex; gap:7px; }
.ls-btn-cl { font-size:12px; padding:6px 13px; border-radius:7px; border:1px solid #e2e8f0; background:transparent; color:#64748b; cursor:pointer; }
.ls-btn-cl:hover { background:#f8fafc; }
.ls-btn-sv { font-size:12px; padding:6px 14px; border-radius:7px; border:none; background:#0f172a; color:#fff; cursor:pointer; font-weight:600; }
.ls-btn-sv:hover { opacity:.85; }
.ls-btn-sv:disabled { opacity:.3; cursor:default; }
`;
    document.head.appendChild(s);
})();


/* ══════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════ */
window._ls = {
    entries:    [],   // ყველა ჩანაწერი (Supabase + ახლად დამატებული)
    curTab:     'all',
    curRole:    't',
    selStat:    null,
    checked:    {},
    showNP:     false,
    assetId:    null,
    assetName:  '',
};

const _lsRoles = {
    t: { name: 'ტექნიკოსი', badge: 'ls-rb-t' },
    m: { name: 'მენეჯერი',  badge: 'ls-rb-m' },
};

const _lsStCfg = {
    c: { label: 'გადაუდებელი', sev: 'ls-sev-c', stripe: 'ls-str-c', selCls: 'on-c', tab: 'al' },
    h: { label: 'ალარმი',      sev: 'ls-sev-h', stripe: 'ls-str-h', selCls: 'on-h', tab: 'al' },
    s: { label: 'გეგმიური',    sev: 'ls-sev-s', stripe: 'ls-str-s', selCls: 'on-s', tab: 'sv' },
    r: { label: 'რეკომ.',      sev: 'ls-sev-r', stripe: 'ls-str-r', selCls: 'on-r', tab: 'rc' },
};

const _lsGOrder  = ['c','h','s','r'];
const _lsGLabel  = { c:'გადაუდებელი', h:'ალარმები', s:'გეგმიური სერვისები', r:'რეკომენდაციები' };
const _lsGDotClr = { c:'#dc2626', h:'d97706', s:'#059669', r:'#2563eb' };

const _lsProbs = [
    { id:'p1',  t:'წყლის გაჟონვა / კონდენსატი', c:'ჰიდრ.' },
    { id:'p2',  t:'მაღ. წნევა — კომპრ.',          c:'კომპრ.' },
    { id:'p3',  t:'დაბ. წნევა — ფრეონი',          c:'ციკლი' },
    { id:'p4',  t:'ფილტრის დაბინძ.',              c:'ჰაერი' },
    { id:'p5',  t:'ვენტ. არ მუშ.',                c:'ელ/მექ' },
    { id:'p6',  t:'ხმაური / ვიბრ.',               c:'მექ.' },
    { id:'p7',  t:'ცუდი სუნი',                    c:'ჰაერი' },
    { id:'p8',  t:'ტემპ. სხვაობა',                c:'თბოგ.' },
    { id:'p9',  t:'ელ. კავშ. / ერ. კოდი',         c:'ელ.' },
    { id:'p10', t:'გ. ბლოკი არ ჩაირთო',           c:'გაშვ.' },
    { id:'p11', t:'BMS კომუნ. გაწყ.',             c:'ავტ.' },
    { id:'p12', t:'კომპრ. გადახ.',                c:'კომპრ.' },
    { id:'p13', t:'სეზ. ტექ. მომსახ.',            c:'გეგმ.' },
    { id:'p14', t:'ინვ. / ხელახ. შეფ.',           c:'ინსპ.' },
];


/* ══════════════════════════════════════════════════════════════
   MAIN RENDER — გამოიძახება _avRenderStatus()-დან
   ══════════════════════════════════════════════════════════════ */
async function lsRender() {
    const tc = document.getElementById('av-tc-status');
    if (!tc || !window._av?.currentAsset) return;

    const a = window._av.currentAsset;
    window._ls.assetId   = a.id;
    window._ls.assetName = a.name || '—';

    // Supabase-დან asset_observations ცხრილი (თუ ცხრილი შექმნილია)
    // თუ ჯერ არ გაქვს ეს ცხრილი, entries-ი ცარიელი იქნება
    try {
        const { data, error } = await _supabase
            .from('asset_observations')
            .select('*')
            .eq('asset_id', a.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Supabase-ს ჩანაწერები ვაფორმატებთ შიდა სტრუქტურაზე
            const dbEntries = data.map(row => ({
                id:      row.id,
                role:    row.author_role === 'tech' ? (row.author_name + ' · ტექნიკოსი') : (row.author_name + ' · მენეჯერი'),
                stat:    row.status_code,   // 'c','h','s','r'
                probs:   row.problems || [],
                note:    row.note || '',
                due:     row.due_date || '',
                time:    _lsFmtDate(row.created_at),
                src:     row.author_role === 'iot' ? 'iot' : (row.author_role === 'tech' ? 'tech' : 'mgr'),
                fromDb:  true,
            }));
            // local-only ჩანაწერები (ახლახანს დამატებული, ჯერ არ refresh) შევინახოთ
            const localOnly = window._ls.entries.filter(e => !e.fromDb);
            window._ls.entries = [...localOnly, ...dbEntries];
        }
    } catch(e) {
        // ცხრილი არ არსებობს — მხოლოდ local entries-ებით ვმუშაობთ
    }

    _lsInjectShell(tc);
    _lsRenderList();
}


/* ══════════════════════════════════════════════════════════════
   HTML SHELL — ერთხელ ინჯექცია av-tc-status-ში
   ══════════════════════════════════════════════════════════════ */
function _lsInjectShell(tc) {
    tc.innerHTML = `
<div class="ls-wrap">

  <!-- Header row -->
  <div class="ls-top">
    <div>
      <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.07em;text-transform:uppercase;margin-bottom:2px">Live მდგომარეობა</div>
      <div style="font-size:12px;color:#64748b" id="ls-asset-sub">${window._ls.assetName}</div>
    </div>
    <button class="ls-btn-add" onclick="lsOpenModal()">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <line x1="6" y1="1" x2="6" y2="11" stroke="#0F6E56" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="1" y1="6" x2="11" y2="6" stroke="#0F6E56" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      დამატება
    </button>
  </div>

  <!-- Metrics -->
  <div class="ls-metrics">
    <div class="ls-met"><div class="ls-mv ls-mv-red" id="ls-m-al">0</div><div class="ls-ml">ალარმი</div></div>
    <div class="ls-met"><div class="ls-mv ls-mv-amber" id="ls-m-sv">0</div><div class="ls-ml">გეგმიური</div></div>
    <div class="ls-met"><div class="ls-mv" id="ls-m-rc">0</div><div class="ls-ml">რეკომ.</div></div>
    <div class="ls-met">
      <div class="ls-mv ls-mv-green"><span class="ls-live-dot"></span>Live</div>
      <div class="ls-ml">IoT სტატუსი</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="ls-tabs">
    <button class="ls-tab on" id="ls-tb-all" onclick="lsSwitchTab('all')">ყველა</button>
    <button class="ls-tab"    id="ls-tb-al"  onclick="lsSwitchTab('al')">ალარმები</button>
    <button class="ls-tab"    id="ls-tb-sv"  onclick="lsSwitchTab('sv')">გეგმიური</button>
    <button class="ls-tab"    id="ls-tb-rc"  onclick="lsSwitchTab('rc')">რეკომ.</button>
  </div>

  <!-- Entry list -->
  <div id="ls-list-area"></div>

  <!-- Action bar -->
  <div class="ls-abar">
    <div class="ls-abar-t"><strong id="ls-abar-n">0 საკითხი</strong> — ინვოისში გაერთიანება შესაძლებელია</div>
    <button class="ls-inv-btn" onclick="lsCreateInvoice()">ინვოისის შექმნა →</button>
  </div>

</div>

<!-- ══ MODAL ══ -->
<div class="ls-overlay" id="ls-overlay">
  <div class="ls-modal">

    <div class="ls-mhdr">
      <div class="ls-mhdr-l">
        <div class="ls-rtog">
          <button class="ls-rbtn on" id="ls-rt-t" onclick="lsSetRole('t')">ტექნიკოსი</button>
          <button class="ls-rbtn"    id="ls-rt-m" onclick="lsSetRole('m')">მენეჯერი</button>
        </div>
        <span class="ls-rbadge ls-rb-t" id="ls-rname">ტექნიკოსი</span>
      </div>
      <button class="ls-mclose" onclick="lsCloseModal()">×</button>
    </div>

    <div class="ls-mbody">

      <!-- სტატუსი -->
      <div>
        <div class="ls-flbl">სტატუსი</div>
        <div class="ls-sgrid">
          <div class="ls-sopt" onclick="lsSelSt(this,'c')" data-v="c">
            <div class="ls-sdot" style="background:#dc2626"></div>
            <div class="ls-st">გადაუდ.</div><div class="ls-ss2">მყისე</div>
          </div>
          <div class="ls-sopt" onclick="lsSelSt(this,'h')" data-v="h">
            <div class="ls-sdot" style="background:#d97706"></div>
            <div class="ls-st">ალარმი</div><div class="ls-ss2">მნიშვ.</div>
          </div>
          <div class="ls-sopt" onclick="lsSelSt(this,'s')" data-v="s">
            <div class="ls-sdot" style="background:#059669"></div>
            <div class="ls-st">გეგმიური</div><div class="ls-ss2">სერვ.</div>
          </div>
          <div class="ls-sopt" onclick="lsSelSt(this,'r')" data-v="r">
            <div class="ls-sdot" style="background:#2563eb"></div>
            <div class="ls-st">რეკომ.</div><div class="ls-ss2">შეთავ.</div>
          </div>
        </div>
      </div>

      <!-- პრობლემა -->
      <div>
        <div class="ls-flbl">პრობლემა / სამუშაო</div>
        <div class="ls-pw">
          <div class="ls-psh">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#94a3b8" stroke-width="1.2"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <input id="ls-pq" type="text" placeholder="მოძებნე..." oninput="lsFilterP()"/>
          </div>
          <div class="ls-plist" id="ls-plist"></div>
          <div class="ls-np-row" id="ls-np-row" style="display:none">
            <input class="ls-np-in" id="ls-np-val" type="text" placeholder="ახალი პრობლემის სახელი..."/>
            <button class="ls-np-ok" onclick="lsAddCustom()">+ დამატება</button>
          </div>
          <div class="ls-padd-row">
            <button class="ls-padd-btn" onclick="lsTogNP()">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              სიაში არ არის?
            </button>
          </div>
        </div>
        <div class="ls-chips" id="ls-chips" style="margin-top:7px"></div>
      </div>

      <!-- შენიშვნა -->
      <div>
        <div class="ls-flbl">შენიშვნა</div>
        <textarea class="ls-textarea" id="ls-fnote"
          placeholder="დეტალები, ზომები, ვიზუალური დაკვირვება...&#10;მაგ: კომპრ. #1 ხმაურობს, ∆T = +8°C..."></textarea>
      </div>

      <!-- ვადა -->
      <div>
        <div class="ls-flbl">საორიენტაციო ვადა</div>
        <input type="date" id="ls-fdue" class="ls-date-in"/>
      </div>

    </div>

    <div class="ls-mftr">
      <span class="ls-mftr-m" id="ls-mftr-asset">${window._ls.assetName}</span>
      <div class="ls-mftr-a">
        <button class="ls-btn-cl" onclick="lsResetForm()">გასუფთ.</button>
        <button class="ls-btn-sv" id="ls-fsave" onclick="lsSaveEntry()" disabled>შენახვა →</button>
      </div>
    </div>

  </div>
</div>`;

    _lsRenderPList('');
}


/* ══════════════════════════════════════════════════════════════
   LIST RENDER
   ══════════════════════════════════════════════════════════════ */
function _lsRenderList() {
    const tabFilter = { all: null, al: ['c','h'], sv: ['s'], rc: ['r'] };
    const f = tabFilter[window._ls.curTab];
    const shown = f
        ? window._ls.entries.filter(e => f.includes(e.stat))
        : window._ls.entries;

    const la = document.getElementById('ls-list-area');
    if (!la) return;

    if (!shown.length) {
        la.innerHTML = '<div class="ls-empty">ჩანაწერები არ არის — "+" ღილაკით დაამატე</div>';
        _lsUpdateMetrics();
        return;
    }

    const groups = { c:[], h:[], s:[], r:[] };
    shown.forEach(e => { if (groups[e.stat]) groups[e.stat].push(e); });

    let html = '';
    _lsGOrder.forEach(g => {
        const arr = groups[g];
        if (!arr.length) return;
        const clr = { c:'#dc2626', h:'#d97706', s:'#059669', r:'#2563eb' }[g];
        html += `<div class="ls-sec">
          <div class="ls-sec-lbl">
            <span style="width:7px;height:7px;border-radius:50%;background:${clr};display:inline-block;flex-shrink:0"></span>
            ${_lsGLabel[g]} <span class="ls-sec-cnt">${arr.length}</span>
          </div>`;
        arr.forEach(e => {
            const sc  = _lsStCfg[e.stat];
            const due = e.due ? _lsDueClass(e.due) : null;
            const srcHtml = e.src === 'iot'
                ? `<span class="ls-live-dot" style="width:6px;height:6px;margin-right:2px"></span>IoT`
                : (e.src === 'mgr' ? 'მენეჯერი' : 'ტექნიკოსი');
            html += `
            <div class="ls-card">
              <div class="ls-stripe ${sc.stripe}"></div>
              <div class="ls-cbody">
                <div class="ls-ctop">
                  <span class="ls-ctitle">${e.probs.join(' · ')}</span>
                  <div class="ls-badges">
                    ${due ? `<span class="ls-due ${due.cls}">${e.due}</span>` : ''}
                    <span class="ls-sev ${sc.sev}">${sc.label}</span>
                  </div>
                </div>
                <div class="ls-meta">${e.role} · ${e.time}</div>
                ${e.note ? `<div class="ls-note">${e.note}</div>` : ''}
                <div class="ls-cfoot">
                  <div class="ls-src">${srcHtml}</div>
                  <button class="ls-cbtn" onclick="lsReqService('${e.probs[0]?.replace(/'/g,"\\'")}')">სერვისი →</button>
                </div>
              </div>
            </div>`;
        });
        html += '</div>';
    });

    la.innerHTML = html;
    _lsUpdateMetrics();
}

function _lsUpdateMetrics() {
    const al = document.getElementById('ls-m-al');
    const sv = document.getElementById('ls-m-sv');
    const rc = document.getElementById('ls-m-rc');
    const nb = document.getElementById('ls-abar-n');
    if (al) al.textContent = window._ls.entries.filter(e => e.stat==='c'||e.stat==='h').length;
    if (sv) sv.textContent = window._ls.entries.filter(e => e.stat==='s').length;
    if (rc) rc.textContent = window._ls.entries.filter(e => e.stat==='r').length;
    if (nb) nb.textContent = window._ls.entries.length + ' საკითხი';
}


/* ══════════════════════════════════════════════════════════════
   TAB SWITCH
   ══════════════════════════════════════════════════════════════ */
function lsSwitchTab(t) {
    window._ls.curTab = t;
    ['all','al','sv','rc'].forEach(x => {
        const el = document.getElementById('ls-tb-' + x);
        if (el) el.classList.toggle('on', x === t);
    });
    _lsRenderList();
}


/* ══════════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════════ */
function lsOpenModal() {
    const ov = document.getElementById('ls-overlay');
    if (ov) { ov.classList.add('open'); _lsRenderPList(''); }
}

function lsCloseModal() {
    const ov = document.getElementById('ls-overlay');
    if (ov) ov.classList.remove('open');
}

function lsSetRole(r) {
    window._ls.curRole = r;
    ['t','m'].forEach(x => {
        const el = document.getElementById('ls-rt-' + x);
        if (el) el.classList.toggle('on', x === r);
    });
    const rn = document.getElementById('ls-rname');
    if (rn) {
        rn.textContent = _lsRoles[r].name;
        rn.className   = 'ls-rbadge ' + _lsRoles[r].badge;
    }
}

function lsSelSt(el, v) {
    document.querySelectorAll('.ls-sopt').forEach(o => {
        o.classList.remove('on-c','on-h','on-s','on-r');
    });
    el.classList.add(_lsStCfg[v].selCls);
    window._ls.selStat = v;
    _lsCheckSave();
}


/* ══════════════════════════════════════════════════════════════
   PROBLEM PICKER
   ══════════════════════════════════════════════════════════════ */
function _lsRenderPList(q) {
    const list = document.getElementById('ls-plist');
    if (!list) return;
    const shown = _lsProbs.filter(p =>
        p.t.toLowerCase().includes((q||'').toLowerCase()) ||
        p.c.toLowerCase().includes((q||'').toLowerCase())
    );
    if (!shown.length) {
        list.innerHTML = '<div class="ls-empty" style="padding:10px">არ მოიძებნა — გამოიყენე "+ ახალი"</div>';
        return;
    }
    list.innerHTML = shown.map(p => {
        const on = window._ls.checked[p.id] ? 'on' : '';
        return `<div class="ls-pi" onclick="lsTog('${p.id}','${p.t.replace(/'/g,"\\'")}')">
          <div class="ls-pck ${on}" id="ls-ck-${p.id}"></div>
          <span class="ls-ptxt">${p.t}</span>
          <span class="ls-pcat">${p.c}</span>
        </div>`;
    }).join('');
}

function lsTog(id, txt) {
    if (window._ls.checked[id]) delete window._ls.checked[id];
    else window._ls.checked[id] = txt;
    _lsRenderPList(document.getElementById('ls-pq')?.value || '');
    _lsRenderChips();
    _lsCheckSave();
}

function _lsRenderChips() {
    const w = document.getElementById('ls-chips');
    if (!w) return;
    w.innerHTML = Object.keys(window._ls.checked).map(k =>
        `<div class="ls-chip">${window._ls.checked[k]}<span class="ls-chip-x" onclick="lsRmChip('${k}')">×</span></div>`
    ).join('');
}

function lsRmChip(id) {
    delete window._ls.checked[id];
    _lsRenderPList(document.getElementById('ls-pq')?.value || '');
    _lsRenderChips();
    _lsCheckSave();
}

function lsFilterP() {
    _lsRenderPList(document.getElementById('ls-pq')?.value || '');
}

function lsTogNP() {
    window._ls.showNP = !window._ls.showNP;
    const row = document.getElementById('ls-np-row');
    if (row) row.style.display = window._ls.showNP ? 'flex' : 'none';
    if (window._ls.showNP) document.getElementById('ls-np-val')?.focus();
}

function lsAddCustom() {
    const val = document.getElementById('ls-np-val')?.value.trim();
    if (!val) return;
    const id = 'cx-' + Date.now();
    _lsProbs.push({ id, t: val, c: 'ხელნ.' });
    window._ls.checked[id] = val;
    const inp = document.getElementById('ls-np-val');
    if (inp) inp.value = '';
    window._ls.showNP = false;
    const row = document.getElementById('ls-np-row');
    if (row) row.style.display = 'none';
    _lsRenderPList(document.getElementById('ls-pq')?.value || '');
    _lsRenderChips();
    _lsCheckSave();
}

function _lsCheckSave() {
    const btn = document.getElementById('ls-fsave');
    if (btn) btn.disabled = !(window._ls.selStat && Object.keys(window._ls.checked).length > 0);
}


/* ══════════════════════════════════════════════════════════════
   SAVE ENTRY
   ══════════════════════════════════════════════════════════════ */
async function lsSaveEntry() {
    const probs = Object.values(window._ls.checked);
    const note  = document.getElementById('ls-fnote')?.value.trim() || '';
    const due   = document.getElementById('ls-fdue')?.value || '';
    const role  = window._ls.curRole;

    const entry = {
        id:     'local-' + Date.now(),
        role:   _lsRoles[role].name + (role === 't' ? ' · ტექნიკოსი' : ' · მენეჯერი'),
        stat:   window._ls.selStat,
        probs:  probs,
        note:   note,
        due:    due,
        time:   'ახლახანს',
        src:    role === 't' ? 'tech' : 'mgr',
        fromDb: false,
    };

    // Supabase-ში შენახვა (თუ ცხრილი asset_observations არსებობს)
    try {
        await _supabase.from('asset_observations').insert({
            asset_id:    window._ls.assetId,
            status_code: window._ls.selStat,
            problems:    probs,
            note:        note,
            due_date:    due || null,
            author_role: role,
            author_name: _lsRoles[role].name,
        });
        entry.fromDb = true;
    } catch(e) {
        // ცხრილი არ არსებობს — local-ად ვინახავთ
    }

    window._ls.entries.unshift(entry);
    _lsRenderList();
    lsResetForm();
    lsCloseModal();
}

function lsResetForm() {
    window._ls.selStat = null;
    window._ls.checked = {};
    window._ls.showNP  = false;
    document.querySelectorAll('.ls-sopt').forEach(o =>
        o.classList.remove('on-c','on-h','on-s','on-r')
    );
    const pq = document.getElementById('ls-pq');
    if (pq) pq.value = '';
    const fn = document.getElementById('ls-fnote');
    if (fn) fn.value = '';
    const fd = document.getElementById('ls-fdue');
    if (fd) fd.value = '';
    const chips = document.getElementById('ls-chips');
    if (chips) chips.innerHTML = '';
    const np = document.getElementById('ls-np-row');
    if (np) np.style.display = 'none';
    const sv = document.getElementById('ls-fsave');
    if (sv) sv.disabled = true;
    _lsRenderPList('');
}


/* ══════════════════════════════════════════════════════════════
   INVOICE + SERVICE REQUEST
   ══════════════════════════════════════════════════════════════ */
function lsCreateInvoice() {
    // ინვოისის ტაბზე გადადი და გადასცე ღია საკითხები
    avSwitchTab('inv', null);
    // შეიძლება ინვოის მოდალს გადასცე entries-ები:
    // window._lsInvoiceSeed = window._ls.entries;
}

function lsReqService(prob) {
    // სერვის ლოგის მოდალი გახსენი (asset_view.js-ის ფუნქცია)
    if (typeof avAddService === 'function') avAddService();
}


/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
function _lsDueClass(d) {
    const diff = (new Date(d) - new Date()) / 864e5;
    if (diff < 0)  return { cls: 'ls-due-od' };
    if (diff < 30) return { cls: 'ls-due-sn' };
    return { cls: 'ls-due-ok' };
}

function _lsFmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ka-GE', { day:'2-digit', month:'short', year:'numeric' });
}