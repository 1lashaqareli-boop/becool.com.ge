/* ============================================================
   BECOOL CRM — weather_analytics.js v3
   ✅ loadBdcWeatherAnalytics() → ამინდის ტაბი
      - მიმდინარე ამინდი (hero)
      - HVAC/R რისკის შეფასება
      - 5-დღიანი პროგნოზი + გრაფიკი
      - ისტ. ანალიტიკა Supabase weather_logs-იდან
      - HVAC/R რეკომენდაციები
      - დღიური summary ცხრილი
   ✅ loadBdcStats() → სტატ. ტაბი = redirect ამინდის ტაბში
   ============================================================ */

let _wChart = null;
let _fChart = null;
const _OWK  = 'a155a131748709196243b52b5bf35b53';
window._waPeriod = 30;
window._waSummaryView = 'daily';


/* ══ loadBdcWeatherAnalytics ══ */
async function loadBdcWeatherAnalytics() {
    const panel = document.getElementById('bdcp-weather');
    if (!panel) return;

    panel.innerHTML = `<div class="space-y-4">
      <div id="wa-hero" class="relative rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200" style="min-height:140px;background:linear-gradient(135deg,#1e3a5f,#1d4ed8,#0f172a);">
        <div class="relative z-10 p-6">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <img id="wa-icon" src="" class="w-16 h-16" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
              <div>
                <div class="flex items-baseline gap-1">
                  <span id="wa-temp" class="font-black text-white" style="font-size:52px;letter-spacing:-2px;line-height:1;">—</span>
                  <span class="text-blue-300 text-2xl font-light">°C</span>
                </div>
                <p id="wa-desc" class="text-blue-200 capitalize text-sm mt-0.5">იტვირთება...</p>
                <p id="wa-loc-name" class="text-blue-400 text-[10px] uppercase tracking-widest mt-0.5"></p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-x-6 gap-y-3">
              <div class="text-center"><div id="wa-feels" class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">შეგრძ.</div></div>
              <div class="text-center"><div id="wa-hum"   class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">ტენ.</div></div>
              <div class="text-center"><div id="wa-wnd"   class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">ქარი</div></div>
              <div class="text-center"><div id="wa-pres"  class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">წნევა</div></div>
              <div class="text-center"><div id="wa-vis"   class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">ხილვ.</div></div>
              <div class="text-center"><div id="wa-clouds"class="text-lg font-black text-white">—</div><div class="text-[9px] text-blue-300 uppercase tracking-wider">ღრ.</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">⚡ HVAC/R რისკი — მიმდინარე</p>
        <div id="wa-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3"><div class="col-span-3 text-xs text-slate-300 italic text-center py-4">იტვირთება...</div></div>
      </div>

      <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">5-დღიანი პროგნოზი</p>
          <span class="text-[10px] text-slate-300">OpenWeatherMap</span>
        </div>
        <div id="wa-fc-cards" class="grid grid-cols-5 gap-2 mb-4">
          ${Array(5).fill(0).map(()=>'<div class="bg-slate-50 rounded-2xl p-3 text-center h-28 animate-pulse"></div>').join('')}
        </div>
        <div style="position:relative;height:160px;"><canvas id="wa-fc-chart"></canvas></div>
      </div>

      <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">📊 ისტ. ამინდი — <span id="wa-branch-name" class="text-blue-500"></span></p>
          <div class="flex gap-2 flex-wrap">
            <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onclick="setWaPeriod(7,this)"  class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">7დ</button>
              <button onclick="setWaPeriod(30,this)" class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">30დ</button>
              <button onclick="setWaPeriod(90,this)" class="wa-period-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">90დ</button>
            </div>
            <select id="wa-metric" onchange="refreshWaChart()" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 bg-slate-50">
              <option value="temp_c">🌡 ტემპ. °C</option>
              <option value="humidity">💧 ტენ. %</option>
              <option value="wind_speed">💨 ქარი m/s</option>
            </select>
          </div>
        </div>
        <div id="wa-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"><div class="col-span-4 text-xs text-slate-300 italic text-center py-4">იტვირთება...</div></div>
        <div style="position:relative;height:200px;" class="mb-4"><canvas id="wa-hist-chart"></canvas></div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ისტ. რისკის ანალიზი</p>
        <div id="wa-hist-risks" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
      </div>

      <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🛠 HVAC/R რეკომენდაციები</p>
        <div id="wa-tips" class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="col-span-2 text-xs text-slate-300 italic text-center py-4">ამინდის შემდეგ...</div></div>
      </div>

      <div class="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">დღიური summary</p>
          <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button onclick="setWaSummaryView('daily',this)"  class="wa-sum-btn px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-sm">დღე</button>
            <button onclick="setWaSummaryView('weekly',this)" class="wa-sum-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400">კვ.</button>
          </div>
        </div>
        <div id="wa-summary" class="overflow-x-auto"><div class="text-xs text-slate-300 italic text-center py-6">იტვირთება...</div></div>
      </div>
    </div>`;

    document.getElementById('wa-branch-name').textContent = activeBranch?.name || '';

    if (typeof Chart === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload = () => _waInit();
        document.head.appendChild(s);
    } else { await _waInit(); }
}

async function _waInit() {
    const lat = activeBranch?.lat, lng = activeBranch?.lng;
    if (!lat || !lng) {
        document.getElementById('wa-risks').innerHTML = '<div class="col-span-3 text-xs text-amber-500 italic text-center py-4">⚠ ფილიალს კოორდინატები არ აქვს.</div>';
        return;
    }
    await Promise.all([_waLoadCurrent(lat,lng), _waLoadForecast(lat,lng), refreshWaChart()]);
}

async function _waLoadCurrent(lat,lng) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${_OWK}&units=metric&lang=ka`);
        if (!res.ok) throw new Error(res.status);
        const w = await res.json();
        const temp=Math.round(w.main.temp), feels=Math.round(w.main.feels_like);
        const hum=w.main.humidity, wind=w.wind.speed.toFixed(1);
        const pres=w.main.pressure, vis=w.visibility?(w.visibility/1000).toFixed(1):'—';
        const clouds=w.clouds?.all??'—';

        document.getElementById('wa-temp').textContent    = temp;
        document.getElementById('wa-feels').textContent   = feels+'°C';
        document.getElementById('wa-hum').textContent     = hum+'%';
        document.getElementById('wa-wnd').textContent     = wind+' m/s';
        document.getElementById('wa-pres').textContent    = pres+' hPa';
        document.getElementById('wa-vis').textContent     = vis+' km';
        document.getElementById('wa-clouds').textContent  = clouds+'%';
        document.getElementById('wa-desc').textContent    = w.weather[0].description;
        document.getElementById('wa-loc-name').textContent= w.name||'';
        document.getElementById('wa-icon').src            = `https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`;

        const hero = document.getElementById('wa-hero');
        hero.style.background = temp>=35?'linear-gradient(135deg,#7f1d1d,#991b1b,#1e293b)'
            :temp>=25?'linear-gradient(135deg,#78350f,#b45309,#1e293b)'
            :temp>=15?'linear-gradient(135deg,#1e3a5f,#1d4ed8,#0f172a)'
            :temp>=5 ?'linear-gradient(135deg,#164e63,#0891b2,#0f172a)'
            :'linear-gradient(135deg,#1e3a5f,#312e81,#0f172a)';

        _waRenderRisks(temp,hum,parseFloat(wind),pres);
        _waRenderTips(temp,hum,parseFloat(wind));
    } catch(e) {
        document.getElementById('wa-desc').textContent='API მიუწვდომელია';
        document.getElementById('wa-risks').innerHTML='<div class="col-span-3 text-xs text-red-400 italic text-center py-4">OpenWeather API Error</div>';
    }
}

function _waRenderRisks(temp,hum,wind,pres){
    const risks=[
        {icon:'🌡',title:'კომპ. დატვირთვა',
         level:temp>=38?'critical':temp>=32?'high':temp>=25?'medium':'ok',
         detail:temp>=38?`${temp}°C — გადახურება! კრიტ.`:temp>=32?`${temp}°C — EER↓~${Math.round((temp-25)*0.8)}%`:temp>=25?`${temp}°C — ნორმ. სამ.`:`${temp}°C — ოპტ.`,
         action:temp>=32?'→ კონდ. ვენტ. + fin-ები':null},
        {icon:'💧',title:'ტენ. რისკი',
         level:hum>=85?'critical':hum>=70?'high':hum>=55?'medium':'ok',
         detail:hum>=85?`${hum}% — კოროზია, drain!`:hum>=70?`${hum}% — გაზრდ. ტენი`:hum>=55?`${hum}% — ოდნ. მომ.`:`${hum}% — ნორმა`,
         action:hum>=70?'→ condensate pan + drain line':null},
        {icon:'❄',title:'ყინვის რისკი',
         level:temp<=-5?'critical':temp<=0?'high':temp<=5?'medium':'ok',
         detail:temp<=-5?`${temp}°C — გაყინვა!`:temp<=0?`${temp}°C — ყინვა!`:temp<=5?`${temp}°C — ზღვარი`:'საფრთხე — არ არის',
         action:temp<=5?'→ crankcase heater + ანტიფრ.':null},
    ];
    const lc={critical:{bg:'bg-red-50',br:'border-red-200',tx:'text-red-700',badge:'bg-red-600 text-white',lbl:'⛔ კრიტ.'},high:{bg:'bg-amber-50',br:'border-amber-200',tx:'text-amber-700',badge:'bg-amber-500 text-white',lbl:'⚠ მაღ.'},medium:{bg:'bg-yellow-50',br:'border-yellow-200',tx:'text-yellow-700',badge:'bg-yellow-400 text-white',lbl:'◆ საშ.'},ok:{bg:'bg-green-50',br:'border-green-200',tx:'text-green-700',badge:'bg-green-500 text-white',lbl:'✓ ნორმა'}};
    document.getElementById('wa-risks').innerHTML=risks.map(r=>{const c=lc[r.level];return`<div class="border rounded-2xl p-4 ${c.bg} ${c.br}"><div class="flex justify-between items-start mb-2"><div class="flex items-center gap-2"><span style="font-size:16px">${r.icon}</span><span class="text-[10px] font-black uppercase tracking-widest ${c.tx}">${r.title}</span></div><span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${c.badge}">${c.lbl}</span></div><p class="text-xs font-medium ${c.tx} mb-${r.action?2:0}">${r.detail}</p>${r.action?`<div class="text-[10px] text-slate-500 bg-white/70 rounded-lg p-2">${r.action}</div>`:''}</div>`;}).join('');
}

function _waRenderTips(temp,hum,wind){
    const tips=[];
    if(temp>=28||temp<=5)tips.push({cat:'🔧 სამ. წნევა',tip:`${temp}°C-ზე R410A კონდ. წნევა≈${Math.round(temp*0.42+10)}Bar(g). გადახრა>10%=გაჟონვა ან dirty coil.`,urgent:temp>=35||temp<=0});
    if(temp>=30)tips.push({cat:'🌡 კონდ. fin-ები',tip:`${temp}°C სიცხეში fin-ების სისუფთავე კრიტ. Dirty condenser=EER −20..40%. გასუფთავება სავალდ.`,urgent:temp>=35});
    if(hum>=65)tips.push({cat:'💧 დრენაჟი',tip:`${hum}% ტენ-ზე კონდ. დებიტი მაღ. Condensate pan+drain line შეამოწ. Biofilm თავიდ. — UV lamp ან biocide.`,urgent:hum>=80});
    if(wind>=8)tips.push({cat:'💨 ქარი',tip:`${wind}m/s — anti-vibration mount-ები შეამ. Outlet direction wind-ის წინ.`,urgent:wind>=12});
    tips.push({cat:'📋 PPM ჩეკლ.',tip:'Superheat 4-8K · Subcooling 4-6K · Amp draw ±10% nameplate · ΔT კოილზე ≥10°C.',urgent:false});
    document.getElementById('wa-tips').innerHTML=tips.map(t=>`<div class="rounded-2xl border p-4 ${t.urgent?'bg-red-50 border-red-200':'bg-slate-50 border-slate-100'}"><div class="text-[10px] font-black uppercase tracking-widest ${t.urgent?'text-red-600':'text-slate-500'} mb-1.5">${t.cat}${t.urgent?' ⚠':''}</div><p class="text-[11px] leading-relaxed ${t.urgent?'text-red-700':'text-slate-600'}">${t.tip}</p></div>`).join('');
}

async function _waLoadForecast(lat,lng){
    try{
        const res=await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${_OWK}&units=metric&lang=ka&cnt=40`);
        if(!res.ok)throw new Error(res.status);
        const data=await res.json();
        const days={};
        data.list.forEach(i=>{const d=i.dt_txt.split(' ')[0];if(!days[d])days[d]=[];days[d].push(i);});
        const dks=Object.keys(days).slice(0,5);
        const dn=['კვი','ორშ','სამ','ოთხ','ხუთ','პარ','შაბ'];
        document.getElementById('wa-fc-cards').innerHTML=dks.map(dk=>{
            const it=days[dk],ts=it.map(i=>i.main.temp),tmax=Math.round(Math.max(...ts)),tmin=Math.round(Math.min(...ts));
            const hum=Math.round(it.reduce((s,i)=>s+i.main.humidity,0)/it.length);
            const icon=it[Math.floor(it.length/2)].weather[0].icon;
            const bg=tmax>=35?'bg-red-50 border-red-100':tmax>=25?'bg-amber-50 border-amber-100':'bg-blue-50 border-blue-100';
            return`<div class="rounded-2xl border p-3 text-center ${bg}"><div class="text-[10px] font-black text-slate-500 uppercase">${dn[new Date(dk).getDay()]}</div><div class="text-[9px] text-slate-400 mb-1">${new Date(dk).toLocaleDateString('ka-GE',{day:'2-digit',month:'short'})}</div><img src="https://openweathermap.org/img/wn/${icon}.png" class="w-10 h-10 mx-auto"><div class="font-black text-slate-900 text-sm">${tmax}°</div><div class="text-slate-400 text-[10px]">${tmin}°</div><div class="text-[9px] text-blue-500 mt-0.5">💧${hum}%</div></div>`;
        }).join('');
        const items=data.list.slice(0,16);
        const labels=items.map(i=>new Date(i.dt_txt).toLocaleString('ka-GE',{day:'2-digit',hour:'2-digit',minute:'2-digit'}));
        const temps=items.map(i=>i.main.temp.toFixed(1)),hums=items.map(i=>i.main.humidity);
        if(_fChart){_fChart.destroy();_fChart=null;}
        const ctx=document.getElementById('wa-fc-chart');
        if(ctx&&typeof Chart!=='undefined'){
            _fChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'ტემპ. °C',data:temps,borderColor:'#f97316',backgroundColor:'#f9731615',borderWidth:2.5,pointRadius:3,tension:0.4,fill:true,yAxisID:'y'},{label:'ტენ. %',data:hums,borderColor:'#3b82f6',backgroundColor:'transparent',borderWidth:1.5,pointRadius:0,tension:0.4,borderDash:[4,3],yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y?.toFixed(1)}`}}},scales:{x:{ticks:{maxTicksLimit:8,font:{size:9},color:'#94a3b8'},grid:{display:false}},y:{type:'linear',position:'left',ticks:{font:{size:10},color:'#f97316'},grid:{color:'#f1f5f9'}},y1:{type:'linear',position:'right',min:0,max:100,ticks:{font:{size:10},color:'#3b82f6'},grid:{display:false}}}}});
        }
    }catch(e){console.warn('forecast:',e);}
}

function setWaPeriod(days,btn){
    window._waPeriod=days;
    document.querySelectorAll('.wa-period-btn').forEach(b=>{b.classList.remove('bg-white','text-slate-900','shadow-sm');b.classList.add('text-slate-400');});
    btn.classList.add('bg-white','text-slate-900','shadow-sm');btn.classList.remove('text-slate-400');
    refreshWaChart();
}
function setWaSummaryView(view,btn){
    window._waSummaryView=view;
    document.querySelectorAll('.wa-sum-btn').forEach(b=>{b.classList.remove('bg-white','text-slate-900','shadow-sm');b.classList.add('text-slate-400');});
    btn.classList.add('bg-white','text-slate-900','shadow-sm');btn.classList.remove('text-slate-400');
    _waRenderSummary(window._waHistData||[]);
}

async function refreshWaChart(){
    const days=window._waPeriod||30,metric=document.getElementById('wa-metric')?.value||'temp_c';
    const since=new Date(Date.now()-days*86400000).toISOString();
    const{data,error}=await _supabase.from('weather_logs').select('logged_at,temp_c,feels_like,humidity,wind_speed,weather_main,pressure').eq('branch_id',activeBranch.id).gte('logged_at',since).order('logged_at',{ascending:true});
    const kpi=document.getElementById('wa-kpis');
    if(error){if(kpi)kpi.innerHTML=`<div class="col-span-4 text-xs text-red-400 text-center py-4">DB Error: ${error.message}</div>`;return;}
    if(!data||!data.length){if(kpi)kpi.innerHTML='<div class="col-span-4 text-center py-8"><div class="text-2xl mb-2">📭</div><p class="text-sm font-medium text-slate-500">weather_logs ცარიელია</p><p class="text-xs text-slate-400 mt-1">Edge Function ყოველ საათში ჩაწერს</p></div>';return;}
    window._waHistData=data;
    _waRenderKPIs(data);_waRenderHistChart(data,metric);_waRenderHistRisks(data);_waRenderSummary(data);
}

function _waRenderKPIs(data){
    const ts=data.map(d=>d.temp_c).filter(v=>v!=null),hs=data.map(d=>d.humidity).filter(v=>v!=null),ws=data.map(d=>d.wind_speed).filter(v=>v!=null);
    const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'—',mn=a=>a.length?Math.min(...a).toFixed(1):'—',mx=a=>a.length?Math.max(...a).toFixed(1):'—';
    const el=document.getElementById('wa-kpis');if(!el)return;
    el.innerHTML=`<div class="bg-amber-50 rounded-2xl p-4 border border-amber-100"><div class="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">ტემპ. საშ.</div><div class="text-3xl font-black text-amber-800">${avg(ts)}°C</div><div class="text-[10px] text-amber-500 mt-1 flex justify-between"><span>↓${mn(ts)}°</span><span>↑${mx(ts)}°</span></div></div><div class="bg-blue-50 rounded-2xl p-4 border border-blue-100"><div class="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">ტენ. საშ.</div><div class="text-3xl font-black text-blue-800">${avg(hs)}%</div><div class="text-[10px] text-blue-500 mt-1 flex justify-between"><span>↓${mn(hs)}%</span><span>↑${mx(hs)}%</span></div></div><div class="bg-teal-50 rounded-2xl p-4 border border-teal-100"><div class="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1">ქარი საშ.</div><div class="text-3xl font-black text-teal-800">${avg(ws)}</div><div class="text-[10px] text-teal-500 mt-1">m/s · max ${mx(ws)}</div></div><div class="bg-slate-50 rounded-2xl p-4 border border-slate-100"><div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">ჩანაწ.</div><div class="text-3xl font-black text-slate-700">${data.length}</div><div class="text-[10px] text-slate-400 mt-1">${window._waPeriod}დ განმ.</div></div>`;
}

function _waRenderHistChart(data,metric){
    const cfg={temp_c:{label:'ტემპ. °C',color:'#f97316',bg:'#f9731618'},humidity:{label:'ტენ. %',color:'#3b82f6',bg:'#3b82f618'},wind_speed:{label:'ქარი m/s',color:'#14b8a6',bg:'#14b8a618'}}[metric]||{label:'ტემპ. °C',color:'#f97316',bg:'#f9731618'};
    const labels=data.map(d=>new Date(d.logged_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}));
    const values=data.map(d=>d[metric]!=null?parseFloat(d[metric].toFixed(1)):null);
    if(_wChart){_wChart.destroy();_wChart=null;}
    const ctx=document.getElementById('wa-hist-chart');if(!ctx||typeof Chart==='undefined')return;
    _wChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:cfg.label,data:values,borderColor:cfg.color,backgroundColor:cfg.bg,borderWidth:2,pointRadius:data.length>200?0:2,pointHoverRadius:4,tension:0.4,fill:true,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${cfg.label}: ${c.parsed.y?.toFixed(1)??'—'}`}}},scales:{x:{ticks:{maxTicksLimit:10,font:{size:10},color:'#94a3b8'},grid:{display:false}},y:{ticks:{font:{size:10},color:'#94a3b8'},grid:{color:'#f1f5f9'}}}}});
}

function _waRenderHistRisks(data){
    const hH=data.filter(d=>d.temp_c>35).length,cH=data.filter(d=>d.temp_c<0).length,mH=data.filter(d=>d.humidity>80).length;
    const card=(on,icon,title,h,desc,c)=>`<div class="border rounded-2xl p-4 ${on?c.bg+' '+c.br:'border-slate-100'}"><div class="flex items-center gap-2 mb-2"><span style="font-size:16px">${icon}</span><span class="text-[10px] font-black uppercase tracking-widest ${on?c.tx:'text-slate-400'}">${title}</span></div><div class="text-2xl font-black ${on?c.val:'text-slate-300'} mb-1">${h} სთ</div><div class="text-[10px] text-slate-400">${desc}</div>${on?`<div class="mt-2 text-[10px] font-bold ${c.tx}">⚠ ანალიზი საჭ.</div>`:'<div class="mt-2 text-[10px] text-green-500">✓ ნორმა</div>'}</div>`;
    const el=document.getElementById('wa-hist-risks');if(!el)return;
    el.innerHTML=card(hH>0,'🌡','ექსტ. სიცხე >35°C',hH,'HVAC გადატვ. ისტ.',{bg:'bg-red-50',br:'border-red-200',tx:'text-red-600',val:'text-red-700'})+card(cH>0,'❄','ყინვა <0°C',cH,'ანტიფრ./მილ. ისტ.',{bg:'bg-blue-50',br:'border-blue-200',tx:'text-blue-600',val:'text-blue-700'})+card(mH>0,'💧','მაღ. ტენ. >80%',mH,'კოროზ./მოლე ისტ.',{bg:'bg-amber-50',br:'border-amber-200',tx:'text-amber-600',val:'text-amber-700'});
}

function _waRenderSummary(data){
    if(!data||!data.length)return;
    const view=window._waSummaryView||'daily',groups={};
    data.forEach(d=>{const dt=new Date(d.logged_at);let key;if(view==='weekly'){const day=dt.getDay(),diff=(day===0?-6:1-day);const m=new Date(dt);m.setDate(dt.getDate()+diff);key=m.toISOString().slice(0,10);}else key=dt.toISOString().slice(0,10);if(!groups[key])groups[key]=[];groups[key].push(d);});
    const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):null,mn=a=>a.length?Math.min(...a):null,mx=a=>a.length?Math.max(...a):null,fmt=v=>v!=null?v.toFixed(1):'—';
    const rows=Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).slice(0,30).map(([key,items])=>{
        const ts=items.map(i=>i.temp_c).filter(v=>v!=null),hs=items.map(i=>i.humidity).filter(v=>v!=null),ws=items.map(i=>i.wind_speed).filter(v=>v!=null);
        const hH=items.filter(i=>i.temp_c>35).length,mH=items.filter(i=>i.humidity>80).length;
        const lbl=view==='weekly'?`კვ. ${new Date(key).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`:new Date(key).toLocaleDateString('ka-GE',{day:'2-digit',month:'short',year:'numeric'});
        return{lbl,ts,hs,ws,hH,mH,cnt:items.length};
    });
    const el=document.getElementById('wa-summary');if(!el)return;
    el.innerHTML=`<table class="w-full text-xs border-collapse min-w-[580px]"><thead><tr class="border-b border-slate-100"><th class="text-left font-medium text-slate-400 py-2 px-2">${view==='weekly'?'კვირა':'თარიღი'}</th><th class="text-center font-medium text-slate-400 py-2 px-2">საშ.°C</th><th class="text-center font-medium text-slate-400 py-2 px-2">მინ</th><th class="text-center font-medium text-slate-400 py-2 px-2">მაქ</th><th class="text-center font-medium text-slate-400 py-2 px-2">ტენ%</th><th class="text-center font-medium text-slate-400 py-2 px-2">ქარი</th><th class="text-center font-medium text-slate-400 py-2 px-2">🌡>35°</th><th class="text-center font-medium text-slate-400 py-2 px-2">💧>80%</th><th class="text-center font-medium text-slate-400 py-2 px-2">ჩანაწ.</th></tr></thead><tbody>${rows.map(r=>`<tr class="border-b border-slate-50 hover:bg-slate-50"><td class="py-2 px-2 font-medium text-slate-800">${r.lbl}</td><td class="py-2 px-2 text-center ${avg(r.ts)>35?'text-red-600 font-bold':avg(r.ts)<0?'text-blue-600 font-bold':'text-slate-700'}">${fmt(avg(r.ts))}</td><td class="py-2 px-2 text-center text-slate-500">${fmt(mn(r.ts))}</td><td class="py-2 px-2 text-center text-slate-500">${fmt(mx(r.ts))}</td><td class="py-2 px-2 text-center ${avg(r.hs)>80?'text-amber-600 font-bold':'text-slate-500'}">${fmt(avg(r.hs))}</td><td class="py-2 px-2 text-center text-slate-500">${fmt(avg(r.ws))}</td><td class="py-2 px-2 text-center ${r.hH>0?'text-red-500 font-bold':'text-slate-300'}">${r.hH||'—'}</td><td class="py-2 px-2 text-center ${r.mH>0?'text-amber-500 font-bold':'text-slate-300'}">${r.mH||'—'}</td><td class="py-2 px-2 text-center text-slate-400">${r.cnt}</td></tr>`).join('')}</tbody></table>`;
}


/* ══ loadBdcStats — სტატ. ტაბი → redirect ══ */
window._statsPeriod = 30;
async function loadBdcStats() {
    const el = document.getElementById('bdcp-stats');
    if (!el) return;
    el.innerHTML = `<div class="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm text-center py-16">
        <div class="text-4xl mb-4">☁️</div>
        <p class="text-slate-700 font-black text-lg mb-2">ამინდის ანალიტიკა გადავიდა</p>
        <p class="text-sm text-slate-400 mb-6">სრული სტატისტიკა, HVAC/R რისკები, 5-დღ. პროგნოზი და ისტ. ანალიზი ახლა <strong>ამინდი ტაბშია</strong>.</p>
        <button onclick="switchBdcTab('weather', [...document.querySelectorAll('#bdc-nav .bdc-tab')].find(b=>b.textContent.includes('ამინდი')))"
            class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition">
            ამინდის ტაბი →
        </button>
    </div>`;
}
