import { clampView } from '../utils/view.js';
import { addMonths, addYears, daysInMonth, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from '../utils/time.js';
import lightpickrDefaults from './defaults.js';

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
    next.viewDate = ymdToTsStartOfDay(y + dir * state.yearViewCount, m, 1);
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
  const next = Object.assign({}, state);
  let viewDate, focusDate;
  if (state.currentView === 'year') {
    const ny = tsToYmd(state.focusDate ?? state.viewDate).y + dir;
    viewDate = ymdToTsStartOfDay(ny, 0, 1);
    focusDate = ymdToTsStartOfDay(ny, 0, 1);
  } else if (state.currentView === 'month') {
    const { ts } = addYears(state.focusDate ?? state.viewDate, dir);
    const { y, m } = tsToYmd(ts);
    viewDate = ymdToTsStartOfDay(y, m, 1);
    focusDate = ymdToTsStartOfDay(y, m, 1);
  } else if (state.currentView === 'day' || state.currentView === 'time') {
    const { ts } = addYears(state.focusDate ?? state.viewDate, dir);
    const { y, m } = tsToYmd(ts);
    viewDate = ymdToTsStartOfDay(y, m, 1);
    focusDate = startOfDayTs(ts);
  } else {
    return state;
  }
  next.viewDate = viewDate;
  next.focusDate = focusDate;
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
  const idx = lightpickrDefaults.viewOrder.indexOf(state.currentView);
  if (state.currentView === 'time') {
    if (state.onlyTime) {
      return next;
    }
    next.currentView = 'day';
    return next;
  }
  if (idx >= 0 && idx < lightpickrDefaults.viewOrder.length - 1) {
    const requested = lightpickrDefaults.viewOrder[idx + 1];
    next.currentView = clampView(state.allowedViews, requested);
  }
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateDown(state) {
  const next = Object.assign({}, state);
  const idx = lightpickrDefaults.viewOrder.indexOf(state.currentView);
  if (idx > 0) {
    const requested = lightpickrDefaults.viewOrder[idx - 1];
    next.currentView = clampView(state.allowedViews, requested);
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
  let next = Object.assign({}, state);
  if (state.onlyTime) {
    next.currentView = 'time';
  } else if (view === 'time') {
    next.currentView = state.enableTime ? 'time' : clampView(state.allowedViews, 'day');
  } else {
    next.currentView = clampView(state.allowedViews, view);
  }
  if (params && params.date != null) {
    next = setViewDateState(next, params.date);
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
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir
 * @returns {boolean}
 */
export function isNavOutOfRange(state, dir) {
  if (!state.disableNavWhenOutOfRange || (state.minDate == null && state.maxDate == null)) {
    return false;
  }
  const period = _navTargetPeriodYmd(state, dir);
  if (period == null) {
    return false;
  }
  const periodStart = ymdToTsStartOfDay(period.startYear, period.startMonth, period.startDay);
  const periodEnd = ymdToTsStartOfDay(period.endYear, period.endMonth, period.endDay);
  return periodEnd < state.minDate || periodStart > state.maxDate;
}

/**
 * @private
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir
 * @returns {{ startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number }|null}
 */
function _navTargetPeriodYmd(state, dir) {
  switch (state.currentView) {
    case 'day':
    case 'time': {
      const { y, m } = addMonths(state.viewDate, dir);
      const monthLastDay = new Date(y, m + 1, 0).getDate();
      return {
        startYear: y,
        endYear: y,
        startMonth: m,
        endMonth: m,
        startDay: 1,
        endDay: monthLastDay
      };
    }
    case 'month': {
      const { y } = addYears(state.viewDate, dir);
      return {
        startYear: y,
        endYear: y,
        startMonth: 0,
        endMonth: 11,
        startDay: 1,
        endDay: 31
      };
    }
    case 'year': {
      const { y } = tsToYmd(state.viewDate);
      const n = Math.max(1, Math.floor(state.yearViewCount));
      const yTarget = y + dir * n;
      const startYearOfBlock = n === 12 ? Math.floor(yTarget / 12) * 12 : yTarget - state.yearViewRadius;
      return {
        startYear: startYearOfBlock,
        endYear: startYearOfBlock + n - 1,
        startMonth: 0,
        endMonth: 11,
        startDay: 1,
        endDay: 31
      };
    }
    default:
      return null;
  }
}
