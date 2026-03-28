import { isSameDay, tsToYmd, ymdToTsStartOfDay, defaultMonthNames, getTranslations } from '../../core/utils.js';
import { yearGridYearValues } from '../../core/calendar-grid.js';
import { createEl } from '../dom.js';
import { buildDefaultNav } from '../context.js';
import { applyRenderCellPatch } from '../render-cell.js';

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
  const s = instance._state;
  const { y, m } = tsToYmd(s.viewDate);
  const canGoUp = s.allowedViews.indexOf('year') >= 0;
  const months = defaultMonthNames({ locale: s.locale }, s.monthsField);

  _renderThreeColumnGridView(
    instance,
    container,
    'month',
    canGoUp,
    'lp-month-grid',
    getTranslations(s).ariaMonthGrid,
    (mi) => {
      const ts = ymdToTsStartOfDay(y, mi, 1);
      return _buildMonthYearGridCell(
        instance,
        'data-lp-month',
        String(mi),
        mi === m,
        ts,
        'month',
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
  const s = instance._state;
  const y = tsToYmd(s.viewDate).y;
  const years = yearGridYearValues(y);

  _renderThreeColumnGridView(
    instance,
    container,
    'year',
    false,
    'lp-year-grid',
    getTranslations(s).ariaYearGrid,
    (i) => {
      const yy = years[i];
      const ts = ymdToTsStartOfDay(yy, 0, 1);
      const yyStr = String(yy);
      return _buildMonthYearGridCell(instance, 'data-lp-year', yyStr, yy === y, ts, 'year', yyStr, yyStr);
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
 * @param {'month'|'year'} cellType
 * @param {string} ariaLabel
 * @param {string} textContent
 * @returns {HTMLElement}
 */
function _buildMonthYearGridCell(instance, dataAttr, dataValueStr, selected, ts, cellType, ariaLabel, textContent) {
  const s = instance._state;
  const c = s.classes;
  const isFocused = s.focusDate != null && isSameDay(s.focusDate, ts);
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

  const out = s.onRenderCell({
    date: new Date(ts),
    cellType,
    datepicker: instance
  });

  if (out && typeof out === 'object') {
    applyRenderCellPatch(el, out);
  }

  if (!el.getAttribute(dataAttr)) {
    el.setAttribute(dataAttr, dataValueStr);
  }

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
  const c = instance._state.classes;
  const header = createEl('div', c.header);
  header.appendChild(buildDefaultNav(instance, view, canGoUp));
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' ' + gridExtraClass, { role: 'grid', 'aria-label': ariaLabel });
  _appendThreeColumnGrid(grid, buildCell);
  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @private
 * @param {HTMLElement} grid
 * @param {(cellIndex: number) => HTMLElement} buildCell
 * @returns {void}
 */
function _appendThreeColumnGrid(grid, buildCell) {
  let index = 0;
  for (let r = 0; r < THREE_COL_GRID_ROWS; r++) {
    const rowEl = createEl('div', 'lp-grid-row lp-grid-row--contents', { role: 'row' });
    for (let col = 0; col < THREE_COL_GRID_COLS; col++) {
      rowEl.appendChild(buildCell(index++));
    }
    grid.appendChild(rowEl);
  }
}
