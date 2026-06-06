import { buildDayMonthCells } from '../../core/calendar-grid.js';
import lightpickrDefaults from '../../core/defaults.js';
import { createEl } from '../../utils/common.js';
import { defaultWeekdayNames, getTranslations } from '../../utils/locale.js';
import { formatDate, tsToYmd } from '../../utils/time.js';
import { buildCtx } from '../context.js';
import { mountViewHeader } from '../header.js';
import { renderTimePanel } from '../time-panel.js';

/**
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderDayView(instance, container) {
  mountViewHeader(instance, container, 'day', instance._state.allowedViews.indexOf('month') >= 0);

  const viewBody = createEl('div', instance._state.classes.viewBody);
  const monthsWrap = createEl('div', `${instance._state.classes.grid} ${instance._state.classes.months}`);
  const block = createEl('div', instance._state.classes.monthBlock);
  const grid = createEl('div', instance._state.classes.grid, {
    role: 'grid',
    'aria-label': getTranslations(instance._state.locale).ariaDayGrid,
  });

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
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function _buildDayGridHeadRow(instance, grid) {
  const names = defaultWeekdayNames(instance._state.locale, instance._state.weekdaysField);
  const fd = instance._state.firstDay % 7;
  const clickable = instance._state.dayNameClickable === true;

  const tag = clickable ? 'button' : 'div';
  const baseClass =
    instance._state.classes.headCell + (clickable ? ` ${instance._state.classes.headCell}--clickable` : '');

  const row = createEl('div', `${instance._state.classes.row} ${instance._state.classes.row}--head`, { role: 'row' });
  for (let i = 0; i < instance._state.dayViewCols; i++) {
    const idx = (fd + i) % 7;
    const attrs = clickable
      ? { type: 'button', [instance._state.attributes.dayName]: String(idx), role: 'columnheader' }
      : { role: 'columnheader' };
    const cell = createEl(
      tag,
      baseClass + (instance._state.weekends.indexOf(idx) >= 0 ? ` ${instance._state.classes.headCell}--weekend` : ''),
      attrs,
    );
    cell.textContent = names[idx];
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

/**
 * @private
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} grid
 * @returns {void}
 */
function _buildDayGridBodyRows(instance, grid) {
  const cells = buildDayMonthCells(instance._state);

  /** @type {HTMLElement|null} */
  let row = null;
  for (let cell = 0; cell < cells.length; cell++) {
    if (cell % instance._state.dayViewCols === 0) {
      row = createEl('div', instance._state.classes.row, { role: 'row' });
      grid.appendChild(row);
    }

    const { ts, outside } = cells[cell];

    if (outside && !instance._state.showOtherMonths) {
      row &&
        row.appendChild(
          createEl(
            'span',
            `${instance._state.classes.cell} ${instance._state.classes.cellOutside} ${instance._state.classes.cellDisabled}`,
          ),
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
      const extra = [instance._state.classes.cell];
      const flagClassPairs = [
        [ctx.isSelected, instance._state.classes.cellSelected],
        [ctx.isDisabled, instance._state.classes.cellDisabled],
        [ctx.isToday, instance._state.classes.cellToday],
        [ctx.isInRange, instance._state.classes.cellRange],
        [ctx.isRangeStart, instance._state.classes.cellRangeStart],
        [ctx.isRangeEnd, instance._state.classes.cellRangeEnd],
        [ctx.isOutside, instance._state.classes.cellOutside],
        [ctx.isWeekend, instance._state.classes.cellWeekend],
        [ctx.isFocused, instance._state.classes.cellFocused],
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
        'aria-disabled': ctx.isDisabled || (ctx.isOutside && !instance._state.selectOtherMonths) ? 'true' : 'false',
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
