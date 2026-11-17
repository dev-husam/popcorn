'use strict';
/* ------------------------------ Extras: classes, teams, fullscreen, shortcuts ------------------------------ */
function switchClass(id) { S.active = id; editingId = null; Store.save(); UI.renderAll(); }

function bindClasses() {
  [$('#classSelect'), $('#classSelect2')].forEach(sel => sel.addEventListener('change', () => switchClass(sel.value)));
  $('#btnClsNew').addEventListener('click', async () => {
    const n = await UI.ask('اسم الصف الجديد', ''); if (!n) return;
    if (S.classes.length >= 12) return UI.toast('الحد الأقصى 12 صفاً');
    const c = newClass(n); S.classes.push(c); switchClass(c.id); UI.toast('تم إنشاء الصف 🏫');
  });
  $('#btnClsRename').addEventListener('click', async () => {
    const n = await UI.ask('اسم الصف', S.cls.name); if (!n) return;
    S.cls.name = n; Store.save(); UI.renderClasses();
  });
  $('#btnClsDel').addEventListener('click', async () => {
    if (S.classes.length < 2) return UI.toast('لا يمكن حذف الصف الوحيد');
    if (!await UI.confirm(`حذف الصف «${S.cls.name}» وكل طلابه؟`, 'نعم، احذف')) return;
    S.classes = S.classes.filter(c => c.id !== S.active); switchClass(S.classes[0].id);
  });
  $('#btnAbsentAll').addEventListener('click', () => { S.students.forEach(s => { s.absent = false; }); Students.changed(); UI.toast('✅ الجميع حاضر'); });
  $('#btnResetWins').addEventListener('click', async () => {
    if (await UI.confirm('تصفير عدّاد الفوز لهذا الصف؟', 'نعم')) { S.students.forEach(s => { s.wins = 0; }); Students.changed(); UI.toast('🏅 تم التصفير'); }
  });
}

function bindTeams() {
  $('#btnTeams').addEventListener('click', () => Teams.open());
  $('#teamPlus').addEventListener('click', () => { Teams.setN(Teams.n + 1); if (Teams.result.length) Teams.make(); });
  $('#teamMinus').addEventListener('click', () => { Teams.setN(Teams.n - 1); if (Teams.result.length) Teams.make(); });
  $('#btnMakeTeams').addEventListener('click', () => Teams.make());
  $('#btnCopyTeams').addEventListener('click', () => Teams.copy());
}

const Fullscreen = {
  el: document.documentElement,
  can: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
  is() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
  toggle() {
    try {
      if (this.is()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (this.el.requestFullscreen || this.el.webkitRequestFullscreen).call(this.el);
    } catch (e) { /* denied */ }
  },
  bind() {
    const b = $('#btnFull'); b.hidden = !this.can; b.addEventListener('click', () => this.toggle());
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
      b.textContent = this.is() ? '🗗' : '⛶'; setTimeout(() => { Chamber.resize(); Fx.resize(); }, 150);
    }));
  }
};

function bindShortcuts() {
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;
    if ($$('.modal').some(m => !m.hidden)) return;
    const k = e.key.toLowerCase();
    if (!$('#winner').hidden) { if (k === 'escape') closeWinner(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startDraw(); }
    else if (k === 'f' || k === 'ب') Fullscreen.toggle();
    else if (k === 'm' || k === 'ة') $('#btnMute').click();
    else if ((k === 't' || k === 'ف') && !busy) Teams.open();
  });
}

function bindExtras() { bindClasses(); bindTeams(); Fullscreen.bind(); bindShortcuts(); }
