import { normalizeAllowedViews, normalizeView } from './normalize.js';
import lightpickrDefaults from '../core/defaults.js';
import { buildDayMonthCells, yearGridYearValues } from '../core/calendar-grid.js';
import { tsToYmd, ymdToTsStartOfDay } from './time.js';

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
  const { y, m } = tsToYmd(state.viewDate);

  if (view === 'day') {
    const cells = buildDayMonthCells(y, m, state.firstDay);
    for (let i = 0; i < cells.length; i++) {
      out.push(cells[i].ts);
    }
  } else if (view === 'month') {
    for (let mi = 0; mi < 12; mi++) {
      out.push(ymdToTsStartOfDay(y, mi, 1));
    }
  } else if (view === 'year') {
    const years = yearGridYearValues(y);
    for (let i = 0; i < years.length; i++) {
      out.push(ymdToTsStartOfDay(years[i], 0, 1));
    }
  }
  return out;
}
