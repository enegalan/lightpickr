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
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

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
 * @param {boolean} range
 * @returns {{ multipleLimit: number, multipleEnabled: boolean }}
 */
export function normalizeMultipleOption(multiple, range) {
  if (multiple === true) {
    return { multipleLimit: 2, multipleEnabled: true };
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
 * @param {import('./state.js').LightpickrOptions} opts
 * @returns {string[]}
 */
export function defaultMonthNames(opts) {
  if (opts.locale && typeof opts.locale === 'object' && Array.isArray(opts.locale.months)) {
    return opts.locale.months;
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
