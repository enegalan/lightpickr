import { addMonths, addYears, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from './utils.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} dir -1 | 1
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function navigateNextPrev(state, dir) {
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
    next.currentView = /** @type {'day'|'month'|'year'} */ (order[idx + 1]);
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
    next.currentView = /** @type {'day'|'month'|'year'} */ (order[idx - 1]);
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
  next.currentView = state.onlyTime ? 'time' : view;
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
