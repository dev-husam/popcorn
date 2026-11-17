'use strict';
/* ------------------------------ Util ------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[secureInt(arr.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#8B5CF6', '#FF69B4', '#FFD93D', '#FF9F43', '#4DCCF5', '#6EE7B7', '#E8344E'];

function secureInt(n) {            // unbiased cryptographic random integer in [0, n)
  if (n <= 1) return 0;
  const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % n;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = secureInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmtDate = ts => { try { return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }).format(ts); } catch { return new Date(ts).toLocaleString(); } };

