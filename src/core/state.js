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
 * @property {string} [ariaYearGrid]
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
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [nav]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [grid]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [time]
 * @property {(ctx: import('../render/context.js').RenderCtx) => HTMLElement} [footer]
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
 * @property {string|('day'|'days'|'month'|'months'|'year'|'years')} [view]
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
 * @property {(view: 'days'|'months'|'years'|'time') => void} [onChangeView]
 * @property {(payload: { date: Date, cellType: 'day'|'month'|'year', datepicker: any }) => ({ html?: string, classes?: string, disabled?: boolean, attrs?: Record<string, string|number|undefined> } | void)} [onRenderCell]
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
 * @property {(view: 'days'|'months'|'years'|'time') => void} onChangeView
 * @property {(payload: { date: Date, cellType: 'day'|'month'|'year', datepicker: any }) => ({ html?: string, classes?: string, disabled?: boolean, attrs?: Record<string, string|number|undefined> } | void)} onRenderCell
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
 */

/**
 * @param {Partial<LightpickrOptions>} incomingRaw
 * @returns {LightpickrInternalState}
 */
export function createStateFromOptions(incomingRaw) {
  const incoming = incomingRaw ?? {};

  const raw = { ...lightpickrDefaults, ...incoming };

  raw.classes = { ...lightpickrDefaults.classes, ...(incoming.classes ?? {}) };
  raw.render = { ...lightpickrDefaults.render, ...(incoming.render ?? {}) };
  raw.navTitles = { ...lightpickrDefaults.navTitles, ...(incoming.navTitles ?? {}) };
  raw.attributes = { ...lightpickrDefaults.attributes, ...(incoming.attributes ?? {}) };
  raw.properties = { ...lightpickrDefaults.properties, ...(incoming.properties ?? {}) };
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
    if (startTs != null) {
      return startOfDayTs(startTs);
    }
    return startOfDayTs(Date.now());
  })();

  /** @type {LightpickrRenderHooks} */
  const render = {
    container: raw.render?.container ?? null,
    header: raw.render?.header ?? null,
    nav: raw.render?.nav ?? null,
    grid: raw.render?.grid ?? null,
    time: raw.render?.time ?? null,
    footer: raw.render?.footer ?? null
  };

  const cls = Object.assign({}, raw.classes);

  const showEvents = normalizeShowEvents(raw.showEvent);
  const monthsField =
    typeof raw.monthsField === 'string' && raw.monthsField.trim()
      ? raw.monthsField.trim()
      : /** @type {string} */ (lightpickrDefaults.monthsField);

  const resolvedFirstDay = normalizeFirstDay(raw.firstDay) ?? 1;

  const allowedViews = normalizeAllowedViews(raw.allowedViews);
  const initialView = clampView(allowedViews, raw.view);

  const navTitles = Object.assign({}, raw.navTitles);

  const minHours = Number.isFinite(Number(raw.minHours)) ? Math.max(0, Math.min(23, Math.floor(Number(raw.minHours)))) : 0;
  const rawMaxHours = Number.isFinite(Number(raw.maxHours)) ? Math.floor(Number(raw.maxHours)) : 24;
  const maxHours = Math.max(minHours, Math.min(23, rawMaxHours >= 24 ? 23 : rawMaxHours));
  const minMinutes = Number.isFinite(Number(raw.minMinutes)) ? Math.max(0, Math.min(59, Math.floor(Number(raw.minMinutes)))) : 0;
  const rawMaxMinutes = Number.isFinite(Number(raw.maxMinutes)) ? Math.max(minMinutes, Math.min(59, Math.floor(Number(raw.maxMinutes)))) : 59;
  const maxMinutes = Math.max(minMinutes, rawMaxMinutes >= 59 ? 59 : rawMaxMinutes);
  const hoursStep = Number.isFinite(Number(raw.hoursStep)) ? Math.max(1, Math.floor(Number(raw.hoursStep))) : 1;
  const minutesStep = Number.isFinite(Number(raw.minutesStep)) ? Math.max(1, Math.floor(Number(raw.minutesStep))) : 1;

  const nextState = {
    inline: raw.inline != null ? Boolean(raw.inline) : false,
    range,
    multipleEnabled,
    multipleLimit: range ? multipleLimit : multipleEnabled ? multipleLimit : 1,
    onlyTime,
    enableTime: onlyTime || Boolean(raw.enableTime),
    showEvents,
    minDate: minTs != null ? startOfDayTs(minTs) : null,
    maxDate: maxTs != null ? startOfDayTs(maxTs) : null,
    disabledDatesSorted: disabled.map(startOfDayTs),
    locale: raw.locale != null ? raw.locale : 'default',
    firstDay: resolvedFirstDay,
    weekends: normalizeWeekendIndexes(raw.weekends),
    isMobile: Boolean(raw.isMobile),
    monthsField,
    allowedViews,
    showOtherMonths: raw.showOtherMonths !== false,
    selectOtherMonths: raw.selectOtherMonths !== false,
    moveToOtherMonthsOnSelect: raw.moveToOtherMonthsOnSelect !== false,
    disableNavWhenOutOfRange: raw.disableNavWhenOutOfRange !== false,
    format: typeof raw.format === 'function'
        ? raw.format
        : typeof raw.format === 'string'
          ? raw.format
          : lightpickrDefaults.format,
    multipleSeparator: typeof raw.multipleSeparator === 'string' ? raw.multipleSeparator : /** @type {string} */ (lightpickrDefaults.multipleSeparator),
    dynamicRange: raw.dynamicRange !== false,
    buttons: raw.buttons != null ? raw.buttons : false,
    autoClose: typeof raw.autoClose === 'boolean' ? raw.autoClose : lightpickrDefaults.autoClose,
    prevHtml: typeof raw.prevHtml === 'string' ? raw.prevHtml : /** @type {string} */ (lightpickrDefaults.prevHtml),
    nextHtml: typeof raw.nextHtml === 'string' ? raw.nextHtml : /** @type {string} */ (lightpickrDefaults.nextHtml),
    navTitles,
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
    onRenderCell: typeof raw.onRenderCell === 'function' ? raw.onRenderCell : function () {},
    onShow: typeof raw.onShow === 'function' ? raw.onShow : function () {},
    onHide: typeof raw.onHide === 'function' ? raw.onHide : function () {},
    onClickDayName: typeof raw.onClickDayName === 'function' ? raw.onClickDayName : function () {},
    onFocus: typeof raw.onFocus === 'function' ? raw.onFocus : function () {},
    onTimeChange: typeof raw.onTimeChange === 'function' ? raw.onTimeChange : function () {},
    onDestroy: typeof raw.onDestroy === 'function' ? raw.onDestroy : function () {},
    render,
    classes: cls,
    attributes: Object.assign({}, raw.attributes),
    properties: Object.assign({}, raw.properties),
    currentView: onlyTime ? 'time' : initialView,
    viewDate,
    focusDate: null,
    visible: false,
    selectedDates: [],
    rangeAnchor: null,
    timePart: { hours: new Date().getHours(), minutes: new Date().getMinutes() },
    pendingRangeStart: null,
    position:
      typeof raw.position === 'function'
        ? raw.position
        : typeof raw.position === 'string'
          ? raw.position
          : /** @type {string} */ (lightpickrDefaults.position),
    anchor: raw.anchor != null ? raw.anchor : null
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
  if (patch.render) {
    raw.render = Object.assign({}, state.render, patch.render);
  }
  if (patch.classes) {
    raw.classes = Object.assign({}, state.classes, patch.classes);
  }
  if (patch.attributes) {
    raw.attributes = Object.assign({}, state.attributes, patch.attributes);
  }
  if (patch.properties) {
    raw.properties = Object.assign({}, state.properties, patch.properties);
  }
  const next = createStateFromOptions(raw);
  next.selectedDates = patch.selectedDates !== undefined ? next.selectedDates : state.selectedDates;
  next.pendingRangeStart = state.pendingRangeStart;
  next.rangeAnchor = state.rangeAnchor;
  next.viewDate = patch.startDate !== undefined ? next.viewDate : state.viewDate;
  next.focusDate = state.focusDate;
  next.visible = state.visible;
  if (patch.onlyTime === true) {
    next.currentView = 'time';
  } else if (patch.onlyTime === false) {
    next.currentView = state.currentView === 'time' ? 'day' : state.currentView;
  } else {
    next.currentView =
      patch.view !== undefined || patch.allowedViews !== undefined
        ? clampView(next.allowedViews, next.currentView === 'time' ? 'day' : next.currentView)
        : state.currentView;
    if (next.onlyTime && next.currentView !== 'time') {
      next.currentView = 'time';
    }
  }
  next.timePart = Object.assign({}, state.timePart);
  return next;
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
    view: state.currentView === 'time' ? 'days' : state.currentView + 's',
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
    onRenderCell: state.onRenderCell,
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
    anchor: state.anchor
  };
}
