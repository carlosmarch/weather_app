/* Odometer-style text change. Characters that differ roll vertically:
   dir > 0 (forward in time): the new value comes up from below
   dir < 0 (back in time):    the new value comes down from above
   dir = 0 or reduced motion: plain swap.
   When the length changes (9° -> 10°) the whole text rolls as one piece. */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DURATION = 320;

export function rollText(el, text, dir = 0) {
  const prev = el.dataset.text ?? el.textContent;
  el.dataset.text = text;
  if (!dir || prev === text || reduceMotion.matches) {
    el.textContent = text;
    return;
  }
  const a = [...prev], b = [...text];
  const units = a.length === b.length ? b.map((c, i) => [a[i], c]) : [[prev, text]];
  const s = Math.sign(dir);

  el.textContent = '';
  let plain = '';
  const flush = () => { if (plain) { el.append(plain); plain = ''; } };
  for (const [from, to] of units) {
    if (from === to) { plain += to; continue; }
    flush();
    const wrap = document.createElement('span');
    wrap.className = 'roll';
    const next = document.createElement('span');
    next.className = 'roll__in';
    next.textContent = to;
    const old = document.createElement('span');
    old.className = 'roll__out';
    old.textContent = from;
    wrap.append(next, old);
    el.append(wrap);
    next.animate(
      [{ transform: `translateY(${s * 100}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: DURATION, easing: EASE });
    old.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translateY(${-s * 100}%)`, opacity: 0 }],
      { duration: DURATION, easing: EASE, fill: 'forwards' }).onfinish = () => old.remove();
  }
  flush();
}
