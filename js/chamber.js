'use strict';
/* ------------------------------ Chamber (kernels inside glass) ------------------------------ */
const Chamber = {
  cv: $('#chamber'), ctx: null, W: 284, H: 260, k: [], spawned: 0, fill: 0, raf: 0, last: 0, shake: 0, scale: 1,
  init() { this.ctx = this.cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()); },
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2), w = this.cv.clientWidth, h = this.cv.clientHeight; if (!w || !h) return;
    this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); this.scale = this.cv.width / this.W;
  },
  reset() { this.k = []; this.spawned = 0; this.fill = 8; this.shake = 0; this.draw(); },
  newK(popped) {
    return { x: 142 + rand(-30, 30), y: rand(60, 85), vx: rand(-170, 170), vy: rand(-380, -60), r: rand(6.5, 9), rot: rand(0, 6), vr: rand(-6, 6), frac: Math.random(), popped: !!popped, pop: popped ? 1 : 0, face: Math.random() < 0.8 };
  },
  spawnTo(total) { while (this.spawned < total) { this.k.push(this.newK(false)); this.spawned++; } this.run(); },
  addPopcorn(n) { for (let i = 0; i < n; i++) { const k = this.newK(true); k.pop = 0.3; k.r = rand(7, 9); this.k.push(k); } this.run(); },
  popFraction(f) { const un = this.k.filter(k => !k.popped); const target = Math.floor(this.k.length * clamp(f, 0, 1)); let have = this.k.length - un.length; for (const k of un) { if (have >= target) break; k.popped = true; k.pop = 0; k.vy = -rand(180, 380); k.vx += rand(-80, 80); have++; } this.run(); },
  setFill(v) { this.fill = v; },
  run() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } },
  loop(t) {
    const dt = Math.min(0.04, (t - this.last) / 1000); this.last = t;
    for (const k of this.k) {
      k.vy += 900 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.rot += k.vr * dt; if (k.popped && k.pop < 1) k.pop = Math.min(1, k.pop + dt * 3.2);
      const rad = k.r * (k.popped ? 1 + 1.2 * k.pop : 1), floor = this.H - 4 - rad - k.frac * this.fill;
      if (k.x < rad) { k.x = rad; k.vx = Math.abs(k.vx) * 0.7; } else if (k.x > this.W - rad) { k.x = this.W - rad; k.vx = -Math.abs(k.vx) * 0.7; }
      if (k.y > floor) { k.y = floor; k.vy = -Math.abs(k.vy) * 0.5; k.vx *= 0.8; k.vr *= 0.8; if (Math.abs(k.vy) < 40) k.vy = 0; }
      if (this.shake && k.y >= floor - 1 && Math.random() < dt * 5 * this.shake) k.vy = -rand(60, 160) * this.shake;
    }
    this.draw();
    this.raf = this.k.length ? requestAnimationFrame(t2 => this.loop(t2)) : 0;
  },
  draw() {
    const c = this.ctx; if (!c) return; c.setTransform(this.scale, 0, 0, this.scale, 0, 0); c.clearRect(0, 0, this.W, this.H);
    for (const k of this.k) {
      c.save(); c.translate(k.x, k.y); c.rotate(k.rot);
      if (k.popped) { const s = k.r * (1 + 1.2 * k.pop) * 1.15; drawPuff(c, s, k.face); }
      else {
        c.fillStyle = '#FFD93D'; c.strokeStyle = '#D89200'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, k.r, k.r * 1.2, 0, 0, 6.283); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-k.r * .35, -k.r * .5, k.r * .22, k.r * .38, .5, 0, 6.283); c.fill();
        if (k.face) { c.fillStyle = '#40205F'; c.beginPath(); c.arc(-k.r * .32, 0, k.r * .14, 0, 6.283); c.arc(k.r * .32, 0, k.r * .14, 0, 6.283); c.fill(); c.strokeStyle = '#40205F'; c.lineWidth = 1; c.beginPath(); c.arc(0, k.r * .15, k.r * .3, .2, Math.PI - .2); c.stroke(); }
      }
      c.restore();
    }
  },
  /** page-space centre + all piece positions, then empties the chamber */
  explode() {
    const r = this.cv.getBoundingClientRect(), s = r.width / this.W, out = this.k.map(k => ({ x: r.left + k.x * s, y: r.top + k.y * s, popped: k.popped }));
    this.k = []; this.draw(); return { rect: r, pieces: out };
  }
};

