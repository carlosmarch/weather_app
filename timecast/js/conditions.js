/* Maps WMO weather codes (Open-Meteo) to a label and the
 * environment effects that draw it. Successor of the old icons.js.
 *
 * Effect values are intensities for a ~1440x900 screen; scene.js
 * scales them to the real viewport.
 */

const CONDITIONS = {
  0:  { label: 'clear sky',               fx: {} },
  1:  { label: 'mainly clear',            fx: { clouds: 3 } },
  2:  { label: 'partly cloudy',           fx: { clouds: 7 } },
  3:  { label: 'overcast',                fx: { clouds: 15, darken: 0.2 } },
  45: { label: 'fog',                     fx: { fog: 5, clouds: 5, darken: 0.1 } },
  48: { label: 'rime fog',                fx: { fog: 6, clouds: 5, snow: 10, darken: 0.1 } },
  51: { label: 'light drizzle',           fx: { rain: 25, clouds: 6 } },
  53: { label: 'drizzle',                 fx: { rain: 40, clouds: 8 } },
  55: { label: 'dense drizzle',           fx: { rain: 60, clouds: 10, darken: 0.1 } },
  56: { label: 'freezing drizzle',        fx: { rain: 30, snow: 15, clouds: 8 } },
  57: { label: 'dense freezing drizzle',  fx: { rain: 50, snow: 25, clouds: 10, darken: 0.1 } },
  61: { label: 'light rain',              fx: { rain: 60, clouds: 8 } },
  63: { label: 'rain',                    fx: { rain: 100, clouds: 12, darken: 0.15 } },
  65: { label: 'heavy rain',              fx: { rain: 160, clouds: 15, darken: 0.25 } },
  66: { label: 'freezing rain',           fx: { rain: 70, snow: 25, clouds: 10, darken: 0.1 } },
  67: { label: 'heavy freezing rain',     fx: { rain: 120, snow: 40, clouds: 15, darken: 0.2 } },
  71: { label: 'light snow',              fx: { snow: 40, clouds: 6 } },
  73: { label: 'snow',                    fx: { snow: 80, clouds: 10 } },
  75: { label: 'heavy snow',              fx: { snow: 140, clouds: 15, darken: 0.15 } },
  77: { label: 'snow grains',             fx: { snow: 60, clouds: 8 } },
  80: { label: 'rain showers',            fx: { rain: 70, clouds: 10 } },
  81: { label: 'heavy showers',           fx: { rain: 120, clouds: 14, darken: 0.15 } },
  82: { label: 'violent showers',         fx: { rain: 180, clouds: 15, darken: 0.25, wind: 10 } },
  85: { label: 'snow showers',            fx: { snow: 60, clouds: 10 } },
  86: { label: 'heavy snow showers',      fx: { snow: 120, clouds: 14, darken: 0.15 } },
  95: { label: 'thunderstorm',            fx: { rain: 100, clouds: 12, thunder: 3, darken: 0.25 } },
  96: { label: 'thunderstorm with hail',  fx: { rain: 110, snow: 30, clouds: 14, thunder: 3, darken: 0.25 } },
  99: { label: 'heavy hail storm',        fx: { rain: 140, snow: 50, clouds: 15, thunder: 4, darken: 0.3 } },
};

export const CODES = Object.keys(CONDITIONS).map(Number);

export function getCondition(code, windKmh = 0) {
  const base = CONDITIONS[code] || CONDITIONS[0];
  const fx = { ...base.fx };
  // Strong wind adds streaks and slants the rain (old createWind @todo)
  if (windKmh >= 25) fx.wind = Math.max(fx.wind || 0, Math.round((windKmh - 15) / 2));
  fx.slant = Math.min(windKmh / 60, 0.6);
  return { label: base.label, fx };
}
