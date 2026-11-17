'use strict';
/* ------------------------------ Fx (full-screen particles) ------------------------------ */
const Fx = {
  cv: $('#fx'), ctx: null, parts: [], raf: 0, last: 0, w: 0, h: 0, timers: [],
  init() { this.ctx = this.cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()); },
  resize() { const d = Math.min(devicePixelRatio || 1, 2); this.w = innerWidth; this.h = innerHeight; this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); },
  add(p) { if (this.parts.length > 650) this.parts.shift(); this.parts.push(p); if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } },
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; const c = this.ctx; c.clearRect(0, 0, this.w, this.h);
    this.parts = this.parts.filter(p => {
      p.life -= dt; if (p.life <= 0 || p.y > this.h + 80 || p.y < -400) return false;
      p.vx *= 1 - (p.drag || 0) * dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt; p.t = (p.t || 0) + dt;
      c.save(); c.globalAlpha = clamp(p.life / (p.fade || 0.4), 0, 1); c.translate(p.x + (p.wob ? Math.sin(p.t * 6 + p.rot) * p.wob : 0), p.y); c.rotate(p.rot); this.draw(c, p); c.restore(); return true;
    });
    this.raf = this.parts.length ? requestAnimationFrame(t2 => this.loop(t2)) : 0;
  },
  draw(c, p) {
    const s = p.size;
    switch (p.type) {
      case 'confetti': c.fillStyle = p.color; c.fillRect(-s / 2, -s / 3, s, s * 0.6); break;
      case 'star': c.fillStyle = p.color; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.4 : s, a = i * Math.PI / 5; c.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } c.closePath(); c.fill(); break;
      case 'spark': c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 10; c.beginPath(); c.arc(0, 0, s * 0.4, 0, 6.283); c.fill(); break;
      case 'puff': drawPuff(c, s, p.face); break;
      case 'emoji': c.font = `${s}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.ch, 0, 0); break;
    }
  },
  mk(o) { return Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 2, rot: 0, vr: 0, size: 10, type: 'confetti', color: pick(COLORS), drag: 0 }, o); },
  burst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283), sp = rand(o.min || 150, o.max || 700), type = pick(o.types || ['confetti', 'star', 'spark']);
      this.add(this.mk({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.g ?? 900, life: rand(1.2, 2.6), size: type === 'puff' ? rand(14, 26) : rand(8, 18), type, vr: rand(-9, 9), drag: 0.8, face: Math.random() < 0.5, fade: 0.5 }));
    }
  },
  rain(n, o = {}) {
    for (let i = 0; i < n; i++) this.add(this.mk({ x: rand(0, this.w), y: rand(-40, -10), vx: rand(-60, 60), vy: rand(120, 320), g: 40, life: rand(3, 6), size: rand(9, 16), type: o.type || pick(['confetti', 'confetti', 'star']), vr: rand(-6, 6), wob: rand(10, 30), fade: 0.6, ch: o.ch }));
  },
  emojiRise(ch, n) { for (let i = 0; i < n; i++) this.add(this.mk({ x: rand(0, this.w), y: this.h + rand(10, 80), vx: rand(-40, 40), vy: rand(-520, -280), g: 160, life: rand(1.8, 3), size: rand(34, 64), type: 'emoji', ch, vr: rand(-1, 1), fade: 0.6 })); },
  every(ms, fn) { const id = setInterval(fn, ms); this.timers.push(id); return id; },
  stopTimers() { this.timers.forEach(clearInterval); this.timers = []; },
  clear() { this.stopTimers(); this.parts = []; }
};
const PUFF = [[-.5, .1, .7], [.5, .1, .7], [0, -.5, .8], [-.25, .5, .6], [.38, .5, .55], [0, 0, .85]];
function drawPuff(c, s, face) {
  c.fillStyle = '#FFF8E7'; c.strokeStyle = '#EFC06A'; c.lineWidth = Math.max(1.4, s * 0.12);
  for (const p of PUFF) { c.beginPath(); c.arc(p[0] * s, p[1] * s, p[2] * s * 0.62, 0, 6.283); c.fill(); c.stroke(); }
  c.lineWidth = 0; for (const p of PUFF) { c.beginPath(); c.arc(p[0] * s, p[1] * s, p[2] * s * 0.6, 0, 6.283); c.fill(); }
  c.fillStyle = '#FFD93D'; c.beginPath(); c.arc(-.4 * s, -.1 * s, s * 0.13, 0, 6.283); c.arc(.45 * s, .45 * s, s * 0.11, 0, 6.283); c.fill();
  if (face) { c.fillStyle = '#40205F'; c.beginPath(); c.arc(-.22 * s, 0, s * 0.09, 0, 6.283); c.arc(.22 * s, 0, s * 0.09, 0, 6.283); c.fill(); c.strokeStyle = '#40205F'; c.lineWidth = Math.max(1, s * 0.07); c.beginPath(); c.arc(0, .12 * s, s * 0.2, 0.2, Math.PI - 0.2); c.stroke(); }
}

