import { cloneSelectedDates, findDayIndex, isInClosedRangeDay, isSameDay, isDayDisabled, startOfDayTs } from '../utils/time.js';
import { trimFifo } from '../utils/common.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} timestamp
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function selectDate(state, timestamp) {
  if (timestamp == null) {
    return { state: state, changed: false };
  }
  const d = startOfDayTs(timestamp);
  if (isDayDisabled(state, d)) {
    return { state: state, changed: false };
  }

  const next = Object.assign({}, state);
  next.selectedDates = cloneSelectedDates(state.selectedDates);

  if (state.range) {
    if (state.pendingRangeStart == null) {
      if (Array.isArray(next.selectedDates[0])) {
        next.selectedDates = [];
      }
      next.pendingRangeStart = d;
      next.focusDate = d;
      return { state: next, changed: true };
    }
    const pair = [Math.min(state.pendingRangeStart, d), Math.max(state.pendingRangeStart, d)];
    const list = Array.isArray(next.selectedDates[0]) ? /** @type {number[][]} */ (next.selectedDates) : [];
    next.selectedDates = trimFifo(list.concat([pair]), state.multipleLimit);
    next.pendingRangeStart = null;
    next.focusDate = d;
    return { state: next, changed: true };
  }

  if (state.multipleEnabled) {
    let dates = /** @type {number[]} */ (next.selectedDates);
    if (!Array.isArray(dates) || (dates.length && Array.isArray(dates[0]))) {
      dates = [];
    }
    const idx = findDayIndex(d, dates);
    if (idx >= 0) {
      dates = dates.slice();
      dates.splice(idx, 1);
    } else {
      dates = dates.concat([d]);
      dates = trimFifo(dates, state.multipleLimit);
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
 * @param {number} timestamp
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function unselectDate(state, timestamp) {
  if (timestamp == null) {
    return { state: state, changed: false };
  }
  const d = startOfDayTs(timestamp);
  const next = Object.assign({}, state);
  const sel = cloneSelectedDates(state.selectedDates);
  if (state.range) {
    const list = /** @type {number[][]} */ (sel);
    const filtered = list.filter((pair) => !isInClosedRangeDay(d, pair[0], pair[1]));
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
export function clearSelection(state) {
  const next = Object.assign({}, state);
  next.selectedDates = [];
  next.pendingRangeStart = null;
  next.rangeAnchor = null;
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} rangeIndex
 * @param {'start'|'end'} edge
 * @param {number} timestamp
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function applyRangeEndpointDrag(state, rangeIndex, edge, timestamp) {
  if (!state.range || !Array.isArray(state.selectedDates[0])) {
    return { state, changed: false };
  }
  const ranges = /** @type {number[][]} */ (cloneSelectedDates(state.selectedDates));
  if (rangeIndex < 0 || rangeIndex >= ranges.length) {
    return { state, changed: false };
  }
  const d = startOfDayTs(timestamp);
  if (isDayDisabled(state, d)) {
    return { state, changed: false };
  }
  const pair = ranges[rangeIndex];
  let start = pair[0];
  let end = pair[1];
  if (edge === 'start') {
    start = d;
  } else {
    end = d;
  }
  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  if (isDayDisabled(state, start) || isDayDisabled(state, end)) {
    return { state, changed: false };
  }
  if (pair[0] === start && pair[1] === end) {
    return { state, changed: false };
  }
  ranges[rangeIndex] = [start, end];
  const next = Object.assign({}, state);
  next.selectedDates = ranges;
  next.focusDate = d;
  return { state: next, changed: true };
}
