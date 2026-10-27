/* "How it works" page: every demo is drawn with the app's own code
   (palette, conditions, scene), so it always matches the app. */

import { colorByCelsius, colorByHour, desaturate, mix, luminance, sunIntensity, token } from './palette.js';
import { getCondition } from './conditions.js';
import { createScene } from './scene.js';

const $ = sel => document.querySelector(sel);
const pad = n => String(n).padStart(2, '0');

/* Back: return to the exact app screen when we came from it */
$('#back').addEventListener('click', e => {
  if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
    e.preventDefault();
    history.back();
  }
});

/* Same recipe as the app's skyFor() */
function sky(hour, temp, code = 0, wind = 10, isDay = hour >= 7 && hour < 19) {
  const cond = getCondition(code, wind);
  const hourColor = colorByHour(hour);
  let tempColor = colorByCelsius(temp);
  if (!isDay) tempColor = mix(tempColor, hourColor, 0.55);
  const timeColor = desaturate(hourColor, cond.fx.sat);
  tempColor = desaturate(tempColor, cond.fx.sat);
  const ink = luminance(mix(timeColor, tempColor)) > 0.55 ? token('--ink-dark') : token('--ink-light');
  return { cond, isDay, timeColor, tempColor, ink };
}

function gradient(el, angle, from, to) {
  el.style.background = `linear-gradient(${angle}, ${from}, ${to})`;
  el.style.background = `linear-gradient(${angle} in oklch, ${from}, ${to})`;
}

function orb(s, temp) {
  const o = document.createElement('div');
  if (!s.isDay) {
    o.className = 'orb orb--moon';
    return o;
  }
  const veiled = s.cond.fx.veil;
  const { pulses = 0, big, shining } = veiled ? {} : sunIntensity(temp);
  o.className = 'orb orb--sun' + (shining ? ' is-shining' : '') + (veiled ? ' is-veiled' : '');
  for (let i = 0; i < pulses; i++) {
    const p = document.createElement('i');
    if (big) p.className = 'big';
    o.append(p);
  }
  return o;
}

function tile({ hour, temp, code = 0, wind = 10, title, sub }) {
  const s = sky(hour, temp, code, wind);
  const t = document.createElement('div');
  t.className = 'tile';
  gradient(t, '-65deg', s.timeColor, s.tempColor);
  t.style.setProperty('--tile-ink', s.ink);
  if (s.cond.fx.darken) {
    const v = document.createElement('div');
    v.className = 'tile__veil';
    v.style.opacity = s.cond.fx.darken;
    t.append(v);
  }
  t.append(orb(s, temp));
  const c = document.createElement('div');
  c.className = 'tile__caption';
  c.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
  t.append(c);
  return { el: t, sky: s };
}

/* 01 · The circle */
const circles = [
  { hour: 11, temp: 12, title: 'Under 15°' },
  { hour: 12, temp: 17, title: '15° +', sub: 'one pulse' },
  { hour: 14, temp: 26, title: '20° +', sub: 'glow, pulses' },
  { hour: 12, temp: 16, code: 3, title: 'Clouds', sub: 'veiled' },
  { hour: 23, temp: 14, title: 'Night', sub: 'moon' },
];
$('#demo-circles').append(...circles.map(c => tile(c).el));

/* 02 · The sky: the two scales, then examples */
const timeStops = Array.from({ length: 25 }, (_, h) => `${colorByHour(h)} ${(h / 24 * 100).toFixed(1)}%`);
$('#strip-time').style.background = `linear-gradient(90deg, ${timeStops.join(', ')})`;
const temps = Array.from({ length: 19 }, (_, i) => -10 + i * 2.5);
const tempStops = temps.map((t, i) => `${colorByCelsius(t)} ${(i / (temps.length - 1) * 100).toFixed(1)}%`);
$('#strip-temp').style.background = `linear-gradient(90deg, ${tempStops.join(', ')})`;

const skies = [
  { hour: 13, temp: 31, title: '13:00 · 31°', sub: 'clear' },
  { hour: 2, temp: 12, title: '02:00 · 12°', sub: 'clear night' },
  { hour: 12, temp: 9, code: 3, title: '12:00 · 9°', sub: 'overcast' },
  { hour: 10.5, temp: 18, code: 1, title: '10:30 · 18°', sub: 'pale: dark text' },
];
$('#demo-skies').append(...skies.map(c => tile(c).el));

/* 03 · The weather: live scenes, lighter than full screen */
const weather = [
  { hour: 22, temp: 12, code: 63, title: 'Rain' },
  { hour: 23, temp: -3, code: 73, title: 'Snow' },
  { hour: 7.5, temp: 8, code: 45, title: 'Fog' },
  { hour: 18, temp: 24, code: 95, wind: 40, title: 'Storm' },
  { hour: 2, temp: 14, code: 0, title: 'Stars' },
  { hour: 15, temp: 18, code: 2, wind: 50, title: 'Wind' },
];
for (const w of weather) {
  const { el, sky: s } = tile(w);
  const canvas = document.createElement('canvas');
  el.prepend(canvas);
  $('#demo-weather').append(el);
  const scene = createScene(canvas, () => ({ top: canvas.clientHeight * 0.28, bottom: canvas.clientHeight * 0.52 }));
  const fx = { ...s.cond.fx };
  for (const k of ['rain', 'snow', 'wind']) if (fx[k]) fx[k] = Math.ceil(fx[k] / 3);
  if (fx.clouds) fx.clouds = Math.ceil(fx.clouds / 2);
  scene.set({ fx, stars: s.isDay ? 0 : 40, timeColor: s.timeColor });
}

/* 04 · The timeline: a sample day you can scrub */
const day = [
  [13, 0, 31], [14, 0, 31], [15, 1, 30], [16, 2, 28], [17, 3, 26], [18, 61, 23], [19, 63, 21], [20, 95, 20],
  [21, 63, 19], [22, 3, 18], [23, 0, 17], [0, 0, 16], [1, 0, 16], [2, 0, 15], [3, 0, 15], [4, 0, 15],
  [5, 0, 15], [6, 45, 16], [7, 45, 17], [8, 1, 20], [9, 0, 23], [10, 0, 25], [11, 0, 27], [12, 0, 29],
];
const track = $('#demo-timeline-track');
const tlow = Math.min(...day.map(d => d[2])), thigh = Math.max(...day.map(d => d[2]));
const n = day.length;
const nightStops = [];
day.forEach(([hour, code, temp], i) => {
  const isDay = hour >= 7 && hour < 19;
  const s = sky(hour, temp, code, 10, isDay);
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.height = `${18 + ((temp - tlow) / (thigh - tlow)) * 82}%`;
  gradient(bar, 'to top', s.timeColor, s.tempColor);
  const amount = Math.max(s.cond.fx.rain || 0, s.cond.fx.snow || 0);
  if (amount) {
    const wx = document.createElement('span');
    wx.className = 'bar__wx' + ((s.cond.fx.snow || 0) > (s.cond.fx.rain || 0) ? ' is-snow' : '');
    wx.innerHTML = '<i></i>'.repeat(amount < 50 ? 1 : amount < 110 ? 2 : 3);
    bar.append(wx);
  }
  track.append(bar);
  nightStops.push(`${isDay ? 'transparent' : token('--ink-faint')} ${(i / n * 100).toFixed(2)}% ${((i + 1) / n * 100).toFixed(2)}%`);
  const prevDay = i === 0 ? true : day[i - 1][0] >= 7 && day[i - 1][0] < 19;
  if (!isDay && prevDay) mark('moon', i);
  if (isDay && i > 0 && !prevDay) mark('sun', i);
});
track.style.setProperty('--night', `linear-gradient(90deg, ${nightStops.join(', ')})`);

function mark(kind, i) {
  const m = document.createElement('i');
  m.className = `night-mark night-mark--${kind}`;
  m.style.left = `${(i / n * 100).toFixed(2)}%`;
  $('#demo-timeline-night').append(m);
}

function selectBar(i) {
  i = Math.max(0, Math.min(n - 1, i));
  [...track.children].forEach((b, j) => b.classList.toggle('is-selected', j === i));
  const [hour, code, temp] = day[i];
  $('#demo-timeline-label').textContent = `${i === 0 ? 'Now' : `${pad(hour)}:00`} · ${temp}° · ${getCondition(code).label}`;
}
const indexAt = e => Math.floor(((e.clientX - track.getBoundingClientRect().left) / track.clientWidth) * n);
let dragging = false;
track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); selectBar(indexAt(e)); });
track.addEventListener('pointermove', e => { if (dragging || e.pointerType === 'mouse') selectBar(indexAt(e)); });
track.addEventListener('pointerup', () => { dragging = false; });
track.addEventListener('pointercancel', () => { dragging = false; });
selectBar(0);
