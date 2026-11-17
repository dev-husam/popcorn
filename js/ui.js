'use strict';
/* ------------------------------ UI ------------------------------ */
const UI = {
  toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3300); },
  setPrompt(txt) { const p = $('#prompt'); p.textContent = txt; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); },
  open(id) { const m = $(id); m.hidden = false; const f = $('[data-close],#confirmNo', m); if (f) f.focus(); },
  close(m) { m.hidden = true; },
  closeAll() { $$('.modal').forEach(m => { if (m.id !== 'confirmModal') m.hidden = true; }); },
  confirm(msg, yes = 'نعم') {
    return new Promise(res => {
      $('#confirmMsg').textContent = msg; $('#confirmYes').textContent = yes; const m = $('#confirmModal'); m.hidden = false; $('#confirmNo').focus();
      const done = v => { m.hidden = true; $('#confirmYes').onclick = $('#confirmNo').onclick = null; res(v); };
      $('#confirmYes').onclick = () => done(true); $('#confirmNo').onclick = () => done(false);
    });
  },
  ask(msg, val = '') {
    return new Promise(res => {
      const m = $('#confirmModal'), inp = $('#askInput');
      $('#confirmMsg').textContent = msg; inp.hidden = false; inp.value = val; $('#confirmYes').textContent = 'حفظ'; m.hidden = false; inp.focus(); inp.select();
      const done = v => { m.hidden = true; inp.hidden = true; $('#confirmYes').onclick = $('#confirmNo').onclick = inp.onkeydown = null; res(v); };
      $('#confirmYes').onclick = () => done(inp.value.trim().slice(0, 30) || null);
      $('#confirmNo').onclick = () => done(null);
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#confirmYes').click(); } };
    });
  },
  banner(txt) { const b = document.createElement('div'); b.className = 'banner'; b.textContent = txt; document.body.appendChild(b); setTimeout(() => b.remove(), 1850); },
  tab(name) { $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name))); $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name)); },
  syncControls() {
    const st = S.settings;
    $$('[data-set]').forEach(i => { i.checked = !!st[i.dataset.set]; });
    $$('[data-range]').forEach(i => { i.value = Math.round(st[i.dataset.range] * 100); });
    $$('[data-seg]').forEach(g => $$('button', g).forEach(b => b.setAttribute('aria-pressed', String(String(st[g.dataset.seg]) === b.dataset.val))));
    document.documentElement.dataset.theme = st.theme;
    $('meta[name=theme-color]').content = THEME_COLORS[st.theme];
    $('#btnMute').textContent = st.muted ? '🔇' : '🔊'; $('#btnMute').setAttribute('aria-pressed', String(st.muted));
    $('#btnMute2').textContent = st.muted ? '🔇 كتم (اضغط للتشغيل)' : '🔊 تشغيل (اضغط للكتم)';
  },
  renderMain() {
    const has = S.students.length > 0;
    $('#machineWrap').hidden = !has; $('#tagline').hidden = !has; $('#empty').hidden = has; $('#prompt').hidden = !has;
    if (!has) $('#emptyChar').innerHTML = popcornSVG(true);
    else requestAnimationFrame(() => Chamber.resize());
    const st = S.settings, removal = st.removeSelected && !st.allowDuplicates, r = $('#remain');
    if (has && removal) { const pr = S.present, left = pr.filter(s => !S.used.includes(s.id)).length; r.hidden = false; r.textContent = `المتبقون في هذه الجولة: ${left} من ${pr.length}`; } else r.hidden = true;
  },
  renderStudents() {
    const q = $('#search').value.trim().toLowerCase(), box = $('#studentList'); box.textContent = '';
    $('#countNum').textContent = S.students.length;
    const items = S.students.filter(s => !q || s.name.toLowerCase().includes(q));
    if (!items.length) { const d = document.createElement('div'); d.className = 'none'; d.style.gridColumn = '1/-1'; d.textContent = S.students.length ? 'لا توجد نتائج مطابقة 🔍' : 'لم تتم إضافة طلاب بعد ✏️'; box.appendChild(d); return; }
    items.forEach((s, i) => {
      const chip = document.createElement('div'); chip.className = 'chip' + (s.absent ? ' absent' : ''); chip.style.setProperty('--c', ['#e4d4ff', '#ffd1e8', '#fff0a8', '#ffdcb0', '#c4f0ff', '#c7f7e3'][i % 6]);
      const av = document.createElement('span'); av.className = 'av'; av.textContent = s.emoji; chip.appendChild(av);
      if (editingId === s.id) {
        const inp = document.createElement('input'); inp.value = s.name; inp.maxLength = 40; inp.setAttribute('aria-label', 'تعديل الاسم');
        const save = mkBtn('✔️', 'حفظ', () => Students.rename(s.id, inp.value)), cancel = mkBtn('✖️', 'إلغاء', () => { editingId = null; UI.renderStudents(); });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); Students.rename(s.id, inp.value); } else if (e.key === 'Escape') { e.stopPropagation(); editingId = null; UI.renderStudents(); } });
        chip.append(inp, save, cancel); box.appendChild(chip); setTimeout(() => { inp.focus(); inp.select(); }, 0);
      } else {
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = s.name; chip.appendChild(nm);
        if (S.used.includes(s.id) && S.settings.removeSelected && !S.settings.allowDuplicates) { const w = document.createElement('span'); w.className = 'won'; w.title = 'تم اختياره في هذه الجولة'; w.textContent = '⭐'; chip.appendChild(w); }
        if (s.wins) { const w = document.createElement('span'); w.className = 'won'; w.title = 'عدد مرات الفوز'; w.textContent = '🏅' + s.wins; chip.appendChild(w); }
        chip.append(mkBtn(s.absent ? '🚫' : '✅', s.absent ? 'غائب — اضغط ليصبح حاضراً' : 'حاضر — اضغط ليصبح غائباً', () => Students.toggleAbsent(s.id)), mkBtn('✏️', 'تعديل', () => { editingId = s.id; UI.renderStudents(); }), mkBtn('🗑️', 'حذف', () => Students.remove(s.id)));
        box.appendChild(chip);
      }
    });
  },
  renderHistory() {
    const ul = $('#histList'); ul.textContent = '';
    if (!S.history.length) { const li = document.createElement('li'); li.className = 'none'; li.style.display = 'block'; li.textContent = 'لا يوجد فائزون بعد 🍿'; ul.appendChild(li); return; }
    [...S.history].reverse().forEach(h => {
      const li = document.createElement('li'), no = document.createElement('span'), nm = document.createElement('span'), tm = document.createElement('time');
      no.className = 'no'; no.textContent = '#' + h.draw; nm.className = 'nm'; nm.textContent = h.name + (h.cls && S.classes.length > 1 ? ' — ' + h.cls : ''); tm.textContent = fmtDate(h.time);
      li.append(no, nm, tm); ul.appendChild(li);
    });
  },
  renderClasses() {
    for (const sel of [$('#classSelect'), $('#classSelect2')]) {
      sel.textContent = '';
      S.classes.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = `${c.name} (${c.students.length})`; o.selected = c.id === S.active; sel.appendChild(o); });
    }
    $('#classBar').hidden = S.classes.length < 2;
  },
  renderAll() { UI.renderClasses(); UI.renderMain(); UI.renderStudents(); UI.renderHistory(); UI.syncControls(); }
};
let editingId = null;
function mkBtn(txt, label, fn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.title = label; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; }

function popcornSVG(sad) {
  const mouth = sad ? '<path d="M42 64 Q51 56 60 64" fill="none" stroke="#40205F" stroke-width="3" stroke-linecap="round"/><path d="M36 50 q2 8 0 10" stroke="#4DCCF5" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<path d="M42 58 Q51 68 60 58" fill="none" stroke="#40205F" stroke-width="3" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#FFF8E7" stroke="#F2C879" stroke-width="3"><circle cx="30" cy="42" r="20"/><circle cx="56" cy="30" r="22"/><circle cx="73" cy="48" r="19"/><circle cx="40" cy="64" r="20"/><circle cx="63" cy="68" r="18"/><circle cx="50" cy="48" r="23" stroke="none"/></g>
  <ellipse cx="28" cy="36" rx="5" ry="3" fill="#FFD93D"/><ellipse cx="70" cy="62" rx="5" ry="3" fill="#FFD93D"/>
  <circle cx="42" cy="48" r="3.6" fill="#40205F"/><circle cx="60" cy="48" r="3.6" fill="#40205F"/>${mouth}<circle cx="35" cy="56" r="4" fill="#FF69B4" opacity=".6"/><circle cx="67" cy="56" r="4" fill="#FF69B4" opacity=".6"/></svg>`;
}

