import { clampInt } from '../utils/common.js';
import {
  addMonths,
  addYears,
  daysInMonth,
  startOfDayTs,
  toTimestamp,
  tsToYmd,
  ymdToTsStartOfDay,
} from '../utils/time.js';
import { clampView } from '../utils/view.js';
import { buildMonthViewTimestamps, viewPage } from './calendar-grid.js';
import lightpickrDefaults from './defaults.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir
 * @returns {number}
 */
export function navigateViewPage(state, dir) {
  const kind = state.currentView === 'year' ? 'year' : 'month';
  const { all, offset, size } = viewPage(state, kind);
  const count = clampInt(
    kind === 'month' ? state.monthViewCount : state.yearViewCount,
    1,
    Number.MAX_SAFE_INTEGER,
    kind === 'month' ? 12 : 1,
  );
  if (size >= all.length) {
    if (kind === 'month') {
      return count === 12 ? addMonths(state.viewDate, dir * 12).ts : addMonths(state.viewDate, dir * count).ts;
    }
    const { y, m } = tsToYmd(state.viewDate);
    return ymdToTsStartOfDay(y + dir * count, m, 1);
  }
  const next = offset + dir * size;
  if (next >= 0 && next < all.length) {
    const value = all[next];
    return kind === 'month' ? value : ymdToTsStartOfDay(value, 0, 1);
  }
  if (kind === 'month') {
    if (dir > 0) {
      return count === 12
        ? ymdToTsStartOfDay(tsToYmd(all[0]).y + 1, 0, 1)
        : addMonths(all[all.length - 1], 1).ts;
    }
    const prevAnchor =
      count === 12 ? ymdToTsStartOfDay(tsToYmd(all[0]).y - 1, 0, 1) : addMonths(all[0], -1).ts;
    const prevAll = buildMonthViewTimestamps({ ...state, viewDate: prevAnchor });
    return prevAll[Math.floor((prevAll.length - 1) / size) * size];
  }
  const start = all[0];
  if (dir > 0) {
    return ymdToTsStartOfDay(start + count, 0, 1);
  }
  return ymdToTsStartOfDay(start - count + Math.floor((count - 1) / size) * size, 0, 1);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function alignViewPageEntry(state) {
  if (state.currentView !== 'month' && state.currentView !== 'year') {
    return state;
  }
  const kind = state.currentView;
  let anchor = state.focusDate ?? state.viewDate;
  const sel = state.selectedDates;
  if (state.range) {
    const ranges = /** @type {number[][]} */ (sel);
    if (ranges.length) {
      anchor = ranges[ranges.length - 1][0];
    }
  } else if (/** @type {number[]} */ (sel).length) {
    anchor = /** @type {number[]} */ (sel)[sel.length - 1];
  }
  const { y, m } = tsToYmd(anchor);
  const viewAnchor = kind === 'month' ? ymdToTsStartOfDay(y, m, 1) : ymdToTsStartOfDay(y, 0, 1);
  const { all, offset } = viewPage({ ...state, viewDate: viewAnchor }, kind);
  const pageStart = all[offset];
  return {
    ...state,
    viewDate: kind === 'month' ? pageStart : ymdToTsStartOfDay(pageStart, 0, 1),
    focusDate: null,
  };
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
  let timestamp = null;
  if (v === 'day' || v === 'time') {
    const { ts } = addMonths(state.viewDate, dir);
    timestamp = ts;
  } else if (v === 'month' || v === 'year') {
    timestamp = navigateViewPage(state, dir);
  }
  if (timestamp != null) {
    next.viewDate = timestamp;
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
  if (state.onlyTime && state.currentView === 'time') {
    return next;
  }
  const viewKey = state.currentView === 'time' ? 'day' : state.currentView;
  const idx = lightpickrDefaults.viewOrder.indexOf(viewKey);
  if (idx >= 0 && idx < lightpickrDefaults.viewOrder.length - 1) {
    const requested = lightpickrDefaults.viewOrder[idx + 1];
    next.currentView = clampView(state.allowedViews, requested);
  }
  return alignViewPageEntry(next);
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
  return alignViewPageEntry(next);
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
  } else {
    const clamped = clampView(state.allowedViews, view === 'time' ? 'day' : view);
    next.currentView = state.enableTime && clamped === 'day' ? 'time' : clamped;
  }
  if (params?.date != null) {
    next = setViewDateState(next, params.date);
  }
  return alignViewPageEntry(next);
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
  return (state.minDate != null && periodEnd < state.minDate) || (state.maxDate != null && periodStart > state.maxDate);
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
        endDay: monthLastDay,
      };
    }
    case 'month':
    case 'year': {
      const kind = state.currentView;
      const { items } = viewPage({ ...state, viewDate: navigateViewPage(state, dir) }, kind);
      if (!items.length) {
        return null;
      }
      if (kind === 'month') {
        const first = tsToYmd(items[0]);
        const last = tsToYmd(items[items.length - 1]);
        return {
          startYear: first.y,
          endYear: last.y,
          startMonth: first.m,
          endMonth: last.m,
          startDay: 1,
          endDay: daysInMonth(last.y, last.m),
        };
      }
      return {
        startYear: items[0],
        endYear: items[items.length - 1],
        startMonth: 0,
        endMonth: 11,
        startDay: 1,
        endDay: 31,
      };
    }
    default:
      return null;
  }
}
