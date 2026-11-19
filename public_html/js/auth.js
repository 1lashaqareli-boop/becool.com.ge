/* ============================================================
   BECOOL CRM — auth.js
   დემო ვერსიის შესვლის ეკრანი (სტატიკური მომხმარებლები)

   ⚠ ეს არის „ფარდა" და არა დაცვა: კოდი ბრაუზერში იკითხება.
     პაროლები ინახება SHA-256 hash-ის სახით, რომ წყაროში ღიად არ ჩანდეს.

   დაყენება:
   1. ეს ფაილი ჩადე js/ საქაღალდეში
   2. index.html-ის <head>-ში, ყველა სხვა <script>-ზე ადრე:
      <script src="js/auth.js"></script>
   3. ქვემოთ USERS სიაში ჩაწერე სახელები და პაროლების hash-ები
   ============================================================ */
(function () {

    /* ── მომხმარებლები ──
       user    = შესვლის სახელი
       hash    = პაროლის SHA-256 (როგორ მიიღო — იხ. ინსტრუქცია)
       expires = ბოლო დღე, როცა შესვლა შეიძლება (YYYY-MM-DD) */
    const USERS = [
        { user: 'demo1', hash: '49ebda15d343158774d05bdd4ac963b38db2d10c581fe2add452b7182266cb7e', expires: '2026-12-31' },
        { user: 'demo2', hash: '187b1a43e311a824aeb05226843302f94fd1a26ba6a4d4691b8486fd3b3310e9', expires: '2026-12-31' },
        { user: 'demo3', hash: 'bb112541c8d6c66c867909b7a38ec2e480f7940beb66ae1887bd24c7d0ca55c2', expires: '2026-12-31' },
    ];

    const STORAGE_KEY   = 'becool_demo_auth';
    const SESSION_HOURS = 8;   /* რამდენ საათში მოითხოვოს ხელახლა შესვლა */

    /* ── დამხმარე ფუნქციები ── */
    async function sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function todayLocal() {
        return new Date().toLocaleDateString('sv-SE');   /* YYYY-MM-DD, ადგილობრივი დრო */
    }

    function readSession() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
        catch (e) { return null; }
    }

    function isSessionValid() {
        const s = readSession();
        if (!s || Date.now() > s.until) return false;
        const u = USERS.find(x => x.user === s.user);
        return !!u && todayLocal() <= u.expires;
    }

    /* გამოსვლა: Console-ში ან ღილაკიდან → demoLogout() */
    window.demoLogout = function () {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    };

    /* ── გვერდის დამალვა, სანამ შესვლა არ დადასტურდება ── */
    const hideStyle = document.createElement('style');
    hideStyle.id = 'demo-hide';
    hideStyle.textContent = 'body > *:not(#demo-login){display:none !important}';

    if (isSessionValid()) return;            /* უკვე შესულია → არაფერი */
    document.head.appendChild(hideStyle);

    function unlock() {
        const st = document.getElementById('demo-hide');
        if (st) st.remove();
        const ov = document.getElementById('demo-login');
        if (ov) ov.remove();
    }

    /* ── შესვლის ფორმა ── */
    function showLogin() {
        const ov = document.createElement('div');
        ov.id = 'demo-login';
                ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:linear-gradient(rgba(15,23,42,.55),rgba(15,23,42,.55)),url(background2.jpg) center/cover no-repeat,#0f172a;font-family:inherit';
        ov.innerHTML = `
          <form id="demo-form" style="background:#fff;border-radius:1.25rem;padding:2rem;width:320px;box-shadow:0 20px 50px rgba(0,0,0,.4)">
                        <div style="margin-bottom:1.5rem">
              <div style="font-weight:900;font-size:1.4rem;color:#0f172a">BECOOL <span style="color:#2563eb">CMMS</span></div>
              <div style="font-size:.7rem;color:#94a3b8">დემო ვერსია</div>
            </div>
            <label style="font-size:.7rem;color:#64748b;font-weight:700">მომხმარებელი</label>
            <input id="demo-user" autocomplete="username" required
                   style="width:100%;padding:.6rem .8rem;margin:.3rem 0 .9rem;border:1px solid #e2e8f0;border-radius:.7rem;font-size:.9rem;box-sizing:border-box">
            <label style="font-size:.7rem;color:#64748b;font-weight:700">პაროლი</label>
            <input id="demo-pass" type="password" autocomplete="current-password" required
                   style="width:100%;padding:.6rem .8rem;margin:.3rem 0 .9rem;border:1px solid #e2e8f0;border-radius:.7rem;font-size:.9rem;box-sizing:border-box">
            <div id="demo-err" style="display:none;color:#dc2626;font-size:.75rem;margin-bottom:.8rem"></div>
            <button type="submit"
                    style="width:100%;padding:.7rem;border:0;border-radius:.7rem;background:#2563eb;color:#fff;font-weight:800;cursor:pointer">
              შესვლა
            </button>
          </form>`;
        document.body.appendChild(ov);

        document.getElementById('demo-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('demo-user').value.trim();
            const pass = document.getElementById('demo-pass').value;
            const err  = document.getElementById('demo-err');
            const u    = USERS.find(x => x.user === name);
            const ok   = u && (await sha256(pass)) === u.hash;

            if (!ok) {
                err.textContent = 'მომხმარებელი ან პაროლი არასწორია';
                err.style.display = 'block';
                return;
            }
            if (todayLocal() > u.expires) {
                err.textContent = 'დემო ვერსიის ვადა ამოიწურა';
                err.style.display = 'block';
                return;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                user:  u.user,
                until: Date.now() + SESSION_HOURS * 3600 * 1000
            }));
            unlock();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showLogin);
    } else {
        showLogin();
    }
})();
