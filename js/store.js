'use strict';
/* ------------------------------ Store ------------------------------ */
const EMOJIS = ['🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🦄', '🐙', '🦋', '🐢', '🐬', '🦉', '🐧', '🐥', '🦖', '🐞', '🌟', '🚀', '⚽', '🎨'];
const DEFAULTS = { removeSelected: true, allowDuplicates: false, winners: 1, speed: 'normal', sound: true, music: false, autoCelebrate: true, muted: false, sfxVol: 0.8, musicVol: 0.5 };
const S = { students: [], used: [], history: [], drawCount: 0, settings: { ...DEFAULTS } };
const Store = {
  key: 'popcorn-classroom-v1',
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (!d || typeof d !== 'object') return;
      if (Array.isArray(d.students)) S.students = d.students.filter(s => s && typeof s.name === 'string' && s.name.trim()).map(s => ({ id: String(s.id || uid()), name: s.name.trim().slice(0, 40), emoji: typeof s.emoji === 'string' ? s.emoji : pick(EMOJIS) }));
      if (Array.isArray(d.used)) S.used = d.used.map(String);
      if (Array.isArray(d.history)) S.history = d.history.filter(h => h && typeof h.name === 'string').map(h => ({ id: String(h.id || uid()), name: h.name, draw: +h.draw || 0, time: +h.time || Date.now() }));
      S.drawCount = Number.isFinite(+d.drawCount) ? +d.drawCount : 0;
      const st = d.settings || {};
      for (const k of ['removeSelected', 'allowDuplicates', 'sound', 'music', 'autoCelebrate', 'muted']) if (typeof st[k] === 'boolean') S.settings[k] = st[k];
      if ([1, 2, 3, 5].includes(+st.winners)) S.settings.winners = +st.winners;
      if (['slow', 'normal', 'fast'].includes(st.speed)) S.settings.speed = st.speed;
      for (const k of ['sfxVol', 'musicVol']) if (Number.isFinite(+st[k])) S.settings[k] = clamp(+st[k], 0, 1);
    } catch (e) { /* corrupted storage: start fresh */ }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
};

