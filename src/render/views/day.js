import { buildDayMonthCells } from '../../core/calendar-grid.js';
import { defaultWeekdayNames, getTranslations } from '../../utils/locale.js';
import { formatDate, tsToYmd } from '../../utils/time.js';
import { createEl } from '../../utils/common.js';
import { buildCtx } from '../context.js';
import { buildDefaultHeader } from '../header.js';
import { renderTimePanel } from '../time-panel.js';
import lightpickrDefaults from '../../core/defaults.js';

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderDayView(instance, container) {
  const { header: headerHook } = instance._state.render;

  const ctx = buildCtx(instance, instance._state.viewDate);

  const header = createEl('div', instance._state.classes.header);
  const headerEl = headerHook?.(ctx) || buildDefaultHeader(instance, 'day', instance._state.allowedViews.indexOf('month') >= 0);

  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);

  const viewBody = createEl('div', instance._state.classes.viewBody);
  const monthsWrap = createEl('div', instance._state.classes.grid + ' ' + instance._state.classes.months);
  const block = createEl('div', instance._state.classes.monthBlock);
  const grid = createEl('div', instance._state.classes.grid, { role: 'grid', 'aria-label': getTranslations(instance._state.locale).ariaDayGrid });

  _buildDayGridHeadRow(instance, grid);
  _buildDayGridBodyRows(instance, grid);

  block.appendChild(grid);
  monthsWrap.appendChild(block);
  viewBody.appendChild(monthsWrap);
  container.appendChild(viewBody);

  if (instance._state.enableTime && instance._state.currentView !== 'time') {
    renderTimePanel(instance, container);
  }
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function _buildDayGridHeadRow(instance, grid) {
  const names = defaultWeekdayNames(instance._state.locale, instance._state.weekdaysField);
  const fd = instance._state.firstDay % 7;
  const clickable = instance._state.dayNameClickable === true;

  const tag = clickable ? 'button' : 'div';
  const baseClass = instance._state.classes.headCell + (clickable ? ' ' + instance._state.classes.headCell + '--clickable' : '');

  const row = createEl('div', instance._state.classes.row + ' ' + instance._state.classes.row + '--head', { role: 'row' });
  for (let i = 0; i < 7; i++) {
    const idx = (fd + i) % 7;
    const attrs = clickable
      ? { type: 'button', [instance._state.attributes.dayName]: String(idx), role: 'columnheader' }
      : { role: 'columnheader' };
    const cell = createEl(
      tag,
      baseClass + (instance._state.weekends.indexOf(idx) >= 0 ? ' ' + instance._state.classes.headCell + '--weekend' : ''),
      attrs
    );
    cell.textContent = names[idx];
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function _buildDayGridBodyRows(instance, grid) {
  const c = instance._state.classes;
  const cells = buildDayMonthCells(instance._state);

  /** @type {HTMLElement|null} */
  let row = null;
  for (let cell = 0; cell < cells.length; cell++) {
    if (cell % 7 === 0) {
      row = createEl('div', instance._state.classes.row, { role: 'row' });
      grid.appendChild(row);
    }

    const { ts, outside } = cells[cell];

    if (outside && !instance._state.showOtherMonths) {
      row && row.appendChild(
        createEl('span', c.cell + ' ' + c.cellOutside + ' ' + c.cellDisabled)
      );
      continue;
    }

    const ctx = buildCtx(instance, ts, outside);
    let cellEl = null;
    if (typeof instance._state.render.cell === 'function') {
      const customCellRenderer = instance._state.render.cell(ctx);
      cellEl = customCellRenderer instanceof HTMLElement ? customCellRenderer : null;
    }
    if (!cellEl) {
      const format = typeof instance._state.format === 'string' ? instance._state.format : lightpickrDefaults.format;
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
      const label = formatDate(format, ctx.date, null, instance._state);
      cellEl = createEl('button', extra.join(' '), {
        type: 'button',
        [instance._state.attributes.day]: String(ctx.date),
        role: 'gridcell',
        tabindex: ctx.isFocused ? '0' : '-1',
        'aria-label': label,
        'aria-selected': ctx.isSelected ? 'true' : 'false',
        'aria-disabled': ctx.isDisabled || (ctx.isOutside && !instance._state.selectOtherMonths) ? 'true' : 'false'
      });
      cellEl.textContent = String(d);

      if (ctx.isDisabled) {
        cellEl.disabled = true;
      }
      if (ctx.isOutside && !instance._state.selectOtherMonths) {
        cellEl.disabled = true;
      }
    }
    cellEl && row && row.appendChild(cellEl);
  }
}
