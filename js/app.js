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
  try {
    const pos = await getPosition();
    clearShare();
    await loadPlace({ ...pos, label: '' }, { share: false, remember: true });
  } catch (err) {
    const saved = initial && loadSavedPlace();
    if (saved) {
      await loadPlace(saved, { share: false });
    } else {
      toast(initial ? 'Location unavailable · showing a random city' : 'Location unavailable');
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
  if (place.label) el.city.textContent = place.label;
  if (share) shareURL(place);

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

  // Local time at the location, not on the device
  const ts = h.isNow ? Date.now() : h.time * 1000;
  const local = new Date(ts + offset * 1000);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60;

  const cond = getCondition(h.code, h.wind);
  const isDay = h.isDay;
  const hourColor = colorByHour(hour);
  let tempColor = colorByCelsius(h.temp);
  // At night the temperature colour sinks into the dark, so a mild
  // night still reads as night instead of dusk
  if (!isDay) tempColor = mix(tempColor, hourColor, 0.55);
  const timeColor = desaturate(hourColor, cond.fx.sat);
  tempColor = desaturate(tempColor, cond.fx.sat);

  // Only rebuild the scene when what it shows actually changes
  const key = [h.code, Math.round(h.temp), isDay, Math.floor(hour), Math.round(h.wind / 10)].join('|');
  const changed = key !== state.lastKey;
  state.lastKey = key;

  // Text
  setText(el.condition, cond.label, 'animate-down', changed);
  el.city.textContent = state.place.label;
  el.date.textContent = `${DAYS[local.getUTCDay()]}, ${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  renderTemp(h.temp);
  el.label.textContent = h.isNow ? 'Now' : `${pad(local.getUTCHours())}:00`;

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

function paintSky(timeColor, tempColor) {
  const next = el.skyLayers[state.skyIndex ^ 1];
  const prev = el.skyLayers[state.skyIndex];
  next.style.background = `linear-gradient(-65deg, ${timeColor}, ${tempColor})`;
  // perceptual blend where supported; ignored by older browsers
  next.style.background = `linear-gradient(-65deg in oklch, ${timeColor}, ${tempColor})`;
  next.classList.add('is-active');
  prev.classList.remove('is-active');
  state.skyIndex ^= 1;
}

function makeDayOrNight(isDay, celsius, veiled) {
  el.icon.textContent = '';
  const body = document.createElement('div');
  if (isDay) {
    // a sun behind clouds or fog doesn't shine or pulse
    const { pulses, big, shining } = veiled ? {} : sunIntensity(celsius);
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
  const f = state.unit === 'F';
  const v = Math.round(f ? celsius * 9 / 5 + 32 : celsius);
  el.temp.hidden = false;
  el.temp.innerHTML = `${v}<sup>°</sup><small>${state.unit}</small>`;
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

function showError(msg) {
  el.icon.innerHTML = '<div class="moon"></div>';
  el.condition.textContent = msg;
  el.timeline.hidden = true;
  el.temp.hidden = true;
  toast('Could not load the weather · try again later', 6000);
}

/* ======================================================================
   TIMELINE
   ====================================================================== */
function buildTimeline() {
  const { hours, offset } = state.forecast;
  const temps = hours.map(h => h.temp);
  const min = Math.min(...temps), max = Math.max(...temps);
  const range = Math.max(max - min, 4);

  el.track.textContent = '';
  el.track.setAttribute('aria-valuemax', hours.length - 1);
  hours.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${18 + ((h.temp - min) / range) * 82}%`;
    if (!h.isDay) bar.classList.add('is-night');
    if (getCondition(h.code).fx.rain || getCondition(h.code).fx.snow) bar.classList.add('is-wet');
    const local = new Date(h.time * 1000 + offset * 1000);
    if (i > 0 && local.getUTCHours() % 6 === 0) {
      const tick = document.createElement('span');
      tick.className = 'bar__tick';
      tick.textContent = pad(local.getUTCHours());
      bar.append(tick);
    }
    el.track.append(bar);
  });
  el.timeline.hidden = false;
  markSelected();
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

function indexFromPointer(e) {
  const r = el.track.getBoundingClientRect();
  const n = state.forecast.hours.length;
  return Math.floor(((e.clientX - r.left) / r.width) * n);
}

/* ======================================================================
   UI EVENTS
   ====================================================================== */
function bindUI() {
  $('#btn-locate').addEventListener('click', () => locate());
  $('#btn-random').addEventListener('click', () => (state.demo ? randomDemo() : loadRandomCity()));
  $('#btn-search').addEventListener('click', openSearch);

  el.temp.addEventListener('click', () => {
    state.unit = state.unit === 'C' ? 'F' : 'C';
    try { localStorage.setItem('tc-unit', state.unit); } catch {}
    if (state.forecast) renderTemp(state.forecast.hours[state.selected].temp);
  });

  // Timeline: tap or drag to scrub
  let dragging = false;
  el.track.addEventListener('pointerdown', e => {
    if (!state.forecast) return;
    dragging = true;
    el.track.setPointerCapture(e.pointerId);
    select(indexFromPointer(e));
  });
  el.track.addEventListener('pointermove', e => dragging && select(indexFromPointer(e)));
  const stop = () => { dragging = false; };
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
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
