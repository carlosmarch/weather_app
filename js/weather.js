/* Data sources - all free, HTTPS and keyless:
 *  - Open-Meteo forecast   https://open-meteo.com
 *  - Open-Meteo geocoding  (city search)
 *  - BigDataCloud          (reverse geocoding: coords -> city name)
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,is_day,wind_speed_10m',
    forecast_days: 2,
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  const data = await getJSON(`${FORECAST_URL}?${params}`);
  const offset = data.utc_offset_seconds || 0;
  const c = data.current;

  const now = {
    time: c.time,
    temp: c.temperature_2m,
    feels: c.apparent_temperature,
    code: c.weather_code,
    isDay: !!c.is_day,
    wind: c.wind_speed_10m,
  };

  // Next 24 hours, starting with the current conditions
  const h = data.hourly;
  const hours = [{ ...now, isNow: true }];
  for (let i = 0; i < h.time.length && hours.length < 25; i++) {
    if (h.time[i] <= c.time) continue;
    hours.push({
      time: h.time[i],
      temp: h.temperature_2m[i],
      code: h.weather_code[i],
      isDay: !!h.is_day[i],
      wind: h.wind_speed_10m[i],
    });
  }

  return { offset, hours };
}

export async function reverseGeocode(lat, lon) {
  try {
    const params = new URLSearchParams({ latitude: lat, longitude: lon, localityLanguage: 'en' });
    const d = await getJSON(`${REVERSE_URL}?${params}`);
    const city = d.city || d.locality || d.principalSubdivision;
    return [city, d.countryCode || d.countryName].filter(Boolean).join(', ');
  } catch {
    return '';
  }
}

export async function searchCity(query, signal) {
  const params = new URLSearchParams({ name: query, count: 6, language: 'en', format: 'json' });
  const d = await getJSON(`${SEARCH_URL}?${params}`, signal);
  return (d.results || []).map(r => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    label: `${r.name}, ${r.country_code || r.country || ''}`.replace(/, $/, ''),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    // Open-Meteo explains bad requests: {"error": true, "reason": "..."}
    let reason = '';
    try { reason = (await res.json()).reason || ''; } catch {}
    throw new Error(`HTTP ${res.status}${reason ? ` · ${reason}` : ''}`);
  }
  return res.json();
}
