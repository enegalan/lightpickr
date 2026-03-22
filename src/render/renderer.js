import {
  daysInMonth,
  firstWeekdayOfMonth,
  isInClosedRangeDay,
  isSameDay,
  startOfDayTs,
  tsToYmd,
  ymdToTsStartOfDay,
  defaultMonthNames,
  defaultWeekdayNames
} from '../core/utils.js';
import { isDateDisabled } from '../core/selection.js';
import { createEl, delegate } from './dom.js';

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
 * @property {object} state
 * @property {object} instance
 */

/**
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
    minDate: s.minDate,
    maxDate: s.maxDate,
    disabledDates: s.disabledDatesSorted.slice(),
    locale: s.locale,
    firstDayOfWeek: s.firstDayOfWeek,
    numberOfMonths: s.numberOfMonths,
    format: s.format,
    currentView: s.currentView,
    viewDate: s.viewDate,
    focusDate: s.focusDate,
    visible: s.visible,
    selectedDates: cloneSel(s.selectedDates),
    timePart: Object.assign({}, s.timePart)
  };
}

/**
 * @param {number[]|number[][]} sel
 * @returns {number[]|number[][]}
 */
function cloneSel(sel) {
  if (!sel || !sel.length) {
    return [];
  }
  if (Array.isArray(sel[0])) {
    return sel.map((p) => /** @type {number[]} */ (p).slice());
  }
  return /** @type {number[]} */ (sel).slice();
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
  const today = startOfDayTs(Date.now());
  const flags = dayFlags(s, d, today);
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
    state: publicStateSnapshot(instance),
    instance: instance
  };
}

/**
 * @param {import('../core/state.js').LightpickrInternalState} s
 * @param {number} d
 * @param {number} today
 */
function dayFlags(s, d, today) {
  const disabled = isDateDisabled(s, d);
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
    isDisabled: disabled,
    isToday: isSameDay(d, today),
    isInRange,
    isRangeStart,
    isRangeEnd
  };
}

/**
 * @param {import('../core/state.js').LightpickrClassMap} c
 * @returns {string[]}
 */
function previewClassNames(c) {
  return [c.cellRangePreview, c.cellRangePreviewMid, c.cellRangePreviewStartCap, c.cellRangePreviewEndCap];
}

/**
 * @param {object} instance
 */
export function syncPendingRangeHoverClasses(instance) {
  const root = instance.$datepicker;
  const s = instance._state;
  const c = s.classes;
  const pv = previewClassNames(c);
  const buttons = root.querySelectorAll('[data-lp-day]');
  for (let i = 0; i < buttons.length; i++) {
    const el = buttons[i];
    for (let j = 0; j < pv.length; j++) {
      el.classList.remove(pv[j]);
    }
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
  const p = c.cellRangePreview;
  const mid = c.cellRangePreviewMid;
  const startCap = c.cellRangePreviewStartCap;
  const endCap = c.cellRangePreviewEndCap;

  for (let i = 0; i < buttons.length; i++) {
    const el = /** @type {HTMLButtonElement} */ (buttons[i]);
    const raw = el.getAttribute('data-lp-day');
    if (raw == null) {
      continue;
    }
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      continue;
    }
    const d = startOfDayTs(ts);
    if (d < lo || d > hi) {
      continue;
    }
    if (d > lo && d < hi) {
      el.classList.add(p, mid);
      continue;
    }
    const atLo = d === lo;
    const atHi = d === hi;
    const atAnchor = d === anchor;
    if (atLo && atHi) {
      el.classList.add(p, mid);
      continue;
    }
    if (atLo) {
      if (!atAnchor) {
        el.classList.add(p, startCap);
      }
      continue;
    }
    if (atHi) {
      if (atAnchor) {
        el.classList.add(endCap);
      } else {
        el.classList.add(p, endCap);
      }
    }
  }
}

/**
 * @param {HTMLElement} root
 * @param {EventTarget|null} target
 * @returns {HTMLElement|null}
 */
function dayButtonFromEventTarget(root, target) {
  if (target == null) {
    return null;
  }
  if (!(target instanceof Node) || !root.contains(target)) {
    return null;
  }
  let el = target instanceof Element ? target : target.parentElement;
  if (!el) {
    return null;
  }
  const btn = el.closest('[data-lp-day]');
  return btn && root.contains(btn) ? /** @type {HTMLElement} */ (btn) : null;
}

/**
 * @param {object} instance
 * @param {HTMLElement} dayBtn
 */
function applyRangeHoverFromDayButton(instance, dayBtn) {
  const raw = dayBtn.getAttribute('data-lp-day');
  if (raw == null) {
    return;
  }
  const ts = Number(raw);
  if (!Number.isFinite(ts)) {
    return;
  }
  const next = startOfDayTs(ts);
  if (instance._pendingRangeHoverTs === next) {
    return;
  }
  instance._pendingRangeHoverTs = next;
  syncPendingRangeHoverClasses(instance);
}

/**
 * @param {object} instance
 * @param {HTMLElement} root
 */
export function attachDelegatedHandlers(instance, root) {
  const offs = instance._delegateOffs || [];
  offs.forEach((fn) => fn());
  const off1 = delegate(root, '[data-lp-day]', 'click', function (_ev, el) {
    const raw = el.getAttribute('data-lp-day');
    if (raw == null) {
      return;
    }
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      return;
    }
    instance._handleDayClick(ts);
  });
  const off2 = delegate(root, '[data-lp-nav]', 'click', function (_ev, el) {
    const act = el.getAttribute('data-lp-nav');
    if (act === 'prev') {
      instance.prev();
    } else if (act === 'next') {
      instance.next();
    } else if (act === 'title') {
      instance.up();
    }
  });
  const off3 = delegate(root, '[data-lp-month]', 'click', function (_ev, el) {
    const raw = el.getAttribute('data-lp-month');
    if (raw == null) {
      return;
    }
    const idx = Number(raw);
    if (!Number.isFinite(idx)) {
      return;
    }
    instance._handleMonthPick(idx);
  });
  const off4 = delegate(root, '[data-lp-year]', 'click', function (_ev, el) {
    const raw = el.getAttribute('data-lp-year');
    if (raw == null) {
      return;
    }
    const y = Number(raw);
    if (!Number.isFinite(y)) {
      return;
    }
    instance._handleYearPick(y);
  });
  const timeFn = function (ev) {
    instance._onTimeInputChange(ev);
  };
  root.addEventListener('input', timeFn);
  root.addEventListener('change', timeFn);
  const off5 = function () {
    root.removeEventListener('input', timeFn);
    root.removeEventListener('change', timeFn);
  };

  const onRangeHoverOver = function (ev) {
    if (!instance._state.range || instance._state.pendingRangeStart == null) {
      return;
    }
    const dayBtn = dayButtonFromEventTarget(root, ev.target);
    if (!dayBtn) {
      return;
    }
    applyRangeHoverFromDayButton(instance, dayBtn);
  };

  const onRangeHoverLeave = function () {
    if (instance._pendingRangeHoverTs != null) {
      instance._pendingRangeHoverTs = null;
      syncPendingRangeHoverClasses(instance);
    }
  };

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

  instance._delegateOffs = [off1, off2, off3, off4, off5, off6];
}

/**
 * @param {object} instance
 */
export function renderFull(instance) {
  const s = instance._state;
  const hooks = s.render;
  const root = instance.$datepicker;
  root.innerHTML = '';
  root.className = s.classes.container;
  if (s.inline) {
    root.classList.add('lp--inline');
  } else {
    root.classList.add('lp--popover');
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

  if (s.currentView === 'day') {
    renderDayView(instance, container);
  } else if (s.currentView === 'month') {
    renderMonthView(instance, container);
  } else if (s.currentView === 'year') {
    renderYearView(instance, container);
  } else if (s.currentView === 'time') {
    renderDayView(instance, container);
    renderTimePanel(instance, container);
  }

  if (!s.inline && instance.$pointer) {
    root.appendChild(instance.$pointer);
  }

  instance._pluginOnRender();
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 */
function renderDayView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const headerHook = s.render.header;
  const navHook = s.render.nav;
  const gridHook = s.render.grid;
  const dayHook = s.render.dayCell;

  const header = createEl('div', c.header);
  if (headerHook) {
    const el = headerHook(buildDayCtx(instance, s.viewDate, false));
    if (el) {
      header.appendChild(el);
    }
  } else {
    const nav = createEl('div', c.nav);
    if (navHook) {
      const el = navHook(buildDayCtx(instance, s.viewDate, false));
      if (el) {
        nav.appendChild(el);
      }
    } else {
      const prev = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'prev' });
      prev.textContent = '‹';
      const title = createEl('button', c.titleButton, { type: 'button', 'data-lp-nav': 'title' });
      const { y, m } = tsToYmd(s.viewDate);
      title.textContent = defaultMonthNames({ locale: s.locale })[m] + ' ' + y;
      const next = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'next' });
      next.textContent = '›';
      nav.appendChild(prev);
      nav.appendChild(title);
      nav.appendChild(next);
    }
    header.appendChild(nav);
  }
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const monthsWrap = createEl('div', c.grid + ' lp-months');
  const block = createEl('div', 'lp-month-block');
  const vd = s.viewDate;
  const { y, m } = tsToYmd(vd);
  const grid = createEl('div', c.grid);
  if (gridHook) {
    const fake = buildDayCtx(instance, vd, false);
    const el = gridHook(fake);
    if (el) {
      grid.appendChild(el);
    }
  } else {
      buildWeekdayRow(instance, grid);
    buildDayGrid(instance, grid, y, m, dayHook);
  }
  block.appendChild(grid);
  monthsWrap.appendChild(block);
  viewBody.appendChild(monthsWrap);
  container.appendChild(viewBody);

  if (s.enableTime && s.currentView !== 'time') {
    renderTimePanel(instance, container);
  }
}

/**
 * @param {object} instance
 * @param {HTMLElement} grid
 */
function buildWeekdayRow(instance, grid) {
  const s = instance._state;
  const names = defaultWeekdayNames({ locale: s.locale });
  const fd = s.firstDayOfWeek % 7;
  const row = createEl('div', 'lp-row lp-row--head');
  for (let i = 0; i < 7; i++) {
    const idx = (fd + i) % 7;
    const cell = createEl('div', 'lp-head-cell');
    cell.textContent = names[idx];
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

/**
 * @param {object} instance
 * @param {HTMLElement} grid
 * @param {number} y
 * @param {number} m
 * @param {(ctx: RenderCtx) => HTMLElement|null|undefined} dayHook
 */
function buildDayGrid(instance, grid, y, m, dayHook) {
  const s = instance._state;
  const fd = s.firstDayOfWeek % 7;
  const first = firstWeekdayOfMonth(y, m);
  const leading = (first - fd + 7) % 7;
  const dim = daysInMonth(y, m);
  const prevY = m - 1 < 0 ? y - 1 : y;
  const prevM = m - 1 < 0 ? 11 : m - 1;
  const prevDim = daysInMonth(prevY, prevM);
  let dayNum = 1;
  let nextMonthDay = 1;
  const rows = Math.ceil((leading + dim) / 7);
  const totalCells = Math.max(6, rows) * 7;
  /** @type {HTMLElement|null} */
  let row = null;
  for (let cell = 0; cell < totalCells; cell++) {
    if (cell % 7 === 0) {
      row = createEl('div', 'lp-row');
      grid.appendChild(row);
    }
    let ts;
    let outside = false;
    if (cell < leading) {
      const d = prevDim - (leading - cell - 1);
      ts = ymdToTsStartOfDay(prevY, prevM, d);
      outside = true;
    } else if (dayNum <= dim) {
      ts = ymdToTsStartOfDay(y, m, dayNum);
      dayNum++;
    } else {
      const nm = m + 1 > 11 ? 0 : m + 1;
      const ny = m + 1 > 11 ? y + 1 : y;
      ts = ymdToTsStartOfDay(ny, nm, nextMonthDay);
      nextMonthDay++;
      outside = true;
    }
    const ctx = buildDayCtx(instance, ts, outside);
    let cellEl;
    if (dayHook) {
      const custom = dayHook(ctx);
      cellEl = custom || defaultDayCell(instance, ctx);
    } else {
      cellEl = defaultDayCell(instance, ctx);
    }
    if (row) {
      row.appendChild(cellEl);
    }
  }
}

/**
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
  if (ctx.isFocused) {
    extra.push(c.cellFocused);
  }
  const el = createEl('button', extra.join(' '), { type: 'button', 'data-lp-day': String(ctx.date) });
  const { d } = tsToYmd(ctx.date);
  el.textContent = String(d);
  if (ctx.isDisabled) {
    el.disabled = true;
  }
  return el;
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 */
function renderMonthView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const { y, m } = tsToYmd(s.viewDate);
  const header = createEl('div', c.header);
  const nav = createEl('div', c.nav);
  const prev = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'prev' });
  prev.textContent = '‹';
  const title = createEl('button', c.titleButton, { type: 'button', 'data-lp-nav': 'title' });
  title.textContent = String(y);
  const next = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'next' });
  next.textContent = '›';
  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-month-grid');
  const hook = s.render.monthCell;
  const months = defaultMonthNames({ locale: s.locale });
  for (let mi = 0; mi < 12; mi++) {
    const ts = ymdToTsStartOfDay(y, mi, 1);
    const ctx = buildDayCtx(instance, ts, false);
    ctx.date = ts;
    let el;
    if (hook) {
      el = hook(ctx) || createEl('button', c.cell, { type: 'button', 'data-lp-month': String(mi) });
    } else {
      el = createEl('button', c.cell, { type: 'button', 'data-lp-month': String(mi) });
      el.textContent = months[mi];
    }
    if (!el.getAttribute('data-lp-month')) {
      el.setAttribute('data-lp-month', String(mi));
    }
    if (mi === m) {
      el.className = el.className + ' ' + c.cellSelected;
    }
    grid.appendChild(el);
  }
  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 */
function renderYearView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const y = tsToYmd(s.viewDate).y;
  const start = y - 5;
  const header = createEl('div', c.header);
  const nav = createEl('div', c.nav);
  const prev = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'prev' });
  prev.textContent = '‹';
  const title = createEl('span', c.titleButton + ' ' + c.titleButton + '--disabled' );
  title.textContent = start + ' – ' + (start + 11);
  const next = createEl('button', c.navButton, { type: 'button', 'data-lp-nav': 'next' });
  next.textContent = '›';
  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-year-grid');
  const hook = s.render.yearCell;
  for (let i = 0; i < 12; i++) {
    const yy = start + i;
    const ts = ymdToTsStartOfDay(yy, 0, 1);
    const ctx = buildDayCtx(instance, ts, false);
    ctx.date = ts;
    let el;
    if (hook) {
      el = hook(ctx) || createEl('button', c.cell, { type: 'button', 'data-lp-year': String(yy) });
    } else {
      el = createEl('button', c.cell, { type: 'button', 'data-lp-year': String(yy) });
      el.textContent = String(yy);
    }
    if (!el.getAttribute('data-lp-year')) {
      el.setAttribute('data-lp-year', String(yy));
    }
    if (yy === y) {
      el.className = el.className + ' ' + c.cellSelected;
    }
    grid.appendChild(el);
  }
  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 */
function renderTimePanel(instance, container) {
  const s = instance._state;
  const hook = s.render.time;
  const wrap = createEl('div', s.classes.timePanel);
  if (hook) {
    const ctx = buildDayCtx(instance, s.viewDate, false);
    const el = hook(ctx);
    if (el) {
      wrap.appendChild(el);
    }
  } else {
    const pad2 = (n) => String(n).padStart(2, '0');
    const inp = createEl('input', 'lp-time-input', {
      type: 'time',
      'data-lp-time': 'clock',
      'aria-label': 'Time'
    });
    inp.value = pad2(s.timePart.hours) + ':' + pad2(s.timePart.minutes);
    wrap.appendChild(inp);
  }
  container.appendChild(wrap);
}

/**
 * @param {object} instance
 * @param {'day'|'month'|'year'|undefined} view
 * @returns {number[]}
 */
export function getViewDates(instance, view) {
  const s = instance._state;
  const v = view || s.currentView;
  const out = [];
  if (v === 'day') {
    const vd = s.viewDate;
    const { y, m } = tsToYmd(vd);
    const fd = s.firstDayOfWeek % 7;
    const first = firstWeekdayOfMonth(y, m);
    const leading = (first - fd + 7) % 7;
    const dim = daysInMonth(y, m);
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
        ts = ymdToTsStartOfDay(y, m, dayNum);
        dayNum++;
      } else {
        const nm = m + 1 > 11 ? 0 : m + 1;
        const ny = m + 1 > 11 ? y + 1 : y;
        ts = ymdToTsStartOfDay(ny, nm, nextMonthDay);
        nextMonthDay++;
      }
      out.push(ts);
    }
  } else if (v === 'month') {
    const y = tsToYmd(s.viewDate).y;
    for (let mi = 0; mi < 12; mi++) {
      out.push(ymdToTsStartOfDay(y, mi, 1));
    }
  } else if (v === 'year') {
    const y = tsToYmd(s.viewDate).y;
    const start = y - 5;
    for (let i = 0; i < 12; i++) {
      out.push(ymdToTsStartOfDay(start + i, 0, 1));
    }
  }
  return out;
}
