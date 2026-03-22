import { addMonths, addYears, clampViewToAllowed, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from './utils.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir
 * @returns {boolean}
 */
function isNavOutOfRange(state, dir) {
  if (!state.disableNavWhenOutOfRange) {
    return false;
  }
  if (state.minDate == null && state.maxDate == null) {
    return false;
  }
  const v = state.currentView;
  let periodStart;
  let periodEnd;
  if (v === 'day' || v === 'time') {
    const shifted = addMonths(state.viewDate, dir);
    const y = shifted.y;
    const m = shifted.m;
    periodStart = ymdToTsStartOfDay(y, m, 1);
    periodEnd = ymdToTsStartOfDay(y, m, new Date(y, m + 1, 0).getDate());
  } else if (v === 'month') {
    const shifted = addYears(state.viewDate, dir);
    const y = shifted.y;
    periodStart = ymdToTsStartOfDay(y, 0, 1);
    periodEnd = ymdToTsStartOfDay(y, 11, 31);
  } else if (v === 'year') {
    const { y } = tsToYmd(state.viewDate);
    const start = y + dir * 12 - 5;
    periodStart = ymdToTsStartOfDay(start, 0, 1);
    periodEnd = ymdToTsStartOfDay(start + 11, 11, 31);
  } else {
    return false;
  }
  if (state.minDate != null && periodEnd < state.minDate) {
    return true;
  }
  if (state.maxDate != null && periodStart > state.maxDate) {
    return true;
  }
  return false;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {boolean}
 */
export function navPrevDisabled(state) {
  return isNavOutOfRange(state, -1);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {boolean}
 */
export function navNextDisabled(state) {
  return isNavOutOfRange(state, 1);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir -1 | 1
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateNextPrev(state, dir) {
  if (isNavOutOfRange(state, dir)) {
    return state;
  }
  const next = Object.assign({}, state);
  const v = state.currentView;
  if (v === 'day') {
    const { ts } = addMonths(state.viewDate, dir);
    next.viewDate = ts;
  } else if (v === 'month') {
    const { ts } = addYears(state.viewDate, dir);
    next.viewDate = ts;
  } else if (v === 'year') {
    const { y, m } = tsToYmd(state.viewDate);
    next.viewDate = ymdToTsStartOfDay(y + dir * 12, m, 1);
  } else if (v === 'time') {
    const { ts } = addMonths(state.viewDate, dir);
    next.viewDate = ts;
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateUp(state) {
  const next = Object.assign({}, state);
  const order = ['day', 'month', 'year'];
  const idx = order.indexOf(state.currentView);
  if (state.currentView === 'time') {
    if (state.onlyTime) {
      return next;
    }
    next.currentView = 'day';
    return next;
  }
  if (idx >= 0 && idx < order.length - 1) {
    const requested = /** @type {'day'|'month'|'year'} */ (order[idx + 1]);
    next.currentView = clampViewToAllowed(state.allowedViews, requested);
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateDown(state) {
  const next = Object.assign({}, state);
  const order = ['day', 'month', 'year'];
  const idx = order.indexOf(state.currentView);
  if (idx > 0) {
    const requested = /** @type {'day'|'month'|'year'} */ (order[idx - 1]);
    next.currentView = clampViewToAllowed(state.allowedViews, requested);
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {'day'|'month'|'year'|'time'} view
 * @param {{ date?: number|Date|string } | undefined} params
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setCurrentViewState(state, view, params) {
  const next = Object.assign({}, state);
  if (state.onlyTime) {
    next.currentView = 'time';
  } else if (view === 'time') {
    next.currentView = state.enableTime ? 'time' : clampViewToAllowed(state.allowedViews, 'day');
  } else {
    next.currentView = clampViewToAllowed(state.allowedViews, view);
  }
  if (params && params.date != null) {
    const raw = toTimestamp(params.date);
    if (raw != null) {
      next.viewDate = startOfDayTs(raw);
    }
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number|Date|string} date
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setViewDateState(state, date) {
  const raw = toTimestamp(date);
  const next = Object.assign({}, state);
  if (raw != null) {
    next.viewDate = startOfDayTs(raw);
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number|Date|string|null} date
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setFocusDateState(state, date) {
  const next = Object.assign({}, state);
  if (date == null) {
    next.focusDate = null;
    return next;
  }
  const raw = toTimestamp(date);
  if (raw != null) {
    next.focusDate = startOfDayTs(raw);
  }
  return next;
}
