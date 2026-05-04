import { clampInt } from '../utils/common.js';
import { getViewDates } from '../utils/view.js';
import { navigateDown, navigateMonthKeepFocusDay, navigateMonthKeepFocusMonth, navigateNextPrev, navigateUp, navigateYearKeepFocusDay, setFocusDateState } from './navigation.js';
import { findDayIndex, isSameDay, startOfDayTs, tsToYmd, ymdToTsStartOfDay } from '../utils/time.js';

/** @type {number} */
const GRID_COLS_DAY = 7;

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
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function reseedKeyboardFocusForView(state) {
  if (state.currentView === 'month') {
    return _stateWithDefaultMonthYearGridFocus(state, getViewDates('month', state), 'month');
  }
  if (state.currentView === 'year') {
    return _stateWithDefaultMonthYearGridFocus(state, getViewDates('year', state), 'year');
  }
  if (state.currentView === 'day' || state.currentView === 'time') {
    return _stateWithDefaultDayFocus(state, getViewDates('day', state));
  }
  return state;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {{ key: string, shiftKey: boolean, altKey: boolean }} evLike
 * @returns {{ type: 'noop' } | { type: 'altView', prev: import('./state.js').LightpickrInternalState, next: import('./state.js').LightpickrInternalState } | { type: 'grid', seed: import('./state.js').LightpickrInternalState | null, next: import('./state.js').LightpickrInternalState }}
 */
export function applyEventKey(state, evLike) {
  const { key, shiftKey, altKey } = evLike;
  const isArrowUp = key === 'ArrowUp';
  const isArrowDown = key === 'ArrowDown';

  if (altKey && (isArrowUp || isArrowDown)) {
    const navigated = isArrowUp ? navigateUp(state) : navigateDown(state);
    return {
      type: 'altView',
      prev: state,
      next: reseedKeyboardFocusForView(navigated)
    };
  }

  if (state.currentView === 'month' || state.currentView === 'year') {
    let s = state;
    let seed = null;
    if (s.focusDate == null) {
      const seeded = reseedKeyboardFocusForView(s);
      if (seeded !== s) {
        seed = seeded;
        s = seeded;
      }
    }
    const next = _nextStateAfterMonthYearGridKey(
      s,
      key,
      shiftKey,
      getViewDates(s.currentView, s),
      s.currentView
    );
    return { type: 'grid', seed, next };
  }

  if (state.currentView !== 'day' && state.currentView !== 'time') {
    return { type: 'noop' };
  }

  let s = state;
  let seed = null;
  if (s.focusDate == null) {
    const seeded = reseedKeyboardFocusForView(s);
    if (seeded !== s) {
      seed = seeded;
      s = seeded;
    }
  }
  const next = _nextStateAfterDayViewKey(s, key, shiftKey, getViewDates('day', s));
  return { type: 'grid', seed, next };
}

/**
 * @private
 * @param {number} idx
 * @param {string} key
 * @param {number} cols
 * @param {number} len
 * @returns {number}
 */
function _moveGridIndex(idx, key, cols, len) {
  if (idx < 0) {
    idx = 0;
  }
  if (key === 'Home') {
    return clampInt(Math.floor(idx / cols) * cols, 0, len - 1, 0);
  }
  if (key === 'End') {
    return clampInt(Math.floor(idx / cols) * cols + (cols - 1), 0, len - 1, 0);
  }
  if (key === 'ArrowLeft') {
    return idx - 1;
  }
  if (key === 'ArrowRight') {
    return idx + 1;
  }
  if (key === 'ArrowUp') {
    return idx - cols;
  }
  if (key === 'ArrowDown') {
    return idx + cols;
  }
  return idx;
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number[]} dayGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
function _stateWithDefaultDayFocus(state, dayGridDates) {
  if (!dayGridDates.length || (state.focusDate != null && findDayIndex(state.focusDate, dayGridDates) >= 0)) {
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
  if (cand != null && findDayIndex(cand, dayGridDates) >= 0) {
    return setFocusDateState(state, cand);
  }
  const today = startOfDayTs(Date.now());
  if (findDayIndex(today, dayGridDates) >= 0) {
    return setFocusDateState(state, today);
  }
  return setFocusDateState(state, dayGridDates[0]);
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number[]} gridDates
 * @param {'month' | 'year'} kind
 * @returns {import('./state.js').LightpickrInternalState}
 */
function _stateWithDefaultMonthYearGridFocus(state, gridDates, kind) {
  if (!gridDates.length || (state.focusDate != null && findDayIndex(state.focusDate, gridDates) >= 0)) {
    return state;
  }
  const { y, m } = tsToYmd(state.viewDate);
  if (kind === 'year') {
    const yearStart = ymdToTsStartOfDay(y, 0, 1);
    if (findDayIndex(yearStart, gridDates) >= 0) {
      return setFocusDateState(state, yearStart);
    }
    return setFocusDateState(state, gridDates[0]);
  }
  let pick = ymdToTsStartOfDay(y, m, 1);
  if (findDayIndex(pick, gridDates) >= 0) {
    return setFocusDateState(state, pick);
  }
  if (state.focusDate != null) {
    const fd = tsToYmd(state.focusDate);
    pick = ymdToTsStartOfDay(fd.y, fd.m, 1);
    if (findDayIndex(pick, gridDates) >= 0) {
      return setFocusDateState(state, pick);
    }
  }
  return setFocusDateState(state, gridDates[0]);
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {(s: import('./state.js').LightpickrInternalState, dir: -1 | 1) => import('./state.js').LightpickrInternalState} withoutShift
 * @returns {import('./state.js').LightpickrInternalState | null}
 */
function _pageUpDownWithOptionalShiftYear(state, key, shiftKey, withoutShift) {
  if (key === 'PageUp') {
    return shiftKey ? navigateYearKeepFocusDay(state, -1) : withoutShift(state, -1);
  }
  if (key === 'PageDown') {
    return shiftKey ? navigateYearKeepFocusDay(state, 1) : withoutShift(state, 1);
  }
  return null;
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {number[]} dayGridDates
 * @returns {import('./state.js').LightpickrInternalState}
 */
function _nextStateAfterDayViewKey(state, key, shiftKey, dayGridDates) {
  const page = _pageUpDownWithOptionalShiftYear(state, key, shiftKey, navigateMonthKeepFocusDay);
  if (page !== null) {
    return page;
  }
  if (!dayGridDates.length) {
    return state;
  }
  let idx = state.focusDate != null ? findDayIndex(state.focusDate, dayGridDates) : 0;
  idx = clampInt(_moveGridIndex(idx, key, GRID_COLS_DAY, dayGridDates.length), 0, dayGridDates.length - 1, 0);
  const picked = dayGridDates[idx];
  let next = setFocusDateState(state, picked);
  const { y, m } = tsToYmd(next.viewDate);
  const cell = tsToYmd(picked);
  if (cell.m !== m || cell.y !== y) {
    if (next.moveToOtherMonthsOnSelect) {
      next.viewDate = ymdToTsStartOfDay(cell.y, cell.m, 1);
    }
  }
  return next;
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {number[]} gridDates
 * @param {'month' | 'year'} currentView
 * @returns {import('./state.js').LightpickrInternalState}
 */
function _nextStateAfterMonthYearGridKey(state, key, shiftKey, gridDates, currentView) {
  if (currentView === 'year' && (key === 'PageUp' || key === 'PageDown')) {
    const dir = /** @type {-1 | 1} */ (key === 'PageUp' ? -1 : 1);
    if (shiftKey) {
      return navigateYearKeepFocusDay(state, dir);
    }
    const nextNav = navigateNextPrev(state, dir);
    if (nextNav === state) {
      return nextNav;
    }
    return _stateWithDefaultMonthYearGridFocus(
      nextNav,
      /** @type {number[]} */ (getViewDates('year', nextNav)),
      'year'
    );
  }
  const page = _pageUpDownWithOptionalShiftYear(
    state,
    key,
    shiftKey,
    currentView === 'month' ? navigateMonthKeepFocusMonth : navigateNextPrev
  );
  if (page !== null) {
    return page;
  }
  if (!gridDates.length) {
    return state;
  }
  let idx = state.focusDate != null ? gridDates.findIndex((x) => isSameDay(x, state.focusDate)) : 0;
  const gridCols = currentView === 'month' ? state.monthViewCols : state.yearViewCols;
  idx = clampInt(_moveGridIndex(idx, key, gridCols, gridDates.length), 0, gridDates.length - 1, 0);
  return setFocusDateState(state, gridDates[idx]);
}
