import { buildDayMonthCells } from '../../core/calendar-grid.js';
import { defaultWeekdayNames, getTranslations } from '../../utils/locale.js';
import lightpickrDefaults from '../../core/defaults.js';
import { formatDate, tsToYmd } from '../../utils/time.js';
import { createEl } from '../dom.js';
import { buildDayCtx, buildDefaultNav } from '../context.js';
import { applyRenderCellPatch } from '../cell.js';
import { renderTimePanel } from '../time-panel.js';

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderDayView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const { header: headerHook, nav: navHook, grid: gridHook } = s.render;

  const vd = s.viewDate;
  const ctx = buildDayCtx(instance, vd, false);
  const { y, m } = tsToYmd(vd);

  const header = createEl('div', c.header);
  const headerEl =
    headerHook?.(ctx) ||
    navHook?.(ctx) ||
    buildDefaultNav(instance, 'day', s.allowedViews.indexOf('month') >= 0);

  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const monthsWrap = createEl('div', c.grid + ' ' + c.months);
  const block = createEl('div', c.monthBlock);
  const grid = createEl('div', c.grid, { role: 'grid', 'aria-label': getTranslations(s).ariaDayGrid });

  const gridEl = gridHook?.(ctx);
  if (gridEl) {
    grid.appendChild(gridEl);
  } else {
    _buildWeekdayRow(instance, grid);
    _buildDayGrid(instance, grid, y, m);
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
 * @private
 * @param {object} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function _buildWeekdayRow(instance, grid) {
  const s = instance._state;
  const names = defaultWeekdayNames({ locale: s.locale });
  const fd = s.firstDay % 7;
  const clickable = s.dayNameClickable === true;

  const tag = clickable ? 'button' : 'div';
  const baseClass = s.classes.headCell + (clickable ? ' ' + s.classes.headCell + '--clickable' : '');

  const row = createEl('div', s.classes.row + ' ' + s.classes.row + '--head', { role: 'row' });
  for (let i = 0; i < 7; i++) {
    const idx = (fd + i) % 7;
    const attrs = clickable
      ? { type: 'button', [s.attributes.dayName]: String(idx), role: 'columnheader' }
      : { role: 'columnheader' };
    const cell = createEl(
      tag,
      baseClass,
      attrs
    );
    if (s.weekends.indexOf(idx) >= 0) {
      cell.classList.add(s.classes.headCell + '--weekend');
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
function _buildDayGrid(instance, grid, y, m) {
  const s = instance._state;
  const c = s.classes;
  const cells = buildDayMonthCells(y, m, s.firstDay);

  /** @type {HTMLElement|null} */
  let row = null;
  for (let cell = 0; cell < cells.length; cell++) {
    if (cell % 7 === 0) {
      row = createEl('div', s.classes.row, { role: 'row' });
      grid.appendChild(row);
    }

    const { ts, outside } = cells[cell];

    if (outside && !s.showOtherMonths) {
      row && row.appendChild(
        createEl('span', c.cell + ' ' + c.cellOutside + ' ' + c.cellDisabled)
      );
      continue;
    }

    const ctx = buildDayCtx(instance, ts, outside);
    row && row.appendChild(_buildDayCellWithRenderHook(instance, ctx));
  }
}

/**
 * @private
 * @param {object} instance
 * @param {import('../context.js').RenderCtx} ctx
 * @returns {HTMLElement}
 */
function _defaultDayCell(instance, ctx) {
  const s = instance._state;
  const format = typeof s.format === 'string' ? s.format : lightpickrDefaults.format;
  const c = s.classes;
  const extra = [c.cell];
  const flagClassPairs = [
    [ctx.isSelected, c.cellSelected],
    [ctx.isDisabled, c.cellDisabled],
    [ctx.isToday, c.cellToday],
    [ctx.isInRange, c.cellRange],
    [ctx.isRangeStart, c.cellRangeStart],
    [ctx.isRangeEnd, c.cellRangeEnd],
    [ctx.isOutside, c.cellOutside],
    [ctx.isWeekend, c.cellWeekend],
    [ctx.isFocused, c.cellFocused]
  ];
  for (let i = 0; i < flagClassPairs.length; i++) {
    if (flagClassPairs[i][0]) {
      extra.push(flagClassPairs[i][1]);
    }
  }

  const { d } = tsToYmd(ctx.date);
  const label = formatDate(format, ctx.date, null, s);
  const el = createEl('button', extra.join(' '), {
    type: 'button',
    [s.attributes.day]: String(ctx.date),
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
 * @param {import('../context.js').RenderCtx} ctx
 * @returns {HTMLElement}
 */
function _buildDayCellWithRenderHook(instance, ctx) {
  const s = instance._state;
  const fallback = _defaultDayCell(instance, ctx);
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
