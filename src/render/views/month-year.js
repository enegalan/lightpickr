import { defaultMonthNames, getTranslations } from '../../utils/locale.js';
import { isSameDay, tsToYmd, ymdToTsStartOfDay } from '../../utils/time.js';
import { yearGridYearValues } from '../../core/calendar-grid.js';
import { createEl } from '../../utils/common.js';
import { buildCtx } from '../context.js';
import { buildDefaultHeader } from '../header.js';

/** @private */
const THREE_COL_GRID_ROWS = 4;
/** @private */
const THREE_COL_GRID_COLS = 3;

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderMonthView(instance, container) {
  const { y, m } = tsToYmd(instance._state.viewDate);
  const canGoUp = instance._state.allowedViews.indexOf('year') >= 0;
  const months = defaultMonthNames({ locale: instance._state.locale }, instance._state.monthsField);

  _renderThreeColumnGridView(
    instance,
    container,
    'month',
    canGoUp,
    instance._state.classes.monthGrid,
    getTranslations(instance._state.locale).ariaMonthGrid,
    (mi) => {
      const ts = ymdToTsStartOfDay(y, mi, 1);
      return _buildMonthYearGridCell(
        instance,
        instance._state.attributes.month,
        String(mi),
        mi === m,
        ts,
        months[mi] + ' ' + String(y),
        months[mi]
      );
    }
  );
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderYearView(instance, container) {
  const y = tsToYmd(instance._state.viewDate).y;
  const years = yearGridYearValues(y);

  _renderThreeColumnGridView(
    instance,
    container,
    'year',
    false,
    instance._state.classes.yearGrid,
    getTranslations(instance._state.locale).ariaYearGrid,
    (i) => {
      const yy = years[i];
      const ts = ymdToTsStartOfDay(yy, 0, 1);
      const yyStr = String(yy);
      return _buildMonthYearGridCell(instance, instance._state.attributes.year, yyStr, yy === y, ts, yyStr, yyStr);
    }
  );
}

/**
 * @private
 * @param {object} instance
 * @param {string} dataAttr
 * @param {string} dataValueStr
 * @param {boolean} selected
 * @param {number} ts
 * @param {string} ariaLabel
 * @param {string} textContent
 * @returns {HTMLElement}
 */
function _buildMonthYearGridCell(instance, dataAttr, dataValueStr, selected, ts, ariaLabel, textContent) {
  const ctx = buildCtx(instance, ts, false);
  const cellFn = instance._state.render.cell;
  if (typeof cellFn === 'function') {
    const custom = cellFn(ctx);
    if (custom instanceof HTMLElement) {
      if (!custom.getAttribute(dataAttr)) {
        custom.setAttribute(dataAttr, dataValueStr);
      }
      return custom;
    }
  }

  const c = instance._state.classes;
  const isFocused = instance._state.focusDate != null && isSameDay(instance._state.focusDate, ts);
  const cellClass =
    c.cell + (selected ? ' ' + c.cellSelected : '') + (isFocused ? ' ' + c.cellFocused : '');
  const attrs = {
    type: 'button',
    [dataAttr]: dataValueStr,
    role: 'gridcell',
    tabindex: isFocused ? '0' : '-1',
    'aria-selected': selected ? 'true' : 'false',
    'aria-label': ariaLabel
  };
  const el = createEl('button', cellClass, attrs);
  el.textContent = textContent;

  return el;
}

/**
 * @private
 * @param {object} instance
 * @param {HTMLElement} container
 * @param {'month'|'year'} view
 * @param {boolean} canGoUp
 * @param {string} gridExtraClass
 * @param {string} ariaLabel
 * @param {(cellIndex: number) => HTMLElement} buildCell
 * @returns {void}
 */
function _renderThreeColumnGridView(instance, container, view, canGoUp, gridExtraClass, ariaLabel, buildCell) {
  const s = instance._state;
  const c = s.classes;
  const { header: headerHook } = s.render;
  const ctx = buildCtx(instance, s.viewDate, false);

  const header = createEl('div', c.header);
  const headerEl = headerHook?.(ctx) || buildDefaultHeader(instance, view, canGoUp);
  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' ' + gridExtraClass, { role: 'grid', 'aria-label': ariaLabel });

  let index = 0;
  for (let r = 0; r < THREE_COL_GRID_ROWS; r++) {
    const rowEl = createEl('div', c.gridRow + ' ' + c.gridRow + '--contents', { role: 'row' });
    for (let col = 0; col < THREE_COL_GRID_COLS; col++) {
      rowEl.appendChild(buildCell(index++));
    }
    grid.appendChild(rowEl);
  }

  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}
