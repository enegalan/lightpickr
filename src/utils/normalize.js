import lightpickrDefaults from '../core/defaults.js';

/** @type {Map<string, 'day'|'month'|'year'>} */
const VIEW_INPUT_ALIASES = new Map();
for (let i = 0; i < lightpickrDefaults.viewOrder.length; i++) {
  const id = lightpickrDefaults.viewOrder[i];
  VIEW_INPUT_ALIASES.set(id, id);
  VIEW_INPUT_ALIASES.set(id + 's', id);
}

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
    return lightpickrDefaults.weekends.slice();
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
  return out.length ? out : lightpickrDefaults.weekends.slice();
}

/**
 * @param {unknown} view
 * @returns {'day'|'month'|'year'}
 */
export function normalizeView(view) {
  if (typeof view !== 'string') {
    return 'day';
  }
  return VIEW_INPUT_ALIASES.get(view) ?? 'day';
}

/**
 * @param {unknown} views
 * @returns {('day'|'month'|'year')[]}
 */
export function normalizeAllowedViews(views) {
  const out = [];
  const seen = new Set();
  const add = function (raw) {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (trimmed && !seen.has(trimmed) && VIEW_INPUT_ALIASES.get(trimmed) !== undefined) {
      seen.add(trimmed);
      out.push(trimmed);
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
