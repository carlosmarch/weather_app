/* Environment renderer.
 * The original built hundreds of absolutely positioned <div>s with jQuery;
 * here everything is drawn on one <canvas>, which keeps mobile smooth.
 * Effects keep the original look: square stars, 1px rain, round snow,
 * thin translucent cloud bands, wide fog bands and thunder flashes.
 *
 * Changing the weather never rebuilds the scene: each layer keeps the
 * particles it has, fades in the ones it needs and fades out the rest,
 * so scrubbing through the forecast morphs from hour to hour.
 */

import { hexToRgb, mix, token } from './palette.js';

const REF_AREA = 1440 * 900;
let P = '255,255,255'; // particle colour (rgb), from the --particle token
const FADE_S = 0.8;

export function createScene(canvas, getAnchor) {
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let W = 0, H = 0, dpr = 1;
  let state = null;
  let layers = { stars: [], clouds: [], fog: [], rain: [], snow: [], wind: [] };
  let thunder = [];
  let flashFade = 0;
  let raf = 0;
  let last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state) {
      // positions depend on the viewport: start over, without fading
      for (const k in layers) layers[k] = [];
      update(true);
      if (!raf) draw(0, 0);
    }
  }

  function scale(n) {
    const f = Math.min(Math.max((W * H) / REF_AREA, 0.45), 1.6);
    return Math.round((n || 0) * f);
  }

  const makers = {
    stars: () => ({
      x: rand(0, W), y: rand(0, H / 3),
      s: rand(1, 4) | 0,
      tinted: Math.random() < 0.5,
      a: rand(0.15, 1),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.5, 1.3), // each star breathes at its own pace
    }),
    clouds: () => {
      const a = getAnchor();
      return { y: rand(a.top, a.bottom), h: rand(1, 30), a: rand(0.01, 0.08), phase: rand(0, 10) };
    },
    // thicker fog reaches higher and is denser
    fog: () => {
      const lvl = state.fx.fogLevel || 2;
      const top = H * (0.62 - lvl * 0.1);
      return { y: rand(top, Math.max(top + 1, H - 300)), h: rand(100, 450), a: rand(0.01, 0.07) * (0.6 + lvl * 0.25), phase: rand(0, 5) };
    },
    // heavier rain: longer, faster drops
    rain: () => {
      const k = 0.75 + (state.fx.rainLevel || 3) * 0.1;
      return { x: rand(-W * 0.3, W), y: rand(-H, H), len: rand(5, 11) * k, v: rand(900, 1500) * k };
    },
    // heavier snow: bigger flakes, and heavy / blizzard fall faster
    snow: () => {
      const lvl = state.fx.snowLevel || 3;
      const k = 0.8 + lvl * 0.1;
      const fast = 1 + Math.max(0, lvl - 3) * 0.25;
      return { x: rand(0, W), y: rand(-H, H), r: rand(0.5, 2.2) * k, v: rand(35, 90) * fast, phase: rand(0, Math.PI * 2) };
    },
    wind: () => ({ x: rand(-W, W), y: rand(0, H), len: rand(40, 130), v: rand(500, 1100), a: rand(0.06, 0.18) }),
  };

  function update(instant = false) {
    const fx = state.fx;
    const want = {
      stars: scale(state.stars),
      clouds: fx.clouds || 0,
      fog: fx.fog || 0,
      rain: scale(fx.rain),
      snow: scale(fx.snow),
      wind: scale(fx.wind),
    };
    const life = instant || reduceMotion.matches ? 1 : 0;
    for (const k in layers) layers[k] = reconcile(layers[k], want[k], makers[k], life);

    // tinted stars: lifted toward white, or they vanish into a black sky
    state.tint = hexToRgb(mix(state.timeColor, token('--white'), 0.65)).join(',');
    P = hexToRgb(token('--particle')).join(',');
    // [cycle s, delay s] from the original thunder keyframes, timed from now
    const now = performance.now() / 1000;
    thunder = [[3, 0], [10.5, 8.5], [6.2, 20.2], [7.4, 4.1]]
      .slice(0, fx.thunder || 0)
      .map(([cycle, delay]) => [cycle, now + delay]);
  }

  /* Keep living particles, add what's missing (fading in), retire extras */
  function reconcile(list, n, make, life) {
    const alive = list.filter(p => !p.dying);
    alive.slice(n).forEach(p => { p.dying = true; });
    for (let i = alive.length; i < n; i++) list.push({ ...make(), life });
    return list;
  }

  function frame(t) {
    const dt = Math.min((t - (last || t)) / 1000, 0.05);
    last = t;
    draw(t / 1000, dt);
    raf = requestAnimationFrame(frame);
  }

  function age(list, dt) {
    const step = dt / FADE_S;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.dying) {
        p.life -= step;
        if (p.life <= 0) list.splice(i, 1);
      } else if (p.life < 1) {
        p.life = Math.min(1, p.life + step);
      }
    }
  }

  function draw(time, dt) {
    ctx.clearRect(0, 0, W, H);
    if (!state) return;
    const fx = state.fx;
    const still = reduceMotion.matches;
    if (still) {
      for (const k in layers) layers[k] = layers[k].filter(p => !p.dying).map(p => ({ ...p, life: 1 }));
    } else {
      for (const k in layers) age(layers[k], dt);
    }

    // Stars - square like the original, each softly pulsing
    for (const s of layers.stars) {
      const pulse = still ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
      const a = (s.tinted ? s.a * 0.5 : s.a) * s.life * pulse;
      ctx.fillStyle = `rgba(${s.tinted ? state.tint : P},${a})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Cloud bands crossing the sun / moon
    for (const c of layers.clouds) {
      const bob = still ? 0 : Math.sin((time + c.phase) * (Math.PI / 5)) * 3;
      ctx.fillStyle = `rgba(${P},${c.a * c.life})`;
      ctx.fillRect(0, c.y + bob, W, c.h);
    }

    // Fog bands
    for (const f of layers.fog) {
      const bob = still ? 0 : Math.sin((time + f.phase) * (Math.PI / 2.5)) * 4;
      ctx.fillStyle = `rgba(${P},${f.a * f.life})`;
      ctx.fillRect(0, f.y + bob, W, f.h);
    }

    // Wind streaks - tapered, transparent at both ends
    for (const w of layers.wind) {
      if (!still) {
        w.x += w.v * dt;
        if (w.x > W) { w.x = -w.len - rand(0, W / 2); w.y = rand(0, H); }
      }
      const g = ctx.createLinearGradient(w.x, 0, w.x + w.len, 0);
      g.addColorStop(0, `rgba(${P},0)`);
      g.addColorStop(0.6, `rgba(${P},${w.a * w.life})`);
      g.addColorStop(1, `rgba(${P},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(w.x, w.y, w.len, 1);
    }

    // Rain - 1px drops, slanted by the wind
    const slant = fx.slant || 0;
    ctx.lineWidth = 1;
    batch(layers.rain, 0.55, 'stroke', d => {
      if (!still) {
        d.y += d.v * dt;
        d.x += d.v * slant * dt;
        if (d.y > H) { d.y = rand(-60, -10); d.x = rand(-W * 0.3, W); }
      }
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * slant, d.y + d.len);
    });

    // Snow - round flakes swaying down
    batch(layers.snow, 0.9, 'fill', f => {
      if (!still) {
        f.y += f.v * dt;
        f.x += (Math.sin(time * 1.5 + f.phase) * 12 + f.v * slant) * dt;
        if (f.y > H + 5) { f.y = -5; f.x = rand(0, W); }
      }
      ctx.moveTo(f.x + f.r, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    });

    // Thunder flashes (fade with the weather like everything else)
    flashFade = thunder.length ? Math.min(1, flashFade + dt / FADE_S) : 0;
    if (!still && thunder.length) {
      let flash = 0;
      for (const [cycle, start] of thunder) {
        if (time < start) continue;
        flash = Math.max(flash, thunderCurve(((time - start) % cycle) / cycle));
      }
      if (flash) {
        ctx.fillStyle = `rgba(${P},${flash * (fx.flash || 0.55) * flashFade})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  /* Draw a particle layer as few paths as possible: everything at full
     life in one path, fading particles on their own */
  function batch(list, alpha, mode, trace) {
    const setStyle = a => {
      if (mode === 'fill') ctx.fillStyle = `rgba(${P},${a})`;
      else ctx.strokeStyle = `rgba(${P},${a})`;
    };
    setStyle(alpha);
    ctx.beginPath();
    for (const p of list) if (p.life >= 1) trace(p);
    ctx[mode]();
    for (const p of list) {
      if (p.life >= 1) continue;
      setStyle(alpha * p.life);
      ctx.beginPath();
      trace(p);
      ctx[mode]();
    }
  }

  let paused = false;
  function render() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduceMotion.matches || document.hidden || paused) {
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
    // stop animating (e.g. while scrolled off screen); the last frame stays
    pause() { paused = true; render(); },
    resume() { if (paused) { paused = false; render(); } },
    set(next) {
      state = next;
      update();
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
