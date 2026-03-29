import { yearBlockStartYear, yearGridYearValues, YEAR_GRID_COUNT, buildDayMonthCells } from '../core/calendar-grid.js';
import { isInClosedRangeDay, isSameDay, startOfDayTs, tsToYmd, cloneSelectedDates, ymdToTsStartOfDay, defaultMonthNames } from '../core/utils.js';
import { isDateDisabled } from '../core/selection.js';
import { isNavOutOfRange } from '../core/navigation.js';
import { createEl } from './dom.js';

/**
 * @typedef {Object} RenderCtx
 * @property {number} date
 * @property {number} viewDate
 * @property {boolean} isSelected
 * @property {boolean} isDisabled
 * @property {boolean} isToday
 * @property {boolean} isInRange
 * @property {boolean} isRangeStart
 * @property {boolean} isRangeEnd
 * @property {boolean} isFocused
 * @property {boolean} isOutside
 * @property {boolean} isWeekend
 * @property {object} state
 * @property {object} instance
 */

/**
 * @param {import('../core/state.js').LightpickrInternalState} state
 * @param {'day'|'month'|'year'|undefined} view
 * @returns {number[]}
 */
export function getViewDatesFromState(state, view) {
  const v = view || state.currentView;
  const out = [];
  const { y, m } = tsToYmd(state.viewDate);

  if (v === 'day') {
    const cells = buildDayMonthCells(y, m, state.firstDayOfWeek);
    for (let i = 0; i < cells.length; i++) {
      out.push(cells[i].ts);
    }
  } else if (v === 'month') {
    for (let mi = 0; mi < 12; mi++) {
      out.push(ymdToTsStartOfDay(y, mi, 1));
    }
  } else if (v === 'year') {
    const years = yearGridYearValues(y);
    for (let i = 0; i < years.length; i++) {
      out.push(ymdToTsStartOfDay(years[i], 0, 1));
    }
  }
  return out;
}

/**
 * @param {object} instance
 * @returns {object}
 */
export function publicStateSnapshot(instance) {
  const s = instance._state;
  return {
    inline: s.inline,
    range: s.range,
    multipleLimit: s.multipleLimit,
    multipleEnabled: s.multipleEnabled,
    enableTime: s.enableTime,
    onlyTime: s.onlyTime,
    minDate: s.minDate,
    maxDate: s.maxDate,
    disabledDates: s.disabledDatesSorted.slice(),
    locale: s.locale,
    firstDayOfWeek: s.firstDayOfWeek,
    weekendIndexes: s.weekendIndexes.slice(),
    format: s.format,
    currentView: s.currentView,
    viewDate: s.viewDate,
    focusDate: s.focusDate,
    visible: s.visible,
    selectedDates: cloneSelectedDates(s.selectedDates),
    timePart: Object.assign({}, s.timePart),
    allowedViews: s.allowedViews.slice()
  };
}

/**
 * @param {object} instance
 * @param {number} dayTs
 * @param {boolean} outside
 * @returns {RenderCtx}
 */
export function buildDayCtx(instance, dayTs, outside) {
  const s = instance._state;
  const d = startOfDayTs(dayTs);
  const flags = _dayFlags(s, d);
  return {
    date: d,
    viewDate: s.viewDate,
    isSelected: flags.isSelected,
    isDisabled: flags.isDisabled,
    isToday: flags.isToday,
    isInRange: flags.isInRange,
    isRangeStart: flags.isRangeStart,
    isRangeEnd: flags.isRangeEnd,
    isFocused: s.focusDate != null && isSameDay(s.focusDate, d),
    isOutside: outside,
    isWeekend: s.weekendIndexes.indexOf(new Date(d).getDay()) >= 0,
    state: publicStateSnapshot(instance),
    instance: instance
  };
}

/**
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @param {boolean} canGoUp
 * @returns {HTMLElement}
 */
export function buildDefaultNav(instance, view, canGoUp) {
  const s = instance._state;
  const c = s.classes;

  const nav = createEl('div', c.nav);

  const prev = createEl('button', c.navButton, { type: 'button', [s.attributes.nav]: 'prev' });
  prev.innerHTML = s.prevHtml;
  const prevDisabled = isNavOutOfRange(s, -1);

  const next = createEl('button', c.navButton, { type: 'button', [s.attributes.nav]: 'next' });
  next.innerHTML = s.nextHtml;
  const nextDisabled = isNavOutOfRange(s, 1);

  if (prevDisabled) {
    prev.disabled = true;
    prev.setAttribute('aria-disabled', 'true');
  }
  if (nextDisabled) {
    next.disabled = true;
    next.setAttribute('aria-disabled', 'true');
  }

  const titleTag = canGoUp ? 'button' : 'span';
  const title = createEl(titleTag, c.titleButton + (canGoUp ? '' : ' ' + c.titleButton + '--disabled'), canGoUp ? { type: 'button', [s.attributes.nav]: 'title' } : {});
  title.innerHTML = _formatNavTitle(instance, view);

  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  return nav;
}

/**
 * @param {import('../core/state.js').LightpickrClassMap} c
 * @returns {object}
 */
export function previewClassNames(c) {
  return {
    rangePreview: c.cellRangePreview,
    rangePreviewMid: c.cellRangePreviewMid,
    rangePreviewStartCap: c.cellRangePreviewStartCap,
    rangePreviewEndCap: c.cellRangePreviewEndCap
  };
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInternalState} s
 * @param {number} d
 * @returns {object}
 */
function _dayFlags(s, d) {
  const today = startOfDayTs(Date.now());
  let isSelected = false;
  let isInRange = false;
  let isRangeStart = false;
  let isRangeEnd = false;
  if (s.range) {
    const ranges = /** @type {number[][]} */ (s.selectedDates);
    for (let i = 0; i < ranges.length; i++) {
      const pair = ranges[i];
      if (isSameDay(d, pair[0])) {
        isRangeStart = true;
      }
      if (isSameDay(d, pair[1])) {
        isRangeEnd = true;
      }
      if (isInClosedRangeDay(d, pair[0], pair[1])) {
        isInRange = true;
      }
      if (isSameDay(d, pair[0]) || isSameDay(d, pair[1])) {
        isSelected = true;
      }
    }
    if (s.pendingRangeStart != null && isSameDay(s.pendingRangeStart, d)) {
      isSelected = true;
      isRangeStart = true;
    }
  } else {
    const dates = /** @type {number[]} */ (s.selectedDates);
    isSelected = dates.some((x) => isSameDay(x, d));
  }
  return {
    isSelected,
    isDisabled: isDateDisabled(s, d),
    isToday: isSameDay(d, today),
    isInRange,
    isRangeStart,
    isRangeEnd
  };
}

/**
 * @private
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @returns {string}
 */
function _formatNavTitle(instance, view) {
  const s = instance._state;
  const titles = s.navTitles || {};
  const key = view === 'day' ? 'days' : view === 'month' ? 'months' : 'years';
  const resolver = titles[key];
  if (typeof resolver === 'function') {
    return String(resolver(instance));
  }

  const rawTemplate = typeof resolver === 'string' ? resolver : '';
  const { y, m } = tsToYmd(s.viewDate);
  const blockStart = yearBlockStartYear(y);
  const monthLong = defaultMonthNames({ locale: s.locale }, 'monthsLong')[m];
  const monthShort = defaultMonthNames({ locale: s.locale }, s.monthsField)[m];
  return rawTemplate
    .replace(/yyyy1/g, String(blockStart))
    .replace(/yyyy2/g, String(blockStart + YEAR_GRID_COUNT - 1))
    .replace(/MMMM/g, monthLong || monthShort)
    .replace(/yyyy/g, String(y))
    .replace(/YYYY/g, String(y));
}
