import {
  clampViewToAllowed,
  normalizeAllowedViews,
  normalizeFirstDay,
  normalizeMultipleOption,
  normalizeShowEvents,
  normalizeTimeBounds,
  normalizeViewOption,
  normalizeWeekendIndexes,
  startOfDayTs,
  toTimestamp
} from './utils.js';

/**
 * @typedef {Object} LightpickrNavTitles
 * @property {string | ((picker: any) => string)} [days]
 * @property {string | ((picker: any) => string)} [months]
 * @property {string | ((picker: any) => string)} [years]
 */

/**
 * @typedef {Object} LightpickrLocale
 * @property {string[]} [months]
 * @property {string[]} [monthsShort]
 * @property {string[]} [monthsLong]
 * @property {string[]} [weekdays]
 * @property {number} [firstDay]
 */

/**
 * @typedef {Object} LightpickrRenderHooks
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [container]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [header]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [nav]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [grid]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [dayCell]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [monthCell]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [yearCell]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [time]
 * @property {(ctx: import('../render/renderer.js').RenderCtx) => HTMLElement} [footer]
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
 * @property {string} [navButton]
 * @property {string} [titleButton]
 * @property {string} [timePanel]
 * @property {string} [footer]
 * @property {string} [popoverPointer]
 * @property {string} [viewBody]
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
 * @property {number} [firstDayOfWeek]
 * @property {number[]} [weekends]
 * @property {boolean} [isMobile]
 * @property {number} [numberOfMonths]
 * @property {string} [format]
 * @property {string} [monthsField]
 * @property {string|('day'|'days'|'month'|'months'|'year'|'years')} [view]
 * @property {string|string[]} [allowedViews]
 * @property {boolean} [showOtherMonths]
 * @property {boolean} [selectOtherMonths]
 * @property {boolean} [moveToOtherMonthsOnSelect]
 * @property {boolean} [disableNavWhenOutOfRange]
 * @property {string} [multipleSeparator]
 * @property {boolean} [dynamicRange]
 * @property {unknown} [buttons]
 * @property {string | string[]} [showEvent]
 * @property {boolean} [autoClose]
 * @property {boolean} [closeOnSelect]
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
 * @property {(dates: number[] | number[][]) => void} [onChange]
 * @property {() => void} [onShow]
 * @property {() => void} [onHide]
 * @property {() => void} [onDestroy]
 * @property {Partial<LightpickrRenderHooks>} [render]
 * @property {Partial<LightpickrClassMap>} [classes]
 * @property {string | LightpickrPositionFn} [position]
 * @property {string | HTMLElement | null} [anchor]
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
 * @returns {void | ((hideDone: () => void) => void)}
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
 * @property {number} firstDayOfWeek
 * @property {number[]} weekendIndexes
 * @property {boolean} isMobile
 * @property {number} numberOfMonths
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
 * @property {boolean} closeOnSelect
 * @property {string} prevHtml
 * @property {string} nextHtml
 * @property {LightpickrNavTitles} navTitles
 * @property {number} minHours
 * @property {number} maxHours
 * @property {number} minMinutes
 * @property {number} maxMinutes
 * @property {number} hoursStep
 * @property {number} minutesStep
 * @property {(dates: number[] | number[][]) => void} onChange
 * @property {() => void} onShow
 * @property {() => void} onHide
 * @property {() => void} onDestroy
 * @property {LightpickrRenderHooks} render
 * @property {LightpickrClassMap} classes
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

const defaultClasses = {
  container: 'lp',
  header: 'lp-header',
  nav: 'lp-nav',
  grid: 'lp-grid',
  cell: 'lp-cell',
  cellSelected: 'lp-cell--selected',
  cellDisabled: 'lp-cell--disabled',
  cellToday: 'lp-cell--today',
  cellRange: 'lp-cell--range',
  cellRangeStart: 'lp-cell--range-start',
  cellRangeEnd: 'lp-cell--range-end',
  cellRangePreview: 'lp-cell--range-preview',
  cellRangePreviewMid: 'lp-cell--range-preview-mid',
  cellRangePreviewStartCap: 'lp-cell--range-preview-start-cap',
  cellRangePreviewEndCap: 'lp-cell--range-preview-end-cap',
  cellOutside: 'lp-cell--outside',
  cellWeekend: 'lp-cell--weekend',
  cellFocused: 'lp-cell--focused',
  navButton: 'lp-nav-btn',
  titleButton: 'lp-title-btn',
  timePanel: 'lp-time',
  footer: 'lp-footer',
  popoverPointer: 'lp-popover-pointer lp--pointer',
  viewBody: 'lp-view-body'
};

/**
 * @param {number[]} dates
 * @param {number} max
 * @returns {number[]}
 */
function trimDatesFifo(dates, max) {
  const out = dates.slice();
  while (out.length > max) {
    out.shift();
  }
  return out;
}

/**
 * @param {number[][]} ranges
 * @param {number} max
 * @returns {number[][]}
 */
function trimRangesFifo(ranges, max) {
  const out = ranges.slice();
  while (out.length > max) {
    out.shift();
  }
  return out;
}

/**
 * @param {LightpickrInternalState} state
 * @param {(Date|string|number)[] | false | undefined} selectedDates
 * @returns {number[]|number[][]}
 */
function parseInitialSelectedDates(state, selectedDates) {
  if (!Array.isArray(selectedDates)) {
    return [];
  }
  if (state.range) {
    const pairs = [];
    for (let i = 0; i < selectedDates.length; i++) {
      const pair = selectedDates[i];
      if (!Array.isArray(pair) || pair.length < 2) {
        continue;
      }
      const a = toTimestamp(pair[0]);
      const b = toTimestamp(pair[1]);
      if (a == null || b == null) {
        continue;
      }
      const start = startOfDayTs(Math.min(a, b));
      const end = startOfDayTs(Math.max(a, b));
      pairs.push([start, end]);
    }
    return trimRangesFifo(pairs, state.multipleLimit);
  }
  const normalized = [];
  for (let i = 0; i < selectedDates.length; i++) {
    const ts = toTimestamp(selectedDates[i]);
    if (ts == null) {
      continue;
    }
    const day = startOfDayTs(ts);
    if (normalized.indexOf(day) < 0) {
      normalized.push(day);
    }
  }
  if (state.multipleEnabled) {
    return trimDatesFifo(normalized, state.multipleLimit);
  }
  return normalized.length ? [normalized[0]] : [];
}

/**
 * @param {Partial<LightpickrOptions>} raw
 * @returns {LightpickrInternalState}
 */
export function createStateFromOptions(raw) {
  const onlyTime = Boolean(raw.onlyTime);
  const range = onlyTime ? false : Boolean(raw.range);
  const { multipleLimit, multipleEnabled } = normalizeMultipleOption(onlyTime ? false : raw.multiple, range);
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
    container: raw.render && raw.render.container ? raw.render.container : null,
    header: raw.render && raw.render.header ? raw.render.header : null,
    nav: raw.render && raw.render.nav ? raw.render.nav : null,
    grid: raw.render && raw.render.grid ? raw.render.grid : null,
    dayCell: raw.render && raw.render.dayCell ? raw.render.dayCell : null,
    monthCell: raw.render && raw.render.monthCell ? raw.render.monthCell : null,
    yearCell: raw.render && raw.render.yearCell ? raw.render.yearCell : null,
    time: raw.render && raw.render.time ? raw.render.time : null,
    footer: raw.render && raw.render.footer ? raw.render.footer : null
  };

  const cls = Object.assign({}, defaultClasses, raw.classes || {});

  const showEvents = normalizeShowEvents(raw.showEvent);
  const monthsField = typeof raw.monthsField === 'string' && raw.monthsField.trim() ? raw.monthsField.trim() : 'monthsShort';

  const firstDay =
    normalizeFirstDay(raw.firstDay) ??
    normalizeFirstDay(raw.firstDayOfWeek) ??
    (raw.locale && typeof raw.locale === 'object' ? normalizeFirstDay(raw.locale.firstDay) : null) ??
    1;

  const allowedViews = normalizeAllowedViews(raw.allowedViews);
  const requestedView = normalizeViewOption(raw.view);
  const initialView = clampViewToAllowed(allowedViews, requestedView);

  const closeOnSelect =
    typeof raw.autoClose === 'boolean'
      ? raw.autoClose
      : raw.closeOnSelect !== false;

  const navTitles = Object.assign(
    {
      days: 'MMMM, <i>yyyy</i>',
      months: 'yyyy',
      years: 'yyyy1 - yyyy2'
    },
    raw.navTitles && typeof raw.navTitles === 'object' ? raw.navTitles : {}
  );

  const tb = normalizeTimeBounds(raw.minHours, raw.maxHours, raw.minMinutes, raw.maxMinutes, raw.hoursStep, raw.minutesStep);

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
    firstDayOfWeek: firstDay,
    weekendIndexes: normalizeWeekendIndexes(raw.weekends),
    isMobile: Boolean(raw.isMobile),
    numberOfMonths: 1,
    format: typeof raw.format === 'string' ? raw.format : 'YYYY-MM-DD',
    monthsField,
    allowedViews,
    showOtherMonths: raw.showOtherMonths !== false,
    selectOtherMonths: raw.selectOtherMonths !== false,
    moveToOtherMonthsOnSelect: raw.moveToOtherMonthsOnSelect !== false,
    disableNavWhenOutOfRange: raw.disableNavWhenOutOfRange !== false,
    multipleSeparator: typeof raw.multipleSeparator === 'string' ? raw.multipleSeparator : ', ',
    dynamicRange: raw.dynamicRange !== false,
    buttons: raw.buttons != null ? raw.buttons : false,
    closeOnSelect,
    prevHtml:
      typeof raw.prevHtml === 'string'
        ? raw.prevHtml
        : '<svg><path d="M17,12 l -5,5 l 5,5"></path></svg>',
    nextHtml:
      typeof raw.nextHtml === 'string'
        ? raw.nextHtml
        : '<svg><path d="M14,12 l 5,5 l -5,5"></path></svg>',
    navTitles,
    minHours: tb.minHours,
    maxHours: tb.maxHours,
    minMinutes: tb.minMinutes,
    maxMinutes: tb.maxMinutes,
    hoursStep: tb.hoursStep,
    minutesStep: tb.minutesStep,
    onChange: typeof raw.onChange === 'function' ? raw.onChange : function () {},
    onShow: typeof raw.onShow === 'function' ? raw.onShow : function () {},
    onHide: typeof raw.onHide === 'function' ? raw.onHide : function () {},
    onDestroy: typeof raw.onDestroy === 'function' ? raw.onDestroy : function () {},
    render,
    classes: cls,
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
          : 'bottom left',
    anchor: raw.anchor != null ? raw.anchor : null
  };
  nextState.selectedDates = parseInitialSelectedDates(nextState, raw.selectedDates);
  return nextState;
}

/**
 * @param {LightpickrInternalState} state
 * @returns {LightpickrOptions}
 */
export function extractRawOptions(state) {
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
    firstDay: state.firstDayOfWeek,
    firstDayOfWeek: state.firstDayOfWeek,
    weekends: state.weekendIndexes.slice(),
    isMobile: state.isMobile,
    numberOfMonths: state.numberOfMonths,
    format: state.format,
    monthsField: state.monthsField,
    view: state.currentView === 'time' ? 'days' : state.currentView + 's',
    allowedViews: state.allowedViews.map((v) => v + 's'),
    showOtherMonths: state.showOtherMonths,
    selectOtherMonths: state.selectOtherMonths,
    moveToOtherMonthsOnSelect: state.moveToOtherMonthsOnSelect,
    disableNavWhenOutOfRange: state.disableNavWhenOutOfRange,
    multipleSeparator: state.multipleSeparator,
    dynamicRange: state.dynamicRange,
    buttons: state.buttons,
    closeOnSelect: state.closeOnSelect,
    autoClose: state.closeOnSelect,
    prevHtml: state.prevHtml,
    nextHtml: state.nextHtml,
    navTitles: state.navTitles,
    minHours: state.minHours,
    maxHours: state.maxHours,
    minMinutes: state.minMinutes,
    maxMinutes: state.maxMinutes,
    hoursStep: state.hoursStep,
    minutesStep: state.minutesStep,
    onChange: state.onChange,
    onShow: state.onShow,
    onHide: state.onHide,
    onDestroy: state.onDestroy,
    render: state.render,
    classes: state.classes,
    position: state.position,
    anchor: state.anchor
  };
}

/**
 * @param {LightpickrInternalState} state
 * @param {Partial<LightpickrOptions>} patch
 * @returns {LightpickrInternalState}
 */
export function mergeOptionsIntoState(state, patch) {
  const raw = Object.assign(extractRawOptions(state), patch);
  if (patch.render) {
    raw.render = Object.assign({}, state.render, patch.render);
  }
  if (patch.classes) {
    raw.classes = Object.assign({}, state.classes, patch.classes);
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
        ? clampViewToAllowed(next.allowedViews, next.currentView === 'time' ? 'day' : next.currentView)
        : state.currentView;
    if (next.onlyTime && next.currentView !== 'time') {
      next.currentView = 'time';
    }
  }
  next.timePart = Object.assign({}, state.timePart);
  return next;
}
