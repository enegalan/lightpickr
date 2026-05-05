import { findDayIndex, isInClosedRangeDay, isSameDay, isDayDisabled, startOfDayTs, timestampToPickerDate } from '../utils/time.js';
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
  const sel = state.selectedDates;
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
 * @param {import('./state.js').LightpickrInstance} instance
 * @param {number} timestamp
 * @returns {{ state: import('./state.js').LightpickrInternalState, changed: boolean }}
 */
export function applyRangeEndpointDrag(instance, timestamp) {
  if (!instance._state.range || !Array.isArray(instance._state.selectedDates[0]) || !instance._rangeDrag || timestamp == null) {
    return { state: instance._state, changed: false };
  }
  const ranges = instance.selectedDates;
  if (instance._rangeDrag.rangeIndex < 0 || instance._rangeDrag.rangeIndex >= ranges.length) {
    return { state: instance._state, changed: false };
  }
  const d = startOfDayTs(timestamp);
  if (instance._state.onBeforeSelect({
    date: timestampToPickerDate(timestamp, instance._state),
    datepicker: instance
  }) === false) {
    return { state: instance._state, changed: false };
  }
  if (isDayDisabled(instance._state, d)) {
    return { state: instance._state, changed: false };
  }
  const pair = ranges[instance._rangeDrag.rangeIndex];
  let start = pair[0];
  let end = pair[1];
  if (instance._rangeDrag.edge === 'start') {
    start = d;
  } else {
    end = d;
  }
  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  if (isDayDisabled(instance._state, start) || isDayDisabled(instance._state, end)) {
    return { state: instance._state, changed: false };
  }
  if (pair[0] === start && pair[1] === end) {
    return { state: instance._state, changed: false };
  }
  ranges[instance._rangeDrag.rangeIndex] = [start, end];
  const next = Object.assign({}, instance._state);
  next.selectedDates = ranges;
  next.focusDate = d;
  return { state: next, changed: true };
}
