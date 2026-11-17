'use strict';
/* ------------------------------ Sound ------------------------------ */
const Sound = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null, heat: null, music: { timer: 0, step: 0, next: 0, on: false },
  ready() { return !!this.ctx; },
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
        this.mus = this.ctx.createGain(); this.mus.connect(this.master);
        const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.sync();
    } catch (e) { /* audio unsupported */ }
  },
  on() { return this.ctx && S.settings.sound && !S.settings.muted; },
  sync() {
    if (!this.ctx) return;
    const st = S.settings, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(st.muted ? 0 : 1, t, 0.02);
    this.sfx.gain.setTargetAtTime(st.sound ? st.sfxVol : 0, t, 0.02);
    this.mus.gain.setTargetAtTime(st.music ? st.musicVol * 0.45 : 0, t, 0.05);
    if (st.music && !st.muted) this.musicStart(); else this.musicStop();
    if (!this.on()) this.heatStop();
  },
  tone(f, dur, o = {}) {
    if (!this.on()) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    const v = o.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.out || this.sfx); osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(dur, o = {}) {
    if (!this.on()) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true;
    f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 1;
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t + (o.attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  },
  click() { this.tone(660, 0.07, { type: 'square', vol: 0.12 }); this.tone(990, 0.09, { type: 'triangle', vol: 0.18, delay: 0.05 }); },
  pop() {
    const f = rand(900, 2600);
    this.noise(0.06, { type: 'bandpass', freq: f, q: 1.5, vol: rand(0.18, 0.35) });
    this.tone(rand(260, 520), 0.09, { type: 'sine', vol: 0.18, slide: 120 });
  },
  sparkle() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.28, { type: 'sine', vol: 0.13, delay: i * 0.055 })); },
  rumble(dur) {
    this.noise(dur, { freq: 90, freqEnd: 260, vol: 0.35, attack: dur * 0.5 });
    this.tone(55, dur, { type: 'sawtooth', vol: 0.12, slide: 110, attack: dur * 0.6 });
  },
  whoosh() { this.noise(1.1, { type: 'bandpass', freq: 300, freqEnd: 3500, q: 2, vol: 0.28, attack: 0.5 }); },
  explosion() {
    this.noise(1.3, { freq: 5000, freqEnd: 60, vol: 0.7, attack: 0.01 });
    this.tone(150, 0.9, { type: 'sine', vol: 0.7, slide: 28 });
    this.tone(90, 0.7, { type: 'square', vol: 0.18, slide: 30 });
    setTimeout(() => this.sparkle(), 250);
  },
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, i === 6 ? 0.9 : 0.2, { type: 'square', vol: 0.12, delay: i * 0.13 })); },
  victory() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { this.tone(f, 0.45, { type: 'triangle', vol: 0.25, delay: i * 0.11 }); this.tone(f * 2, 0.3, { type: 'sine', vol: 0.08, delay: i * 0.11 }); });
    [1047, 1319, 1568].forEach(f => this.tone(f, 1.2, { type: 'triangle', vol: 0.18, delay: 0.7 }));
    this.noise(0.5, { type: 'highpass', freq: 5000, vol: 0.12, delay: 0.7 });
  },
  clap() { for (let i = 0; i < 14; i++) this.noise(0.07, { type: 'bandpass', freq: rand(1200, 2600), q: 0.8, vol: 0.3, delay: i * rand(0.07, 0.12) }); },
  heatStart() {
    if (!this.on() || this.heat) return;
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(250, c.currentTime); f.frequency.linearRampToValueAtTime(1400, c.currentTime + 6);
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(0.16, c.currentTime + 1);
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(); this.heat = { src, g };
  },
  heatStop() {
    if (!this.heat) return; const { src, g } = this.heat; this.heat = null;
    try { g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08); src.stop(this.ctx.currentTime + 0.4); } catch (e) { /* already stopped */ }
  },
  /* Original cheerful loop: C – Am – F – G, 132 bpm */
  musicStart() {
    const m = this.music; if (m.on || !this.ctx) return; m.on = true; m.next = this.ctx.currentTime + 0.1;
    m.timer = setInterval(() => this.musicTick(), 100);
  },
  musicStop() { const m = this.music; if (!m.on) return; m.on = false; clearInterval(m.timer); },
  musicTick() {
    const m = this.music, c = this.ctx, eighth = 60 / 132 / 2;
    const mel = [[76, -1, 72, 74, 76, -1, 79, -1], [76, -1, 72, 69, 72, -1, 76, -1], [77, -1, 74, 72, 69, -1, 72, -1], [74, -1, 71, 74, 79, -1, 74, -1]];
    const chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bass = [48, 45, 41, 43];
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    while (m.next < c.currentTime + 0.3) {
      const bar = Math.floor(m.step / 8) % 4, s = m.step % 8, t = m.next - c.currentTime;
      const note = mel[bar][s];
      if (note > 0) this.mtone(hz(note), eighth * 1.7, 'square', 0.1, t);
      this.mtone(hz(chords[bar][s % 3] + 12), eighth * 0.9, 'triangle', 0.09, t);
      if (s % 4 === 0) this.mtone(hz(bass[bar]), eighth * 3, 'triangle', 0.3, t);
      if (s % 2 === 1) this.mnoise(eighth * 0.3, t);
      m.next += eighth; m.step++;
    }
  },
  mtone(f, dur, type, vol, delay) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + dur + 0.05);
  },
  mnoise(dur, delay) {
    const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
};

