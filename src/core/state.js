import { normalizeMultipleOption, startOfDayTs, toTimestamp } from './utils.js';

/**
 * @typedef {Object} LightpickrLocale
 * @property {string[]} [months]
 * @property {string[]} [weekdays]
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
 * @property {number|Date|string|null} [minDate]
 * @property {number|Date|string|null} [maxDate]
 * @property {(number|Date|string)[]} [disabledDates]
 * @property {string|LightpickrLocale} [locale]
 * @property {number} [firstDayOfWeek]
 * @property {number} [numberOfMonths]
 * @property {string} [format]
 * @property {boolean} [closeOnSelect]
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
 * @property {number|null} minDate
 * @property {number|null} maxDate
 * @property {number[]} disabledDatesSorted
 * @property {string|LightpickrLocale} locale
 * @property {number} firstDayOfWeek
 * @property {number} numberOfMonths
 * @property {string} format
 * @property {boolean} closeOnSelect
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
  cellFocused: 'lp-cell--focused',
  navButton: 'lp-nav-btn',
  titleButton: 'lp-title-btn',
  timePanel: 'lp-time',
  footer: 'lp-footer',
  popoverPointer: 'lp-popover-pointer lp--pointer',
  viewBody: 'lp-view-body'
};

/**
 * @param {Partial<LightpickrOptions>} raw
 * @returns {LightpickrInternalState}
 */
export function createStateFromOptions(raw) {
  const range = Boolean(raw.range);
  const { multipleLimit, multipleEnabled } = normalizeMultipleOption(raw.multiple, range);
  const minTs = toTimestamp(raw.minDate);
  const maxTs = toTimestamp(raw.maxDate);
  const disabled = Array.isArray(raw.disabledDates) ? raw.disabledDates.map(toTimestamp).filter((t) => t != null) : [];
  disabled.sort((a, b) => a - b);

  const now = Date.now();
  const viewDate = startOfDayTs(now);

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

  return {
    inline: raw.inline != null ? Boolean(raw.inline) : false,
    range,
    multipleEnabled,
    multipleLimit: range ? multipleLimit : multipleEnabled ? multipleLimit : 1,
    enableTime: Boolean(raw.enableTime),
    minDate: minTs != null ? startOfDayTs(minTs) : null,
    maxDate: maxTs != null ? startOfDayTs(maxTs) : null,
    disabledDatesSorted: disabled.map(startOfDayTs),
    locale: raw.locale != null ? raw.locale : 'default',
    firstDayOfWeek: typeof raw.firstDayOfWeek === 'number' ? raw.firstDayOfWeek : 1,
    numberOfMonths: 1,
    format: typeof raw.format === 'string' ? raw.format : 'YYYY-MM-DD',
    closeOnSelect: raw.closeOnSelect !== false,
    onChange: typeof raw.onChange === 'function' ? raw.onChange : function () {},
    onShow: typeof raw.onShow === 'function' ? raw.onShow : function () {},
    onHide: typeof raw.onHide === 'function' ? raw.onHide : function () {},
    onDestroy: typeof raw.onDestroy === 'function' ? raw.onDestroy : function () {},
    render,
    classes: cls,
    currentView: 'day',
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
}

/**
 * @param {LightpickrInternalState} state
 * @returns {LightpickrOptions}
 */
export function extractRawOptions(state) {
  return {
    inline: state.inline,
    multiple: state.multipleEnabled ? state.multipleLimit : false,
    range: state.range,
    enableTime: state.enableTime,
    minDate: state.minDate,
    maxDate: state.maxDate,
    disabledDates: state.disabledDatesSorted.slice(),
    locale: state.locale,
    firstDayOfWeek: state.firstDayOfWeek,
    numberOfMonths: state.numberOfMonths,
    format: state.format,
    closeOnSelect: state.closeOnSelect,
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
  next.selectedDates = state.selectedDates;
  next.pendingRangeStart = state.pendingRangeStart;
  next.rangeAnchor = state.rangeAnchor;
  next.viewDate = state.viewDate;
  next.focusDate = state.focusDate;
  next.visible = state.visible;
  next.currentView = state.currentView;
  next.timePart = Object.assign({}, state.timePart);
  return next;
}
