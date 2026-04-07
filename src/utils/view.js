import { normalizeAllowedViews, normalizeView } from './normalize.js';
import { buildDayMonthCells, buildMonthViewTimestamps, buildYearViewYears } from '../core/calendar-grid.js';
import { ymdToTsStartOfDay } from './time.js';
import lightpickrDefaults from '../core/defaults.js';

/**
 * @param {unknown} views
 * @param {unknown} requestedView
 * @returns {'day'|'month'|'year'}
 */
export function clampView(views, requestedView) {
  const allowedViews = normalizeAllowedViews(views);
  const req = normalizeView(requestedView);
  if (allowedViews.indexOf(req) >= 0) {
    return req;
  }
  const reqIdx = lightpickrDefaults.viewOrder.indexOf(req);
  let best = allowedViews[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < allowedViews.length; i++) {
    const cand = allowedViews[i];
    const dist = Math.abs(lightpickrDefaults.viewOrder.indexOf(cand) - reqIdx);
    if (dist < bestDist) {
      bestDist = dist;
      best = cand;
    }
  }
  return best;
}

/**
 * @param {'day'|'month'|'year'} view
 * @param {import('../core/state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
export function getViewDates(view, state) {
  const out = [];

  if (view === 'day') {
    const cells = buildDayMonthCells(state);
    for (let i = 0; i < cells.length; i++) {
      out.push(cells[i].ts);
    }
  } else if (view === 'month') {
    const stamps = buildMonthViewTimestamps(state);
    for (let i = 0; i < stamps.length; i++) {
      out.push(stamps[i]);
    }
  } else if (view === 'year') {
    const years = buildYearViewYears(state);
    for (let i = 0; i < years.length; i++) {
      out.push(ymdToTsStartOfDay(years[i], 0, 1));
    }
  }
  return out;
}
