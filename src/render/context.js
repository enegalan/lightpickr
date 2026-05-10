import { isInClosedRangeDay, isSameDay, isDayDisabled, isFocusDay, startOfDayTs } from '../utils/time.js';

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
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {number} dayTs
 * @param {boolean} outside
 * @returns {RenderCtx}
 */
export function buildCtx(instance, dayTs, outside = false) {
  const date = startOfDayTs(dayTs);
  const flags = _dayFlags(instance._state, date);
  return {
    date,
    viewDate: instance._state.viewDate,
    isSelected: flags.isSelected,
    isDisabled: flags.isDisabled,
    isToday: flags.isToday,
    isInRange: flags.isInRange,
    isRangeStart: flags.isRangeStart,
    isRangeEnd: flags.isRangeEnd,
    isFocused: isFocusDay(instance._state.focusDate, date),
    isOutside: outside,
    isWeekend: instance._state.weekends.indexOf(new Date(date).getDay()) >= 0,
    state: {
      inline: instance._state.inline,
      range: instance._state.range,
      multipleLimit: instance._state.multipleLimit,
      multipleEnabled: instance._state.multipleEnabled,
      enableTime: instance._state.enableTime,
      onlyTime: instance._state.onlyTime,
      minDate: instance._state.minDate,
      maxDate: instance._state.maxDate,
      disabledDates: instance._state.disabledDates,
      locale: instance._state.locale,
      firstDay: instance._state.firstDay,
      weekends: instance._state.weekends.slice(),
      format: instance._state.format,
      currentView: instance._state.currentView,
      viewDate: instance._state.viewDate,
      focusDate: instance._state.focusDate,
      visible: instance._state.visible,
      selectedDates: instance._state.selectedDates,
      timePart: Object.assign({}, instance._state.timePart),
      allowedViews: instance._state.allowedViews.slice()
    },
    instance
  };
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInternalState} state
 * @param {number} date
 * @returns {object}
 */
function _dayFlags(state, date) {
  let isSelected = false;
  let isInRange = false;
  let isRangeStart = false;
  let isRangeEnd = false;
  if (state.range) {
    const ranges = /** @type {number[][]} */ (state.selectedDates);
    for (let i = 0; i < ranges.length; i++) {
      if (isSameDay(date, ranges[i][0])) {
        isRangeStart = true;
      }
      if (isSameDay(date, ranges[i][1])) {
        isRangeEnd = true;
      }
      if (isInClosedRangeDay(date, ranges[i][0], ranges[i][1])) {
        isInRange = true;
      }
      if (isSameDay(date, ranges[i][0]) || isSameDay(date, ranges[i][1])) {
        isSelected = true;
      }
    }
    if (state.pendingRangeStart != null && isSameDay(state.pendingRangeStart, date)) {
      isSelected = true;
      isRangeStart = true;
    }
  } else {
    isSelected = /** @type {number[]} */ (state.selectedDates).some((x) => isSameDay(x, date));
  }
  return {
    isSelected,
    isDisabled: isDayDisabled(state, date),
    isToday: isSameDay(date, startOfDayTs(Date.now())),
    isInRange,
    isRangeStart,
    isRangeEnd
  };
}
