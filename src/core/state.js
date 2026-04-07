import { clampView } from '../utils/view.js';
import { parseSelectedDates, startOfDayTs, toTimestamp } from '../utils/time.js';
import { normalizeShowEvents, normalizeWeekendIndexes, normalizeAllowedViews, normalizeFirstDay } from '../utils/normalize.js';
import lightpickrDefaults from './defaults.js';

/**
 * @typedef {Object} LightpickrNavTitles
 * @property {string | ((picker: any) => string)} [day]
 * @property {string | ((picker: any) => string)} [month]
 * @property {string | ((picker: any) => string)} [year]
 */

/**
 * @typedef {Object} LightpickrLocale
 * @property {string[]} [monthsShort]
 * @property {string[]} [monthsLong]
 * @property {string[]} [weekdaysShort]
 * @property {string[]} [weekdaysLong]
 * @property {string} [ariaDayGrid]
 * @property {string} [ariaMonthGrid]
 * @property {string} [ariaYearView]
 * @property {string} [ariaTimeHours]
 * @property {string} [ariaTimeMinutes]
 * @property {string} [btnToday]
 * @property {string} [btnClear]
 * @property {string} [am]
 * @property {string} [pm]
 */

/**
 * @typedef {Object} LightpickrRenderHooks
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [container]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [header]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [time]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [footer]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [cell]
 */

/**
 * @typedef {Object} LightpickrSelectPayload
 * @property {Date|Date[]|null} date
 * @property {Date[]} dates
 * @property {string|string[]|''} formattedDate
 * @property {string[]} formattedDates
 * @property {'select'|'unselect'|'clear'|'range-drag'|'time'} trigger
 * @property {any} datepicker
 */

/**
 * @typedef {Object} LightpickrClassMap
 * @property {string} [container]
 * @property {string} [header]
 * @property {string} [nav]
 * @property {string} [grid]
 * @property {string} [cell]
 * @property {string} [cellSelected]
 * @property {string} [cellDisabled]
 * @property {string} [cellToday]
 * @property {string} [cellRange]
 * @property {string} [cellRangeStart]
 * @property {string} [cellRangeEnd]
 * @property {string} [cellRangePreview]
 * @property {string} [cellRangePreviewMid]
 * @property {string} [cellRangePreviewStartCap]
 * @property {string} [cellRangePreviewEndCap]
 * @property {string} [cellOutside]
 * @property {string} [cellFocused]
 * @property {string} [cellActive]
 * @property {string} [navButton]
 * @property {string} [titleButton]
 * @property {string} [timePanel]
 * @property {string} [footer]
 * @property {string} [popoverPointer]
 * @property {string} [viewBody]
 */

/**
 * @typedef {Object} LightpickrPositionCtx
 * @property {HTMLDivElement} $datepicker
 * @property {HTMLElement} $target
 * @property {HTMLElement} $anchor
 * @property {HTMLElement} $pointer
 * @property {boolean} isViewChange
 * @property {() => void} done
 */

/**
 * @callback LightpickrPositionFn
 * @param {LightpickrPositionCtx} ctx
 * @returns {void | (() => void)}
 */

/**
 * @typedef {Object} LightpickrOptions
 * @property {boolean} [inline]
 * @property {boolean|number} [multiple]
 * @property {boolean} [range]
 * @property {boolean} [enableTime]
 * @property {boolean} [onlyTime]
 * @property {number|Date|string|null} [startDate]
 * @property {number|Date|string|null} [minDate]
 * @property {number|Date|string|null} [maxDate]
 * @property {(number|Date|string)[]} [disabledDates]
 * @property {string|LightpickrLocale} [locale]
 * @property {number} [firstDay]
 * @property {number[]} [weekends]
 * @property {boolean} [isMobile]
 * @property {string | ((date: Date | Date[]) => string)} [format]
 * @property {string} [monthsField]
 * @property {string|('day'|'month'|'year')} [view]
 * @property {('day'|'month'|'year')|('day'|'month'|'year')[]} [allowedViews]
 * @property {boolean} [showOtherMonths]
 * @property {boolean} [selectOtherMonths]
 * @property {boolean} [moveToOtherMonthsOnSelect]
 * @property {boolean} [disableNavWhenOutOfRange]
 * @property {string} [multipleSeparator]
 * @property {boolean} [dynamicRange]
 * @property {unknown} [buttons]
 * @property {string | string[]} [showEvent]
 * @property {boolean} [autoClose]
 * @property {string} [prevHtml]
 * @property {string} [nextHtml]
 * @property {LightpickrNavTitles} [navTitles]
 * @property {number} [minHours]
 * @property {number} [maxHours]
 * @property {number} [minMinutes]
 * @property {number} [maxMinutes]
 * @property {number} [hoursStep]
 * @property {number} [minutesStep]
 * @property {(Date|string|number)[] | false} [selectedDates]
 * @property {(payload: LightpickrSelectPayload) => void} [onSelect]
 * @property {(payload: { date: Date, datepicker: any }) => boolean} [onBeforeSelect]
 * @property {(payload: { month: number, year: number, decade: [number, number], datepicker: any }) => void} [onChangeViewDate]
 * @property {(view: 'day'|'month'|'year'|'time') => void} [onChangeView]
 * @property {(isFinished: boolean, payload: { datepicker: any }) => void} [onShow]
 * @property {(isFinished: boolean, payload: { datepicker: any }) => void} [onHide]
 * @property {(payload: { dayIndex: number, datepicker: any }) => void} [onClickDayName]
 * @property {(payload: { date: Date, datepicker: any }) => void} [onFocus]
 * @property {(payload: { date: Date|null, formattedDate: string, datepicker: any }) => void} [onTimeChange]
 * @property {() => void} [onDestroy]
 * @property {Partial<LightpickrRenderHooks>} [render]
 * @property {Partial<LightpickrClassMap>} [classes]
 * @property {Record<string, string>} [attributes]
 * @property {Record<string, string>} [properties]
 * @property {string | LightpickrPositionFn} [position]
 * @property {string | HTMLElement | null} [anchor]
 * @property {number} [yearViewRadius]
 * @property {number} [yearViewCount]
 * @property {number} [monthViewCount]
 * @property {number} [monthViewRadius]
 * @property {number} [monthViewCols]
 * @property {number} [monthViewRows]
 * @property {number} [yearViewCols]
 * @property {number} [yearViewRows]
 */

/**
 * @typedef {Object} LightpickrInternalState
 * @property {boolean} inline
 * @property {boolean} range
 * @property {boolean} multipleEnabled
 * @property {number} multipleLimit
 * @property {boolean} enableTime
 * @property {boolean} onlyTime
 * @property {string[]} showEvents
 * @property {number|null} minDate
 * @property {number|null} maxDate
 * @property {number[]} disabledDatesSorted
 * @property {string|LightpickrLocale} locale
 * @property {number} firstDay
 * @property {number[]} weekends
 * @property {boolean} isMobile
 * @property {string} format
 * @property {string} monthsField
 * @property {('day'|'month'|'year')[]} allowedViews
 * @property {boolean} showOtherMonths
 * @property {boolean} selectOtherMonths
 * @property {boolean} moveToOtherMonthsOnSelect
 * @property {boolean} disableNavWhenOutOfRange
 * @property {string} multipleSeparator
 * @property {boolean} dynamicRange
 * @property {unknown} buttons
 * @property {boolean} autoClose
 * @property {string} prevHtml
 * @property {string} nextHtml
 * @property {LightpickrNavTitles} navTitles
 * @property {number} minHours
 * @property {number} maxHours
 * @property {number} minMinutes
 * @property {number} maxMinutes
 * @property {number} hoursStep
 * @property {number} minutesStep
 * @property {boolean} dayNameClickable
 * @property {(payload: LightpickrSelectPayload) => void} onSelect
 * @property {(payload: { date: Date, datepicker: any }) => boolean} onBeforeSelect
 * @property {(payload: { month: number, year: number, decade: [number, number], datepicker: any }) => void} onChangeViewDate
 * @property {(view: 'day'|'month'|'year'|'time') => void} onChangeView
 * @property {(isFinished: boolean, payload: { datepicker: any }) => void} onShow
 * @property {(isFinished: boolean, payload: { datepicker: any }) => void} onHide
 * @property {(payload: { dayIndex: number, datepicker: any }) => void} onClickDayName
 * @property {(payload: { date: Date, datepicker: any }) => void} onFocus
 * @property {(payload: { date: Date|null, formattedDate: string, datepicker: any }) => void} onTimeChange
 * @property {() => void} onDestroy
 * @property {LightpickrRenderHooks} render
 * @property {LightpickrClassMap} classes
 * @property {Record<string, string>} attributes
 * @property {Record<string, string>} properties
 * @property {'day'|'month'|'year'|'time'} currentView
 * @property {number} viewDate
 * @property {number|null} focusDate
 * @property {boolean} visible
 * @property {number[]|number[][]} selectedDates
 * @property {number|null} rangeAnchor
 * @property {{ hours: number, minutes: number }} timePart
 * @property {number|null} pendingRangeStart
 * @property {string | LightpickrPositionFn} position
 * @property {string | HTMLElement | null} anchor
 * @property {number} yearViewRadius
 * @property {number} yearViewCount
 * @property {number} monthViewCount
 * @property {number} monthViewRadius
 * @property {number} monthViewCols
 * @property {number} monthViewRows
 * @property {number} yearViewCols
 * @property {number} yearViewRows
 */

/**
 * @param {Partial<LightpickrOptions>} incomingRaw
 * @returns {LightpickrInternalState}
 */
export function createStateFromOptions(incomingRaw) {
  const incoming = incomingRaw ?? {};

  const raw = { ...lightpickrDefaults, ...incoming };

  raw.classes = { ...lightpickrDefaults.classes, ...(incoming.classes) };
  raw.render = { ...lightpickrDefaults.render, ...(incoming.render) };
  raw.navTitles = { ...lightpickrDefaults.navTitles, ...(incoming.navTitles) };
  raw.attributes = { ...lightpickrDefaults.attributes, ...(incoming.attributes) };
  raw.properties = { ...lightpickrDefaults.properties, ...(incoming.properties) };
  const onlyTime = Boolean(raw.onlyTime);
  const range = onlyTime ? false : Boolean(raw.range);
  const multiple = onlyTime ? false : raw.multiple;
  let multipleLimit = 1;
  let multipleEnabled = false;
  if (multiple === true) {
    multipleLimit = Number.POSITIVE_INFINITY;
    multipleEnabled = true;
  } else if (multiple === false || multiple == null || multiple === 0 || multiple === 1) {
    multipleLimit = 1;
    multipleEnabled = false;
  } else {
    const n = Number(multiple);
    if (Number.isFinite(n) && n > 1) {
      multipleLimit = Math.floor(n);
      multipleEnabled = true;
    }
  }
  const minTs = toTimestamp(raw.minDate);
  const maxTs = toTimestamp(raw.maxDate);
  const disabled = Array.isArray(raw.disabledDates) ? raw.disabledDates.map(toTimestamp).filter((t) => t != null) : [];
  disabled.sort((a, b) => a - b);

  const viewDate = (() => {
    const startTs = toTimestamp(raw.startDate);
    return startOfDayTs(startTs != null ? startTs : Date.now());
  })();

  /** @type {LightpickrRenderHooks} */
  const render = {
    container: raw.render?.container ?? null,
    header: raw.render?.header ?? null,
    time: raw.render?.time ?? null,
    cell: raw.render?.cell ?? null,
    footer: raw.render?.footer ?? null,
  };

  const allowedViews = normalizeAllowedViews(raw.allowedViews);

  const minHours = Number.isFinite(Number(raw.minHours)) ? Math.max(0, Math.min(23, Math.floor(Number(raw.minHours)))) : lightpickrDefaults.minHours;
  const rawMaxHours = Number.isFinite(Number(raw.maxHours)) ? Math.floor(Number(raw.maxHours)) : lightpickrDefaults.maxHours;
  const maxHours = Math.max(minHours, Math.min(23, rawMaxHours >= 24 ? 23 : rawMaxHours));
  const minMinutes = Number.isFinite(Number(raw.minMinutes)) ? Math.max(0, Math.min(59, Math.floor(Number(raw.minMinutes)))) : lightpickrDefaults.minMinutes;
  const rawMaxMinutes = Number.isFinite(Number(raw.maxMinutes)) ? Math.max(minMinutes, Math.min(59, Math.floor(Number(raw.maxMinutes)))) : lightpickrDefaults.maxMinutes;
  const maxMinutes = Math.max(minMinutes, rawMaxMinutes >= 59 ? 59 : rawMaxMinutes);
  const hoursStep = Number.isFinite(Number(raw.hoursStep)) ? Math.max(1, Math.floor(Number(raw.hoursStep))) : lightpickrDefaults.hoursStep;
  const minutesStep = Number.isFinite(Number(raw.minutesStep)) ? Math.max(1, Math.floor(Number(raw.minutesStep))) : lightpickrDefaults.minutesStep;
  const yearViewCount = Number.isFinite(Number(raw.yearViewCount)) ? Math.floor(Number(raw.yearViewCount)) : lightpickrDefaults.yearViewCount;
  const yearViewRadius = Number.isFinite(Number(raw.yearViewRadius)) ? Math.floor(Number(raw.yearViewRadius)) : lightpickrDefaults.yearViewRadius;
  const monthViewCount = Number.isFinite(Number(raw.monthViewCount)) ? Math.floor(Number(raw.monthViewCount)) : lightpickrDefaults.monthViewCount;
  const monthViewRadius = Number.isFinite(Number(raw.monthViewRadius)) ? Math.floor(Number(raw.monthViewRadius)) : lightpickrDefaults.monthViewRadius;
  let monthViewCols = Number.isFinite(Number(raw.monthViewCols)) ? Math.min(monthViewCount, Math.floor(Number(raw.monthViewCols))) : lightpickrDefaults.monthViewCols;
  let monthViewRows = Number.isFinite(Number(raw.monthViewRows)) ? Math.min(monthViewCount, Math.floor(Number(raw.monthViewRows))) : lightpickrDefaults.monthViewRows;
  let yearViewCols = Number.isFinite(Number(raw.yearViewCols)) ? Math.min(yearViewCount, Math.floor(Number(raw.yearViewCols))) : lightpickrDefaults.yearViewCols;
  let yearViewRows = Number.isFinite(Number(raw.yearViewRows)) ? Math.min(yearViewCount, Math.floor(Number(raw.yearViewRows))) : lightpickrDefaults.yearViewRows;

  if (monthViewCols > 0 && monthViewRows > 0) {
    monthViewRows = Math.max(monthViewRows, Math.ceil(monthViewCount / monthViewCols));
  } else if (monthViewCols > 0) {
    monthViewRows = Math.ceil(monthViewCount / monthViewCols);
  } else if (monthViewRows > 0) {
    monthViewCols = Math.ceil(monthViewCount / monthViewRows);
  }

  if (yearViewCols > 0 && yearViewRows > 0) {
    yearViewRows = Math.max(yearViewRows, Math.ceil(yearViewCount / yearViewCols));
  } else if (yearViewCols > 0) {
    yearViewRows = Math.ceil(yearViewCount / yearViewCols);
  } else if (yearViewRows > 0) {
    yearViewCols = Math.ceil(yearViewCount / yearViewRows);
  }

  const nextState = {
    inline: Boolean(raw.inline),
    range,
    multipleEnabled,
    multipleLimit: range ? multipleLimit : multipleEnabled ? multipleLimit : 1,
    onlyTime,
    enableTime: onlyTime || Boolean(raw.enableTime),
    showEvents: normalizeShowEvents(raw.showEvent),
    minDate: minTs != null ? startOfDayTs(minTs) : null,
    maxDate: maxTs != null ? startOfDayTs(maxTs) : null,
    disabledDatesSorted: disabled.map(startOfDayTs),
    locale: raw.locale,
    firstDay: normalizeFirstDay(raw.firstDay) ?? 1,
    weekends: normalizeWeekendIndexes(raw.weekends),
    isMobile: Boolean(raw.isMobile),
    monthsField: raw.monthsField.trim(),
    allowedViews,
    showOtherMonths: raw.showOtherMonths !== false,
    selectOtherMonths: raw.selectOtherMonths !== false,
    moveToOtherMonthsOnSelect: raw.moveToOtherMonthsOnSelect !== false,
    disableNavWhenOutOfRange: raw.disableNavWhenOutOfRange !== false,
    format: raw.format,
    multipleSeparator: raw.multipleSeparator,
    dynamicRange: Boolean(raw.dynamicRange),
    buttons: raw.buttons ?? false,
    autoClose: Boolean(raw.autoClose),
    prevHtml: raw.prevHtml,
    nextHtml: raw.nextHtml,
    navTitles: raw.navTitles,
    minHours,
    maxHours,
    minMinutes,
    maxMinutes,
    hoursStep,
    minutesStep,
    dayNameClickable: typeof raw.onClickDayName === 'function',
    onSelect: typeof raw.onSelect === 'function' ? raw.onSelect : function () {},
    onBeforeSelect: typeof raw.onBeforeSelect === 'function' ? raw.onBeforeSelect : function () { return true; },
    onChangeViewDate: typeof raw.onChangeViewDate === 'function' ? raw.onChangeViewDate : function () {},
    onChangeView: typeof raw.onChangeView === 'function' ? raw.onChangeView : function () {},
    onShow: typeof raw.onShow === 'function' ? raw.onShow : function () {},
    onHide: typeof raw.onHide === 'function' ? raw.onHide : function () {},
    onClickDayName: typeof raw.onClickDayName === 'function' ? raw.onClickDayName : function () {},
    onFocus: typeof raw.onFocus === 'function' ? raw.onFocus : function () {},
    onTimeChange: typeof raw.onTimeChange === 'function' ? raw.onTimeChange : function () {},
    onDestroy: typeof raw.onDestroy === 'function' ? raw.onDestroy : function () {},
    render,
    classes: raw.classes,
    attributes: raw.attributes,
    properties: raw.properties,
    currentView: onlyTime ? 'time' : clampView(allowedViews, raw.view),
    viewDate,
    focusDate: null,
    visible: false,
    selectedDates: [],
    rangeAnchor: null,
    timePart: { hours: new Date().getHours(), minutes: new Date().getMinutes() },
    pendingRangeStart: null,
    position: raw.position,
    anchor: raw.anchor,
    yearViewCount,
    yearViewRadius,
    monthViewCount,
    monthViewRadius,
    monthViewCols,
    monthViewRows,
    yearViewCols,
    yearViewRows,
  };
  nextState.selectedDates = parseSelectedDates(nextState, raw.selectedDates);
  return nextState;
}

/**
 * @param {LightpickrInternalState} state
 * @param {Partial<LightpickrOptions>} patch
 * @returns {LightpickrInternalState}
 */
export function mergeOptionsIntoState(state, patch) {
  const raw = Object.assign(_extractRawOptions(state), patch);
  raw.render = Object.assign({}, state.render, patch.render);
  raw.classes = Object.assign({}, state.classes, patch.classes);
  raw.attributes = Object.assign({}, state.attributes, patch.attributes);
  raw.properties = Object.assign({}, state.properties, patch.properties);
  return createStateFromOptions(raw);
}
/**
 * @private
 * @param {LightpickrInternalState} state
 * @returns {LightpickrOptions}
 */
function _extractRawOptions(state) {
  return {
    inline: state.inline,
    multiple: state.multipleEnabled ? (Number.isFinite(state.multipleLimit) ? state.multipleLimit : true) : false,
    range: state.range,
    enableTime: state.enableTime,
    onlyTime: state.onlyTime,
    showEvent: state.showEvents.slice(),
    minDate: state.minDate,
    maxDate: state.maxDate,
    disabledDates: state.disabledDatesSorted.slice(),
    locale: state.locale,
    firstDay: state.firstDay,
    weekends: state.weekends.slice(),
    isMobile: state.isMobile,
    format: state.format,
    monthsField: state.monthsField,
    view: state.currentView === 'time' ? 'day' : state.currentView,
    allowedViews: state.allowedViews.slice(),
    showOtherMonths: state.showOtherMonths,
    selectOtherMonths: state.selectOtherMonths,
    moveToOtherMonthsOnSelect: state.moveToOtherMonthsOnSelect,
    disableNavWhenOutOfRange: state.disableNavWhenOutOfRange,
    multipleSeparator: state.multipleSeparator,
    dynamicRange: state.dynamicRange,
    buttons: state.buttons,
    autoClose: state.autoClose,
    prevHtml: state.prevHtml,
    nextHtml: state.nextHtml,
    navTitles: state.navTitles,
    minHours: state.minHours,
    maxHours: state.maxHours,
    minMinutes: state.minMinutes,
    maxMinutes: state.maxMinutes,
    hoursStep: state.hoursStep,
    minutesStep: state.minutesStep,
    onSelect: state.onSelect,
    onBeforeSelect: state.onBeforeSelect,
    onChangeViewDate: state.onChangeViewDate,
    onChangeView: state.onChangeView,
    onShow: state.onShow,
    onHide: state.onHide,
    onClickDayName: state.onClickDayName,
    onFocus: state.onFocus,
    onTimeChange: state.onTimeChange,
    onDestroy: state.onDestroy,
    render: state.render,
    classes: state.classes,
    attributes: state.attributes,
    properties: state.properties,
    position: state.position,
    anchor: state.anchor,
    yearViewCount: state.yearViewCount,
    yearViewRadius: state.yearViewRadius,
    monthViewCount: state.monthViewCount,
    monthViewRadius: state.monthViewRadius,
    monthViewCols: state.monthViewCols,
    monthViewRows: state.monthViewRows,
    yearViewCols: state.yearViewCols,
    yearViewRows: state.yearViewRows,
  };
}
