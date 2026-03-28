import { yearGridYearValues } from './calendar-grid.js';
import { navigateDown, navigateMonthKeepFocusDay, navigateMonthKeepFocusMonth, navigateNextPrev, navigateUp, navigateYearKeepFocusDay, setFocusDateState } from './navigation.js';
import { isSameDay, startOfDayTs, tsToYmd, ymdToTsStartOfDay } from './utils.js';

/** @type {number} */
const GRID_COLS_MONTH_YEAR = 3;

/**
 * @param {string} key
 * @param {boolean} altKey
 * @returns {boolean}
 */
export function isAltViewHierarchyKey(key, altKey) {
  return Boolean(altKey) && (key === 'ArrowUp' || key === 'ArrowDown');
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isDayNavigationKey(key) {
  return (
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'PageUp' ||
    key === 'PageDown' ||
    key === 'Home' ||
    key === 'End'
  );
}

/**
 * @param {number[]} dates
 * @param {number} ts
 * @returns {number}
 */
export function findDayIndexInGrid(dates, ts) {
  for (let i = 0; i < dates.length; i++) {
    if (isSameDay(dates[i], ts)) {
      return i;
    }
  }
  return -1;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number[]} dayGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function stateWithDefaultDayFocus(state, dayGridDates) {
  if (!dayGridDates.length) {
    return state;
  }
  if (state.focusDate != null && findDayIndexInGrid(dayGridDates, state.focusDate) >= 0) {
    return state;
  }
  let cand = null;
  if (!state.range) {
    const arr = /** @type {number[]} */ (state.selectedDates);
    if (arr.length && !Array.isArray(arr[0])) {
      cand = arr[arr.length - 1];
    }
  } else {
    const ranges = /** @type {number[][]} */ (state.selectedDates);
    if (ranges.length) {
      cand = ranges[ranges.length - 1][0];
    }
  }
  if (cand != null && findDayIndexInGrid(dayGridDates, cand) >= 0) {
    return setFocusDateState(state, cand);
  }
  const today = startOfDayTs(Date.now());
  if (findDayIndexInGrid(dayGridDates, today) >= 0) {
    return setFocusDateState(state, today);
  }
  return setFocusDateState(state, dayGridDates[0]);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {number[]} dayGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function nextStateAfterDayViewKey(state, key, shiftKey, dayGridDates) {
  if (key === 'PageUp') {
    return shiftKey ? navigateYearKeepFocusDay(state, -1) : navigateMonthKeepFocusDay(state, -1);
  }
  if (key === 'PageDown') {
    return shiftKey ? navigateYearKeepFocusDay(state, 1) : navigateMonthKeepFocusDay(state, 1);
  }
  if (!dayGridDates.length) {
    return state;
  }
  let idx = state.focusDate != null ? findDayIndexInGrid(dayGridDates, state.focusDate) : 0;
  if (idx < 0) {
    idx = 0;
  }
  if (key === 'Home') {
    idx = Math.floor(idx / 7) * 7;
  } else if (key === 'End') {
    idx = Math.floor(idx / 7) * 7 + 6;
  } else if (key === 'ArrowLeft') {
    idx--;
  } else if (key === 'ArrowRight') {
    idx++;
  } else if (key === 'ArrowUp') {
    idx -= 7;
  } else if (key === 'ArrowDown') {
    idx += 7;
  }
  idx = Math.max(0, Math.min(dayGridDates.length - 1, idx));
  const picked = dayGridDates[idx];
  let next = setFocusDateState(state, picked);
  const { y, m } = tsToYmd(next.viewDate);
  const cell = tsToYmd(picked);
  if (cell.m !== m || cell.y !== y) {
    if (next.moveToOtherMonthsOnSelect) {
      next = Object.assign({}, next);
      next.viewDate = ymdToTsStartOfDay(cell.y, cell.m, 1);
    }
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number[]} monthGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function stateWithDefaultMonthGridFocus(state, monthGridDates) {
  if (!monthGridDates.length) {
    return state;
  }
  for (let i = 0; i < monthGridDates.length; i++) {
    if (state.focusDate != null && isSameDay(state.focusDate, monthGridDates[i])) {
      return state;
    }
  }
  const { y, m } = tsToYmd(state.viewDate);
  if (state.focusDate != null) {
    const fd = tsToYmd(state.focusDate);
    if (fd.y === y) {
      return setFocusDateState(state, ymdToTsStartOfDay(y, fd.m, 1));
    }
  }
  return setFocusDateState(state, ymdToTsStartOfDay(y, m, 1));
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number[]} yearGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function stateWithDefaultYearGridFocus(state, yearGridDates) {
  if (!yearGridDates.length) {
    return state;
  }
  for (let i = 0; i < yearGridDates.length; i++) {
    if (state.focusDate != null && isSameDay(state.focusDate, yearGridDates[i])) {
      return state;
    }
  }
  const vy = tsToYmd(state.viewDate).y;
  return setFocusDateState(state, ymdToTsStartOfDay(vy, 0, 1));
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {number[]} monthGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function nextStateAfterMonthGridKey(state, key, shiftKey, monthGridDates) {
  if (key === 'PageUp') {
    return shiftKey ? navigateYearKeepFocusDay(state, -1) : navigateMonthKeepFocusMonth(state, -1);
  }
  if (key === 'PageDown') {
    return shiftKey ? navigateYearKeepFocusDay(state, 1) : navigateMonthKeepFocusMonth(state, 1);
  }
  if (!monthGridDates.length) {
    return state;
  }
  let idx = state.focusDate != null ? findDayIndexInGrid(monthGridDates, state.focusDate) : 0;
  if (idx < 0) {
    idx = 0;
  }
  idx = moveIndexThreeColGrid(idx, key, monthGridDates.length);
  idx = Math.max(0, Math.min(monthGridDates.length - 1, idx));
  return setFocusDateState(state, monthGridDates[idx]);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {number[]} yearGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function nextStateAfterYearGridKey(state, key, shiftKey, yearGridDates) {
  if (key === 'PageUp') {
    if (shiftKey) {
      return navigateYearKeepFocusDay(state, -1);
    }
    const nextNav = navigateNextPrev(state, -1);
    if (nextNav === state) {
      return nextNav;
    }
    return stateWithDefaultYearGridFocus(nextNav, yearGridTimestamps(nextNav));
  }
  if (key === 'PageDown') {
    if (shiftKey) {
      return navigateYearKeepFocusDay(state, 1);
    }
    const nextNav = navigateNextPrev(state, 1);
    if (nextNav === state) {
      return nextNav;
    }
    return stateWithDefaultYearGridFocus(nextNav, yearGridTimestamps(nextNav));
  }
  if (!yearGridDates.length) {
    return state;
  }
  let idx = state.focusDate != null ? findDayIndexInGrid(yearGridDates, state.focusDate) : 0;
  if (idx < 0) {
    idx = 0;
  }
  idx = moveIndexThreeColGrid(idx, key, yearGridDates.length);
  idx = Math.max(0, Math.min(yearGridDates.length - 1, idx));
  return setFocusDateState(state, yearGridDates[idx]);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} altKey
 * @returns {import('./state.js').LightpickrInternalState|null}
 */
export function nextStateAfterViewHierarchyKey(state, key, altKey) {
  if (!isAltViewHierarchyKey(key, altKey)) {
    return null;
  }
  if (state.onlyTime) {
    return null;
  }
  if (key === 'ArrowUp') {
    return navigateUp(state);
  }
  if (key === 'ArrowDown') {
    return navigateDown(state);
  }
  return null;
}


/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
function yearGridTimestamps(state) {
  const y = tsToYmd(state.viewDate).y;
  const years = yearGridYearValues(y);
  const out = [];
  for (let i = 0; i < years.length; i++) {
    out.push(ymdToTsStartOfDay(years[i], 0, 1));
  }
  return out;
}

/**
 * @private
 * @param {number} idx
 * @param {string} key
 * @param {number} len
 * @returns {number}
 */
function moveIndexThreeColGrid(idx, key, len) {
  if (key === 'Home') {
    return Math.min(len - 1, Math.floor(idx / GRID_COLS_MONTH_YEAR) * GRID_COLS_MONTH_YEAR);
  }
  if (key === 'End') {
    return Math.min(len - 1, Math.floor(idx / GRID_COLS_MONTH_YEAR) * GRID_COLS_MONTH_YEAR + (GRID_COLS_MONTH_YEAR - 1));
  }
  if (key === 'ArrowLeft') {
    return idx - 1;
  }
  if (key === 'ArrowRight') {
    return idx + 1;
  }
  if (key === 'ArrowUp') {
    return idx - GRID_COLS_MONTH_YEAR;
  }
  if (key === 'ArrowDown') {
    return idx + GRID_COLS_MONTH_YEAR;
  }
  return idx;
}