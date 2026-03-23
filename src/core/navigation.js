import { addMonths, addYears, clampViewToAllowed, daysInMonth, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from './utils.js';

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
 * @param {number} dir -1 | 1
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateMonthKeepFocusDay(state, dir) {
  const nextNav = navigateNextPrev(state, dir);
  if (nextNav === state) {
    return nextNav;
  }
  const next = Object.assign({}, nextNav);
  if ((state.currentView === 'day' || state.currentView === 'time') && state.focusDate != null) {
    const { d } = tsToYmd(state.focusDate);
    const { y, m } = tsToYmd(next.viewDate);
    const dim = daysInMonth(y, m);
    next.focusDate = ymdToTsStartOfDay(y, m, Math.min(d, dim));
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir -1 | 1
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateYearKeepFocusDay(state, dir) {
  if (state.currentView === 'year') {
    const next = Object.assign({}, state);
    const base = state.focusDate != null ? state.focusDate : state.viewDate;
    const ny = tsToYmd(base).y + dir;
    next.viewDate = ymdToTsStartOfDay(ny, 0, 1);
    next.focusDate = ymdToTsStartOfDay(ny, 0, 1);
    return next;
  }
  if (state.currentView === 'month') {
    const next = Object.assign({}, state);
    const { ts } = addYears(state.viewDate, dir);
    const { y, m } = tsToYmd(ts);
    next.viewDate = ymdToTsStartOfDay(y, m, 1);
    next.focusDate = ymdToTsStartOfDay(y, m, 1);
    return next;
  }
  if (state.currentView !== 'day' && state.currentView !== 'time') {
    return state;
  }
  const next = Object.assign({}, state);
  const base = state.focusDate != null ? state.focusDate : state.viewDate;
  const { ts } = addYears(base, dir);
  const { y, m } = tsToYmd(ts);
  next.viewDate = ymdToTsStartOfDay(y, m, 1);
  next.focusDate = startOfDayTs(ts);
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir -1 | 1
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateMonthKeepFocusMonth(state, dir) {
  if (state.currentView !== 'month') {
    return state;
  }
  const nextNav = navigateNextPrev(state, dir);
  if (nextNav === state) {
    return nextNav;
  }
  const next = Object.assign({}, nextNav);
  const keepM = tsToYmd(state.focusDate != null ? state.focusDate : state.viewDate).m;
  const { y } = tsToYmd(next.viewDate);
  next.focusDate = ymdToTsStartOfDay(y, keepM, 1);
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

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir
 * @returns {boolean}
 */
function isNavOutOfRange(state, dir) {
  if (!state.disableNavWhenOutOfRange || (state.minDate == null && state.maxDate == null)) {
    return false;
  }
  let startYear, startMonth, startDay, endYear, endMonth, endDay;
  switch (state.currentView) {
    case 'day':
    case 'time': { // Month navigation (+1 month)
      const { y, m } = addMonths(state.viewDate, dir);
      const monthLastDay = new Date(y, m + 1, 0).getDate();
      startYear = endYear = y; // Same year
      startMonth = endMonth = m; // Same month
      startDay = 1; // First day of the month
      endDay = monthLastDay; // Last day of the month
      break;
    }
    case 'month': { // Year navigation (+1 year)
      const { y } = addYears(state.viewDate, dir);
      startYear = endYear = y; // Same year
      startMonth = 0; // January
      endMonth = 11; // December
      startDay = 1; // First day of the year
      endDay = 31; // Last day of the year
      break;
    }
    case 'year': { // Year grid navigation
      const { y } = tsToYmd(state.viewDate);
      const yearChunkSize = 12; // Blocks of 12 years
      const startYearOfBlock = y + dir * yearChunkSize - 5; // -5 is to center the current year in the grid
      startYear = startYearOfBlock;
      endYear = startYearOfBlock + yearChunkSize - 1; 
      startMonth = 0; // January
      endMonth = 11; // December
      startDay = 1; // First day of the year
      endDay = 31; // Last day of the year
      break;
    }
    default: {
      return false; // Unsupported view -> do not restrict navigation
    }
  }
  const periodStart = ymdToTsStartOfDay(startYear, startMonth, startDay);
  const periodEnd = ymdToTsStartOfDay(endYear, endMonth, endDay);
  return periodEnd < state.minDate || periodStart > state.maxDate;
}
