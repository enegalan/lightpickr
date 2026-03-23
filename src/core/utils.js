/**
 * @param {number} ts
 * @returns {{ y: number, m: number, d: number }}
 */
export function tsToYmd(ts) {
  const d = new Date(ts);
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}

/**
 * @param {number} y
 * @param {number} m 0-11
 * @param {number} d
 * @returns {number}
 */
export function ymdToTsStartOfDay(y, m, d) {
  return new Date(y, m, d, 0, 0, 0, 0).getTime();
}

/**
 * @param {number} ts
 * @returns {number}
 */
export function startOfDayTs(ts) {
  const { y, m, d } = tsToYmd(ts);
  return ymdToTsStartOfDay(y, m, d);
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return startOfDayTs(a) === startOfDayTs(b);
}

/**
 * @param {number} ts
 * @param {number} start
 * @param {number} end
 * @returns {boolean}
 */
export function isInClosedRangeDay(ts, start, end) {
  const day = startOfDayTs(ts);
  const s = startOfDayTs(start);
  const e = startOfDayTs(end);
  return day >= s && day <= e;
}

/**
 * @param {number} y
 * @param {number} m
 * @returns {number}
 */
export function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/**
 * @param {number|Date|string|null|undefined} value
 * @returns {number|null}
 */
export function toTimestamp(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'string') {
    return timestampFromDateString(value);
  }
  return null;
}

/**
 * @param {number} y
 * @param {number} m
 * @returns {number} 0-6 Sun-Sat
 */
export function firstWeekdayOfMonth(y, m) {
  return new Date(y, m, 1).getDay();
}

/**
 * @param {number} ts
 * @param {number} delta
 * @returns {{ y: number, m: number, ts: number }}
 */
export function addMonths(ts, delta) {
  const { y, m, d } = tsToYmd(ts);
  const ref = new Date(y, m + delta, 1);
  const ny = ref.getFullYear();
  const mm = ref.getMonth();
  const dim = daysInMonth(ny, mm);
  const dd = Math.min(d, dim);
  return { y: ny, m: mm, ts: ymdToTsStartOfDay(ny, mm, dd) };
}

/**
 * @param {number} ts
 * @param {number} delta
 * @returns {{ y: number, m: number, ts: number }}
 */
export function addYears(ts, delta) {
  const { y, m, d } = tsToYmd(ts);
  const ny = y + delta;
  const dim = daysInMonth(ny, m);
  const dd = Math.min(d, dim);
  return { y: ny, m, m, ts: ymdToTsStartOfDay(ny, m, dd) };
}

/**
 * @param {string} format
 * @param {number} ts
 * @param {{ hours?: number, minutes?: number }} [timePart]
 * @returns {string}
 */
export function formatDate(format, ts, timePart) {
  const { y, m, d } = tsToYmd(ts);
  const pad2 = (n) => String(n).padStart(2, '0');
  const hours = timePart && typeof timePart.hours === 'number' ? timePart.hours : new Date(ts).getHours();
  const minutes = timePart && typeof timePart.minutes === 'number' ? timePart.minutes : new Date(ts).getMinutes();
  return format
    .replace(/YYYY/g, String(y))
    .replace(/MM/g, pad2(m + 1))
    .replace(/DD/g, pad2(d))
    .replace(/HH/g, pad2(hours))
    .replace(/mm/g, pad2(minutes));
}

/**
 * @param {unknown} multiple
 * @returns {{ multipleLimit: number, multipleEnabled: boolean }}
 */
export function normalizeMultipleOption(multiple) {
  if (multiple === true) {
    return { multipleLimit: Number.POSITIVE_INFINITY, multipleEnabled: true };
  }
  if (multiple === false || multiple == null || multiple === 0 || multiple === 1) {
    return { multipleLimit: 1, multipleEnabled: false };
  }
  const n = Number(multiple);
  if (Number.isFinite(n) && n > 1) {
    return { multipleLimit: Math.floor(n), multipleEnabled: true };
  }
  return { multipleLimit: 1, multipleEnabled: false };
}

/**
 * @param {import('./state.js').LightpickrOptions|import('./state.js').LightpickrInternalState} opts
 * @param {string} [monthsField]
 * @returns {string[]}
 */
export function defaultMonthNames(opts, monthsField) {
  const field = typeof monthsField === 'string' && monthsField.trim() ? monthsField.trim() : 'monthsShort';
  if (opts.locale && typeof opts.locale === 'object') {
    const locale = opts.locale;
    if (Array.isArray(locale[field]) && locale[field].length === 12) {
      return locale[field];
    }
    if (field === 'monthsShort' && Array.isArray(locale.months) && locale.months.length === 12) {
      return locale.months;
    }
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

/**
 * @param {import('./state.js').LightpickrOptions} opts
 * @returns {string[]}
 */
export function defaultWeekdayNames(opts) {
  if (opts.locale && typeof opts.locale === 'object' && Array.isArray(opts.locale.weekdays)) {
    return opts.locale.weekdays;
  }
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
}

/**
 * @param {unknown} firstDay
 * @returns {number|null}
 */
export function normalizeFirstDay(firstDay) {
  if (typeof firstDay !== 'number' || !Number.isFinite(firstDay)) {
    return null;
  }
  return ((Math.floor(firstDay) % 7) + 7) % 7;
}

/**
 * @param {unknown} weekends
 * @returns {number[]}
 */
export function normalizeWeekendIndexes(weekends) {
  if (!Array.isArray(weekends)) {
    return [6, 0];
  }
  const seen = new Set();
  const out = [];
  for (let i = 0; i < weekends.length; i++) {
    const raw = weekends[i];
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      continue;
    }
    const idx = ((Math.floor(n) % 7) + 7) % 7;
    if (!seen.has(idx)) {
      seen.add(idx);
      out.push(idx);
    }
  }
  return out.length ? out : [6, 0];
}

/**
 * @param {unknown} view
 * @returns {'day'|'month'|'year'}
 */
export function normalizeViewOption(view) {
  if (view === 'day' || view === 'days') {
    return 'day';
  }
  if (view === 'month' || view === 'months') {
    return 'month';
  }
  if (view === 'year' || view === 'years') {
    return 'year';
  }
  return 'day';
}

/**
 * @param {unknown} allowedViews
 * @returns {('day'|'month'|'year')[]}
 */
export function normalizeAllowedViews(allowedViews) {
  const out = [];
  const seen = new Set();
  const add = function (raw) {
    const view = normalizeViewOption(raw);
    if ((raw === 'day' || raw === 'days' || raw === 'month' || raw === 'months' || raw === 'year' || raw === 'years') && !seen.has(view)) {
      seen.add(view);
      out.push(view);
    }
  };
  if (Array.isArray(allowedViews)) {
    for (let i = 0; i < allowedViews.length; i++) {
      add(allowedViews[i]);
    }
  } else if (typeof allowedViews === 'string') {
    add(allowedViews);
  }
  if (!out.length) {
    return ['day', 'month', 'year'];
  }
  return out;
}

/**
 * @param {('day'|'month'|'year')[]} allowedViews
 * @param {'day'|'month'|'year'} requestedView
 * @returns {'day'|'month'|'year'}
 */
export function clampViewToAllowed(allowedViews, requestedView) {
  if (allowedViews.indexOf(requestedView) >= 0) {
    return requestedView;
  }
  const order = ['day', 'month', 'year'];
  const reqIdx = order.indexOf(requestedView);
  let best = allowedViews[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < allowedViews.length; i++) {
    const cand = allowedViews[i];
    const dist = Math.abs(order.indexOf(cand) - reqIdx);
    if (dist < bestDist) {
      bestDist = dist;
      best = cand;
    }
  }
  return best;
}

/**
 * @param {unknown} showEvent
 * @returns {string[]}
 */
export function normalizeShowEvents(showEvent) {
  if (typeof showEvent === 'string' && showEvent.trim()) {
    return [showEvent.trim()];
  }
  if (Array.isArray(showEvent)) {
    const out = [];
    const seen = new Set();
    for (let i = 0; i < showEvent.length; i++) {
      const value = showEvent[i];
      if (typeof value !== 'string') {
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed || seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);
      out.push(trimmed);
    }
    if (out.length) {
      return out;
    }
  }
  return ['focus'];
}

/**
 * @param {unknown} minHours
 * @param {unknown} maxHours
 * @param {unknown} minMinutes
 * @param {unknown} maxMinutes
 * @param {unknown} hoursStep
 * @param {unknown} minutesStep
 * @returns {{ minHours: number, maxHours: number, minMinutes: number, maxMinutes: number, hoursStep: number, minutesStep: number }}
 */
export function normalizeTimeBounds(minHours, maxHours, minMinutes, maxMinutes, hoursStep, minutesStep) {
  const minH = Number.isFinite(Number(minHours)) ? Math.max(0, Math.min(23, Math.floor(Number(minHours)))) : 0;
  const rawMaxH = Number.isFinite(Number(maxHours)) ? Math.floor(Number(maxHours)) : 24;
  const maxH = Math.max(minH, Math.min(23, rawMaxH >= 24 ? 23 : rawMaxH));
  const minM = Number.isFinite(Number(minMinutes)) ? Math.max(0, Math.min(59, Math.floor(Number(minMinutes)))) : 0;
  const maxM = Number.isFinite(Number(maxMinutes)) ? Math.max(minM, Math.min(59, Math.floor(Number(maxMinutes)))) : 59;
  const stepH = Number.isFinite(Number(hoursStep)) ? Math.max(1, Math.floor(Number(hoursStep))) : 1;
  const stepM = Number.isFinite(Number(minutesStep)) ? Math.max(1, Math.floor(Number(minutesStep))) : 1;
  return {
    minHours: minH,
    maxHours: maxH,
    minMinutes: minM,
    maxMinutes: maxM,
    hoursStep: stepH,
    minutesStep: stepM
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {number}
 */
export function clampToStep(value, min, max, step) {
  const bounded = Math.max(min, Math.min(max, Math.floor(value)));
  const offset = bounded - min;
  const snapped = min + Math.round(offset / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

/**
 * @param {number[]|number[][]} selectedDates
 * @returns {number[]|number[][]}
 */
export function cloneSelectedDates(selectedDates) {
  if (!selectedDates || !selectedDates.length) {
    return [];
  }
  if (Array.isArray(selectedDates[0])) {
    return selectedDates.map((pair) => /** @type {number[]} */ (pair).slice());
  }
  return /** @type {number[]} */ (selectedDates).slice();
}

/**
 * @param {unknown} selectedDates
 * @param {number} max
 * @returns {number[][]}
 */
export function normalizeRangePairs(selectedDates, max) {
  if (!Array.isArray(selectedDates)) {
    return [];
  }
  const pairs = [];
  for (let i = 0; i < selectedDates.length; i++) {
    const pair = selectedDates[i];
    if (!Array.isArray(pair) || pair.length < 2) {
      continue;
    }
    const a = toTimestamp(pair[0]);
    const b = toTimestamp(pair[1]);
    if (a == null || b == null) {
      continue;
    }
    const start = startOfDayTs(Math.min(a, b));
    const end = startOfDayTs(Math.max(a, b));
    pairs.push([start, end]);
  }
  return trimFifo(pairs, max);
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} max
 * @returns {T[]}
 */
export function trimFifo(items, max) {
  const out = items.slice();
  while (out.length > max) {
    out.shift();
  }
  return out;
}

/**
 * @param {number} y
 * @param {number} mo 1-12
 * @param {number} d
 * @param {number} [h]
 * @param {number} [mi]
 * @param {number} [sec]
 * @returns {number|null}
 */
function localTimestampFromParts(y, mo, d, h, mi, sec) {
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  const m = Math.floor(mo) - 1;
  if (m < 0 || m > 11 || d < 1 || d > daysInMonth(y, m)) {
    return null;
  }
  if (h == null || mi == null) {
    return ymdToTsStartOfDay(y, m, d);
  }
  const s = sec != null ? sec : 0;
  if (h < 0 || h > 23 || mi < 0 || mi > 59 || s < 0 || s > 59) {
    return null;
  }
  const t = new Date(y, m, d, h, mi, s, 0).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * @private
 * @param {string} str
 * @returns {number|null}
 */
function timestampFromDateString(str) {
  const trimmed = String(str).trim();
  if (!trimmed) {
    return null;
  }
  /** Same separator twice: YYYY-MM-DD, optional T or space + H:mm[:ss]. */
  const m = /^(\d{4})([-/.])(\d{2})\2(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[3]);
    const d = Number(m[4]);
    if (m[5] !== undefined) {
      const h = Number(m[5]);
      const mi = Number(m[6]);
      const s = m[7] != null ? Number(m[7]) : 0;
      if (!Number.isFinite(h) || !Number.isFinite(mi) || !Number.isFinite(s)) {
        return null;
      }
      if (h < 0 || h > 23 || mi < 0 || mi > 59 || s < 0 || s > 59) {
        return null;
      }
      return localTimestampFromParts(y, mo, d, h, mi, s);
    }
    return localTimestampFromParts(y, mo, d);
  }
  if (/^\d{4}[/.]\d/.test(trimmed)) {
    return null;
  }
  if (/^\d{8}$/.test(trimmed)) {
    return null;
  }
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
    /^\d{4}\/\d{2}\/\d{2}$/.test(trimmed) ||
    /^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)
  ) {
    return null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}