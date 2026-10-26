/*!
 Name: Timecast v3
 Author: Carlos March - http://carlosmarch.es
 Created: 5 feb 2016 - Rebuilt: 2026
 Data: Open-Meteo, BigDataCloud
 Licensed under the MIT license
 */

import { getForecast, reverseGeocode, searchCity, getPosition } from './weather.js';
import { getCondition, CODES } from './conditions.js';
import { colorByCelsius, colorByHour, desaturate, sunIntensity, starsByHour, luminance, mix } from './palette.js';
import { createScene } from './scene.js';
import { cities } from './cities.js';

const REFRESH_MS = 15 * 60 * 1000;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const $ = sel => document.querySelector(sel);
const el = {
  root: document.documentElement,
  skyLayers: document.querySelectorAll('.sky__layer'),
  darken: $('.sky__darken'),
  condition: $('#condition'),
  icon: $('#icon'),
  temp: $('#temp'),
  city: $('#city'),
  date: $('#date'),
  timeline: $('#timeline'),
  track: $('#timeline-track'),
  label: $('#timeline-label'),
  low: $('#timeline-low'),
  night: $('#timeline-night'),
  high: $('#timeline-high'),
  retry: $('#retry'),
  search: $('#search'),
  searchForm: $('#search-form'),
  searchInput: $('#search-input'),
  searchResults: $('#search-results'),
  toast: $('#toast'),
  domlog: $('#domlog'),
  themeColor: $('meta[name="theme-color"]'),
};

const scene = createScene($('.scene'), () => {
  const r = el.icon.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom };
});

const state = {
  place: null,     // { lat, lon, label }
  forecast: null,  // { offset, hours[] }
  selected: 0,
  unit: loadUnit(),
  skyIndex: 0,
  lastKey: '',
  iconKey: '',
  refreshTimer: 0,
  demo: null,
};

/* ======================================================================
   BOOT
   ====================================================================== */
init();

function init() {
  bindUI();
  registerServiceWorker();

  const params = new URLSearchParams(location.search);
  if (params.has('demo')) return startDemo(params);

  const lat = parseFloat(params.get('lat'));
  const lon = parseFloat(params.get('lon'));
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return loadPlace({ lat, lon, label: params.get('name') || '' }, { share: false });
  }
  if (params.get('city') === 'random') return loadRandomCity();

  locate({ initial: true });
}

async function locate({ initial = false } = {}) {
  const btn = $('#btn-locate');
  btn.classList.add('is-busy');
  if (!state.forecast) setStatus('locating');
  try {
    const pos = await getPosition();
    clearShare();
    await loadPlace({ ...pos, label: '' }, { share: false, remember: true });
  } catch (err) {
    const saved = initial && loadSavedPlace();
    if (saved) {
      await loadPlace(saved, { share: false });
    } else {
      toast(initial ? 'No location · random city' : 'Location unavailable');
      if (initial) loadRandomCity();
    }
  } finally {
    btn.classList.remove('is-busy');
  }
}

function loadRandomCity() {
  let c;
  do {
    c = cities[Math.floor(Math.random() * cities.length)];
  } while (state.place && c[0] === state.place.label.split(',')[0]);
  return loadPlace({ lat: c[2], lon: c[3], label: cityLabel(c) });
}

async function loadPlace(place, { share = true, remember = false } = {}) {
  state.demo = null;
  document.body.classList.remove('is-demo');
  el.domlog.hidden = true;
  state.place = place;
  el.city.textContent = place.label || '';
  if (share) shareURL(place);
  setLoading(true);

  try {
    const [forecast, label] = await Promise.all([
      getForecast(place.lat, place.lon),
      place.label ? place.label : reverseGeocode(place.lat, place.lon),
    ]);
    if (state.place !== place) return; // a newer request won
    place.label = label || formatCoords(place);
    state.forecast = forecast;
    state.selected = 0;
    if (remember) savePlace(place);
    setLoading(false);
    state.lastKey = '';
    buildTimeline();
    render();
    scheduleRefresh();
  } catch (err) {
    console.error(err);
    if (state.place !== place) return;
    showError(navigator.onLine ? 'no signal' : 'offline');
  }
}

function scheduleRefresh() {
  clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(() => {
    if (document.hidden || !state.place) return;
    const place = state.place;
    getForecast(place.lat, place.lon).then(f => {
      if (state.place !== place) return;
      state.forecast = f;
      state.selected = Math.min(state.selected, f.hours.length - 1);
      buildTimeline();
      render();
    }).catch(() => {});
  }, REFRESH_MS);
}

// Re-render "now" every minute so the sky follows the clock
setInterval(() => {
  if (state.forecast && state.selected === 0 && !document.hidden) render();
}, 60 * 1000);

/* ======================================================================
   RENDER
   ====================================================================== */
function render() {
  const { hours, offset } = state.forecast;
  const h = hours[state.selected];
  const { local, hour, cond, timeColor, tempColor } = skyFor(h, offset);
  const isDay = h.isDay;

  // Only rebuild the scene when what it shows actually changes
  const key = [h.code, Math.round(h.temp), isDay, Math.floor(hour), Math.round(h.wind / 10)].join('|');
  const changed = key !== state.lastKey;
  state.lastKey = key;

  // Text
  el.condition.classList.remove('is-status');
  setText(el.condition, cond.label, 'animate-down', changed);
  el.city.textContent = state.place.label;
  el.date.textContent = `${DAYS[local.getUTCDay()]}, ${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  renderTemp(h.temp);
  el.label.textContent = `${h.isNow ? 'Now' : `${pad(local.getUTCHours())}:00`} · ${toUnit(h.temp)}°`;

  if (!changed) return;

  // Sky gradient: same recipe as the original (-65deg, time -> temperature)
  paintSky(timeColor, tempColor);
  el.darken.style.opacity = cond.fx.darken || 0;

  // Contrast: very pale skies get dark ink
  const mid = mix(timeColor, tempColor);
  const lum = luminance(mid);
  el.root.dataset.ink = lum > 0.55 ? 'dark' : 'light';
  el.root.style.setProperty('--text-shadow', lum > 0.3 && lum <= 0.55 ? '0 1px 14px rgba(0,0,0,.18)' : 'none');
  el.themeColor.content = timeColor;

  // Sun or moon
  makeDayOrNight(isDay, h.temp, cond.fx.veil);

  // Environment particles
  const stars = isDay ? 0 : starsByHour(hour) || 40;
  scene.set({ fx: cond.fx, stars: cond.fx.clouds > 10 ? stars / 4 : stars, timeColor });

  if (state.demo) {
    el.domlog.hidden = false;
    el.domlog.textContent = `demo · hour ${pad(Math.floor(hour))} · ${Math.round(h.temp)}°C · code ${h.code} · ${cond.label} · wind ${Math.round(h.wind)} km/h`;
  }
}

/* Colours and condition for one forecast hour. Shared by the sky and
   the timeline bars, so each bar is a small copy of that hour's sky */
function skyFor(h, offset) {
  // Local time at the location, not on the device
  const ts = h.isNow ? Date.now() : h.time * 1000;
  const local = new Date(ts + offset * 1000);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60;

  const cond = getCondition(h.code, h.wind);
  const hourColor = colorByHour(hour);
  let tempColor = colorByCelsius(h.temp);
  // At night the temperature colour sinks into the dark, so a mild
  // night still reads as night instead of dusk
  if (!h.isDay) tempColor = mix(tempColor, hourColor, 0.55);
  return {
    local,
    hour,
    cond,
    timeColor: desaturate(hourColor, cond.fx.sat),
    tempColor: desaturate(tempColor, cond.fx.sat),
  };
}

function gradient(el, angle, from, to) {
  el.style.background = `linear-gradient(${angle}, ${from}, ${to})`;
  // perceptual blend where supported; ignored by older browsers
  el.style.background = `linear-gradient(${angle} in oklch, ${from}, ${to})`;
}

function paintSky(timeColor, tempColor) {
  const next = el.skyLayers[state.skyIndex ^ 1];
  const prev = el.skyLayers[state.skyIndex];
  gradient(next, '-65deg', timeColor, tempColor);
  next.classList.add('is-active');
  prev.classList.remove('is-active');
  state.skyIndex ^= 1;
}

function makeDayOrNight(isDay, celsius, veiled) {
  // a sun behind clouds or fog doesn't shine or pulse
  const { pulses = 0, big, shining } = isDay && !veiled ? sunIntensity(celsius) : {};
  // keep the element (and its animations) when nothing visible changes
  const key = isDay ? `sun|${veiled}|${pulses}|${big}|${shining}` : 'moon';
  if (key === state.iconKey) return;
  state.iconKey = key;

  el.icon.textContent = '';
  const body = document.createElement('div');
  if (isDay) {
    body.className = 'sun' + (shining ? ' shining' : '') + (veiled ? ' is-veiled' : '');
    for (let i = 0; i < pulses; i++) {
      const p = document.createElement('div');
      p.className = big ? 'sun-pulse2x' : 'sun-pulse';
      body.append(p);
    }
  } else {
    body.className = 'moon';
  }
  el.icon.append(body);
}

function renderTemp(celsius) {
  el.temp.hidden = false;
  el.temp.innerHTML = `${toUnit(celsius)}<sup>°</sup><small>${state.unit}</small>`;
}

function toUnit(celsius) {
  return Math.round(state.unit === 'F' ? celsius * 9 / 5 + 32 : celsius);
}

function setText(node, text, anim, animate) {
  if (node.textContent === text && !animate) return;
  node.textContent = text;
  if (animate) {
    node.classList.remove(anim);
    void node.offsetWidth; // restart animation
    node.classList.add(anim);
  }
}

function setStatus(text) {
  el.condition.classList.remove('animate-down');
  el.condition.classList.add('is-status');
  el.condition.textContent = text;
}

function setLoading(on) {
  document.body.classList.toggle('is-loading', on);
  if (!on) return;
  el.retry.hidden = true;
  setStatus('loading');
  el.icon.innerHTML = '<div class="loader"></div>';
  state.iconKey = '';
}

function showError(msg) {
  document.body.classList.remove('is-loading');
  el.icon.innerHTML = '<div class="icon-empty"></div>';
  state.iconKey = '';
  state.lastKey = '';
  el.condition.classList.remove('is-status');
  setText(el.condition, msg, 'animate-down', true);
  el.date.textContent = '';
  el.timeline.hidden = true;
  el.temp.hidden = true;
  el.retry.hidden = false;
}

/* ======================================================================
   TIMELINE
   ====================================================================== */
function buildTimeline() {
  const { hours, offset } = state.forecast;
  const temps = hours.map(h => h.temp);
  const min = Math.min(...temps), max = Math.max(...temps);
  const range = Math.max(max - min, 4);

  state.range = [min, max];
  renderRange();

  el.track.textContent = '';
  el.track.setAttribute('aria-valuemax', hours.length - 1);
  hours.forEach((h, i) => {
    const { local, cond, timeColor, tempColor } = skyFor(h, offset);
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${18 + ((h.temp - min) / range) * 82}%`;
    // each bar is that hour's sky: time colour at the bottom, temperature on top
    gradient(bar, 'to top', timeColor, tempColor);

    // precipitation marks: rain ticks / snow dots, more for heavier
    const amount = Math.max(cond.fx.rain || 0, cond.fx.snow || 0);
    if (amount) {
      const wx = document.createElement('span');
      wx.className = 'bar__wx' + ((cond.fx.snow || 0) > (cond.fx.rain || 0) ? ' is-snow' : '');
      wx.innerHTML = '<i></i>'.repeat(amount < 50 ? 1 : amount < 110 ? 2 : 3);
      bar.append(wx);
    }

    if (i > 0 && local.getUTCHours() % 6 === 0) {
      const tick = document.createElement('span');
      tick.className = 'bar__tick';
      tick.textContent = pad(local.getUTCHours());
      bar.append(tick);
    }
    el.track.append(bar);
  });
  // night hours: one straight line under the bars (drawn on the track so
  // it doesn't bend when the bars magnify)
  const n = hours.length;
  const stops = hours.map((h, i) => {
    const c = h.isDay ? 'transparent' : 'var(--ink-faint)';
    return `${c} ${(i / n * 100).toFixed(2)}% ${((i + 1) / n * 100).toFixed(2)}%`;
  });
  el.track.style.setProperty('--night', `linear-gradient(90deg, ${stops.join(', ')})`);

  // a small moon where each night starts and a sun where it ends,
  // drawn like the big ones: a ring and a dot
  el.night.textContent = '';
  const mark = (kind, i) => {
    const m = document.createElement('i');
    m.className = `night-mark night-mark--${kind}`;
    m.style.left = `${(i / n * 100).toFixed(2)}%`;
    el.night.append(m);
  };
  hours.forEach((h, i) => {
    const prevDay = i === 0 ? true : hours[i - 1].isDay;
    if (!h.isDay && prevDay) mark('moon', i);
    if (h.isDay && i > 0 && !prevDay) mark('sun', i);
  });

  el.timeline.hidden = false;
  markSelected();
}

function renderRange() {
  const [min, max] = state.range;
  el.low.textContent = `Low ${toUnit(min)}°`;
  el.high.textContent = `High ${toUnit(max)}°`;
}

function select(i) {
  const n = state.forecast.hours.length;
  i = Math.max(0, Math.min(n - 1, i));
  if (i === state.selected) return;
  state.selected = i;
  markSelected();
  render();
}

function markSelected() {
  [...el.track.children].forEach((b, i) => b.classList.toggle('is-selected', i === state.selected));
  el.track.setAttribute('aria-valuenow', state.selected);
  const h = state.forecast.hours[state.selected];
  el.track.setAttribute('aria-valuetext', `${state.selected === 0 ? 'now' : `in ${state.selected} hours`}, ${Math.round(h.temp)} degrees, ${getCondition(h.code).label}`);
}

/* Dock-style magnification: bars near the pointer grow taller and wider,
   pushing their neighbours aside. Measured on the un-magnified layout so
   the effect doesn't feed back into itself */
function magnify(e) {
  const bars = el.track.children;
  if (!e) {
    for (const b of bars) b.style.removeProperty('--mag'), b.style.removeProperty('--w');
    return;
  }
  const r = el.track.getBoundingClientRect();
  const pos = ((e.clientX - r.left) / r.width) * bars.length - 0.5;
  for (let i = 0; i < bars.length; i++) {
    const d = i - pos;
    const g = Math.exp(-(d * d) / 12.5); // ~2.5 bars either side feel it
    bars[i].style.setProperty('--mag', (1 + 0.55 * g).toFixed(3));
    bars[i].style.setProperty('--w', (1 + 1.4 * g).toFixed(3));
  }
}

/* The bar under the pointer, using the real (magnified) bar positions */
function indexFromPointer(e) {
  const bars = el.track.children;
  for (let i = 0; i < bars.length; i++) {
    const r = bars[i].getBoundingClientRect();
    if (e.clientX < r.right + 1.5) return i; // half the gap belongs to each side
  }
  return bars.length - 1;
}

/* ======================================================================
   UI EVENTS
   ====================================================================== */
function bindUI() {
  $('#btn-locate').addEventListener('click', () => locate());
  $('#btn-random').addEventListener('click', () => (state.demo ? randomDemo() : loadRandomCity()));
  $('#btn-search').addEventListener('click', openSearch);
  el.retry.addEventListener('click', () => {
    if (state.place) loadPlace({ ...state.place }, { share: false });
    else locate({ initial: true });
  });

  el.temp.addEventListener('click', () => {
    state.unit = state.unit === 'C' ? 'F' : 'C';
    try { localStorage.setItem('tc-unit', state.unit); } catch {}
    if (state.forecast) { render(); renderRange(); }
  });

  // Timeline: tap or drag to scrub. While a finger is down (or a mouse
  // hovers) the timeline grows and the bars under the pointer swell
  let dragging = false;
  let shrinkTimer = 0;
  const grow = () => {
    clearTimeout(shrinkTimer);
    el.timeline.classList.add('is-active');
  };
  const shrink = (delay = 0) => {
    clearTimeout(shrinkTimer);
    shrinkTimer = setTimeout(() => {
      el.timeline.classList.remove('is-active');
      magnify(null);
    }, delay);
  };
  let settleTimer = 0;
  const scrub = e => {
    const i = indexFromPointer(e);
    if (i !== state.selected && e.pointerType === 'touch') navigator.vibrate?.(4);
    select(i);
    // bars keep sliding for a moment after magnifying: check again once
    // they settle so the selected hour is the one under the finger
    const { clientX, pointerType } = e;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => dragging && scrub({ clientX, pointerType }), 200);
  };

  el.track.addEventListener('pointerdown', e => {
    if (!state.forecast) return;
    dragging = true;
    el.track.setPointerCapture(e.pointerId);
    grow();
    magnify(e);
    scrub(e);
  });
  el.track.addEventListener('pointermove', e => {
    if (!state.forecast) return;
    if (dragging) scrub(e);
    if (dragging || e.pointerType === 'mouse') magnify(e);
  });
  el.track.addEventListener('pointerenter', e => {
    if (state.forecast && e.pointerType === 'mouse') { grow(); magnify(e); }
  });
  el.track.addEventListener('pointerleave', e => {
    if (!dragging && e.pointerType === 'mouse') shrink();
  });
  const stop = e => {
    dragging = false;
    // touch: stay big for a moment so the result can be read
    if (e.pointerType !== 'mouse') shrink(700);
  };
  el.track.addEventListener('pointerup', stop);
  el.track.addEventListener('pointercancel', stop);

  el.track.addEventListener('keydown', e => {
    if (!state.forecast) return;
    const keys = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (e.key in keys) select(state.selected + keys[e.key]);
    else if (e.key === 'Home') select(0);
    else if (e.key === 'End') select(state.forecast.hours.length - 1);
    else return;
    e.preventDefault();
  });

  // Global shortcuts
  document.addEventListener('keydown', e => {
    if (!el.search.hidden) {
      if (e.key === 'Escape') closeSearch();
      return;
    }
    if (e.target.closest('input, [role="slider"]')) return;
    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); openSearch(); }
    else if (e.key === 'r') $('#btn-random').click();
    else if (e.key === 'ArrowRight' && state.forecast) select(state.selected + 1);
    else if (e.key === 'ArrowLeft' && state.forecast) select(state.selected - 1);
  });

  // Search
  let timer = 0, controller = null, results = [];
  el.searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    const q = el.searchInput.value.trim();
    if (q.length < 2) { el.searchResults.textContent = ''; results = []; return; }
    timer = setTimeout(async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        results = await searchCity(q, controller.signal);
        renderResults(results);
      } catch (err) {
        if (err.name !== 'AbortError') renderResults([], 'Search unavailable');
      }
    }, 250);
  });
  el.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    if (results[0]) pickResult(results[0]);
  });
  el.searchResults.addEventListener('click', e => {
    const btn = e.target.closest('button[data-i]');
    if (btn) pickResult(results[+btn.dataset.i]);
  });
  $('#search-close').addEventListener('click', closeSearch);
  el.search.addEventListener('click', e => { if (e.target === el.search) closeSearch(); });

  function renderResults(list, empty = 'No cities found') {
    el.searchResults.innerHTML = list.length
      ? list.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.name)}<small>${esc(r.region)}</small></button></li>`).join('')
      : `<li class="search__empty">${empty}</li>`;
  }

  function pickResult(r) {
    closeSearch();
    loadPlace({ lat: r.lat, lon: r.lon, label: r.label });
  }
}

function openSearch() {
  el.search.hidden = false;
  el.searchInput.value = '';
  el.searchResults.textContent = '';
  requestAnimationFrame(() => el.searchInput.focus());
}

function closeSearch() {
  el.search.hidden = true;
  $('#btn-search').focus({ preventScroll: true });
}

let toastTimer = 0;
function toast(msg, ms = 3500) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, ms);
}

/* ======================================================================
   DEMO MODE  (?demo  or  ?demo&code=95&temp=24&hour=22&wind=40)
   Fake data, no network - successor of the old initDevelopment()
   ====================================================================== */
function startDemo(params) {
  const num = (k, d) => (params.has(k) ? parseFloat(params.get(k)) : d);
  const c = cities[Math.floor(Math.random() * cities.length)];
  buildDemo({
    code: num('code', CODES[Math.floor(Math.random() * CODES.length)]),
    temp: num('temp', Math.round(Math.random() * 45 - 8)),
    hour: num('hour', Math.random() * 24),
    wind: num('wind', Math.random() * 40),
    label: params.get('name') || cityLabel(c),
  });
}

function randomDemo() {
  startDemo(new URLSearchParams());
}

function buildDemo({ code, temp, hour, wind, label }) {
  // Pretend the location's clock reads `hour` right now
  const nowUtc = Date.now();
  const d = new Date(nowUtc);
  const deviceHour = d.getUTCHours() + d.getUTCMinutes() / 60;
  const offset = Math.round((hour - deviceHour) * 3600);
  const startHour = Math.floor((nowUtc / 1000 + 3600) / 3600) * 3600;
  const isDayAt = t => {
    const lh = new Date((t + offset) * 1000).getUTCHours();
    return lh >= 7 && lh < 20;
  };

  const hours = [{ time: Math.floor(nowUtc / 1000), temp, code, isDay: isDayAt(nowUtc / 1000), wind, isNow: true }];
  for (let i = 0; i < 24; i++) {
    const t = startHour + i * 3600;
    const lh = new Date((t + offset) * 1000).getUTCHours();
    hours.push({
      time: t,
      temp: temp + Math.sin(((lh - 9) / 24) * Math.PI * 2) * 4 - 2 + Math.random(),
      code: i < 6 ? code : CODES[Math.floor(Math.random() * CODES.length)],
      isDay: isDayAt(t),
      wind,
    });
  }
  state.demo = true;
  document.body.classList.add('is-demo');
  state.place = { lat: 0, lon: 0, label };
  state.forecast = { offset, hours };
  state.selected = 0;
  state.lastKey = '';
  el.retry.hidden = true;
  buildTimeline();
  render();
}

/* ======================================================================
   UTILS
   ====================================================================== */
function shareURL(place) {
  const p = new URLSearchParams({ lat: place.lat.toFixed(3), lon: place.lon.toFixed(3), name: place.label || '' });
  history.replaceState(null, '', `?${p}`);
}

function clearShare() {
  if (location.search) history.replaceState(null, '', location.pathname);
}

function savePlace(place) {
  try { localStorage.setItem('tc-place', JSON.stringify(place)); } catch {}
}

function loadSavedPlace() {
  try { return JSON.parse(localStorage.getItem('tc-place')); } catch { return null; }
}

function loadUnit() {
  try {
    const saved = localStorage.getItem('tc-unit');
    if (saved) return saved;
  } catch {}
  return /^en-(US|LR|MM)$/.test(navigator.language) ? 'F' : 'C';
}

function formatCoords({ lat, lon }) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
}

function cityLabel([city, country, , , code]) {
  return `${city}, ${code || country}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  // a page served by an older worker reloads once when the new one takes
  // over, so a deploy never leaves old files on screen
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
