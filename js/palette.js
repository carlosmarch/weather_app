/* Background colours. Same palette as the original Timecast, but
 * blended between stops instead of jumping from bucket to bucket.
 * Blending happens in OKLCH so in-between colours stay clean
 * (purple -> yellow passes through pink, not olive).
 */

// [celsius, colour] - midpoints of the original temperature buckets
const TEMP_STOPS = [
  [-10, '#24303F'], // freezing (new)
  [3,   '#393E46'], // too cold
  [8,   '#48466D'], // cold
  [12.5,'#F8A79B'], // warm
  [17.5,'#FFD460'], // hot
  [25,  '#EB586F'], // very hot
  [35,  '#EA5455'], // damn hot
];

// [hour, colour] - midpoints of the original time-of-day buckets (cyclic)
const TIME_STOPS = [
  [3,    '#000000'],
  [7.5,  '#563761'],
  [10.5, '#F5FFAE'],
  [14,   '#FFB400'],
  [17.5, '#56132A'],
  [21.5, '#1F1F1F'],
  [27,   '#000000'], // = 3h next day
];

export function colorByCelsius(celsius) {
  return interpolate(TEMP_STOPS, celsius);
}

export function colorByHour(hour) {
  const h = hour < 3 ? hour + 24 : hour;
  return interpolate(TIME_STOPS, h);
}

/* Bad weather drains colour from the sky: sat 1 = untouched, 0 = grey */
export function desaturate(hex, sat) {
  if (sat >= 1) return hex;
  const [l, c, h] = hexToOklch(hex);
  return oklchToHex([l * (0.92 + 0.08 * sat), c * sat, h]);
}

/* Sun intensity, from the original returnColorByCelsius side effects */
export function sunIntensity(celsius) {
  if (celsius >= 30) return { pulses: 3, big: true, shining: true };
  if (celsius >= 20) return { pulses: 2, big: true, shining: true };
  if (celsius >= 15) return { pulses: 1, big: false, shining: false };
  return { pulses: 0, big: false, shining: false };
}

/* Stars, from the original returnColorByCurrentTime side effects */
export function starsByHour(hour) {
  if (hour >= 19 || hour < 6) return 80;
  if (hour >= 16) return 50;
  return 0;
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* Perceptual mix in OKLCH (shortest way round the hue circle) */
export function mix(a, b, t = 0.5) {
  const [l1, c1, h1] = hexToOklch(a);
  const [l2, c2, h2] = hexToOklch(b);
  // a grey has no meaningful hue: borrow the other colour's
  const ha = c1 < 0.02 ? h2 : h1;
  const hb = c2 < 0.02 ? h1 : h2;
  let dh = hb - ha;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklchToHex([l1 + (l2 - l1) * t, c1 + (c2 - c1) * t, ha + dh * t]);
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function interpolate(stops, value) {
  if (value <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [v1, c1] = stops[i];
    if (value <= v1) {
      const [v0, c0] = stops[i - 1];
      // ease so most of each bucket keeps its original colour
      const t = smoothstep((value - v0) / (v1 - v0));
      return mix(c0, c1, t);
    }
  }
  return stops[stops.length - 1][1];
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/* ---- sRGB <-> OKLCH (https://bottosson.github.io/posts/oklab/) ---- */

function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}

function oklchToHex([L, C, H]) {
  const a = C * Math.cos(H * Math.PI / 180);
  const b = C * Math.sin(H * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return '#' + rgb.map(v => {
    const c = Math.round(Math.min(Math.max(toGamma(v), 0), 1) * 255);
    return c.toString(16).padStart(2, '0');
  }).join('');
}

function toLinear(v) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function toGamma(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;
}
