/* Background colours. Same palette as the original Timecast, but
 * blended between stops instead of jumping from bucket to bucket.
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
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function mix(a, b, t = 0.5) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
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
