
/* ============================================================
   BECOOL CRM — branch_dashboard.js v2
   ============================================================ */

const OPENWEATHER_KEY = 'a155a131748709196243b52b5bf35b53';
let bdcMap = null;
let bdcOpen = true;

/* ── viewBranchDashboard ── */
function viewBranchDashboard(b) {
    activeBranch = b;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const dashboardView = document.getElementById('branch-dashboard-view');
    dashboardView.classList.add('active');

    // უკან დაბრუნების ღილაკის დამატება
    if (!document.getElementById('back-to-branches-btn')) {
        const backBtn = document.createElement('button');
        backBtn.id = 'back-to-branches-btn';
        backBtn.onclick = backToBranches;
        backBtn.className = 'text-blue-600 font-black mb-6 hover:underline flex items-center gap-2 group text-xs uppercase tracking-widest';
        backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:-translate-x-1 transition"><polyline points="15 18 9 12 15 6"/></svg> უკან ფილიალებში';
        dashboardView.prepend(backBtn);
    }

    if (bdcMap) { bdcMap.remove(); bdcMap = null; }
    fillBdcHeader(b);
    loadBdcKPIs();
    loadBdcWeather();
    const firstTab = document.querySelector('#bdc-nav .bdc-tab');
    switchBdcTab('home', firstTab);
}

function backToBranches() {
    document.getElementById('branch-dashboard-view').classList.remove('active');
    document.getElementById('branch-view').classList.add('active');
}
