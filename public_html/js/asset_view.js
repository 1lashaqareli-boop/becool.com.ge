/* ============================================================
   BECOOL CRM — asset_view.js  (FIX: CSS layout პრობლემა)
   
   მთავარი fix-ები:
   1. .av-main overflow: hidden → overflow: auto  (შიგთავსი იჭრებოდა)
   2. .av-layout min-height → height: auto         (grid სიმაღლე)
   3. #asset-view display: block + min-height       (view-section კონფლიქტი)
   4. .av-tab-content overflow-y: auto + max-height (სქროლი)
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   HTML INJECTION — asset-view სექციის HTML
   ══════════════════════════════════════════════════════════════ */
function injectAssetViewHTML() {
    const section = document.getElementById('asset-view');
    if (!section) return;

    section.innerHTML = `
    <div class="av-layout">

      <!-- ════ SIDEBAR ════ -->
      <div class="av-sb" id="av-sidebar">
        <div class="av-sb-header">
          <div class="av-sb-branch-name" id="av-branch-label">ფილიალი</div>
          <div class="av-sb-sub">აგრეგატები</div>
        </div>

        <!-- კონდიციონერები -->
        <div class="av-sb-section-label">კონდიციონერები</div>
        <div class="av-cat-wrap">
          <div class="av-cat open" onclick="avToggleCat(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 11h12"/></svg>
            AC სისტემები
            <svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="av-sub">
            <div class="av-item" data-type="Split" onclick="avSelectType(this)">Split<span class="av-badge" id="badge-Split">0</span></div>
            <div class="av-item" data-type="Multi-Split" onclick="avSelectType(this)">Multi-Split<span class="av-badge" id="badge-Multi-Split">0</span></div>
            <div class="av-item" data-type="Semi-Industrial" onclick="avSelectType(this)">ნახ. სამრ.<span class="av-badge" id="badge-Semi-Industrial">0</span></div>
            <div class="av-item" data-type="VRF" onclick="avSelectType(this)">VRV / VRF<span class="av-badge" id="badge-VRF">0</span></div>
            <div class="av-item" data-type="Chiller" onclick="avSelectType(this)">Chiller<span class="av-badge" id="badge-Chiller">0</span></div>
            <div class="av-item" data-type="Rooftop" onclick="avSelectType(this)">Rooftop<span class="av-badge" id="badge-Rooftop">0</span></div>
          </div>
        </div>

        <!-- მაცივრები -->
        <div class="av-sb-section-label">მაცივრები</div>
        <div class="av-cat-wrap">
          <div class="av-cat" onclick="avToggleCat(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 6v4M8 8h8M12 14v4M8 16h8"/></svg>
            Refrigeration
            <svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="av-sub">
            <div class="av-item" data-type="Reach-in" onclick="avSelectType(this)">Reach-in<span class="av-badge" id="badge-Reach-in">0</span></div>
            <div class="av-item" data-type="Walk-in" onclick="avSelectType(this)">Walk-in<span class="av-badge" id="badge-Walk-in">0</span></div>
            <div class="av-item" data-type="Display Case" onclick="avSelectType(this)">Display case<span class="av-badge" id="badge-Display Case">0</span></div>
            <div class="av-item" data-type="Blast Chiller" onclick="avSelectType(this)">Blast chiller<span class="av-badge" id="badge-Blast Chiller">0</span></div>
            <div class="av-item" data-type="Condensing Unit" onclick="avSelectType(this)">Cond. unit<span class="av-badge" id="badge-Condensing Unit">0</span></div>
          </div>
        </div>

        <!-- გათბობა -->
        <div class="av-sb-section-label">გათბობა</div>
        <div class="av-cat-wrap">
          <div class="av-cat" onclick="avToggleCat(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c-4 4-6 7-6 10a6 6 0 0 0 12 0c0-3-2-6-6-10z"/></svg>
            Heating
            <svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="av-sub">
            <div class="av-item" data-type="Boiler" onclick="avSelectType(this)">Boiler<span class="av-badge" id="badge-Boiler">0</span></div>
          </div>
        </div>

        <!-- წყალი -->
        <div class="av-sb-section-label">წყალი</div>
        <div class="av-cat-wrap">
          <div class="av-cat" onclick="avToggleCat(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20"/></svg>
            Hot / Cold water
            <svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="av-sub">
            <div class="av-item" data-type="DHW" onclick="avSelectType(this)">DHW ბაკი<span class="av-badge" id="badge-DHW">0</span></div>
            <div class="av-item" data-type="Electric Heater" onclick="avSelectType(this)">ელ. გამაც.<span class="av-badge" id="badge-Electric Heater">0</span></div>
            <div class="av-item" data-type="Pump" onclick="avSelectType(this)">ტუმბო<span class="av-badge" id="badge-Pump">0</span></div>
          </div>
        </div>

        <!-- ვენტილაცია -->
        <div class="av-sb-section-label">ვენტილაცია</div>
        <div class="av-cat-wrap">
          <div class="av-cat" onclick="avToggleCat(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12c2-2 6-2 6 2s-4 4-6 2M12 12C10 10 6 10 6 6s4-4 6-2M12 12c0 3 2 6-2 6s-4-4-2-6M12 12c0-3-2-6 2-6s4 4 2 6"/></svg>
            ვენტ. სისტემები
            <svg class="av-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="av-sub">
            <div class="av-item" data-type="Recuperator" onclick="avSelectType(this)">რეკუპერატორი<span class="av-badge" id="badge-Recuperator">0</span></div>
            <div class="av-item" data-type="AHU" onclick="avSelectType(this)">AHU<span class="av-badge" id="badge-AHU">0</span></div>
            <div class="av-item" data-type="Fan" onclick="avSelectType(this)">გამწოვი<span class="av-badge" id="badge-Fan">0</span></div>
          </div>
        </div>

        <!-- სხვა -->
        <div class="av-cat-wrap" style="margin-top:4px">
          <div class="av-item" data-type="Other" onclick="avSelectType(this)" style="padding-left:16px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            სხვა<span class="av-badge" id="badge-Other">0</span>
          </div>
        </div>
      </div>

      <!-- ════ MAIN CONTENT ════ -->
      <div class="av-main" id="av-main">

        <!-- ══ ASSET LIST (type selected, no asset) ══ -->
        <div id="av-list-panel" class="av-list-panel">
          <div class="av-list-header">
            <div>
              <div class="av-list-title" id="av-list-title">აირჩიეთ კატეგორია</div>
              <div class="av-list-sub" id="av-list-sub"></div>
            </div>
            <button class="av-btn-add" onclick="avOpenNewAsset()">+ ახალი</button>
          </div>
          <div class="av-cards-grid" id="av-cards-grid">
            <div class="av-empty">კატეგორია არ არის არჩეული</div>
          </div>
        </div>

        <!-- ══ ASSET DETAIL ══ -->
        <div id="av-detail-panel" class="av-hidden">

          <!-- Header -->
          <div class="av-header" id="av-detail-header">
            <div class="av-header-top">
              <div class="av-header-img" id="av-hdr-img">
                <svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".2" width="60" height="60">
                  <rect x="4" y="4" width="72" height="32" rx="4"/>
                  <rect x="8" y="38" width="64" height="14" rx="2"/>
                  <circle cx="22" cy="20" r="9"/><circle cx="22" cy="20" r="4"/>
                  <line x1="38" y1="14" x2="70" y2="14"/>
                  <line x1="38" y1="20" x2="70" y2="20"/>
                  <line x1="38" y1="26" x2="70" y2="26"/>
                </svg>
              </div>
              <div class="av-header-info">
                <div class="av-hdr-name" id="av-hdr-name">—</div>
                <div class="av-hdr-model" id="av-hdr-model">—</div>
                <div class="av-hdr-specs" id="av-hdr-specs"></div>
              </div>
              <div class="av-header-right">
                <span class="av-status-badge" id="av-hdr-status">—</span>
                <div class="av-hdr-kpis" id="av-hdr-kpis"></div>
                <div class="av-hdr-btns">
                  <button class="av-btn-pri" onclick="avAddService()">+ სერვისი</button>
                  <button class="av-btn-sec" onclick="avEditAsset()">რედ.</button>
                  <button class="av-btn-back" onclick="avBackToList()">← სია</button>
                </div>
              </div>
            </div>

            <!-- Toggle details -->
            <div class="av-toggle-row" id="av-toggle-row" onclick="avToggleDetails()">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>სრული ტექნიკური მონაცემები</span>
              <svg id="av-toggle-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:auto;transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <!-- Details (collapsible) -->
            <div class="av-details-panel av-hidden" id="av-details-panel">
              <div class="av-details-grid" id="av-details-grid"></div>
            </div>
          </div>

          <!-- KPI strip -->
          <div class="av-kpi-strip" id="av-kpi-strip"></div>

          <!-- Tabs -->
          <div class="av-tabs" id="av-tabs">
            <div class="av-tab active" data-tab="home" onclick="avSwitchTab('home',this)">მთავარი</div>
            <div class="av-tab" data-tab="svc" onclick="avSwitchTab('svc',this)">სერვ. ისტ.</div>
            <div class="av-tab" data-tab="status" onclick="avSwitchTab('status',this)">მდგ. &amp; გეგმა</div>
            <div class="av-tab" data-tab="inv" onclick="avSwitchTab('inv',this)">ინვოისები</div>
            <div class="av-tab" data-tab="iot" onclick="avSwitchTab('iot',this)">IoT / BMS</div>
            <div class="av-tab" data-tab="lib" onclick="avSwitchTab('lib',this)">ბიბლიოთეკა</div>
          </div>

          <!-- Tab content -->
          <div class="av-tab-content" id="av-tc-home"></div>
          <div class="av-tab-content av-hidden" id="av-tc-svc"></div>
          <div class="av-tab-content av-hidden" id="av-tc-status"></div>
          <div class="av-tab-content av-hidden" id="av-tc-inv"></div>
          <div class="av-tab-content av-hidden" id="av-tc-iot"></div>
          <div class="av-tab-content av-hidden" id="av-tc-lib"></div>
        </div>

      </div>
    </div>`;
}


/* ══════════════════════════════════════════════════════════════
   CSS INJECTION  —  ★ მთავარი FIX-ები აქ ★
   ══════════════════════════════════════════════════════════════ */
function injectAssetViewCSS() {
    /* თუ უკვე ჩასმულია — წავშალოთ და ხელახლა ჩავსვათ (განახლების გარანტია) */
    const old = document.getElementById('av-styles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'av-styles';
    style.textContent = `

/* ════════════════════════════════════════════════════════════
   FIX 1 — #asset-view: view-section კლასი display:none-ს წერს
   active კლასზე ავცდენთ: display:block + min-height
   ════════════════════════════════════════════════════════════ */
#asset-view {
    display: block !important;   /* view-section display:none-ს ვაჩხუბებთ */
    min-height: 600px;
}

/* ════════════════════════════════════════════════════════════
   FIX 2 — .av-layout: grid სიმაღლე
   overflow:hidden ნაცვლად — visible, სიმაღლე auto
   ════════════════════════════════════════════════════════════ */
.av-layout {
    display: grid;
    grid-template-columns: 210px 1fr;
    min-height: 600px;           /* FIX: calc(100vh-80px) ცვლის breadcrumb-ის გამო */
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    overflow: visible;           /* FIX: hidden → visible */
    background: #fff;
    margin-bottom: 2rem;
}

/* ════════════════════════════════════════════════════════════
   FIX 3 — .av-main: overflow:hidden შიგთავსს ჭრიდა
   ════════════════════════════════════════════════════════════ */
.av-main {
    display: flex;
    flex-direction: column;
    overflow: visible;           /* FIX: hidden → visible */
    min-width: 0;                /* grid overflow დაცვა */
}

/* ════════════════════════════════════════════════════════════
   FIX 4 — .av-tab-content: სქროლი და ხილვადობა
   ════════════════════════════════════════════════════════════ */
.av-tab-content {
    padding: 16px 18px;
    overflow-y: auto;            /* FIX: flex:1 ამოვიღეთ */
    display: block;
}

/* ── Sidebar ── */
.av-sb {
    background: #0f2942;
    overflow-y: auto;
    border-radius: 1rem 0 0 1rem;
}
.av-sb-header {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,.07);
}
.av-sb-branch-name {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
}
.av-sb-sub {
    font-size: 10px;
    color: rgba(255,255,255,.4);
    margin-top: 2px;
}
.av-sb-section-label {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,.3);
    text-transform: uppercase;
    letter-spacing: .1em;
    padding: 14px 16px 5px;
}

.av-cat {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    color: rgba(255,255,255,.55);
    font-size: 11.5px;
    font-weight: 600;
    user-select: none;
    transition: background .12s;
}
.av-cat:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.9); }
.av-cat.open { color: #fff; }
.av-arrow { margin-left: auto; transition: transform .2s; opacity: .5; flex-shrink: 0; }
.av-cat.open .av-arrow { transform: rotate(90deg); opacity: 1; }
.av-sub { display: none; }
.av-cat.open + .av-sub { display: block; }

.av-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px 6px 34px;
    font-size: 11px;
    color: rgba(255,255,255,.4);
    cursor: pointer;
    transition: background .12s;
}
.av-item:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.75); }
.av-item.active { background: rgba(29,158,117,.2); color: #5DCAA5; font-weight: 600; }
.av-badge {
    margin-left: auto;
    background: rgba(255,255,255,.08);
    border-radius: 8px;
    padding: 1px 6px;
    font-size: 9px;
    color: rgba(255,255,255,.35);
}
.av-item.active .av-badge { background: rgba(29,158,117,.3); color: #9FE1CB; }

/* ── List panel ── */
.av-list-panel { padding: 18px 20px; }
.av-list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}
.av-list-title { font-size: 15px; font-weight: 700; color: #0f172a; }
.av-list-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
.av-btn-add {
    font-size: 11px;
    padding: 6px 14px;
    border: 1.5px solid #1D9E75;
    border-radius: 8px;
    color: #1D9E75;
    cursor: pointer;
    background: transparent;
    font-weight: 600;
}
.av-btn-add:hover { background: #E1F5EE; }
.av-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}
.av-empty {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
    grid-column: 1/-1;
    padding: 40px 0;
    text-align: center;
}

/* Asset cards */
.av-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all .15s;
    background: #fff;
}
.av-card:hover { border-color: #1D9E75; box-shadow: 0 2px 8px rgba(29,158,117,.1); transform: translateY(-1px); }
.av-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.av-card-name { font-size: 12px; font-weight: 700; color: #0f172a; }
.av-card-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
.av-card-rows { font-size: 11px; }
.av-card-row { display: flex; justify-content: space-between; padding: 3px 0; color: #64748b; border-bottom: 1px solid #f1f5f9; }
.av-card-row:last-child { border: none; }
.av-card-val { font-weight: 600; color: #0f172a; }
.av-card-actions { display: flex; gap: 6px; margin-top: 10px; }
.av-card-btn {
    flex: 1;
    padding: 5px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 10px;
    text-align: center;
    cursor: pointer;
    background: #fff;
    color: #475569;
}
.av-card-btn:hover { background: #f8fafc; }
.av-card-btn.pri { background: #1D9E75; border-color: #1D9E75; color: #fff; font-weight: 600; }
.av-card-btn.pri:hover { background: #0F6E56; }

/* Status badges */
.av-s-ok    { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
.av-s-maint { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
.av-s-down  { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }

/* ── Detail Header ── */
.av-header { border-bottom: 1px solid #e2e8f0; }
.av-header-top {
    padding: 14px 18px;
    display: grid;
    grid-template-columns: 150px 1fr auto;
    gap: 14px;
    align-items: start;
}
.av-header-img {
    width: 150px;
    height: 100px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
}
.av-header-img img { width: 100%; height: 100%; object-fit: cover; }
.av-hdr-name  { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.av-hdr-model { font-size: 11px; color: #64748b; margin-bottom: 8px; }
.av-hdr-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
.av-spec-row  { display: flex; gap: 5px; font-size: 11px; }
.av-spec-l    { color: #64748b; min-width: 80px; }
.av-spec-v    { color: #0f172a; font-weight: 600; }
.av-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; }
.av-status-badge { padding: 3px 11px; border-radius: 14px; font-size: 10.5px; font-weight: 700; }
.av-hdr-kpis { display: flex; gap: 6px; }
.av-hdr-kpi  { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px 10px; text-align: center; }
.av-hdr-kpi-v { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1; }
.av-hdr-kpi-l { font-size: 9px; color: #64748b; margin-top: 2px; }
.av-hdr-btns { display: flex; gap: 6px; }
.av-btn-pri  { font-size: 11px; padding: 5px 10px; border-radius: 6px; background: #1D9E75; border: none; color: #fff; cursor: pointer; font-weight: 600; }
.av-btn-pri:hover { background: #0F6E56; }
.av-btn-sec  { font-size: 11px; padding: 5px 10px; border-radius: 6px; background: #fff; border: 1px solid #e2e8f0; color: #475569; cursor: pointer; }
.av-btn-sec:hover { background: #f8fafc; }
.av-btn-back { font-size: 11px; padding: 5px 10px; border-radius: 6px; background: #fff; border: 1px solid #e2e8f0; color: #1D9E75; cursor: pointer; font-weight: 600; }
.av-btn-back:hover { background: #E1F5EE; }

/* Toggle row */
.av-toggle-row {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 18px;
    cursor: pointer;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 10.5px;
    color: #64748b;
    user-select: none;
}
.av-toggle-row:hover { background: #f1f5f9; color: #475569; }

/* Details collapsible */
.av-details-panel { border-top: 1px solid #e2e8f0; padding: 12px 18px; background: #f8fafc; }
.av-details-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.av-det-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
.av-det-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; font-weight: 600; }
.av-det-val   { font-size: 12px; font-weight: 700; color: #0f172a; }
.av-det-sub   { font-size: 10px; color: #64748b; margin-top: 1px; }

/* KPI strip */
.av-kpi-strip {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    overflow-x: auto;
}
.av-ks-cell   { flex: 1; min-width: 80px; padding: 8px 6px; text-align: center; border-right: 1px solid #e2e8f0; }
.av-ks-cell:last-child { border-right: none; }
.av-ks-v { font-size: 15px; font-weight: 700; color: #0f172a; }
.av-ks-l { font-size: 9px; color: #94a3b8; margin-top: 1px; }
.av-ks-ok   { color: #166534 !important; }
.av-ks-warn { color: #92400e !important; }
.av-ks-down { color: #991b1b !important; }
.av-ks-info { color: #185FA5 !important; }

/* Tabs */
.av-tabs {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 18px;
    background: #fff;
    overflow-x: auto;
}
.av-tab {
    padding: 9px 14px;
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
}
.av-tab:hover { color: #64748b; }
.av-tab.active { color: #1D9E75; border-bottom-color: #1D9E75; }

/* Content cards */
.av-tcard { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.av-tcard-h { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.av-tcard-ha { font-size: 10px; color: #1D9E75; cursor: pointer; font-weight: 600; text-transform: none; letter-spacing: 0; }
.av-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.av-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.av-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }

/* Log table */
.av-log-head { display: grid; grid-template-columns: 68px 1fr 72px 56px 50px; gap: 4px; padding: 4px 0; font-size: 9px; color: #94a3b8; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
.av-log-row  { display: grid; grid-template-columns: 68px 1fr 72px 56px 50px; gap: 4px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; align-items: center; font-size: 11px; }
.av-log-row:last-child { border: none; }
.av-log-date { color: #94a3b8; font-size: 10px; }
.av-log-tech { color: #94a3b8; font-size: 10px; }
.av-log-cost { font-weight: 700; text-align: right; color: #0f172a; }
.av-pill { padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; text-align: center; }
.av-ppm  { background: #dbeafe; color: #1e40af; }
.av-cor  { background: #fef3c7; color: #92400e; }
.av-emr  { background: #fee2e2; color: #991b1b; }
.av-inst { background: #dcfce7; color: #166534; }

/* Measurements */
.av-meas { background: #f8fafc; border-radius: 6px; padding: 8px 10px; border-left: 3px solid; }
.av-meas.g { border-color: #10b981; }
.av-meas.y { border-color: #f59e0b; }
.av-meas.r { border-color: #ef4444; }
.av-meas-l { font-size: 9px; color: #94a3b8; margin-bottom: 2px; font-weight: 600; }
.av-meas-v { font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.2; }
.av-meas-u { font-size: 10px; color: #94a3b8; margin-left: 2px; }

/* Scheduled */
.av-sched-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
.av-sched-row:last-child { border: none; }
.av-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.av-sched-date { min-width: 66px; color: #94a3b8; font-size: 10px; }
.av-sched-task { flex: 1; color: #0f172a; }
.av-days { font-size: 9px; padding: 2px 7px; border-radius: 10px; font-weight: 700; }
.av-days.warn { background: #fef3c7; color: #92400e; }
.av-days.ok   { background: #dcfce7; color: #166534; }
.av-days.soon { background: #fee2e2; color: #991b1b; }

/* Health bar */
.av-hbar { height: 7px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin: 4px 0; }
.av-hbar-fill { height: 100%; border-radius: 4px; }

/* Invoices */
.av-inv-head { display: grid; grid-template-columns: 82px 1fr 64px 54px; gap: 4px; padding: 4px 0; font-size: 9px; color: #94a3b8; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
.av-inv-row  { display: grid; grid-template-columns: 82px 1fr 64px 54px; gap: 4px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; align-items: center; }
.av-inv-row:last-child { border: none; }
.av-inv-n { color: #185FA5; cursor: pointer; font-weight: 600; font-size: 10.5px; }
.av-inv-a { font-weight: 700; text-align: right; color: #0f172a; }
.av-paid { background: #dcfce7; color: #166534; }
.av-pend { background: #fef3c7; color: #92400e; }

/* IoT */
.av-iot-cell { background: #f8fafc; border-radius: 8px; padding: 10px; position: relative; border: 1px solid #e2e8f0; }
.av-iot-l { font-size: 9px; color: #94a3b8; margin-bottom: 3px; font-weight: 600; }
.av-iot-v { font-size: 20px; font-weight: 700; color: #0f172a; }
.av-iot-u { font-size: 10px; color: #94a3b8; }
.av-live { position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%; }
.av-live.ok   { background: #10b981; }
.av-live.warn { background: #f59e0b; }

/* Library */
.av-lib-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; cursor: pointer; }
.av-lib-card:hover { background: #f8fafc; border-color: #1D9E75; }
.av-lib-icon { width: 32px; height: 32px; margin: 0 auto 8px; }
.av-lib-name { font-size: 11px; font-weight: 700; color: #0f172a; }
.av-lib-type { font-size: 9px; color: #94a3b8; margin-top: 2px; }

/* ════════════════════════════════════════════════════════════
   UTILITY
   ════════════════════════════════════════════════════════════ */
.av-hidden { display: none !important; }
`;
    document.head.appendChild(style);
}


/* ══════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════ */
window._av = {
    branchAssets: [],
    currentType:  null,
    currentAsset: null,
    detailsOpen:  false,
};


/* ══════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════ */
async function loadAssetView(branch) {
    activeBranch = branch;
    window._av.currentAsset = null;
    window._av.currentType  = null;
    window._av.detailsOpen  = false;

    /* CSS ყოველთვის განახლდება */
    injectAssetViewCSS();
    injectAssetViewHTML();

    /* ეკრანის გადართვა */
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const avSection = document.getElementById('asset-view');
    avSection.classList.add('active');

    /* branch სახელი sidebar */
    const lbl = document.getElementById('av-branch-label');
    if (lbl) lbl.textContent = branch.name || 'ფილიალი';

    /* Supabase-დან ყველა asset */
    const { data, error } = await _supabase
        .from('assets')
        .select('*')
        .eq('branch_id', branch.id)
        .order('name');

    if (error) { console.error('[AV] Supabase error:', error); return; }
    window._av.branchAssets = data || [];

    _avUpdateBadges();

    /* _pendingAssetId — კონკრეტული asset პირდაპირ გახსნა */
    const pendingId = window._pendingAssetId;
    console.log('[AV] loadAssetView complete. pendingId=', pendingId,
                '| assets loaded=', window._av.branchAssets?.length,
                '| branch=', branch?.name);

    if (pendingId) {
        window._pendingAssetId = null;

        const target = window._av.branchAssets.find(a => a.id === pendingId);
        console.log('[AV] target=', target ? target.name + ' / ' + target.asset_type : 'NOT FOUND');

        if (target) {
            window._av.currentType = target.asset_type || 'Other';

            /* sidebar type active */
            const typeEl = document.querySelector(`.av-item[data-type="${target.asset_type}"]`);
            if (typeEl) {
                document.querySelectorAll('.av-item').forEach(i => i.classList.remove('active'));
                typeEl.classList.add('active');
                const catWrap = typeEl.closest('.av-cat-wrap');
                if (catWrap) {
                    const catEl = catWrap.querySelector('.av-cat');
                    if (catEl && !catEl.classList.contains('open')) catEl.classList.add('open');
                }
            }

            await avOpenAsset(target);
            return;
        }
    }

    _avShowListPanel();
}


/* ══════════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════════════ */
function avToggleCat(el) {
    el.classList.toggle('open');
}

function avSelectType(el) {
    document.querySelectorAll('.av-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    window._av.currentType  = el.dataset.type;
    window._av.currentAsset = null;
    _avShowListPanel();
}

function _avUpdateBadges() {
    const counts = {};
    window._av.branchAssets.forEach(a => {
        const t = a.asset_type || 'Other';
        counts[t] = (counts[t] || 0) + 1;
    });
    document.querySelectorAll('[id^="badge-"]').forEach(el => {
        const type = el.id.replace('badge-', '');
        el.textContent = counts[type] || 0;
    });
}


/* ══════════════════════════════════════════════════════════════
   LIST PANEL
   ══════════════════════════════════════════════════════════════ */
function _avShowListPanel() {
    const listPanel   = document.getElementById('av-list-panel');
    const detailPanel = document.getElementById('av-detail-panel');
    if (!listPanel || !detailPanel) return;

    listPanel.classList.remove('av-hidden');
    detailPanel.classList.add('av-hidden');

    const type    = window._av.currentType;
    const titleEl = document.getElementById('av-list-title');
    const subEl   = document.getElementById('av-list-sub');
    const grid    = document.getElementById('av-cards-grid');

    if (!type) {
        titleEl.textContent = 'კატეგორია აირჩიეთ';
        subEl.textContent   = '';
        grid.innerHTML      = '<div class="av-empty">მარცხნივ კატეგორია აირჩიეთ</div>';
        return;
    }

    const filtered = window._av.branchAssets.filter(a => a.asset_type === type);
    titleEl.textContent = type;
    subEl.textContent   = filtered.length + ' აგრეგატი';

    if (!filtered.length) {
        grid.innerHTML = `<div class="av-empty">${type} — ჩანაწერები არ არის</div>`;
        return;
    }

    const stClass = { Operational:'av-s-ok', Maintenance_Required:'av-s-maint', Down:'av-s-down' };
    const stLabel = { Operational:'OK', Maintenance_Required:'Maint.', Down:'Down' };

    grid.innerHTML = filtered.map(a => `
        <div class="av-card" onclick='avOpenAsset(${JSON.stringify(a)})'>
            <div class="av-card-top">
                <div>
                    <div class="av-card-name">${a.name || '—'}</div>
                    <div class="av-card-sub">${[a.brand, a.model].filter(Boolean).join(' · ')}</div>
                </div>
                <span class="${stClass[a.status] || 'av-s-ok'}">${stLabel[a.status] || a.status}</span>
            </div>
            <div class="av-card-rows">
                <div class="av-card-row"><span>TAG</span><span class="av-card-val">${a.tag_number || '—'}</span></div>
                <div class="av-card-row"><span>სიმძლ.</span><span class="av-card-val">${a.cooling_capacity_kw ? a.cooling_capacity_kw + ' kW' : '—'}</span></div>
                <div class="av-card-row"><span>საფ.</span><span class="av-card-val">${a.refrigerant_type || '—'}</span></div>
                <div class="av-card-row"><span>ბოლო სერვ.</span><span class="av-card-val">${a.last_service_date ? new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</span></div>
            </div>
            <div class="av-card-actions">
                <div class="av-card-btn" onclick='event.stopPropagation();avOpenAsset(${JSON.stringify(a)});avSwitchTab("svc",null)'>სერვ.</div>
                <div class="av-card-btn pri" onclick='event.stopPropagation();avOpenAsset(${JSON.stringify(a)})'>გახსნა →</div>
            </div>
        </div>
    `).join('');
}


/* ══════════════════════════════════════════════════════════════
   ASSET DETAIL OPEN
   ══════════════════════════════════════════════════════════════ */
async function avOpenAsset(asset) {
    console.log('[AV] avOpenAsset called:', asset?.name, asset?.id?.slice(0,8));

    if (!asset) {
        console.error('[AV] avOpenAsset: asset is null/undefined!');
        return;
    }

    window._av.currentAsset = asset;
    window._av.detailsOpen  = false;

    /* HTML inject-ი თუ panels ვერ ვიპოვეთ */
    let listPanel   = document.getElementById('av-list-panel');
    let detailPanel = document.getElementById('av-detail-panel');

    if (!listPanel || !detailPanel) {
        console.warn('[AV] panels not found — re-injecting HTML');
        injectAssetViewCSS();
        injectAssetViewHTML();
        listPanel   = document.getElementById('av-list-panel');
        detailPanel = document.getElementById('av-detail-panel');
    }

    if (!listPanel || !detailPanel) {
        console.error('[AV] still no panels after re-inject!');
        return;
    }

    listPanel.classList.add('av-hidden');
    detailPanel.classList.remove('av-hidden');

    _avFillHeader(asset);
    _avFillKpiStrip(asset);

    /* tabs reset */
    document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.av-tab-content').forEach(c => c.classList.add('av-hidden'));
    const firstTab = document.querySelector('.av-tab');
    if (firstTab) firstTab.classList.add('active');
    const tcHome = document.getElementById('av-tc-home');
    if (tcHome) tcHome.classList.remove('av-hidden');

    console.log('[AV] avOpenAsset: rendering home tab...');
    await _avRenderHome(asset);
    console.log('[AV] avOpenAsset: DONE');

    /* _pendingAssetTab */
    const pendingTab = window._pendingAssetTab;
    if (pendingTab) {
        window._pendingAssetTab = null;
        console.log('[AV] switching to pending tab:', pendingTab);
        const tabEl = document.querySelector(`.av-tab[data-tab="${pendingTab}"]`);
        if (tabEl) avSwitchTab(pendingTab, tabEl);
    }
}

function avBackToList() {
    window._av.currentAsset = null;
    _avShowListPanel();
}


/* ══════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════ */
function _avFillHeader(a) {
    const imgEl = document.getElementById('av-hdr-img');
    if (a.image_url) {
        imgEl.innerHTML = `<img src="${a.image_url}" alt="${a.name}">`;
    } else {
        imgEl.innerHTML = `<svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".2" width="60" height="60"><rect x="4" y="4" width="72" height="32" rx="4"/><rect x="8" y="38" width="64" height="14" rx="2"/><circle cx="22" cy="20" r="9"/><circle cx="22" cy="20" r="4"/><line x1="38" y1="14" x2="70" y2="14"/><line x1="38" y1="20" x2="70" y2="20"/><line x1="38" y1="26" x2="70" y2="26"/></svg>`;
    }

    document.getElementById('av-hdr-name').textContent  = a.name || '—';
    document.getElementById('av-hdr-model').textContent =
        [a.brand, a.model, a.serial_number ? 'S/N: '+a.serial_number : '', a.tag_number ? 'TAG: '+a.tag_number : ''].filter(Boolean).join(' · ');

    const specs = [
        ['სიმძლ.', a.cooling_capacity_kw ? `${a.cooling_capacity_kw} kW` : null],
        ['საფ.',   a.refrigerant_type ? `${a.refrigerant_type}${a.refrigerant_charge_kg ? ' · '+a.refrigerant_charge_kg+'kg' : ''}` : null],
        ['კვება',  a.voltage ? `${a.voltage}V / ${a.phase || '3Ph'}` : null],
        ['ლოკ.',   a.location_on_site || null],
    ].filter(([,v]) => v);

    document.getElementById('av-hdr-specs').innerHTML = specs.map(([l,v]) =>
        `<div class="av-spec-row"><span class="av-spec-l">${l}</span><span class="av-spec-v">${v}</span></div>`
    ).join('');

    const stClass = { Operational:'av-s-ok', Maintenance_Required:'av-s-maint', Down:'av-s-down' };
    const stLabel = { Operational:'Operational', Maintenance_Required:'Maintenance', Down:'Down' };
    const badge = document.getElementById('av-hdr-status');
    badge.textContent = stLabel[a.status] || a.status;
    badge.className   = 'av-status-badge ' + (stClass[a.status] || 'av-s-ok');

    const nextSvc = a.last_service_date && a.service_interval_days
        ? Math.ceil(a.service_interval_days - (Date.now() - new Date(a.last_service_date)) / 86400000)
        : null;
    document.getElementById('av-hdr-kpis').innerHTML = `
        <div class="av-hdr-kpi"><div class="av-hdr-kpi-v">${a.condition_score || '—'}/10</div><div class="av-hdr-kpi-l">condition</div></div>
        ${nextSvc !== null ? `<div class="av-hdr-kpi"><div class="av-hdr-kpi-v" style="color:${nextSvc<30?'#991b1b':nextSvc<90?'#92400e':'#166534'}">${nextSvc}დ</div><div class="av-hdr-kpi-l">შემ. სერვ.</div></div>` : ''}
    `;

    const specs_full = a.specs || {};
    const detItems = [
        ['მოდელი',       a.indoor_model  || a.model    || null],
        ['გარე მოდ.',    a.outdoor_model || null],
        ['S/N შიდ.',     a.indoor_serial || a.serial_number || null],
        ['S/N გარე',     a.outdoor_serial || null],
        ['ინსტ. თარ.',   a.installation_date || null],
        ['გამ. წელი',    a.manufacture_year  ? String(a.manufacture_year) : null],
        ['გარანტია',     a.warranty_until    || null],
        ['სერვ. ინტ.',   a.service_interval_days ? a.service_interval_days + ' დღე' : null],
        ['EER',          specs_full.eer  ? String(specs_full.eer)  : null],
        ['COP',          specs_full.cop  ? String(specs_full.cop)  : null],
        ['კვება',        a.voltage ? `${a.voltage}V / ${a.phase}` : null],
        ['Liquid line',  specs_full.liquid_line_inch || null],
    ].filter(([,v]) => v);

    document.getElementById('av-details-grid').innerHTML = detItems.map(([l,v]) =>
        `<div class="av-det-card"><div class="av-det-label">${l}</div><div class="av-det-val">${v}</div></div>`
    ).join('');

    const det = document.getElementById('av-details-panel');
    const ico = document.getElementById('av-toggle-icon');
    det.classList.add('av-hidden');
    ico.style.transform = 'rotate(0deg)';
    window._av.detailsOpen = false;
}

function avToggleDetails() {
    window._av.detailsOpen = !window._av.detailsOpen;
    const det = document.getElementById('av-details-panel');
    const ico = document.getElementById('av-toggle-icon');
    det.classList.toggle('av-hidden', !window._av.detailsOpen);
    ico.style.transform = window._av.detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}


/* ══════════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════════ */
function _avFillKpiStrip(a) {
    const strip = document.getElementById('av-kpi-strip');
    if (!strip) return;
    const items = [
        { v: a.status === 'Operational' ? 'OK' : (a.status === 'Maintenance_Required' ? 'Maint.' : 'Down'),
          l: 'სტატუსი', cls: a.status === 'Operational' ? 'av-ks-ok' : 'av-ks-warn' },
        { v: a.condition_score ? a.condition_score + '/10' : '—', l: 'Condition', cls: '' },
        { v: a.cooling_capacity_kw ? a.cooling_capacity_kw + ' kW' : '—', l: 'სიმძლ.', cls: '' },
        { v: a.refrigerant_type || '—', l: 'საფ. ტიპი', cls: '' },
        { v: a.refrigerant_charge_kg ? a.refrigerant_charge_kg + ' kg' : '—', l: 'საფ. რ-ბა', cls: '' },
        { v: a.last_service_date ? new Date(a.last_service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—', l: 'ბოლო სერვ.', cls: '' },
    ];
    strip.innerHTML = items.map(i =>
        `<div class="av-ks-cell"><div class="av-ks-v ${i.cls}">${i.v}</div><div class="av-ks-l">${i.l}</div></div>`
    ).join('');
}


/* ══════════════════════════════════════════════════════════════
   TABS  —  data-tab ატრიბუტი დამატებულია HTML-ში
   ══════════════════════════════════════════════════════════════ */
function avSwitchTab(name, btn) {
    document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.av-tab-content').forEach(c => c.classList.add('av-hidden'));

    if (btn) {
        btn.classList.add('active');
    } else {
        /* სახელით ვიპოვებ data-tab ატრიბუტით */
        const t = document.querySelector(`.av-tab[data-tab="${name}"]`);
        if (t) t.classList.add('active');
    }

    const tc = document.getElementById(`av-tc-${name}`);
    if (tc) {
        tc.classList.remove('av-hidden');
        if      (name === 'svc')    _avRenderSvc();
        else if (name === 'status') _avRenderStatus();
        else if (name === 'inv')    _avRenderInv();
        else if (name === 'iot')    _avRenderIot();
        else if (name === 'lib')    _avRenderLib();
    }
}


/* ══════════════════════════════════════════════════════════════
   HOME TAB
   ══════════════════════════════════════════════════════════════ */
async function _avRenderHome(a) {
    const tc = document.getElementById('av-tc-home');
    if (!tc) return;

    const { data: logs } = await _supabase
        .from('service_logs')
        .select('service_date,service_type,technician_name,job_description,suction_pressure,discharge_pressure,superheat,subcooling,comp_current_a,ambient_temp_c')
        .eq('asset_id', a.id)
        .order('service_date', { ascending: false })
        .limit(5);

    const typeClass = { PPM:'av-ppm', Corrective:'av-cor', Emergency:'av-emr', Installation:'av-inst' };
    const lastMeas = logs?.[0];

    tc.innerHTML = `
    <div class="av-grid-2">

      <div class="av-tcard">
        <div class="av-tcard-h">ბოლო სერვისები <span class="av-tcard-ha" onclick="avSwitchTab('svc',null)">ყველა →</span></div>
        <div class="av-log-head"><div>თარიღი</div><div>სამ.</div><div>ტექ.</div><div>ტიპი</div><div style="text-align:right">₾</div></div>
        ${(logs || []).map(l => `
          <div class="av-log-row">
            <span class="av-log-date">${new Date(l.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})}</span>
            <span>${(l.job_description || '').substring(0,30)}${l.job_description?.length>30?'...':''}</span>
            <span class="av-log-tech">${l.technician_name || '—'}</span>
            <span class="av-pill ${typeClass[l.service_type]||'av-cor'}">${l.service_type||'—'}</span>
            <span class="av-log-cost">—</span>
          </div>
        `).join('') || '<div class="av-empty">სერვ. ჩანაწ. არ არის</div>'}
      </div>

      <div class="av-tcard">
        <div class="av-tcard-h">გეგმ. სერვ. <span class="av-tcard-ha" onclick="avSwitchTab('status',null)">გეგმა →</span></div>
        <div class="av-sched-row">
          <span class="av-dot" style="background:#f59e0b"></span>
          <span class="av-sched-date">მომდ. PPM</span>
          <span class="av-sched-task">ფილტ. + leak test + SH/SC</span>
          <span class="av-days warn">${a.service_interval_days || 90}დ. ინტ.</span>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-bottom:5px">
            <span>Unit Health</span>
            <span style="color:${(a.condition_score||5)>=7?'#166534':'#92400e'};font-weight:700">${a.condition_score||'—'} / 10</span>
          </div>
          <div class="av-hbar"><div class="av-hbar-fill" style="width:${(a.condition_score||0)*10}%;background:${(a.condition_score||0)>=7?'#10b981':'#f59e0b'}"></div></div>
        </div>
      </div>

      <div class="av-tcard">
        <div class="av-tcard-h">ბოლო გაზომვები <span class="av-tcard-ha" onclick="avSwitchTab('status',null)">სრული →</span></div>
        ${lastMeas ? `
        <div class="av-grid-2" style="gap:6px">
          <div class="av-meas ${(lastMeas.suction_pressure||0)<10?'g':'y'}">
            <div class="av-meas-l">LP წნევა</div>
            <div class="av-meas-v">${lastMeas.suction_pressure||'—'}<span class="av-meas-u">Bar</span></div>
          </div>
          <div class="av-meas ${(lastMeas.discharge_pressure||0)<30?'g':'y'}">
            <div class="av-meas-l">HP წნევა</div>
            <div class="av-meas-v">${lastMeas.discharge_pressure||'—'}<span class="av-meas-u">Bar</span></div>
          </div>
          <div class="av-meas ${lastMeas.superheat>=4&&lastMeas.superheat<=8?'g':'y'}">
            <div class="av-meas-l">Superheat</div>
            <div class="av-meas-v">${lastMeas.superheat||'—'}<span class="av-meas-u">K</span></div>
          </div>
          <div class="av-meas g">
            <div class="av-meas-l">კომპ. ამპ.</div>
            <div class="av-meas-v">${lastMeas.comp_current_a||'—'}<span class="av-meas-u">A</span></div>
          </div>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px">${new Date(lastMeas.service_date).toLocaleDateString('ka-GE')} · ${lastMeas.technician_name||''}</div>
        ` : '<div class="av-empty">გაზომვები არ არის</div>'}
      </div>

      <div class="av-tcard">
        <div class="av-tcard-h">ინვოის preview <span class="av-tcard-ha" onclick="avSwitchTab('inv',null)">ყველა →</span></div>
        <div class="av-empty" style="padding:20px 0">ინვოისები — მალე</div>
      </div>

    </div>`;
}


/* ══════════════════════════════════════════════════════════════
   SVC TAB
   ══════════════════════════════════════════════════════════════ */
async function _avRenderSvc() {
    const tc = document.getElementById('av-tc-svc');
    if (!tc || !window._av.currentAsset) return;
    tc.innerHTML = '<div class="av-tcard"><div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">იტვირთება...</div></div>';

    const { data: logs } = await _supabase
        .from('service_logs')
        .select('*')
        .eq('asset_id', window._av.currentAsset.id)
        .order('service_date', { ascending: false });

    const typeClass = { PPM:'av-ppm', Corrective:'av-cor', Emergency:'av-emr', Installation:'av-inst' };

    tc.innerHTML = `
    <div class="av-tcard">
      <div class="av-tcard-h">სერვისის სრული ისტ. <span class="av-tcard-ha" onclick="avAddService()">+ სერვისი</span></div>
      <div class="av-log-head"><div>თარიღი</div><div>სამუშაო</div><div>ტექნ.</div><div>ტიპი</div><div style="text-align:right">₾</div></div>
      ${(logs || []).map(l => `
        <div class="av-log-row">
          <span class="av-log-date">${new Date(l.service_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
          <span style="color:#0f172a">${l.job_description || '—'}</span>
          <span class="av-log-tech">${l.technician_name || '—'}</span>
          <span class="av-pill ${typeClass[l.service_type]||'av-cor'}">${l.service_type||'—'}</span>
          <span class="av-log-cost">—</span>
        </div>
      `).join('') || '<div class="av-empty">სერვ. ჩანაწ. არ არის</div>'}
    </div>`;
}


/* ══════════════════════════════════════════════════════════════
   STATUS TAB
   ══════════════════════════════════════════════════════════════ */
async function _avRenderStatus() {
    const tc = document.getElementById('av-tc-status');
    if (!tc || !window._av.currentAsset) return;

    const { data: logs } = await _supabase
        .from('service_logs')
        .select('service_date,suction_pressure,discharge_pressure,suction_temp,discharge_temp,superheat,subcooling,ambient_temp_c,comp_current_a,fan_current_a,technician_name')
        .eq('asset_id', window._av.currentAsset.id)
        .order('service_date', { ascending: false })
        .limit(1);

    const m = logs?.[0];
    const a = window._av.currentAsset;

    tc.innerHTML = `
    <div class="av-grid-2">
      <div class="av-tcard">
        <div class="av-tcard-h">ბოლო სერვ. გაზომვები</div>
        ${m ? `
        <div class="av-grid-2" style="gap:6px">
          <div class="av-meas g"><div class="av-meas-l">LP</div><div class="av-meas-v">${m.suction_pressure||'—'}<span class="av-meas-u">Bar</span></div></div>
          <div class="av-meas ${(m.discharge_pressure||0)>28?'y':'g'}"><div class="av-meas-l">HP</div><div class="av-meas-v">${m.discharge_pressure||'—'}<span class="av-meas-u">Bar</span></div></div>
          <div class="av-meas g"><div class="av-meas-l">T შეწ.</div><div class="av-meas-v">${m.suction_temp||'—'}<span class="av-meas-u">°C</span></div></div>
          <div class="av-meas ${(m.discharge_temp||0)>90?'r':(m.discharge_temp||0)>70?'y':'g'}"><div class="av-meas-l">T დაჭ.</div><div class="av-meas-v">${m.discharge_temp||'—'}<span class="av-meas-u">°C</span></div></div>
          <div class="av-meas ${m.superheat>=4&&m.superheat<=8?'g':'y'}"><div class="av-meas-l">SH</div><div class="av-meas-v">${m.superheat||'—'}<span class="av-meas-u">K</span></div></div>
          <div class="av-meas g"><div class="av-meas-l">SC</div><div class="av-meas-v">${m.subcooling||'—'}<span class="av-meas-u">K</span></div></div>
          <div class="av-meas g"><div class="av-meas-l">კომპ. A</div><div class="av-meas-v">${m.comp_current_a||'—'}<span class="av-meas-u">A</span></div></div>
          <div class="av-meas g"><div class="av-meas-l">გარ. ტემ.</div><div class="av-meas-v">${m.ambient_temp_c||'—'}<span class="av-meas-u">°C</span></div></div>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:8px">${new Date(m.service_date).toLocaleDateString('ka-GE')} · ${m.technician_name||''}</div>
        ` : '<div class="av-empty">გაზომვები არ არის</div>'}
      </div>
      <div class="av-tcard">
        <div class="av-tcard-h">გეგმ. PPM სერვ.</div>
        <div class="av-sched-row">
          <span class="av-dot" style="background:#f59e0b"></span>
          <span class="av-sched-date">მომდ. PPM</span>
          <span class="av-sched-task">ფილტ. + SH/SC + leak test</span>
          <span class="av-days warn">${a.service_interval_days||90}დ</span>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-bottom:5px">
            <span>Unit Health</span>
            <span style="color:${(a.condition_score||5)>=7?'#166534':'#92400e'};font-weight:700">${a.condition_score||'—'} / 10</span>
          </div>
          <div class="av-hbar"><div class="av-hbar-fill" style="width:${(a.condition_score||0)*10}%;background:${(a.condition_score||0)>=7?'#10b981':'#f59e0b'}"></div></div>
        </div>
      </div>
    </div>`;
}


/* ══════════════════════════════════════════════════════════════
   INV / IOT / LIB TABS
   ══════════════════════════════════════════════════════════════ */
function _avRenderInv() {
    const tc = document.getElementById('av-tc-inv');
    if (!tc) return;
    tc.innerHTML = `
    <div class="av-tcard">
      <div class="av-tcard-h">ინვოისები <span class="av-tcard-ha">+ ინვ.</span></div>
      <div class="av-empty" style="padding:30px 0">ინვოისების მოდული — მომავალ ვერსიაში</div>
    </div>`;
}

function _avRenderIot() {
    const tc = document.getElementById('av-tc-iot');
    if (!tc) return;
    const a = window._av.currentAsset;
    tc.innerHTML = `
    <div class="av-grid-3" style="margin-bottom:12px">
      <div class="av-iot-cell"><div class="av-live ok"></div><div class="av-iot-l">HP წნევა</div><div class="av-iot-v">—<span class="av-iot-u">Bar</span></div></div>
      <div class="av-iot-cell"><div class="av-live ok"></div><div class="av-iot-l">LP წნევა</div><div class="av-iot-v">—<span class="av-iot-u">Bar</span></div></div>
      <div class="av-iot-cell"><div class="av-live warn"></div><div class="av-iot-l">Tdischarge</div><div class="av-iot-v">—<span class="av-iot-u">°C</span></div></div>
      <div class="av-iot-cell"><div class="av-live ok"></div><div class="av-iot-l">კომპ. Hz</div><div class="av-iot-v">—<span class="av-iot-u">Hz</span></div></div>
      <div class="av-iot-cell"><div class="av-live ok"></div><div class="av-iot-l">კომპ. A</div><div class="av-iot-v">—<span class="av-iot-u">A</span></div></div>
      <div class="av-iot-cell"><div class="av-live ok"></div><div class="av-iot-l">Tamb.</div><div class="av-iot-v">—<span class="av-iot-u">°C</span></div></div>
    </div>
    <div class="av-tcard">
      <div class="av-tcard-h">BMS კავშირი</div>
      <div style="font-size:12px;color:#64748b">
        Device ID: <b style="color:#0f172a">${a?.iot_device_id||'—'}</b> · Protocol: BACnet/IP · სტ: <span style="color:#94a3b8">offline</span>
      </div>
    </div>`;
}

function _avRenderLib() {
    const tc = document.getElementById('av-tc-lib');
    if (!tc) return;
    const a = window._av.currentAsset;
    const docs = [
        { name:'სამ. სახელმ.', type:'PDF', icon:'#185FA5', url: a?.manual_url },
        { name:'ინსტ. სახ.',   type:'PDF', icon:'#10b981', url: null },
        { name:'Wiring სქემა', type:'ZIP', icon:'#f59e0b', url: a?.wiring_diagram_url },
        { name:'სხვა ფაილ.',  type:'—',   icon:'#94a3b8', url: null },
    ];
    tc.innerHTML = `
    <div class="av-grid-4">
      ${docs.map(d => `
        <div class="av-lib-card" onclick="${d.url ? `window.open('${d.url}','_blank')` : 'alert(\"ფაილი არ არის\")'}" >
          <div class="av-lib-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${d.icon}" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="av-lib-name">${d.name}</div>
          <div class="av-lib-type">${d.type}${d.url ? '' : ' · არ არის'}</div>
        </div>
      `).join('')}
    </div>`;
}


/* ══════════════════════════════════════════════════════════════
   ACTIONS
   ══════════════════════════════════════════════════════════════ */
function avOpenNewAsset() {
    openAssetModal(window._av.currentType ? { asset_type: window._av.currentType } : null);
}

function avEditAsset() {
    if (window._av.currentAsset) openAssetModal(window._av.currentAsset);
}

function avAddService() {
    if (window._av.currentAsset) {
        activeAsset = window._av.currentAsset;
        openServiceLogModal();
    }
}


/* ══════════════════════════════════════════════════════════════
   AUTO CSS INJECT ON LOAD
   ══════════════════════════════════════════════════════════════ */
injectAssetViewCSS();
