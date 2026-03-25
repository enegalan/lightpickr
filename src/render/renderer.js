import { daysInMonth, firstWeekdayOfMonth, isInClosedRangeDay, isSameDay, startOfDayTs, tsToYmd, cloneSelectedDates, ymdToTsStartOfDay, defaultMonthNames, defaultWeekdayNames, formatDate } from '../core/utils.js';
import { isDateDisabled } from '../core/selection.js';
import { navNextDisabled, navPrevDisabled } from '../core/navigation.js';
import { createEl, delegate, parseElementNumber } from './dom.js';

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
 * @returns {void}
 */
export function syncPendingRangeHoverClasses(instance) {
  const root = instance.$datepicker;
  const s = instance._state;
  const c = s.classes;

  // Clean up range preview classes
  const { rangePreview, rangePreviewMid, rangePreviewStartCap, rangePreviewEndCap } = previewClassNames(c);
  const buttons = root.querySelectorAll('[data-lp-day]');
  for (let i = 0; i < buttons.length; i++) {
    const el = buttons[i];
    el.classList.remove(rangePreview, rangePreviewMid, rangePreviewStartCap, rangePreviewEndCap);
  }

  if (!s.range || s.pendingRangeStart == null) {
    return;
  }

  const hoverRaw = instance._pendingRangeHoverTs;
  if (hoverRaw == null) {
    return;
  }

  const anchor = startOfDayTs(s.pendingRangeStart);
  const hover = startOfDayTs(hoverRaw);
  if (anchor === hover) {
    return;
  }

  const lo = Math.min(anchor, hover);
  const hi = Math.max(anchor, hover);

  for (let i = 0; i < buttons.length; i++) {
    const el = /** @type {HTMLButtonElement} */ (buttons[i]);
    const ts = parseElementNumber(el, 'data-lp-day');
    if (ts == null) {
      continue;
    }

    const d = startOfDayTs(ts);
    if (d < lo || d > hi) {
      continue;
    }

    const atLo = d === lo;
    const atHi = d === hi;
    const atMid = d > lo && d < hi;
    const atAnchor = d === anchor;

    if (atMid || (atLo && atHi)) {
      el.classList.add(rangePreview, rangePreviewMid);
      continue;
    }

    if (atLo) {
      if (!atAnchor) {
        el.classList.add(rangePreview, rangePreviewStartCap);
      }
      continue;
    }
    if (atHi) {
      el.classList.add(atAnchor ? rangePreviewEndCap : rangePreview, rangePreviewEndCap);
    }
  }
}

/**
 * @param {object} instance
 * @param {HTMLElement} root
 * @returns {void}
 */
export function attachDelegatedHandlers(instance, root) {
  const offs = instance._delegateOffs || [];
  offs.forEach((fn) => fn());

  // Day click handler
  const off1 = delegate(root, '[data-lp-day]', 'click', function (_ev, el) {
    const ts = parseElementNumber(el, 'data-lp-day');
    if (ts == null) {
      return;
    }
    instance._handleDayClick(ts);
  });

  // Navigation click handler
  const off2 = delegate(root, '[data-lp-nav]', 'click', function (_ev, el) {
    if (el instanceof HTMLButtonElement && el.disabled) {
      return;
    }
    const act = el.getAttribute('data-lp-nav');
    if (act === 'prev') {
      instance.prev();
    } else if (act === 'next') {
      instance.next();
    } else if (act === 'title') {
      instance.up();
    }
  });

  // Month click handler
  const off3 = delegate(root, '[data-lp-month]', 'click', function (_ev, el) {
    const monthIndex = parseElementNumber(el, 'data-lp-month');
    if (monthIndex == null) {
      return;
    }
    instance._handleMonthPick(monthIndex);
  });

  // Year click handler
  const off4 = delegate(root, '[data-lp-year]', 'click', function (_ev, el) {
    const y = parseElementNumber(el, 'data-lp-year');
    if (y == null) {
      return;
    }
    instance._handleYearPick(y);
  });

  // Day name click handler
  const offDayName = delegate(root, '[data-lp-day-name]', 'click', function (_ev, el) {
    const dayIndex = parseElementNumber(el, 'data-lp-day-name');
    if (dayIndex == null) {
      return;
    }
    instance._handleDayNameClick(dayIndex);
  });

  // Add time input change handlers
  const timeFn = function (ev) {
    instance._onTimeInputChange(ev);
  };
  root.addEventListener('input', timeFn);
  root.addEventListener('change', timeFn);
  const off5 = function () {
    root.removeEventListener('input', timeFn);
    root.removeEventListener('change', timeFn);
  };

  // Range hover over handler
  const onRangeHoverOver = function (ev) {
    if (!instance._state.range || instance._state.pendingRangeStart == null) {
      return;
    }
    if (!(ev.target instanceof Node) || !root.contains(ev.target)) {
      return;
    }
    let el = ev.target instanceof Element ? ev.target : ev.target.parentElement;
    if (el == null) {
      return;
    }
    const dayBtn = el.closest('[data-lp-day]');
    const ts = parseElementNumber(dayBtn, 'data-lp-day');
    if (ts == null) {
      return;
    }
    const next = startOfDayTs(ts);
    if (instance._pendingRangeHoverTs === next) {
      return;
    }
    instance._pendingRangeHoverTs = next;
    syncPendingRangeHoverClasses(instance);
  };

  // Range hover leave handler
  const onRangeHoverLeave = function () {
    if (instance._pendingRangeHoverTs != null) {
      instance._pendingRangeHoverTs = null;
      syncPendingRangeHoverClasses(instance);
    }
  };

  // Add range hover handlers
  root.addEventListener('mouseover', onRangeHoverOver);
  root.addEventListener('pointerover', onRangeHoverOver);
  root.addEventListener('mouseleave', onRangeHoverLeave);
  root.addEventListener('pointerleave', onRangeHoverLeave);
  const off6 = function () {
    root.removeEventListener('mouseover', onRangeHoverOver);
    root.removeEventListener('pointerover', onRangeHoverOver);
    root.removeEventListener('mouseleave', onRangeHoverLeave);
    root.removeEventListener('pointerleave', onRangeHoverLeave);
  };

  instance._delegateOffs = [off1, off2, off3, off4, offDayName, off5, off6];
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function renderContainer(instance) {
  const s = instance._state;
  const hooks = s.render;
  const root = instance.$datepicker;
  root.innerHTML = '';
  root.className = s.classes.container;
  root.classList.add(s.inline ? 'lp--inline' : 'lp--popover');
  if (s.onlyTime) {
    root.classList.add('lp--only-time');
  }

  let container = root;
  if (hooks.container) {
    const ctx = buildDayCtx(instance, s.viewDate, false);
    ctx.state = publicStateSnapshot(instance);
    const custom = hooks.container(ctx);
    if (custom) {
      root.appendChild(custom);
      container = custom;
    }
  }

  if (s.onlyTime) {
    renderTimePanel(instance, container);
  } else if (s.currentView === 'day') {
    renderDayView(instance, container);
  } else if (s.currentView === 'month') {
    renderMonthView(instance, container);
  } else if (s.currentView === 'year') {
    renderYearView(instance, container);
  } else if (s.currentView === 'time') {
    renderDayView(instance, container);
    renderTimePanel(instance, container);
  }
  renderFooter(instance, container);

  if (!s.inline && instance.$pointer) {
    root.appendChild(instance.$pointer);
  }

  instance._pluginOnRender();
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function syncTimePanelDom(instance) {
  const root = instance.$datepicker;
  const block = root.querySelector('.lp-time-display-block');
  if (!block) {
    return;
  }

  const hoursSpan = block.querySelector('.lp-time-display-hours');
  const minutesSpan = block.querySelector('.lp-time-display-minutes');
  const ampmSpan = block.querySelector('.lp-time-display-ampm');
  if (!hoursSpan || !minutesSpan || !ampmSpan) {
    return;
  }

  const s = instance._state;
  const { hours, minutes } = s.timePart;
  const { hourStr, minuteStr, ampm, fullLabel } = formatClock12Parts(hours, minutes);

  hoursSpan.textContent = hourStr;
  minutesSpan.textContent = minuteStr;
  ampmSpan.textContent = ampm;

  const hoursRange = root.querySelector('input[data-lp-time="hours"]');
  const minutesRange = root.querySelector('input[data-lp-time="minutes"]');

  const hv = String(hours);
  const mv = String(minutes);

  if (hoursRange instanceof HTMLInputElement) {
    if (hoursRange.value !== hv) {
      hoursRange.value = hv;
    }
    hoursRange.setAttribute('aria-valuenow', hv);
    hoursRange.setAttribute('aria-valuetext', fullLabel);
  }
  if (minutesRange instanceof HTMLInputElement) {
    if (minutesRange.value !== mv) {
      minutesRange.value = mv;
    }
    minutesRange.setAttribute('aria-valuenow', mv);
    minutesRange.setAttribute('aria-valuetext', fullLabel);
  }
}

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
    const fd = state.firstDayOfWeek % 7;
    const first = firstWeekdayOfMonth(y, m);
    const dim = daysInMonth(y, m);
    const leading = (first - fd + 7) % 7;

    const prevY = m - 1 < 0 ? y - 1 : y;
    const prevM = m - 1 < 0 ? 11 : m - 1;
    const prevDim = daysInMonth(prevY, prevM);

    let dayNum = 1;
    let nextMonthDay = 1;
    const rows = Math.ceil((leading + dim) / 7);
    const totalCells = Math.max(6, rows) * 7;
    for (let cell = 0; cell < totalCells; cell++) {
      let ts;
      if (cell < leading) {
        const d = prevDim - (leading - cell - 1);
        ts = ymdToTsStartOfDay(prevY, prevM, d);
      } else if (dayNum <= dim) {
        ts = ymdToTsStartOfDay(y, m, dayNum++);
      } else {
        const nm = m + 1 > 11 ? 0 : m + 1;
        const ny = m + 1 > 11 ? y + 1 : y;
        ts = ymdToTsStartOfDay(ny, nm, nextMonthDay++);
      }
      out.push(ts);
    }
  } else if (v === 'month') {
    for (let mi = 0; mi < 12; mi++) {
      out.push(ymdToTsStartOfDay(y, mi, 1));
    }
  } else if (v === 'year') {
    const start = y - 5;
    for (let i = 0; i < 12; i++) {
      out.push(ymdToTsStartOfDay(start + i, 0, 1));
    }
  }
  return out;
}

/**
 * @private
 * @param {object} instance
 * @returns {object}
 */
function publicStateSnapshot(instance) {
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
 * @private
 * @param {object} instance
 * @param {number} dayTs
 * @param {boolean} outside
 * @returns {RenderCtx}
 */
function buildDayCtx(instance, dayTs, outside) {
  const s = instance._state;
  const d = startOfDayTs(dayTs);
  const flags = dayFlags(s, d, startOfDayTs(Date.now()));
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
 * @private
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @returns {string}
 */
function formatNavTitle(instance, view) {
  const s = instance._state;
  const titles = s.navTitles || {};
  const key = view === 'day' ? 'days' : view === 'month' ? 'months' : 'years';
  const resolver = titles[key];
  if (typeof resolver === 'function') {
    return String(resolver(instance));
  }

  const rawTemplate = typeof resolver === 'string' ? resolver : '';
  const { y, m } = tsToYmd(s.viewDate);
  const blockStart = y - 5;
  const monthLong = defaultMonthNames({ locale: s.locale }, 'monthsLong')[m];
  const monthShort = defaultMonthNames({ locale: s.locale }, s.monthsField)[m];
  return rawTemplate
    .replace(/yyyy1/g, String(blockStart))
    .replace(/yyyy2/g, String(blockStart + 11))
    .replace(/MMMM/g, monthLong || monthShort)
    .replace(/yyyy/g, String(y))
    .replace(/YYYY/g, String(y));
}

/**
 * @private
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @param {boolean} canGoUp
 * @returns {HTMLElement}
 */
function buildDefaultNav(instance, view, canGoUp) {
  const s = instance._state;
  const c = s.classes;

  // Build navigation container
  const nav = createEl('div', c.nav);
  
  // Build previous button
  const prev = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'prev' });
  prev.innerHTML = s.prevHtml;
  const prevDisabled = navPrevDisabled(s);

  // Build next button
  const next = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'next' });
  next.innerHTML = s.nextHtml;
  const nextDisabled = navNextDisabled(s);

  // Disable navigation buttons if needed
  if (prevDisabled) {
    prev.disabled = true;
    prev.setAttribute('aria-disabled', 'true');
  }
  if (nextDisabled) {
    next.disabled = true;
    next.setAttribute('aria-disabled', 'true');
  }

  // Build title
  const titleTag = canGoUp ? 'button' : 'span';
  const title = createEl(titleTag, c.titleButton + (canGoUp ? '' : ' ' + c.titleButton + '--disabled'), canGoUp ? { type: 'button', 'data-lp-nav': 'title' } : {});
  title.innerHTML = formatNavTitle(instance, view);

  // Append navigation elements
  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  return nav;
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInternalState} s
 * @param {number} d
 * @param {number} today
 * @returns {object}
 * @property {boolean} isSelected
 * @property {boolean} isDisabled
 * @property {boolean} isToday
 * @property {boolean} isInRange
 * @property {boolean} isRangeStart
 * @property {boolean} isRangeEnd
 * @property {boolean} isFocused
 * @property {boolean} isOutside
 * @property {boolean} isWeekend
 */
function dayFlags(s, d, today) {
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
 * @param {import('../core/state.js').LightpickrClassMap} c
 * @returns {object}
 * @property {string} rangePreview
 * @property {string} rangePreviewMid
 * @property {string} rangePreviewStartCap
 * @property {string} rangePreviewEndCap
 */
function previewClassNames(c) {
  return {
    rangePreview: c.cellRangePreview,
    rangePreviewMid: c.cellRangePreviewMid,
    rangePreviewStartCap: c.cellRangePreviewStartCap,
    rangePreviewEndCap: c.cellRangePreviewEndCap
  }
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
function renderDayView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const { header: headerHook, nav: navHook, grid: gridHook } = s.render;

  const vd = s.viewDate;
  const ctx = buildDayCtx(instance, vd, false);
  const { y, m } = tsToYmd(vd);

  // Header
  const header = createEl('div', c.header);
  const headerEl =
    headerHook?.(ctx) ||
    navHook?.(ctx) ||
    buildDefaultNav(instance, 'day', s.allowedViews.indexOf('month') >= 0);

  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);

  // Body
  const viewBody = createEl('div', c.viewBody);
  const monthsWrap = createEl('div', c.grid + ' lp-months');
  const block = createEl('div', 'lp-month-block');
  const grid = createEl('div', c.grid, { role: 'grid', 'aria-label': 'Calendar dates' });

  const gridEl = gridHook?.(ctx);
  if (gridEl) {
    grid.appendChild(gridEl);
  } else {
    buildWeekdayRow(instance, grid);
    buildDayGrid(instance, grid, y, m);
  }

  block.appendChild(grid);
  monthsWrap.appendChild(block);
  viewBody.appendChild(monthsWrap);
  container.appendChild(viewBody);

  // Time panel
  if (s.enableTime && s.currentView !== 'time') {
    renderTimePanel(instance, container);
  }
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function buildWeekdayRow(instance, grid) {
  const s = instance._state;
  const names = defaultWeekdayNames({ locale: s.locale });
  const fd = s.firstDayOfWeek % 7;
  const clickable = s.dayNameClickable === true;

  const tag = clickable ? 'button' : 'div';
  const baseClass = 'lp-head-cell' + (clickable ? ' lp-head-cell--clickable' : '');

  const row = createEl('div', 'lp-row lp-row--head', { role: 'row' });
  for (let i = 0; i < 7; i++) {
    const idx = (fd + i) % 7;
    const attrs = clickable
      ? { type: 'button', 'data-lp-day-name': String(idx), role: 'columnheader' }
      : { role: 'columnheader' };
    const cell = createEl(
      tag,
      baseClass,
      attrs
    );
    if (s.weekendIndexes.indexOf(idx) >= 0) {
      cell.classList.add('lp-head-cell--weekend');
    }
    cell.textContent = names[idx];
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} grid
 * @param {number} y
 * @param {number} m
 * @returns {void}
 */
function buildDayGrid(instance, grid, y, m) {
  const s = instance._state;
  const c = s.classes;

  const fd = s.firstDayOfWeek % 7;
  const first = firstWeekdayOfMonth(y, m);
  const leading = (first - fd + 7) % 7;
  const dim = daysInMonth(y, m);

  const prevM = m - 1 < 0 ? 11 : m - 1;
  const prevY = m - 1 < 0 ? y - 1 : y;
  const prevDim = daysInMonth(prevY, prevM);

  const nextM = (m + 1) % 12;
  const nextY = m === 11 ? y + 1 : y;

  let dayNum = 1;
  let nextMonthDay = 1;

  const rows = Math.ceil((leading + dim) / 7);
  const totalCells = Math.max(6, rows) * 7;

  /** @type {HTMLElement|null} */
  let row = null;
  for (let cell = 0; cell < totalCells; cell++) {
    if (cell % 7 === 0) {
      row = createEl('div', 'lp-row', { role: 'row' });
      grid.appendChild(row);
    }

    let ts, outside;
    if (cell < leading) {
      const d = prevDim - (leading - cell - 1);
      ts = ymdToTsStartOfDay(prevY, prevM, d);
      outside = true;
    } else if (dayNum <= dim) {
      ts = ymdToTsStartOfDay(y, m, dayNum);
      dayNum++;
    } else {
      ts = ymdToTsStartOfDay(nextY, nextM, nextMonthDay++);
      outside = true;
    }

    if (outside && !s.showOtherMonths) {
      row && row.appendChild(
        createEl('span', c.cell + ' ' + c.cellOutside + ' ' + c.cellDisabled)
      );
      continue;
    }

    const ctx = buildDayCtx(instance, ts, outside);
    row && row.appendChild(buildDayCellWithRenderHook(instance, ctx));
  }
}

/**
 * @private
 * @param {object} instance
 * @param {RenderCtx} ctx
 * @returns {HTMLElement}
 */
function buildDayCellWithRenderHook(instance, ctx) {
  const s = instance._state;
  const fallback = defaultDayCell(instance, ctx);
  const out = s.onRenderCell({
    date: new Date(ctx.date),
    cellType: 'day',
    datepicker: instance
  });
  if (!out || typeof out !== 'object') {
    return fallback;
  }
  return applyRenderCellPatch(fallback, out);
}

/**
 * @private
 * @param {HTMLElement} el
 * @param {{ html?: string, classes?: string, disabled?: boolean, attrs?: Record<string, string|number|undefined> }} out
 * @returns {HTMLElement}
 */
function applyRenderCellPatch(el, out) {
  if (typeof out.html === 'string') {
    el.innerHTML = out.html;
  }

  if (typeof out.classes === 'string' && out.classes.trim()) {
    const classes = out.classes.split(/\s+/).filter(Boolean);
    for (let i = 0; i < classes.length; i++) {
      el.classList.add(classes[i]);
    }
  }

  if (out.disabled === true && 'disabled' in el) {
    // Force non-interactive behavior for custom unavailable cells.
    el.disabled = true;
  }

  if (out.attrs && typeof out.attrs === 'object') {
    const keys = Object.keys(out.attrs);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = out.attrs[key];
      if (value === undefined) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  return el;
}

/**
 * @private
 * @param {object} instance
 * @param {RenderCtx} ctx
 * @returns {HTMLElement}
 */
function defaultDayCell(instance, ctx) {
  const s = instance._state;
  const c = s.classes;
  const extra = [c.cell];

  if (ctx.isSelected) {
    extra.push(c.cellSelected);
  }
  if (ctx.isDisabled) {
    extra.push(c.cellDisabled);
  }
  if (ctx.isToday) {
    extra.push(c.cellToday);
  }
  if (ctx.isInRange) {
    extra.push(c.cellRange);
  }
  if (ctx.isRangeStart) {
    extra.push(c.cellRangeStart);
  }
  if (ctx.isRangeEnd) {
    extra.push(c.cellRangeEnd);
  }
  if (ctx.isOutside) {
    extra.push(c.cellOutside);
  }
  if (ctx.isWeekend) {
    extra.push(c.cellWeekend);
  }
  if (ctx.isFocused) {
    extra.push(c.cellFocused);
  }

  const { d } = tsToYmd(ctx.date);
  const label = formatDate(s.format, ctx.date, null);
  const el = createEl('button', extra.join(' '), {
    type: 'button',
    'data-lp-day': String(ctx.date),
    role: 'gridcell',
    tabindex: ctx.isFocused ? '0' : '-1',
    'aria-label': label,
    'aria-selected': ctx.isSelected ? 'true' : 'false',
    'aria-disabled': ctx.isDisabled || (ctx.isOutside && !s.selectOtherMonths) ? 'true' : 'false'
  });
  el.textContent = String(d);

  if (ctx.isDisabled) {
    el.disabled = true;
  }
  if (ctx.isOutside && !s.selectOtherMonths) {
    el.disabled = true;
  }
  return el;
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
function renderMonthView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const { y, m } = tsToYmd(s.viewDate);
  const canGoUp = s.allowedViews.indexOf('year') >= 0;

  const header = createEl('div', c.header);
  const nav = buildDefaultNav(instance, 'month', canGoUp);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-month-grid', { role: 'grid', 'aria-label': 'Months' });
  const months = defaultMonthNames({ locale: s.locale }, s.monthsField);
  for (let r = 0; r < 4; r++) {
    const rowEl = createEl('div', 'lp-grid-row lp-grid-row--contents', { role: 'row' });
    for (let col = 0; col < 3; col++) {
      const mi = r * 3 + col;
      const ts = ymdToTsStartOfDay(y, mi, 1);
      const isFocused = s.focusDate != null && isSameDay(s.focusDate, ts);
      const monthCellClass =
        c.cell + (mi === m ? ' ' + c.cellSelected : '') + (isFocused ? ' ' + c.cellFocused : '');
      const el = createEl('button', monthCellClass, {
        type: 'button',
        'data-lp-month': String(mi),
        role: 'gridcell',
        tabindex: isFocused ? '0' : '-1',
        'aria-selected': mi === m ? 'true' : 'false',
        'aria-label': months[mi] + ' ' + String(y)
      });
      el.textContent = months[mi];

      const out = s.onRenderCell({
        date: new Date(ts),
        cellType: 'month',
        datepicker: instance
      });

      if (out && typeof out === 'object') {
        applyRenderCellPatch(el, out);
      }

      if (!el.getAttribute('data-lp-month')) {
        el.setAttribute('data-lp-month', String(mi));
      }

      rowEl.appendChild(el);
    }
    grid.appendChild(rowEl);
  }
  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
function renderYearView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const y = tsToYmd(s.viewDate).y;
  const start = y - 5;

  const header = createEl('div', c.header);
  const nav = buildDefaultNav(instance, 'year', false);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-year-grid', { role: 'grid', 'aria-label': 'Years' });
  for (let r = 0; r < 4; r++) {
    const rowEl = createEl('div', 'lp-grid-row lp-grid-row--contents', { role: 'row' });
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      const yy = start + i;
      const ts = ymdToTsStartOfDay(yy, 0, 1);
      const isFocused = s.focusDate != null && isSameDay(s.focusDate, ts);
      const yearCellClass =
        c.cell + (yy === y ? ' ' + c.cellSelected : '') + (isFocused ? ' ' + c.cellFocused : '');
      const el = createEl('button', yearCellClass, {
        type: 'button',
        'data-lp-year': String(yy),
        role: 'gridcell',
        tabindex: isFocused ? '0' : '-1',
        'aria-selected': yy === y ? 'true' : 'false',
        'aria-label': String(yy)
      });
      el.textContent = String(yy);

      const out = s.onRenderCell({
        date: new Date(ts),
        cellType: 'year',
        datepicker: instance
      });

      if (out && typeof out === 'object') {
        applyRenderCellPatch(el, out);
      }

      if (!el.getAttribute('data-lp-year')) {
        el.setAttribute('data-lp-year', String(yy));
      }

      rowEl.appendChild(el);
    }
    grid.appendChild(rowEl);
  }
  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @private
 * @param {number} hours24
 * @param {number} minutes
 * @returns {{ hourStr: string, minuteStr: string, ampm: 'AM'|'PM', fullLabel: string }}
 */
function formatClock12Parts(hours24, minutes) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const h = Math.max(0, Math.min(23, Math.floor(hours24)));
  const m = Math.max(0, Math.min(59, Math.floor(minutes)));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hourStr = pad2(h12);
  const minuteStr = pad2(m);
  return {
    hourStr,
    minuteStr,
    ampm,
    fullLabel: hourStr + ':' + minuteStr + ' ' + ampm
  };
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
function renderTimePanel(instance, container) {
  const s = instance._state;
  const wrap = createEl('div', s.classes.timePanel);

  const hookEl = s.render.time?.(ctx);
  if (hookEl) {
    wrap.appendChild(hookEl);
    container.appendChild(wrap);
    return;
  }

  const { hours: h, minutes: m } = s.timePart;
  const clock = formatClock12Parts(h, m);

  const layout = createEl('div', 'lp-time-layout');

  // Display
  const display = createEl('div', 'lp-time-display-block');
  const makeSpan = (cls, text) => {
    const el = createEl('span', cls);
    el.textContent = text;
    return el;
  };

  display.appendChild(makeSpan('lp-time-display-hours', clock.hourStr));
  display.appendChild(makeSpan('lp-time-display-sep', ':'));
  display.appendChild(makeSpan('lp-time-display-minutes', clock.minuteStr));
  display.appendChild(document.createTextNode(' '));
  display.appendChild(makeSpan('lp-time-display-ampm', clock.ampm));

  // Sliders
  const slidersCol = createEl('div', 'lp-time-sliders-col');

  const makeSlider = (type, value, min, max, step) => {
    const el = createEl('input', `lp-time-slider lp-time-slider--${type}`, {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      'data-lp-time': type,
      'aria-label': type === 'hours' ? 'Hours' : 'Minutes',
      'aria-valuemin': String(min),
      'aria-valuemax': String(max)
    });
    const v = String(value);
    el.value = v;
    el.setAttribute('aria-valuenow', v);
    el.setAttribute('aria-valuetext', clock.fullLabel);
    return el;
  };

  const rowHours = createEl('div', 'lp-time-slider-row lp-time-slider-row--hours');
  rowHours.appendChild(makeSlider('hours', h, s.minHours, s.maxHours, s.hoursStep));

  const rowMinutes = createEl('div', 'lp-time-slider-row lp-time-slider-row--minutes');
  rowMinutes.appendChild(makeSlider('minutes', m, s.minMinutes, s.maxMinutes, s.minutesStep));

  slidersCol.appendChild(rowHours);
  slidersCol.appendChild(rowMinutes);

  layout.appendChild(display);
  layout.appendChild(slidersCol);
  wrap.appendChild(layout);

  container.appendChild(wrap);
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
function renderFooter(instance, container) {
  const s = instance._state;

  const ctx = buildDayCtx(instance, s.viewDate, false);
  const custom = s.render.footer?.(ctx);
  if (custom) {
    const wrap = createEl('div', s.classes.footer);
    wrap.appendChild(custom);
    container.appendChild(wrap);
    return;
  }

  const buttons = s.buttons;
  if (!buttons) {
    return;
  }

  const arr = Array.isArray(buttons) ? buttons : [buttons];
  const wrap = createEl('div', s.classes.footer + ' lp-footer--actions');

  for (let i = 0; i < arr.length; i++) {
    let def = arr[i];

    // Normalize
    if (typeof def === 'string') {
      def = (def === 'today' || def === 'clear') ? { preset: def } : null;
    } else if (!def || typeof def !== 'object') {
      def = null;
    }
    if (!def) continue;

    let el;

    // Presets
    if (def.preset === 'today' || def.preset === 'clear') {
      const action = def.preset;
      el = createEl('button', 'lp-footer-btn', {
        type: 'button',
        'data-lp-footer-action': action
      });
      el.textContent = action === 'today' ? 'Today' : 'Clear';
    } else {
      const tag = def.tagName || 'button';
      const cls = 'lp-footer-btn' + (def.className ? ' ' + def.className : '');

      el = createEl(tag, cls, tag === 'button' ? { type: 'button' } : {});

      const content = typeof def.content === 'function' ? def.content(instance) : def.content;
      if (content != null) el.innerHTML = String(content);

      if (def.attrs) {
        for (const k in def.attrs) {
          el.setAttribute(k, String(def.attrs[k]));
        }
      }

      if (typeof def.onClick === 'function') {
        el.addEventListener('click', () => def.onClick(instance));
      }
    }
    wrap.appendChild(el);
  }

  if (wrap.children.length) {
    container.appendChild(wrap);
  }
}
