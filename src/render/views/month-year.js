import { isSameDay, tsToYmd, ymdToTsStartOfDay, defaultMonthNames, getTranslations } from '../../core/utils.js';
import { yearGridYearValues } from '../../core/calendar-grid.js';
import { createEl } from '../dom.js';
import { buildDefaultNav } from '../context.js';
import { applyRenderCellPatch } from '../render-cell.js';

const THREE_COL_GRID_ROWS = 4;
const THREE_COL_GRID_COLS = 3;

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderMonthView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const { y, m } = tsToYmd(s.viewDate);
  const canGoUp = s.allowedViews.indexOf('year') >= 0;

  const header = createEl('div', c.header);
  const nav = buildDefaultNav(instance, 'month', canGoUp);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-month-grid', { role: 'grid', 'aria-label': getTranslations(s).ariaMonthGrid });
  const months = defaultMonthNames({ locale: s.locale }, s.monthsField);

  _appendThreeColumnGrid(grid, (mi) => {
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

    return el;
  });

  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderYearView(instance, container) {
  const s = instance._state;
  const c = s.classes;
  const y = tsToYmd(s.viewDate).y;
  const years = yearGridYearValues(y);

  const header = createEl('div', c.header);
  const nav = buildDefaultNav(instance, 'year', false);
  header.appendChild(nav);
  container.appendChild(header);

  const viewBody = createEl('div', c.viewBody);
  const grid = createEl('div', c.grid + ' lp-year-grid', { role: 'grid', 'aria-label': getTranslations(s).ariaYearGrid });

  _appendThreeColumnGrid(grid, (i) => {
    const yy = years[i];
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

    return el;
  });

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