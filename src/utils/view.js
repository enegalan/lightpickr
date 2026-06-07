import { buildDayMonthCells, viewPage } from '../core/calendar-grid.js';
import lightpickrDefaults from '../core/defaults.js';
import { normalizeAllowedViews } from './normalize.js';
import { ymdToTsStartOfDay } from './time.js';

/**
 * @param {unknown} views
 * @param {unknown} requestedView
 * @returns {'day'|'month'|'year'}
 */
export function clampView(views, requestedView) {
  const allowedViews = normalizeAllowedViews(views);
  const t = typeof requestedView === 'string' ? requestedView.trim() : '';
  const req = t && lightpickrDefaults.viewOrder.includes(t) ? t : lightpickrDefaults.view;
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
    out.push(...viewPage(state, 'month').items);
  } else if (view === 'year') {
    const items = viewPage(state, 'year').items;
    for (let i = 0; i < items.length; i++) {
      out.push(ymdToTsStartOfDay(items[i], 0, 1));
    }
  }
  return out;
}
