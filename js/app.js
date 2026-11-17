'use strict';
/* ------------------------------ Wiring ------------------------------ */
function applySetting(k, v) {
  S.settings[k] = v; Store.save(); UI.syncControls(); Sound.sync();
  if (k === 'removeSelected' || k === 'allowDuplicates') { UI.renderMain(); UI.renderStudents(); }
}
function bind() {
  startBtn.addEventListener('click', startDraw);
  $('#btnSettings').addEventListener('click', () => { UI.open('#settingsModal'); UI.renderStudents(); UI.syncControls(); });
  $('#btnAddFromEmpty').addEventListener('click', () => { UI.open('#settingsModal'); UI.tab('students'); setTimeout(() => $('#nameInput').focus(), 50); });
  $('#btnHistory').addEventListener('click', () => { UI.renderHistory(); UI.open('#historyModal'); });
  $('#btnOpenHistory').addEventListener('click', () => { UI.renderHistory(); UI.open('#historyModal'); });
  $('#btnSoundPanel').addEventListener('click', () => { UI.syncControls(); UI.open('#soundModal'); });
  const toggleMute = () => { Sound.unlock(); applySetting('muted', !S.settings.muted); };
  $('#btnMute').addEventListener('click', toggleMute); $('#btnMute2').addEventListener('click', toggleMute);
  $('#btnTestSound').addEventListener('click', () => { Sound.unlock(); Sound.pop(); setTimeout(() => Sound.sparkle(), 250); });
  $$('.modal').forEach(m => { m.addEventListener('mousedown', e => { if (e.target === m && m.id !== 'confirmModal') m.hidden = true; }); $$('[data-close]', m).forEach(b => b.addEventListener('click', () => { m.hidden = true; })); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { const open = $$('.modal').filter(m => !m.hidden).pop(); if (open) { if (open.id === 'confirmModal') $('#confirmNo').click(); else open.hidden = true; } } });
  $$('.tab').forEach(t => t.addEventListener('click', () => UI.tab(t.dataset.tab)));
  // settings controls
  document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.set) applySetting(t.dataset.set, t.checked); });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.range) { Sound.unlock(); applySetting(t.dataset.range, clamp(+t.value / 100, 0, 1)); } });
  $$('[data-seg]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = g.dataset.seg; applySetting(k, k === 'winners' ? +b.dataset.val : b.dataset.val); }));
  // global click sound for buttons (start button handles its own)
  document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b !== startBtn && !b.disabled) Sound.click(); });
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => Sound.unlock(), { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!Sound.ctx) return; if (document.hidden) Sound.ctx.suspend(); else if (!S.settings.muted) Sound.ctx.resume(); });
  // students
  const input = $('#nameInput'), add = () => { if (Students.add(input.value)) { input.value = ''; } input.focus(); };
  $('#btnAdd').addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); add(); } });
  $('#search').addEventListener('input', () => UI.renderStudents());
  $('#btnShuffle').addEventListener('click', () => { S.students = shuffle(S.students); Store.save(); UI.renderStudents(); UI.toast('🔀 تمت إعادة ترتيب الأسماء'); });
  $('#btnClearAll').addEventListener('click', async () => { if (!S.students.length) return UI.toast('القائمة فارغة بالفعل'); if (await UI.confirm('هل تريدين حذف جميع الأسماء؟ لا يمكن التراجع!', 'نعم، احذف الكل')) { S.students = []; S.used = []; Store.save(); UI.renderStudents(); UI.renderMain(); UI.toast('تم حذف جميع الأسماء'); } });
  $('#btnImport').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 1024 * 1024) return UI.toast('الملف كبير جداً');
    const rd = new FileReader(); rd.onload = () => { const n = Students.add(String(rd.result).replace(/^﻿/, '')); if (!n) UI.toast('لم يتم العثور على أسماء جديدة في الملف'); }; rd.onerror = () => UI.toast('تعذّرت قراءة الملف'); rd.readAsText(f, 'utf-8');
  });
  $('#btnExport').addEventListener('click', () => {
    if (!S.students.length) return UI.toast('لا توجد أسماء للتصدير');
    const blob = new Blob(['﻿' + S.students.map(s => s.name).join('\n')], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'students.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); UI.toast('📤 تم تصدير القائمة');
  });
  // teacher tools
  $('#btnResetDraw').addEventListener('click', async () => { if (await UI.confirm('إعادة جميع الطلاب إلى قائمة السحب؟', 'نعم، أعد الضبط')) { S.used = []; Store.save(); UI.renderMain(); UI.renderStudents(); UI.toast('🔄 تمت إعادة ضبط السحب'); } });
  $('#btnResetSettings').addEventListener('click', async () => { if (await UI.confirm('إعادة الإعدادات إلى الوضع الافتراضي؟', 'نعم')) { S.settings = { ...DEFAULTS }; Store.save(); UI.renderAll(); Sound.sync(); UI.toast('تمت إعادة ضبط الإعدادات'); } });
  $('#btnClearHist').addEventListener('click', async () => { if (!S.history.length) return UI.toast('السجل فارغ بالفعل'); if (await UI.confirm('هل تريدين مسح سجل الفائزين؟', 'نعم، امسح')) { S.history = []; S.drawCount = 0; Store.save(); UI.renderHistory(); UI.toast('تم مسح السجل'); } });
  // winner screen
  $('#btnBack').addEventListener('click', closeWinner);
  $('#btnAgain').addEventListener('click', () => { closeWinner(); setTimeout(startDraw, 250); });
  $$('[data-celeb]').forEach(b => b.addEventListener('click', () => Celebrate[b.dataset.celeb]()));
}

/* ------------------------------ Background decor ------------------------------ */
function buildBg() {
  const bg = $('#bg');
  for (let i = 0; i < 6; i++) { const c = document.createElement('div'); c.className = 'cloud'; const w = rand(110, 220); c.style.cssText = `width:${w}px;height:${w * .32}px;top:${rand(4, 70)}%;animation-duration:${rand(55, 110)}s;animation-delay:${-rand(0, 100)}s;opacity:${rand(.45, .85)}`; bg.appendChild(c); }
  for (let i = 0; i < 14; i++) { const f = document.createElement('div'); f.className = 'floaty'; f.textContent = pick(['🍿', '🍿', '⭐', '✨', '🎈']); f.style.cssText = `left:${rand(0, 96)}%;bottom:-60px;font-size:${rand(20, 44)}px;animation-duration:${rand(14, 28)}s;animation-delay:${-rand(0, 28)}s`; bg.appendChild(f); }
  for (let i = 0; i < 16; i++) { const t = document.createElement('div'); t.className = 'twinkle'; t.textContent = '★'; t.style.cssText = `left:${rand(0, 98)}%;top:${rand(0, 96)}%;font-size:${rand(14, 30)}px;animation-delay:${rand(0, 2.4)}s`; bg.appendChild(t); }
}

/* ------------------------------ Boot ------------------------------ */
Store.load(); Fx.init(); Chamber.init(); buildBg(); bind(); PWA.bind(); bindExtras(); UI.renderAll();
addEventListener('resize', () => { Chamber.resize(); });
