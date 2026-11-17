'use strict';
/* ------------------------------ Store: state + persistence ------------------------------ */
const EMOJIS = ['🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🦄', '🐙', '🦋', '🐢', '🐬', '🦉', '🐧', '🐥', '🦖', '🐞', '🌟', '🚀', '⚽', '🎨'];
const THEMES = ['candy', 'ocean', 'sunset', 'forest'];
const DEFAULTS = { removeSelected: true, allowDuplicates: false, winners: 1, speed: 'normal', sound: true, music: false, autoCelebrate: true, muted: false, sfxVol: 0.8, musicVol: 0.5, theme: 'candy' };
const THEME_COLORS = { candy: '#8B5CF6', ocean: '#0e7fc0', sunset: '#d9486b', forest: '#2f9e6f' };
const newClass = (name = 'صفّي') => ({ id: uid(), name, students: [], used: [] });

/** App state. `students` / `used` are views onto the active class. */
const S = {
  classes: [], active: '', history: [], drawCount: 0, settings: { ...DEFAULTS },
  get cls() { return this.classes.find(c => c.id === this.active) || this.classes[0]; },
  get students() { return this.cls.students; }, set students(v) { this.cls.students = v; },
  get used() { return this.cls.used; }, set used(v) { this.cls.used = v; },
  get present() { return this.cls.students.filter(s => !s.absent); },
  toJSON() { return { classes: this.classes, active: this.active, history: this.history, drawCount: this.drawCount, settings: this.settings }; }
};

const Store = {
  key: 'popcorn-classroom-v1',
  cleanStudent: s => ({ id: String(s.id || uid()), name: String(s.name).trim().slice(0, 40), emoji: typeof s.emoji === 'string' ? s.emoji : pick(EMOJIS), absent: !!s.absent, wins: Math.max(0, +s.wins || 0) }),
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { /* corrupted: start fresh */ }
    if (d && typeof d === 'object') {
      const raw = Array.isArray(d.classes) ? d.classes : (Array.isArray(d.students) ? [{ name: 'صفّي', students: d.students, used: d.used }] : []);   // v1 → v2 migration
      S.classes = raw.filter(c => c && Array.isArray(c.students)).map(c => ({
        id: String(c.id || uid()), name: String(c.name || 'صفّي').slice(0, 30),
        students: c.students.filter(s => s && typeof s.name === 'string' && s.name.trim()).map(this.cleanStudent),
        used: Array.isArray(c.used) ? c.used.map(String) : []
      }));
      if (Array.isArray(d.history)) S.history = d.history.filter(h => h && typeof h.name === 'string').map(h => ({ id: String(h.id || uid()), name: h.name, cls: h.cls ? String(h.cls) : '', draw: +h.draw || 0, time: +h.time || Date.now() }));
      S.drawCount = Number.isFinite(+d.drawCount) ? +d.drawCount : 0;
      S.active = String(d.active || '');
      const st = d.settings || {};
      for (const k of ['removeSelected', 'allowDuplicates', 'sound', 'music', 'autoCelebrate', 'muted']) if (typeof st[k] === 'boolean') S.settings[k] = st[k];
      if ([1, 2, 3, 5].includes(+st.winners)) S.settings.winners = +st.winners;
      if (['slow', 'normal', 'fast'].includes(st.speed)) S.settings.speed = st.speed;
      if (THEMES.includes(st.theme)) S.settings.theme = st.theme;
      for (const k of ['sfxVol', 'musicVol']) if (Number.isFinite(+st[k])) S.settings[k] = clamp(+st[k], 0, 1);
    }
    if (!S.classes.length) S.classes = [newClass()];
    if (!S.classes.some(c => c.id === S.active)) S.active = S.classes[0].id;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
};
