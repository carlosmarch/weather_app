/* Explore: places where the sky is extreme right now.
 * A fixed list of cities known for cold, heat, rain, snow, storms, fog and
 * wind, spread over both hemispheres so some are always in season, plus the
 * world capitals so rain, snow and storms almost always turn up somewhere.
 * Their current weather is fetched in a few requests and each theme ranks
 * them live.
 * [name, region, countryCode, latitude, longitude]
 */
import { getCondition } from './conditions.js';
import { cities } from './cities.js';

const PLACES = [
  // cold
  ['Oymyakon', 'Sakha, Russia', 'RU', 63.46, 142.79],
  ['Yakutsk', 'Sakha, Russia', 'RU', 62.03, 129.73],
  ['Verkhoyansk', 'Sakha, Russia', 'RU', 67.55, 133.39],
  ['Norilsk', 'Krasnoyarsk Krai, Russia', 'RU', 69.35, 88.2],
  ['Utqiagvik', 'Alaska, United States', 'US', 71.29, -156.79],
  ['Fairbanks', 'Alaska, United States', 'US', 64.84, -147.72],
  ['Yellowknife', 'Northwest Territories, Canada', 'CA', 62.45, -114.37],
  ['Iqaluit', 'Nunavut, Canada', 'CA', 63.75, -68.52],
  ['Alert', 'Nunavut, Canada', 'CA', 82.5, -62.35],
  ['Longyearbyen', 'Svalbard, Norway', 'SJ', 78.22, 15.65],
  ['Qaanaaq', 'Greenland', 'GL', 77.47, -69.23],
  ['Ulaanbaatar', 'Mongolia', 'MN', 47.92, 106.92],
  ['Harbin', 'Heilongjiang, China', 'CN', 45.8, 126.53],
  ['South Pole', 'Antarctica', 'AQ', -89.99, 0],
  ['Vostok Station', 'Antarctica', 'AQ', -78.46, 106.84],
  ['McMurdo Station', 'Antarctica', 'AQ', -77.85, 166.67],
  // heat
  ['Kuwait City', 'Kuwait', 'KW', 29.38, 47.99],
  ['Basra', 'Iraq', 'IQ', 30.51, 47.81],
  ['Ahvaz', 'Khuzestan, Iran', 'IR', 31.32, 48.67],
  ['Jacobabad', 'Sindh, Pakistan', 'PK', 28.28, 68.44],
  ['Death Valley', 'California, United States', 'US', 36.46, -116.87],
  ['Phoenix', 'Arizona, United States', 'US', 33.45, -112.07],
  ['Timbuktu', 'Mali', 'ML', 16.77, -3.01],
  ['Niamey', 'Niger', 'NE', 13.51, 2.11],
  ['Khartoum', 'Sudan', 'SD', 15.5, 32.56],
  ['Dallol', 'Afar, Ethiopia', 'ET', 14.24, 40.3],
  ['Riyadh', 'Saudi Arabia', 'SA', 24.71, 46.68],
  ['Mecca', 'Saudi Arabia', 'SA', 21.42, 39.83],
  ['Alice Springs', 'Northern Territory, Australia', 'AU', -23.7, 133.88],
  ['Marble Bar', 'Western Australia, Australia', 'AU', -21.17, 119.75],
  // rain and storms
  ['Mawsynram', 'Meghalaya, India', 'IN', 25.3, 91.58],
  ['Mumbai', 'Maharashtra, India', 'IN', 19.08, 72.88],
  ['Dhaka', 'Bangladesh', 'BD', 23.81, 90.41],
  ['Quibdó', 'Chocó, Colombia', 'CO', 5.69, -76.66],
  ['Maracaibo', 'Zulia, Venezuela', 'VE', 10.65, -71.64],
  ['Manaus', 'Amazonas, Brazil', 'BR', -3.12, -60.02],
  ['Belém', 'Pará, Brazil', 'BR', -1.46, -48.49],
  ['Monrovia', 'Liberia', 'LR', 6.3, -10.8],
  ['Douala', 'Littoral, Cameroon', 'CM', 4.05, 9.77],
  ['Kampala', 'Uganda', 'UG', 0.35, 32.58],
  ['Singapore', 'Singapore', 'SG', 1.35, 103.82],
  ['Kuala Lumpur', 'Malaysia', 'MY', 3.14, 101.69],
  ['Bogor', 'West Java, Indonesia', 'ID', -6.6, 106.8],
  ['Padang', 'West Sumatra, Indonesia', 'ID', -0.95, 100.35],
  ['Manila', 'Philippines', 'PH', 14.6, 120.98],
  ['Hong Kong', 'Hong Kong', 'HK', 22.32, 114.17],
  ['Darwin', 'Northern Territory, Australia', 'AU', -12.46, 130.84],
  ['Hilo', 'Hawaii, United States', 'US', 19.72, -155.08],
  ['Miami', 'Florida, United States', 'US', 25.76, -80.19],
  ['Kolkata', 'West Bengal, India', 'IN', 22.57, 88.36],
  ['Lagos', 'Nigeria', 'NG', 6.52, 3.38],
  ['Bukavu', 'South Kivu, DR Congo', 'CD', -2.51, 28.86],
  ['São Paulo', 'Brazil', 'BR', -23.55, -46.63],
  ['Brisbane', 'Queensland, Australia', 'AU', -27.47, 153.03],
  ['Tampa', 'Florida, United States', 'US', 27.95, -82.46],
  ['Bergen', 'Vestland, Norway', 'NO', 60.39, 5.32],
  ['Ketchikan', 'Alaska, United States', 'US', 55.34, -131.64],
  ['Milford Sound', 'Southland, New Zealand', 'NZ', -44.67, 167.93],
  // snow
  ['Aomori', 'Aomori, Japan', 'JP', 40.82, 140.74],
  ['Sapporo', 'Hokkaido, Japan', 'JP', 43.06, 141.35],
  ['Buffalo', 'New York, United States', 'US', 42.89, -78.88],
  ['Quebec City', 'Quebec, Canada', 'CA', 46.81, -71.21],
  ['Valdez', 'Alaska, United States', 'US', 61.13, -146.35],
  ['Tromsø', 'Troms, Norway', 'NO', 69.65, 18.96],
  ['Murmansk', 'Murmansk Oblast, Russia', 'RU', 68.97, 33.07],
  ['Zermatt', 'Valais, Switzerland', 'CH', 46.02, 7.75],
  ['Ushuaia', 'Tierra del Fuego, Argentina', 'AR', -54.8, -68.3],
  ['Anchorage', 'Alaska, United States', 'US', 61.22, -149.9],
  ['Whitehorse', 'Yukon, Canada', 'CA', 60.72, -135.06],
  ['Kiruna', 'Lapland, Sweden', 'SE', 67.86, 20.23],
  ['Arkhangelsk', 'Arkhangelsk Oblast, Russia', 'RU', 64.54, 40.54],
  ['Vorkuta', 'Komi, Russia', 'RU', 67.5, 64.05],
  ['Magadan', 'Magadan Oblast, Russia', 'RU', 59.57, 150.8],
  ['Petropavlovsk-Kamchatsky', 'Kamchatka, Russia', 'RU', 53.02, 158.65],
  ['Chamonix', 'Haute-Savoie, France', 'FR', 45.92, 6.87],
  ['Leh', 'Ladakh, India', 'IN', 34.15, 77.58],
  ['Lhasa', 'Tibet, China', 'CN', 29.65, 91.13],
  // fog
  ['San Francisco', 'California, United States', 'US', 37.77, -122.42],
  ['Lima', 'Peru', 'PE', -12.05, -77.04],
  ['Chongqing', 'China', 'CN', 29.56, 106.55],
  ['Milan', 'Lombardy, Italy', 'IT', 45.46, 9.19],
  ["St. John's", 'Newfoundland, Canada', 'CA', 47.56, -52.71],
  // wind
  ['Mount Washington', 'New Hampshire, United States', 'US', 44.27, -71.3],
  ['Wellington', 'New Zealand', 'NZ', -41.29, 174.78],
  ['Punta Arenas', 'Magallanes, Chile', 'CL', -53.16, -70.91],
  ['Stanley', 'Falkland Islands', 'FK', -51.7, -57.85],
  ['Port-aux-Français', 'Kerguelen Islands', 'TF', -49.35, 70.22],
  ['Commonwealth Bay', 'Antarctica', 'AQ', -67, 142.66],
  ['Tórshavn', 'Faroe Islands', 'FO', 62.01, -6.77],
  ['Reykjavík', 'Iceland', 'IS', 64.15, -21.94],
].map(([name, region, code, lat, lon]) => ({ name, region, label: `${name}, ${code}`, lat, lon }));

// capitals, minus those already on the list (within ~50 km)
const near = (a, b) => Math.abs(a.lat - b.lat) < 0.5 && Math.abs(a.lon - b.lon) < 0.5;
for (const [name, country, lat, lon, code] of cities) {
  const place = { name, region: country, label: `${name}, ${code || country}`, lat, lon };
  if (!PLACES.some(p => near(p, place))) PLACES.push(place);
}

/* Each theme keeps the places that match and orders them, most extreme first.
   score: a number (higher = more extreme) or null to leave the place out.
   Rain, snow, fog and storms use the same steps the scene draws, so a place
   listed under "Rain" really rains on screen. */
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
export const THEMES = [
  { id: 'cold', name: 'Coldest', empty: '',
    score: p => -p.now.temp },
  { id: 'hot', name: 'Hottest', empty: '',
    score: p => p.now.temp },
  { id: 'golden', name: 'Golden hour', empty: 'No city on the list is at golden hour right now',
    // sun from 4° below to 6° above the horizon, best around 1° up
    score: p => (p.sun.elevation >= -4 && p.sun.elevation <= 6 ? -Math.abs(p.sun.elevation - 1) : null),
    detail: p => {
      const e = Math.round(p.sun.elevation);
      return `${p.sun.rising ? 'Sunrise' : 'Sunset'} · sun ${Math.abs(e)}° ${e < 0 ? 'below' : 'up'}`;
    } },
  { id: 'rain', name: 'Rain', empty: 'No rain on the list right now',
    score: p => (p.levels.rain && p.levels.rain >= p.levels.snow ? p.levels.rain * 100 + num(p.now.data.rain) : null),
    detail: p => (p.now.data.rain > 0 ? `${p.now.data.rain.toFixed(1)} mm/h` : '') },
  { id: 'snow', name: 'Snowing', empty: 'Nowhere on the list is snowing right now',
    score: p => (p.levels.snow ? p.levels.snow * 100 + num(p.now.data.snow) : null),
    detail: p => (p.now.data.snow > 0 ? `${p.now.data.snow.toFixed(1)} cm/h` : '') },
  { id: 'storm', name: 'Storms', empty: 'No thunderstorms on the list right now',
    score: p => (p.levels.storm ? p.levels.storm * 100 + num(p.now.data.rain) : null) },
  { id: 'fog', name: 'Fog', empty: 'No fog on the list right now',
    score: p => (p.levels.fog ? p.levels.fog * 100000 - num(p.now.data.vis) : null),
    detail: p => (typeof p.now.data.vis === 'number' ? `${Math.round(p.now.data.vis)} m visibility` : '') },
  { id: 'wind', name: 'Windiest', empty: '',
    score: p => Math.max(num(p.now.wind), num(p.now.data.gust)),
    detail: p => `${Math.round(Math.max(num(p.now.wind), num(p.now.data.gust)))} km/h` },
];

export const EXPLORE_PLACES = PLACES;

/* now: one { offset, now } per place, in PLACES order (see getNowMany) */
export function rank(themeId, now, count = 6) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  return PLACES
    .map((place, i) => {
      if (!now[i]) return null;
      const n = now[i].now;
      const { label, levels } = getCondition(n.code, n.wind, n.data);
      const sun = sunAt(place.lat, place.lon, n.time ? n.time * 1000 : Date.now());
      const p = { ...place, now: n, offset: now[i].offset, condition: label, levels, sun };
      const score = theme.score(p);
      return score === null || !Number.isFinite(score) ? null : { ...p, score, detail: theme.detail?.(p) || '' };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/* Sun height above the horizon (degrees) and whether it's rising,
   from the usual low-precision solar position formulas (~0.5° accuracy) */
export function sunAt(lat, lon, ms) {
  const rad = Math.PI / 180;
  const d = (ms - 946728000000) / 86400000; // days since J2000 (2000-01-01 12:00 UTC)
  const g = (357.529 + 0.98560028 * d) * rad;            // mean anomaly
  const q = 280.459 + 0.98564736 * d;                    // mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * rad;             // axial tilt
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = 18.697374558 + 24.06570982441908 * d;     // sidereal time, hours
  const ha = (gmst * 15 + lon - ra) * rad;               // local hour angle
  const elevation = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha)) / rad;
  return { elevation, rising: Math.sin(ha) < 0 }; // before local noon the hour angle is negative
}
