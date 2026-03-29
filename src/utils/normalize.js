import lightpickrDefaults from '../core/defaults.js';

/** @type {readonly string[]} */
const DEFAULT_SHOW_EVENTS = [lightpickrDefaults.showEvent];

/**
 * @param {unknown} showEvent
 * @returns {string[]}
 */
export function normalizeShowEvents(showEvent) {
  if (typeof showEvent === 'string' && showEvent.trim()) {
    return [showEvent.trim()];
  }
  if (!Array.isArray(showEvent)) {
    return DEFAULT_SHOW_EVENTS.slice();
  }
  const out = [];
  const seen = new Set();
  for (let i = 0; i < showEvent.length; i++) {
    const value = showEvent[i];
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out.length ? out : DEFAULT_SHOW_EVENTS.slice();
}

/**
 * @param {unknown} weekends
 * @returns {number[]}
 */
export function normalizeWeekendIndexes(weekends) {
  if (!Array.isArray(weekends)) {
    return lightpickrDefaults.weekendIndexes.slice();
  }
  const seen = new Set();
  const out = [];
  for (let i = 0; i < weekends.length; i++) {
    const idx = normalizeFirstDay(weekends[i]);
    if (idx != null && !seen.has(idx)) {
      seen.add(idx);
      out.push(idx);
    }
  }
  return out.length ? out : lightpickrDefaults.weekendIndexes.slice();
}

/**
 * @param {unknown} view
 * @returns {'day'|'month'|'year'}
 */
export function normalizeView(view) {
  if (view === 'day' || view === 'days') {
    return 'day';
  }
  if (view === 'month' || view === 'months') {
    return 'month';
  }
  if (view === 'year' || view === 'years') {
    return 'year';
  }
  return 'day';
}

/**
 * @param {unknown} views
 * @returns {('day'|'month'|'year')[]}
 */
export function normalizeAllowedViews(views) {
  const out = [];
  const seen = new Set();
  const add = function (raw) {
    const v = normalizeView(raw);
    if ((raw === 'day' || raw === 'days' || raw === 'month' || raw === 'months' || raw === 'year' || raw === 'years') && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };
  if (Array.isArray(views)) {
    for (let i = 0; i < views.length; i++) {
      add(views[i]);
    }
  } else if (typeof views === 'string') {
    add(views);
  }
  if (!out.length) {
    return lightpickrDefaults.viewOrder.slice();
  }
  return out;
}

/**
 * @param {unknown} firstDay
 * @returns {number|null}
 */
export function normalizeFirstDay(firstDay) {
  if (typeof firstDay !== 'number' || !Number.isFinite(firstDay)) {
      return null;
  }
  return ((Math.floor(firstDay) % 7) + 7) % 7;
}
