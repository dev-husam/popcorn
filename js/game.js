'use strict';
/* ------------------------------ Game ------------------------------ */
const MSGS = ['واو! الفشار بدأ يطلع! 🍿', 'يا ترى مين المحظوظ؟', 'استعدوا للمفاجأة!', 'قربنا نعرف!', 'مين رح يكون نجم اليوم؟', 'لحظة الحماس!'];
const SPEED = { slow: 1.45, normal: 1, fast: 0.65 };
let busy = false, lastWinners = [];
const T = ms => ms * SPEED[S.settings.speed] * (REDUCED ? 0.6 : 1);
const machine = $('#machine'), startBtn = $('#startBtn');

function frames(ms, fn) {
  return new Promise(res => { const t0 = performance.now(); let prev = t0; (function step(now) { const p = clamp((now - t0) / ms, 0, 1), dt = (now - prev) / 1000; prev = now; fn(p, dt); if (p < 1) requestAnimationFrame(step); else res(); })(t0); });
}
function pickWinners() {
  const st = S.settings, all = S.present, n = Math.min(st.winners, all.length), removal = st.removeSelected && !st.allowDuplicates;
  let reset = false, chosen, pool = removal ? all.filter(s => !S.used.includes(s.id)) : all.slice();
  if (removal && !pool.length) { S.used = []; pool = all.slice(); reset = true; }
  chosen = shuffle(pool).slice(0, n);
  if (chosen.length < n) {                                  // pool ran out mid-draw: restore it and top up (never the same student twice)
    const have = new Set(chosen.map(c => c.id)), extra = shuffle(all.filter(s => !have.has(s.id))).slice(0, n - chosen.length);
    S.used = []; reset = true; chosen = chosen.concat(extra);
    if (removal) S.used = extra.map(e => e.id);
  } else if (removal) S.used = S.used.concat(chosen.map(c => c.id));
  if (n < st.winners) UI.toast(`عدد الطلاب أقل من ${st.winners} — تم اختيار ${n}`);
  S.drawCount++; const now = Date.now();
  chosen.forEach(c => { const o = S.students.find(x => x.id === c.id); if (o) o.wins = (o.wins || 0) + 1; S.history.push({ id: uid(), name: c.name, cls: S.cls.name, draw: S.drawCount, time: now }); });
  if (S.history.length > 500) S.history = S.history.slice(-500);
  Store.save();
  return { winners: chosen, reset };
}

async function startDraw() {
  if (busy || !S.students.length) return;
  if (!S.present.length) return UI.toast('كل الطلاب غائبون! ✅ حدّدي الحاضرين من الإعدادات');
  busy = true; document.body.classList.add('busy'); startBtn.disabled = true; UI.closeAll(); Sound.unlock(); Chamber.resize(); Chamber.reset();
  try {
    const { winners, reset } = pickWinners(); lastWinners = winners;
    if (reset) UI.toast('🔄 عاد جميع الطلاب إلى القائمة من جديد');
    await phasePrepare(); await phaseFill(); await phaseExplode(); await phaseReveal(winners);
  } catch (e) { console.error(e); endDraw(); }
}
function endDraw() {
  busy = false; document.body.classList.remove('busy'); startBtn.disabled = false; startBtn.classList.remove('pressed');
  machine.className = 'machine'; Sound.heatStop(); Chamber.k = []; Chamber.draw();
  $('#prompt').textContent = '🍿 مستعدين نختار بطل اليوم؟'; $('#prompt').classList.remove('bump');
  UI.renderMain(); UI.renderStudents();
}

/* Phase 1 — preparation */
async function phasePrepare() {
  startBtn.classList.add('pressed'); Sound.click(); machine.classList.add('on', 'excited'); UI.setPrompt('يا ترى مين رح يطلع معنا؟'); Sound.heatStart();
  await sleep(T(420)); startBtn.classList.remove('pressed'); Sound.sparkle();
  Fx.burst(innerWidth / 2, machine.getBoundingClientRect().top + 30, 12, { types: ['star', 'spark'], min: 60, max: 260, g: 200 });
  await sleep(T(950));
}
/* Phase 2 — kernels fly into the glass, machine warms up */
async function phaseFill() {
  machine.classList.add('shaking', 'steaming'); Sound.rumble(T(3600) / 1000);
  const msgTimer = setInterval(() => UI.setPrompt(pick(MSGS)), T(1250)); const total = 70;
  await frames(T(3600), (p, dt) => {
    Chamber.spawnTo(Math.floor(total * p)); Chamber.setFill(8 + 32 * p);
    if (Math.random() < dt * (6 + 12 * p)) Sound.pop();
    if (Math.random() < dt * 1.4) { const r = machine.getBoundingClientRect(); Fx.add(Fx.mk({ x: r.left + r.width * rand(.2, .8), y: r.top + r.height * rand(.2, .6), vy: -rand(20, 80), vx: rand(-20, 20), life: 1, size: rand(8, 14), type: 'star', color: '#FFE97A', vr: 3 })); }
  });
  Chamber.spawnTo(total); clearInterval(msgTimer);
}
/* Phase 3 — it heats up, popcorn expands, EXPLOSION */
async function phaseExplode() {
  machine.classList.remove('shaking'); machine.classList.add('shakingHard', 'flash'); UI.setPrompt('لحظة الحماس!'); Sound.rumble(T(2300) / 1000); Chamber.shake = 1; let said1 = false, said2 = false;
  await frames(T(2300), (p, dt) => {
    Chamber.popFraction(p * 1.1); Chamber.setFill(40 + 120 * p); Chamber.shake = 1 + p * 2;
    if (Math.random() < dt * 40 * (0.3 + p)) { if (p > 0.15) Chamber.addPopcorn(1); }
    if (Math.random() < dt * (14 + 50 * p)) Sound.pop();
    if (p > 0.45 && !said1) { said1 = true; UI.setPrompt('استعدوا للمفاجأة!'); }
    if (p > 0.78 && !said2) { said2 = true; UI.setPrompt('قربنا نعرف!'); Sound.sparkle(); }
  });
  // BOOM
  Sound.heatStop(); Sound.explosion();
  const { rect, pieces } = Chamber.explode(); Chamber.shake = 0;
  machine.classList.remove('shakingHard', 'flash', 'steaming'); machine.classList.add('boom');
  $('#flash').classList.remove('go'); void $('#flash').offsetWidth; $('#flash').classList.add('go');
  if (!REDUCED) { const app = $('#app'); app.classList.remove('screenShake'); void app.offsetWidth; app.classList.add('screenShake'); setTimeout(() => app.classList.remove('screenShake'), 750); }
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  pieces.forEach(p => Fx.add(Fx.mk({ x: p.x, y: p.y, vx: (p.x - cx) * rand(3, 7) + rand(-200, 200), vy: (p.y - cy) * rand(3, 7) - rand(100, 600), g: 900, life: rand(1.4, 2.6), size: rand(14, 28), type: 'puff', face: Math.random() < .6, vr: rand(-6, 6), drag: .5, fade: .5 })));
  Fx.burst(cx, cy, 90, { min: 250, max: 1100, up: 200 });
  setTimeout(() => Fx.rain(70), 150);
  await sleep(T(750));
}
/* Phase 4 — the golden popcorn flies to the centre, blooms like a flower and reveals the winner */
async function phaseReveal(winners) {
  const r = Chamber.cv.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2, size = 100;
  const corn = document.createElement('div'); corn.id = 'bigcorn'; corn.style.left = (sx - size / 2) + 'px'; corn.style.top = (sy - size / 2) + 'px'; corn.innerHTML = popcornSVG(false); document.body.appendChild(corn);
  const dx = innerWidth / 2 - sx, dy = innerHeight / 2 - sy, fs = clamp(Math.min(innerWidth, innerHeight) * 0.4 / size, 1.8, 3.6);
  UI.setPrompt('هنا هو! 🌟'); Sound.whoosh();
  Fx.every(60, () => { const b = corn.getBoundingClientRect(); Fx.add(Fx.mk({ x: b.left + b.width / 2 + rand(-20, 20), y: b.top + b.height / 2 + rand(-20, 20), life: .7, size: rand(8, 16), type: 'star', color: pick(COLORS), vx: rand(-60, 60), vy: rand(-60, 60), vr: 5 })); });
  const flight = corn.animate([
    { transform: 'translate(0,0) scale(.5) rotate(0deg)', offset: 0 },
    { transform: `translate(${dx * .45}px,${dy * .45 - 140}px) scale(${fs * .6}) rotate(420deg)`, offset: .55 },
    { transform: `translate(${dx}px,${dy}px) scale(${fs}) rotate(900deg)`, offset: 1 }
  ], { duration: T(1500), easing: 'cubic-bezier(.35,.1,.3,1)', fill: 'forwards' });
  await flight.finished; Fx.stopTimers();
  // overlay + petals (flower opens)
  const w = $('#winner'), petals = $('#petals'); petals.textContent = ''; w.hidden = false; $('#wcard').hidden = true; $$('.rv', w).forEach(e => e.classList.remove('in')); $('#crown').className = 'crown';
  for (let i = 0; i < 8; i++) { const p = document.createElement('div'); p.className = 'petal'; p.style.setProperty('--a', (i * 45) + 'deg'); p.style.animationDelay = (i * 0.05) + 's,2.6s'; petals.appendChild(p); }
  Sound.sparkle(); corn.animate([{ transform: `translate(${dx}px,${dy}px) scale(${fs}) rotate(900deg)` }, { transform: `translate(${dx}px,${dy}px) scale(${fs * 1.3}) rotate(1080deg)`, offset: .6 }, { transform: `translate(${dx}px,${dy}px) scale(${fs * .3}) rotate(1260deg)`, opacity: 0 }], { duration: T(900), fill: 'forwards' });
  await sleep(T(850)); corn.remove();
  // build card
  const names = $('#rvNames'); names.textContent = ''; const multi = winners.length > 1;
  winners.forEach(s => { const d = document.createElement('div'); d.className = 'wname'; d.textContent = s.emoji + ' ' + s.name; names.appendChild(d); });
  const longest = Math.max(...winners.map(s => s.name.length)), base = multi ? clamp(innerWidth / 14, 28, 54) : clamp(innerWidth / 9, 40, 80);
  names.style.setProperty('--fs', Math.round(clamp(base * (longest > 12 ? 12 / longest + .25 : 1), 26, 80)) + 'px');
  $('#rvLabel').textContent = multi ? 'نجوم اليوم هم' : 'نجم اليوم هو'; $('#rvClap').textContent = multi ? '👏 يلا نصفق لأبطالنا!' : '👏 يلا نصفق لبطلنا!';
  const card = $('#wcard'); card.hidden = false; card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  Sound.victory(); Fx.burst(innerWidth / 2, innerHeight / 2, 70, { min: 250, max: 900, up: 250 });
  await sleep(T(450)); $('#rvTitle').classList.add('in'); Sound.sparkle();
  await sleep(T(550)); $('#rvLabel').classList.add('in'); Sound.tone(880, .2, { type: 'triangle', vol: .2 });
  await sleep(T(600)); names.classList.add('in'); Sound.fanfare(); Fx.burst(innerWidth / 2, innerHeight / 2, 40, { min: 200, max: 700, up: 200 });
  await sleep(T(600)); $('#rvClap').classList.add('in'); Sound.clap();
  await sleep(T(400)); $('#rvActions').classList.add('in');
  if (S.settings.autoCelebrate) { Celebrate.party(true); Fx.every(1400, () => Fx.rain(14)); }
  $('#btnAgain').focus({ preventScroll: true });
}
function closeWinner() {
  Fx.clear(); $('#winner').hidden = true; $('#balloons').textContent = ''; $('#petals').textContent = ''; $('#wcard').hidden = true;
  const c = $('#bigcorn'); if (c) c.remove(); endDraw();
}

/* ------------------------------ Celebration actions ------------------------------ */
const Celebrate = {
  balloons(n) {
    const box = $('#balloons');
    for (let i = 0; i < n; i++) { const b = document.createElement('div'); b.className = 'balloon'; b.style.left = rand(2, 92) + '%'; b.style.setProperty('--c', pick(COLORS)); b.style.setProperty('--d', rand(5, 9) + 's'); b.style.animationDelay = rand(0, 1.4) + 's'; b.addEventListener('animationend', () => b.remove()); box.appendChild(b); }
  },
  hop() { const c = $('#wcard'); c.classList.remove('hop'); void c.offsetWidth; c.classList.add('hop'); },
  party(quiet) { this.balloons(quiet ? 10 : 26); Fx.rain(quiet ? 60 : 140); if (!quiet) { Sound.victory(); Fx.burst(innerWidth / 2, innerHeight / 2, 100, { min: 300, max: 1000, up: 300 }); UI.banner('🎈 احتفال كبير! 🎈'); this.hop(); } },
  clap() { Sound.clap(); Fx.emojiRise('👏', 26); this.hop(); UI.banner('👏 تصفيق حار! 👏'); setTimeout(() => Sound.clap(), 700); },
  star() { Sound.sparkle(); setTimeout(() => Sound.sparkle(), 350); Fx.rain(70, { type: 'star' }); Fx.burst(innerWidth / 2, innerHeight / 2, 60, { types: ['star', 'spark'], min: 200, max: 800, up: 200 }); UI.banner('⭐ أنت نجم اليوم! ⭐'); this.hop(); },
  crown() { const c = $('#crown'); c.className = 'crown'; void c.offsetWidth; c.className = 'crown drop'; Sound.fanfare(); setTimeout(() => { Fx.burst(innerWidth / 2, innerHeight / 3, 40, { types: ['star', 'spark'], min: 150, max: 600 }); Sound.sparkle(); }, 850); UI.banner('👑 تاج البطولة! 👑'); }
};

