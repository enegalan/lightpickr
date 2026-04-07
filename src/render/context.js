import { isInClosedRangeDay, isSameDay, startOfDayTs, cloneSelectedDates } from '../utils/time.js';
import { isDateDisabled } from '../core/selection.js';

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
 * @param {object} instance
 * @param {number} dayTs
 * @param {boolean} outside
 * @returns {RenderCtx}
 */
export function buildCtx(instance, dayTs, outside) {
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
