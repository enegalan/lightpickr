import { yearGridYearValues, buildDayMonthCells } from '../core/calendar-grid.js';
import { isInClosedRangeDay, isSameDay, startOfDayTs, tsToYmd, cloneSelectedDates, ymdToTsStartOfDay, formatDate } from '../utils/time.js';
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
    const cells = buildDayMonthCells(y, m, state.firstDay);
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
 * @param {number} dayTs
 * @param {boolean} outside
 * @returns {RenderCtx}
 */
export function buildDayCtx(instance, dayTs, outside) {
  const d = startOfDayTs(dayTs);
  const flags = _dayFlags(instance._state, d);
  return {
    date: d,
    viewDate: instance._state.viewDate,
    isSelected: flags.isSelected,
    isDisabled: flags.isDisabled,
    isToday: flags.isToday,
    isInRange: flags.isInRange,
    isRangeStart: flags.isRangeStart,
    isRangeEnd: flags.isRangeEnd,
    isFocused: instance._state.focusDate != null && isSameDay(instance._state.focusDate, d),
    isOutside: outside,
    isWeekend: instance._state.weekends.indexOf(new Date(d).getDay()) >= 0,
    state: _publicStateSnapshot(instance),
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
  const c = instance._state.classes;

  const nav = createEl('div', c.nav);

  const prev = createEl('button', c.navButton, { type: 'button', [instance._state.attributes.nav]: 'prev' });
  prev.innerHTML = instance._state.prevHtml;
  const prevDisabled = isNavOutOfRange(instance._state, -1);

  const next = createEl('button', c.navButton, { type: 'button', [instance._state.attributes.nav]: 'next' });
  next.innerHTML = instance._state.nextHtml;
  const nextDisabled = isNavOutOfRange(instance._state, 1);

  if (prevDisabled) {
    prev.disabled = true;
    prev.setAttribute('aria-disabled', 'true');
  }
  if (nextDisabled) {
    next.disabled = true;
    next.setAttribute('aria-disabled', 'true');
  }

  const titleTag = canGoUp ? 'button' : 'span';
  const title = createEl(titleTag, c.titleButton + (canGoUp ? '' : ' ' + c.titleButton + '--disabled'), canGoUp ? { type: 'button', [instance._state.attributes.nav]: 'title' } : {});
  title.innerHTML = _formatNavTitle(instance, view);

  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  return nav;
}

/**
 * @private
 * @param {object} instance
 * @returns {object}
 */
function _publicStateSnapshot(instance) {
  return {
    inline: instance._state.inline,
    range: instance._state.range,
    multipleLimit: instance._state.multipleLimit,
    multipleEnabled: instance._state.multipleEnabled,
    enableTime: instance._state.enableTime,
    onlyTime: instance._state.onlyTime,
    minDate: instance._state.minDate,
    maxDate: instance._state.maxDate,
    disabledDates: instance._state.disabledDatesSorted.slice(),
    locale: instance._state.locale,
    firstDay: instance._state.firstDay,
    weekends: instance._state.weekends.slice(),
    format: instance._state.format,
    currentView: instance._state.currentView,
    viewDate: instance._state.viewDate,
    focusDate: instance._state.focusDate,
    visible: instance._state.visible,
    selectedDates: cloneSelectedDates(instance._state.selectedDates),
    timePart: Object.assign({}, instance._state.timePart),
    allowedViews: instance._state.allowedViews.slice()
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
  const resolver = titles[view];
  if (typeof resolver === 'function') {
    return String(resolver(instance));
  }

  const rawTemplate = typeof resolver === 'string' ? resolver : '';
  return formatDate(rawTemplate, s.viewDate, null, s);
}
