/* Environment renderer.
 * The original built hundreds of absolutely positioned <div>s with jQuery;
 * here everything is drawn on one <canvas>, which keeps mobile smooth.
 * Effects keep the original look: square stars, 1px rain, round snow,
 * thin translucent cloud bands, wide fog bands and thunder flashes.
 */

import { hexToRgb } from './palette.js';

const REF_AREA = 1440 * 900;

export function createScene(canvas, getAnchor) {
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let W = 0, H = 0, dpr = 1;
  let state = null;
  let layers = null;
  let raf = 0;
  let last = 0;
  let born = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state) build(false);
  }

  function scale(n) {
    const f = Math.min(Math.max((W * H) / REF_AREA, 0.45), 1.6);
    return Math.round((n || 0) * f);
  }

  function build(fade = true) {
    const fx = state.fx;
    const anchor = getAnchor();
    const timeRgb = hexToRgb(state.timeColor).join(',');

    layers = {
      stars: Array.from({ length: scale(state.stars) }, (_, i) => ({
        x: rand(0, W), y: rand(0, H / 3),
        s: rand(1, 4) | 0,
        a: i % 2 ? rand(0.1, 1) : rand(0.05, 0.5),
        rgb: i % 2 ? '255,255,255' : timeRgb,
        phase: rand(0, Math.PI * 2),
      })),
      clouds: Array.from({ length: fx.clouds || 0 }, (_, i) => ({
        y: rand(anchor.top, anchor.bottom),
        h: rand(1, 30),
        a: rand(0.01, 0.08),
        phase: i,
      })),
      fog: Array.from({ length: fx.fog || 0 }, (_, i) => ({
        y: rand(H / 2, Math.max(H / 2 + 1, H - 300)),
        h: rand(100, 450),
        a: rand(0.01, 0.07),
        phase: i,
      })),
      rain: Array.from({ length: scale(fx.rain) }, () => ({
        x: rand(-W * 0.3, W), y: rand(-H, H),
        len: rand(5, 11), v: rand(900, 1500),
      })),
      snow: Array.from({ length: scale(fx.snow) }, () => ({
        x: rand(0, W), y: rand(-H, H),
        r: rand(0.5, 2.2), v: rand(35, 90),
        phase: rand(0, Math.PI * 2),
      })),
      wind: Array.from({ length: scale(fx.wind) }, () => ({
        x: rand(-W, W), y: rand(0, H),
        len: rand(60, 220), v: rand(500, 1100), a: rand(0.04, 0.14),
      })),
      // [cycle s, delay s] from the original thunder keyframes
      thunder: [[3, 0], [10.5, 8.5], [6.2, 20.2], [7.4, 4.1]].slice(0, fx.thunder || 0),
    };
    born = fade ? performance.now() : 0;
  }

  function frame(t) {
    const dt = Math.min((t - (last || t)) / 1000, 0.05);
    last = t;
    draw(t / 1000, dt);
    raf = requestAnimationFrame(frame);
  }

  function draw(time, dt) {
    ctx.clearRect(0, 0, W, H);
    if (!layers) return;
    const fade = born ? Math.min((performance.now() - born) / 900, 1) : 1;
    const fx = state.fx;
    const still = reduceMotion.matches;

    // Stars - square, twinkling as a group like the original
    const twinkle = still ? 1 : 0.75 + 0.25 * Math.sin(time * 1.3);
    for (const s of layers.stars) {
      const a = s.a * fade * (still ? 1 : twinkle * (0.8 + 0.2 * Math.sin(time * 2 + s.phase)));
      ctx.fillStyle = `rgba(${s.rgb},${a})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Cloud bands crossing the sun / moon
    for (const c of layers.clouds) {
      const bob = still ? 0 : Math.sin((time + c.phase) * (Math.PI / 5)) * 3;
      ctx.fillStyle = `rgba(255,255,255,${c.a * fade})`;
      ctx.fillRect(0, c.y + bob, W, c.h);
    }

    // Fog bands
    for (const f of layers.fog) {
      const bob = still ? 0 : Math.sin((time + f.phase) * (Math.PI / 2.5)) * 4;
      ctx.fillStyle = `rgba(255,255,255,${f.a * fade})`;
      ctx.fillRect(0, f.y + bob, W, f.h);
    }

    // Wind streaks
    for (const w of layers.wind) {
      if (!still) {
        w.x += w.v * dt;
        if (w.x > W) { w.x = -w.len - rand(0, W / 2); w.y = rand(0, H); }
      }
      ctx.fillStyle = `rgba(255,255,255,${w.a * fade})`;
      ctx.fillRect(w.x, w.y, w.len, 1);
    }

    // Rain - 1px drops, slanted by the wind
    const slant = fx.slant || 0;
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * fade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of layers.rain) {
      if (!still) {
        d.y += d.v * dt;
        d.x += d.v * slant * dt;
        if (d.y > H) { d.y = rand(-60, -10); d.x = rand(-W * 0.3, W); }
      }
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * slant, d.y + d.len);
    }
    ctx.stroke();

    // Snow - round flakes swaying down
    ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
    ctx.beginPath();
    for (const f of layers.snow) {
      if (!still) {
        f.y += f.v * dt;
        f.x += (Math.sin(time * 1.5 + f.phase) * 12 + f.v * slant) * dt;
        if (f.y > H + 5) { f.y = -5; f.x = rand(0, W); }
      }
      ctx.moveTo(f.x + f.r, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    }
    ctx.fill();

    // Thunder flashes
    if (!still && layers.thunder.length) {
      let flash = 0;
      for (const [cycle, delay] of layers.thunder) {
        if (time < delay) continue;
        flash = Math.max(flash, thunderCurve(((time - delay) % cycle) / cycle));
      }
      if (flash) {
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.55 * fade})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  function render() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduceMotion.matches || document.hidden) {
      draw(0, 0);
    } else {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', render);
  reduceMotion.addEventListener?.('change', render);
  resize();

  return {
    set(next) {
      state = next;
      build(true);
      render();
    },
    resize,
  };
}

/* Opacity curve copied from the original thunderAnim keyframes */
function thunderCurve(p) {
  const k = [[0.50, 0], [0.51, 1], [0.52, 0], [0.54, 0], [0.55, 1], [0.56, 0.5],
             [0.57, 1], [0.58, 0], [0.80, 0], [0.81, 1], [0.85, 0]];
  if (p < k[0][0] || p > k[k.length - 1][0]) return 0;
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i][0]) {
      const [p0, v0] = k[i - 1], [p1, v1] = k[i];
      return v0 + (v1 - v0) * ((p - p0) / (p1 - p0));
    }
  }
  return 0;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}
