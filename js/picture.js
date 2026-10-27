/* Draws the current screen into a PNG: sky, weather, sun/moon, text and
   the timeline bars, read from the live page so it matches exactly.
   (The toolbar is left out: the picture is about the weather.) */

import { mix, token } from './palette.js';

export async function renderPicture({ sky, sceneCanvas, root }) {
  await document.fonts?.ready;
  const W = root.clientWidth, H = root.clientHeight;
  const S = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * S);
  canvas.height = Math.round(H * S);
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);
  const box = el => {
    const r = el.getBoundingClientRect(), o = root.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  };

  // 1. sky: same -65deg gradient; extra stops follow the app's OKLCH blend
  const a = (-65 * Math.PI) / 180;
  const dx = Math.sin(a), dy = -Math.cos(a);
  const len = Math.abs(W * dx) + Math.abs(H * dy);
  const g = ctx.createLinearGradient(W / 2 - (dx * len) / 2, H / 2 - (dy * len) / 2, W / 2 + (dx * len) / 2, H / 2 + (dy * len) / 2);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) g.addColorStop(t, mix(sky.timeColor, sky.tempColor, t));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (sky.darken) {
    ctx.globalAlpha = sky.darken;
    ctx.fillStyle = token('--veil');
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 2. weather particles, as on screen (they blend on pale skies)
  ctx.save();
  if (sky.inkDark) ctx.globalCompositeOperation = 'exclusion';
  ctx.drawImage(sceneCanvas, 0, 0, W, H);
  ctx.restore();

  // 3. sun or moon
  const icon = root.querySelector('#icon');
  const ib = box(icon);
  const cx = ib.x + ib.w / 2, cy = ib.y + ib.h / 2, r = ib.w / 2;
  const white = token('--white');
  if (sky.isDay) {
    if (sky.shining) {
      const gr = r * (sky.blazing ? 4 : 3.2);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      glow.addColorStop(0.3, token('--sun-glow-inner'));
      glow.addColorStop(0.55, token('--sun-glow-outer'));
      glow.addColorStop(1, token('--sun-glow-end'));
      ctx.fillStyle = glow;
      ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
    }
    ctx.save();
    if (sky.veiled) ctx.filter = 'blur(1.5px)';
    ctx.fillStyle = sky.veiled ? token('--sun-veiled') : token('--sun');
    circle(ctx, cx, cy, r);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = token('--moon-fill');
    circle(ctx, cx, cy, r);
    ctx.fill();
    ctx.strokeStyle = white;
    ctx.lineWidth = 6;
    circle(ctx, cx, cy, r - 3);
    ctx.stroke();
  }

  // 4. text, each element where it sits on screen
  for (const sel of ['#condition', '#temp .temp__num', '#temp sup', '#temp small', '#city', '#date',
                     '#timeline-low', '#timeline-label', '#timeline-high']) {
    const el = root.querySelector(sel);
    if (!el || el.hidden || el.closest('[hidden]')) continue;
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) === 0) continue;
    const text = el.dataset.text ?? el.textContent;
    drawText(ctx, text, box(el), cs);
  }

  // 5. timeline bars (each a small sky)
  for (const bar of root.querySelectorAll('.bar')) {
    if (!bar.dataset.from) continue;
    const b = box(bar);
    const bg = ctx.createLinearGradient(0, b.y + b.h, 0, b.y);
    bg.addColorStop(0, bar.dataset.from);
    bg.addColorStop(1, bar.dataset.to);
    ctx.fillStyle = bg;
    roundRect(ctx, b.x, b.y, b.w, b.h, 2);
    ctx.fill();
    ctx.strokeStyle = bar.classList.contains('is-selected') ? getComputedStyle(root).getPropertyValue('--ink') : token('--bar-stroke');
    ctx.lineWidth = bar.classList.contains('is-selected') ? 1.5 : 1;
    ctx.stroke();
  }

  // 6. signature
  const ink = getComputedStyle(root.querySelector('#city')).color;
  drawText(ctx, 'TIMECAST', { x: 0, y: 14, w: W, h: 16 }, null, { font: `700 9px Montserrat, sans-serif`, color: ink, spacing: 0.35 * 9, center: true, alpha: 0.7 });

  return new Promise(res => canvas.toBlob(res, 'image/png'));
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Draw text with CSS letter-spacing, character by character */
function drawText(ctx, text, b, cs, o = {}) {
  if (!text) return;
  const upper = cs ? cs.textTransform === 'uppercase' : false;
  const t = upper ? text.toUpperCase() : text;
  ctx.save();
  ctx.font = o.font || `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.fillStyle = o.color || cs.color;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.textBaseline = 'middle';
  const spacing = o.spacing ?? (parseFloat(cs.letterSpacing) || 0);
  const chars = [...t];
  const width = chars.reduce((w, c) => w + ctx.measureText(c).width + spacing, 0);
  let x = o.center ? b.x + (b.w - width) / 2 + spacing / 2 : b.x;
  // centred blocks: centre the text in the element's box
  if (!o.center && cs && cs.textAlign === 'center') x = b.x + (b.w - width) / 2 + spacing / 2;
  if (!o.center && cs && cs.textAlign === 'right') x = b.x + b.w - width;
  const y = b.y + b.h / 2;
  for (const c of chars) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + spacing;
  }
  ctx.restore();
}
