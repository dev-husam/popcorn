'use strict';
/* ------------------------------ Teams: random balanced groups ------------------------------ */
const Teams = {
  n: 2, result: [],
  COLORS: ['#ffd1e8', '#c4f0ff', '#fff0a8', '#c7f7e3', '#e4d4ff', '#ffdcb0', '#ffc4c4', '#d8f5a8'],
  NAMES: ['الصقور', 'النمور', 'النجوم', 'الأسود', 'الدلافين', 'الفهود', 'الصواريخ', 'الفراشات'],
  ICONS: ['🦅', '🐯', '⭐', '🦁', '🐬', '🐆', '🚀', '🦋'],
  max() { return clamp(S.present.length, 2, 8); },
  setN(v) { this.n = clamp(v, 2, this.max()); $('#teamCount').textContent = this.n; },
  open() {
    this.setN(this.n); this.result = []; $('#teamGrid').textContent = '';
    $('#teamHint').textContent = `الطلاب الحاضرون: ${S.present.length} (يتم استبعاد الغائبين تلقائياً).`;
    UI.open('#teamsModal');
  },
  make() {
    const people = shuffle(S.present);
    if (people.length < 2) return UI.toast('نحتاج طالبين حاضرين على الأقل');
    this.setN(this.n);
    const names = shuffle(this.NAMES.map((n, i) => [n, this.ICONS[i]]));
    this.result = Array.from({ length: this.n }, (_, i) => ({ name: names[i][0], icon: names[i][1], members: [] }));
    people.forEach((s, i) => this.result[i % this.n].members.push(s));
    this.render(); Sound.sparkle(); Fx.burst(innerWidth / 2, innerHeight / 3, 40, { min: 200, max: 700, up: 200 });
  },
  render() {
    const g = $('#teamGrid'); g.textContent = '';
    this.result.forEach((t, i) => {
      const c = document.createElement('div'); c.className = 'team'; c.style.setProperty('--c', this.COLORS[i % 8]); c.style.animationDelay = (i * 0.12) + 's';
      const h = document.createElement('h3'); h.textContent = `${t.icon} فريق ${t.name} (${t.members.length})`; c.appendChild(h);
      const ul = document.createElement('ul');
      t.members.forEach(m => { const li = document.createElement('li'); li.textContent = `${m.emoji} ${m.name}`; ul.appendChild(li); });
      c.appendChild(ul); g.appendChild(c);
    });
  },
  async copy() {
    if (!this.result.length) return UI.toast('وزّعي الطلاب أولاً');
    const txt = this.result.map(t => `${t.icon} فريق ${t.name}\n` + t.members.map(m => '- ' + m.name).join('\n')).join('\n\n');
    try { await navigator.clipboard.writeText(txt); } catch (e) {
      const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      document.body.removeChild(a);
    }
    UI.toast('📋 تم نسخ الفرق');
  }
};
