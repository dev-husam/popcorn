'use strict';
/* ------------------------------ Students ------------------------------ */
const Students = {
  parse(text) {
    const seen = new Set();
    return String(text).split(/[\r\n,،;؛\t]+/).map(n => n.replace(/[\u0000-\u001f\u007f‎‏‪-‮]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(n => {
      if (!n) return false; const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true;
    });
  },
  add(text) {
    const names = this.parse(text); if (!names.length) { UI.toast('اكتب اسماً أولاً ✏️'); return 0; }
    const have = new Set(S.students.map(s => s.name.toLowerCase())); let added = 0, dup = 0, full = false;
    for (const n of names) {
      if (have.has(n.toLowerCase())) { dup++; continue; }
      if (S.students.length >= 300) { full = true; break; }
      S.students.push({ id: uid(), name: n, emoji: pick(EMOJIS) }); have.add(n.toLowerCase()); added++;
    }
    this.changed();
    UI.toast(added ? `تمت إضافة ${added} ${added === 1 ? 'طالب' : 'طلاب'} 🎉${dup ? ` (تم تجاهل ${dup} مكرر)` : ''}` : dup ? 'هذا الاسم موجود مسبقاً 🙂' : 'لم تتم إضافة أي اسم');
    if (full) UI.toast('وصلنا للحد الأقصى: 300 طالب');
    return added;
  },
  remove(id) { S.students = S.students.filter(s => s.id !== id); this.changed(); },
  rename(id, val) {
    const n = this.parse(val)[0]; if (!n) { UI.toast('الاسم لا يمكن أن يكون فارغاً'); return; }
    if (S.students.some(s => s.id !== id && s.name.toLowerCase() === n.toLowerCase())) { UI.toast('هذا الاسم موجود مسبقاً 🙂'); return; }
    const s = S.students.find(x => x.id === id); if (s) s.name = n; editingId = null; this.changed();
  },
  changed() { const ids = new Set(S.students.map(s => s.id)); S.used = S.used.filter(i => ids.has(i)); Store.save(); UI.renderStudents(); UI.renderMain(); }
};

