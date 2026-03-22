import { isSameDay, startOfDayTs, toTimestamp } from './utils.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dayTs
 * @returns {boolean}
 */
export function isDateDisabled(state, dayTs) {
  const d = startOfDayTs(dayTs);
  if (state.minDate != null && d < state.minDate) {
    return true;
  }
  if (state.maxDate != null && d > state.maxDate) {
    return true;
  }
  const arr = state.disabledDatesSorted;
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = arr[mid];
    if (v === d) {
      return true;
    }
    if (v < d) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return false;
}

/**
 * @param {number[][]} ranges
 * @param {number} max
 * @returns {number[][]}
 */
function trimRangesFifo(ranges, max) {
  const out = ranges.slice();
  while (out.length > max) {
    out.shift();
  }
  return out;
}

/**
 * @param {number[]} dates
 * @param {number} max
 * @returns {number[]}
 */
function trimDatesFifo(dates, max) {
  const out = dates.slice();
  while (out.length > max) {
    out.shift();
  }
  return out;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dayTs
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function applyDaySelection(state, dayTs) {
  const d = startOfDayTs(dayTs);
  if (isDateDisabled(state, d)) {
    return { state: state, changed: false };
  }

  const next = Object.assign({}, state);
  next.selectedDates = cloneSelection(state);

  if (state.range) {
    const maxR = state.multipleLimit;
    if (state.pendingRangeStart == null) {
      next.pendingRangeStart = d;
      next.focusDate = d;
      return { state: next, changed: true };
    }
    const a = state.pendingRangeStart;
    const start = Math.min(a, d);
    const end = Math.max(a, d);
    const pair = [start, end];
    const list = Array.isArray(next.selectedDates[0]) ? /** @type {number[][]} */ (next.selectedDates) : [];
    const merged = trimRangesFifo(list.concat([pair]), maxR);
    next.selectedDates = merged;
    next.pendingRangeStart = null;
    next.focusDate = d;
    return { state: next, changed: true };
  }

  if (state.multipleEnabled) {
    const maxD = state.multipleLimit;
    let dates = /** @type {number[]} */ (next.selectedDates);
    if (!Array.isArray(dates) || (dates.length && Array.isArray(dates[0]))) {
      dates = [];
    }
    const idx = dates.findIndex((x) => isSameDay(x, d));
    if (idx >= 0) {
      dates = dates.slice();
      dates.splice(idx, 1);
    } else {
      dates = dates.concat([d]);
      dates = trimDatesFifo(dates, maxD);
    }
    next.selectedDates = dates;
    next.focusDate = d;
    return { state: next, changed: true };
  }

  next.selectedDates = [d];
  next.focusDate = d;
  return { state: next, changed: true };
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]|number[][]}
 */
function cloneSelection(state) {
  const s = state.selectedDates;
  if (!s || !s.length) {
    return [];
  }
  if (Array.isArray(s[0])) {
    return s.map((p) => /** @type {number[]} */ (p).slice());
  }
  return /** @type {number[]} */ (s).slice();
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number|Date|string} date
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function selectDateExplicit(state, date) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return { state: state, changed: false };
  }
  return applyDaySelection(state, ts);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number|Date|string} date
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function unselectDate(state, date) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return { state: state, changed: false };
  }
  const d = startOfDayTs(ts);
  const next = Object.assign({}, state);
  const sel = cloneSelection(state);
  if (state.range) {
    const list = /** @type {number[][]} */ (sel);
    const filtered = list.filter((pair) => !(d >= pair[0] && d <= pair[1]));
    next.selectedDates = filtered;
  } else {
    const dates = /** @type {number[]} */ (sel);
    next.selectedDates = dates.filter((x) => !isSameDay(x, d));
  }
  if (state.pendingRangeStart != null && isSameDay(state.pendingRangeStart, d)) {
    next.pendingRangeStart = null;
  }
  next.focusDate = d;
  return { state: next, changed: true };
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function clearSelectionState(state) {
  const next = Object.assign({}, state);
  next.selectedDates = [];
  next.pendingRangeStart = null;
  next.rangeAnchor = null;
  return next;
}