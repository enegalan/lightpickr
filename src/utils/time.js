import { trimFifo, pad2 } from './common.js';
import { defaultMonthNames, defaultWeekdayNames } from './locale.js';
import lightpickrDefaults from '../core/defaults.js';

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
 * @param {number} m
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
 * @param {{ enableTime: boolean, timePart: { hours: number, minutes: number } }} state
 * @returns {Date}
 */
export function timestampToPickerDate(ts, state) {
    const d = new Date(ts);
    if (state.enableTime) {
        d.setHours(state.timePart.hours, state.timePart.minutes, 0, 0);
    } else {
        d.setHours(0, 0, 0, 0);
    }
    return d;
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
        return _timestampFromDateString(value);
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
    return { y: ny, m, ts: ymdToTsStartOfDay(ny, m, dd) };
}

/**
 * @param {string} format
 * @param {number} ts
 * @param {{ hours?: number, minutes?: number }|null|undefined} timePart
 * @param {import('./state.js').LightpickrInternalState|import('./state.js').LightpickrOptions|null|undefined} [state]
 * @returns {string}
 */
export function formatDate(format, ts, timePart, state) {
    const { y, m, d } = tsToYmd(ts);
    const dateObj = new Date(ts);
    const dow = dateObj.getDay();
    const hours = timePart && typeof timePart.hours === 'number' ? timePart.hours : dateObj.getHours();
    const minutes = timePart && typeof timePart.minutes === 'number' ? timePart.minutes : dateObj.getMinutes();
    const opts = state && typeof state === 'object' ? state : lightpickrDefaults;
    opts.monthsField = opts.monthsField && typeof opts.monthsField === 'string' ? opts.monthsField : lightpickrDefaults.monthsField;
    const monthShort = defaultMonthNames(opts.locale, 'monthsShort');
    const monthLong = defaultMonthNames(opts.locale, 'monthsLong');
    const dayShort = defaultWeekdayNames(opts.locale, 'weekdaysShort');
    const dayLong = defaultWeekdayNames(opts.locale, 'weekdaysLong');
    const yy = String(y).slice(-2);
    const blockStart = y - lightpickrDefaults.yearGridRadius;
    const blockEnd = blockStart + lightpickrDefaults.yearGridCount - 1;

    let out = '';
    let i = 0;
    while (i < format.length) {
        const rest = format.slice(i);
        if (rest.startsWith('yyyy1')) {
            out += String(blockStart);
            i += 5;
        } else if (rest.startsWith('yyyy2')) {
            out += String(blockEnd);
            i += 5;
        } else if (rest.startsWith('MMMM')) {
            out += monthLong[m] || '';
            i += 4;
        } else if (rest.startsWith('MMM')) {
            out += monthShort[m] || '';
            i += 3;
        } else if (rest.startsWith('yyyy') || rest.startsWith('YYYY')) {
            out += String(y);
            i += 4;
        } else if (rest.startsWith('yy')) {
            out += yy;
            i += 2;
        } else if (rest.startsWith('MM')) {
            out += pad2(m + 1);
            i += 2;
        } else if (rest.startsWith('dd') || rest.startsWith('DD')) {
            out += pad2(d);
            i += 2;
        } else if (rest.startsWith('EEEE')) {
            out += dayLong[dow] || '';
            i += 4;
        } else if (rest.startsWith('HH')) {
            out += pad2(hours);
            i += 2;
        } else if (rest.startsWith('mm')) {
            out += pad2(minutes);
            i += 2;
        } else if (rest.startsWith('M')) {
            out += String(m + 1);
            i += 1;
        } else if (rest.startsWith('d')) {
            out += String(d);
            i += 1;
        } else if (rest.startsWith('E')) {
            out += dayShort[dow] || '';
            i += 1;
        } else if (rest.startsWith('T')) {
            out += String(ts);
            i += 1;
        } else {
            out += format[i];
            i += 1;
        }
    }
    return out;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} hours
 * @param {number} minutes
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setTimePart(state, hours, minutes) {
    const next = Object.assign({}, state);
    const h = _clampToStep(hours, state.minHours, state.maxHours, state.hoursStep);
    const m = _clampToStep(minutes, state.minMinutes, state.maxMinutes, state.minutesStep);
    next.timePart = { hours: h, minutes: m };
    return next;
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
 * @param {{ range: boolean, multipleEnabled: boolean, multipleLimit: number }} state
 * @param {unknown} selectedDates
 * @returns {number[]|number[][]}
 */
export function parseSelectedDates(state, selectedDates) {
    if (!Array.isArray(selectedDates)) {
        return [];
    }
    if (state.range) {
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
            pairs.push([startOfDayTs(Math.min(a, b)), startOfDayTs(Math.max(a, b))]);
        }
        return trimFifo(pairs, state.multipleLimit);
    }
    const normalized = [];
    for (let i = 0; i < selectedDates.length; i++) {
        const ts = toTimestamp(selectedDates[i]);
        if (ts == null) {
            continue;
        }
        const day = startOfDayTs(ts);
        if (normalized.indexOf(day) < 0) {
            normalized.push(day);
        }
    }
    if (state.multipleEnabled) {
        return trimFifo(normalized, state.multipleLimit);
    }
    return normalized.length ? [normalized[0]] : [];
}

/**
 * @private
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {number}
 */
function _clampToStep(value, min, max, step) {
    const bounded = Math.max(min, Math.min(max, Math.floor(value)));
    const offset = bounded - min;
    const snapped = min + Math.round(offset / step) * step;
    return Math.max(min, Math.min(max, snapped));
}

/**
 * @private
 * @param {string} str
 * @returns {number|null}
 */
function _timestampFromDateString(str) {
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
            return _localTimestampFromParts(y, mo, d, h, mi, s);
        }
        return _localTimestampFromParts(y, mo, d);
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


/**
 * @private
 * @param {number} y
 * @param {number} mo
 * @param {number} d
 * @param {number} [h]
 * @param {number} [mi]
 * @param {number} [sec]
 * @returns {number|null}
 */
function _localTimestampFromParts(y, mo, d, h, mi, sec) {
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
