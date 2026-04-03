import { normalizeAllowedViews, normalizeView } from './normalize.js';
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
