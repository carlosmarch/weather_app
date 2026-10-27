/* Maps a forecast hour (WMO weather code + measured amounts) to a label
 * and the environment effects that draw it. Successor of the old icons.js.
 *
 * Rain, snow, fog, storms and wind each go through intensity STEPS based
 * on real amounts (mm/h, cm/h, visibility, km/h). When an amount is
 * missing, a typical value for the weather code is used instead.
 * The same STEPS are shown on the "How it works" page.
 *
 * Effect values are intensities for a ~1440x900 screen; scene.js
 * scales them to the real viewport.
 */

const LABELS = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'rime fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'dense drizzle',
  56: 'freezing drizzle', 57: 'dense freezing drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  66: 'freezing rain', 67: 'heavy freezing rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'rain showers', 81: 'heavy showers', 82: 'violent showers',
  85: 'snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'heavy hail storm',
};

export const CODES = Object.keys(LABELS).map(Number);

/* Cloud cover for codes without precipitation */
const SKY = { 1: { clouds: 3 }, 2: { clouds: 7 }, 3: { clouds: 15, darken: 0.2 } };

/* Typical amounts per code, used when the forecast has no measurement */
const TYPICAL = {
  rain: { 51: 0.2, 53: 0.4, 55: 0.8, 56: 0.3, 57: 0.8, 61: 1.2, 63: 4, 65: 10, 66: 1.5, 67: 8,
          80: 1.5, 81: 5, 82: 25, 95: 4, 96: 6, 99: 15 },
  snow: { 48: 0.1, 56: 0.1, 57: 0.2, 66: 0.2, 67: 0.4, 71: 0.3, 73: 1.5, 75: 3.5, 77: 0.5,
          85: 0.8, 86: 3, 96: 0.3, 99: 0.6 },
  vis:  { 45: 600, 48: 400 },
};

/* ---- Intensity steps. Each step's `max` is exclusive ---- */
export const STEPS = {
  rain: { unit: 'mm/h', steps: [
    { name: 'Drizzle',    max: 0.5,      drops: 25,  clouds: 6 },
    { name: 'Light',      max: 2.5,      drops: 55,  clouds: 8 },
    { name: 'Moderate',   max: 7.6,      drops: 100, clouds: 11, darken: 0.12 },
    { name: 'Heavy',      max: 20,       drops: 150, clouds: 14, darken: 0.2 },
    { name: 'Very heavy', max: 50,       drops: 210, clouds: 15, darken: 0.28 },
    { name: 'Violent',    max: Infinity, drops: 280, clouds: 15, darken: 0.35 },
  ] },
  snow: { unit: 'cm/h', steps: [
    { name: 'Flurries', max: 0.2,      flakes: 25,  clouds: 5 },
    { name: 'Light',    max: 1,        flakes: 50,  clouds: 8 },
    { name: 'Moderate', max: 2.5,      flakes: 90,  clouds: 11, darken: 0.1 },
    { name: 'Heavy',    max: 5,        flakes: 140, clouds: 14, darken: 0.15 },
    { name: 'Blizzard', max: Infinity, flakes: 200, clouds: 15, darken: 0.2, wind: 4 },
  ] },
  // visibility in metres: lower is thicker, so steps go from clear to dense
  fog: { unit: 'visibility', steps: [
    { name: 'Mist',      min: 1000, bands: 3, clouds: 3 },
    { name: 'Fog',       min: 200,  bands: 5, clouds: 5, darken: 0.1 },
    { name: 'Dense fog', min: 0,    bands: 8, clouds: 6, darken: 0.18 },
  ] },
  storm: { unit: '', steps: [
    { name: 'Distant thunder', flashes: 1, flash: 0.3 },
    { name: 'Thunderstorm',    flashes: 2, flash: 0.55 },
    { name: 'With hail',       flashes: 3, flash: 0.6 },
    { name: 'Severe',          flashes: 4, flash: 0.75 },
  ] },
  wind: { unit: 'km/h', steps: [
    { name: 'Breeze', max: 25,       streaks: 4 },
    { name: 'Fresh',  max: 39,       streaks: 10 },
    { name: 'Strong', max: 50,       streaks: 18 },
    { name: 'Gale',   max: 75,       streaks: 28 },
    { name: 'Storm',  max: Infinity, streaks: 40 },
  ] },
};
export const CALM_WIND = 12;   // km/h: below this, no streaks
export const MIST_VISIBILITY = 5000; // m: below this (and dry), mist

/* Step index (1-based) for an amount, 0 when there's nothing */
export function rainLevel(mm) {
  if (!(mm > 0.05)) return 0;
  return STEPS.rain.steps.findIndex(s => mm < s.max) + 1;
}
export function snowLevel(cm) {
  if (!(cm > 0.02)) return 0;
  return STEPS.snow.steps.findIndex(s => cm < s.max) + 1;
}
export function fogLevel(vis) {
  if (!(vis < MIST_VISIBILITY)) return 0;
  return STEPS.fog.steps.findIndex(s => vis >= s.min) + 1;
}
export function windLevel(kmh) {
  if (!(kmh >= CALM_WIND)) return 0;
  return STEPS.wind.steps.findIndex(s => kmh < s.max) + 1;
}
export function stormLevel(code, rainMm) {
  if (code === 99) return 4;
  if (code === 96) return 3;
  if (code === 95) return rainMm < 1 ? 1 : 2;
  return 0;
}

/* data: { rain mm/h, snow cm/h, vis m, gust km/h } - any may be missing */
export function getCondition(code, windKmh = 0, data = {}) {
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const rain = num(data.rain) ?? TYPICAL.rain[code] ?? 0;
  const snow = num(data.snow) ?? TYPICAL.snow[code] ?? 0;
  const isFogCode = code === 45 || code === 48;
  let vis = num(data.vis) ?? TYPICAL.vis[code] ?? Infinity;
  if (isFogCode) vis = Math.min(vis, 999); // the code says fog: at least "Fog"
  // gusts count, softened: a gusty breeze isn't a gale
  const wind = Math.max(windKmh || 0, (num(data.gust) ?? 0) * 0.6);

  const levels = {
    rain: rainLevel(rain),
    snow: snowLevel(snow),
    storm: stormLevel(code, rain),
    wind: windLevel(wind),
    fog: 0,
  };
  // low visibility is fog only when it isn't just heavy rain or snow
  if (isFogCode || (levels.rain <= 1 && levels.snow <= 1)) levels.fog = fogLevel(vis);

  const fx = { ...(SKY[code] || {}) };
  const take = step => {
    if (!step) return;
    fx.clouds = Math.max(fx.clouds || 0, step.clouds || 0);
    fx.darken = Math.max(fx.darken || 0, step.darken || 0);
  };
  if (levels.rain) {
    const s = STEPS.rain.steps[levels.rain - 1];
    fx.rain = s.drops; fx.rainLevel = levels.rain; take(s);
  }
  if (levels.snow) {
    const s = STEPS.snow.steps[levels.snow - 1];
    fx.snow = s.flakes; fx.snowLevel = levels.snow; take(s);
    if (s.wind) levels.wind = Math.max(levels.wind, s.wind);
  }
  if (levels.fog) {
    const s = STEPS.fog.steps[levels.fog - 1];
    fx.fog = s.bands; fx.fogLevel = levels.fog; take(s);
  }
  if (levels.storm) {
    const s = STEPS.storm.steps[levels.storm - 1];
    fx.thunder = s.flashes; fx.flash = s.flash;
    fx.clouds = Math.max(fx.clouds || 0, 12);
    fx.darken = Math.max(fx.darken || 0, 0.2 + levels.storm * 0.03);
  }
  if (levels.wind) {
    fx.wind = STEPS.wind.steps[levels.wind - 1].streaks;
    fx.windLevel = levels.wind;
  }
  // Wind slants the rain and snow
  fx.slant = Math.min(Math.max(wind, levels.wind >= 5 ? 50 : 0) / 60, 0.6);

  // Clouds, fog and precipitation drain colour from the sky...
  const wet = fx.rain || fx.snow ? 0.1 : 0;
  const sat = 1 - (fx.clouds || 0) * 0.025 - (fx.darken || 0) * 1.2 - (fx.fog || 0) * 0.04 - wet;
  fx.sat = Math.min(Math.max(sat, 0.4), 1);
  // ...and hide the sun behind a veil
  fx.veil = (fx.clouds || 0) >= 10 || levels.fog >= 2;

  return { label: LABELS[code] || LABELS[0], fx, levels };
}

/* Timeline marks: rain ticks or snow dots, 1-3 by step
   (rain steps 1-6, snow steps 1-5) */
export function weatherMarks(levels) {
  const { rain, snow } = levels;
  if (!rain && !snow) return null;
  if (snow && snow >= rain) return { snow: true, count: Math.ceil((snow * 3) / 5) };
  return { snow: false, count: Math.ceil(rain / 2) };
}

