import { defaultMonthNames, getTranslations } from '../../utils/locale.js';
import { isSameDay, tsToYmd, ymdToTsStartOfDay } from '../../utils/time.js';
import { buildMonthViewTimestamps, buildYearViewYears } from '../../core/calendar-grid.js';
import { createEl } from '../../utils/common.js';
import { buildCtx } from '../context.js';
import { buildDefaultHeader } from '../header.js';

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderMonthView(instance, container) {
  const { y, m } = tsToYmd(instance._state.viewDate);
  const months = defaultMonthNames(instance._state.locale, instance._state.monthsField);
  const stamps = buildMonthViewTimestamps(instance._state);

  _renderMonthYearGridView(
    instance,
    container,
    instance._state.allowedViews.indexOf('year') >= 0,
    instance._state.classes.monthView,
    getTranslations(instance._state.locale).ariaMonthGrid,
    instance._state.monthViewCount,
    instance._state.monthViewCols,
    instance._state.monthViewRows,
    (i) => {
      const ts = stamps[i];
      const { y: yy, m: mm } = tsToYmd(ts);
      const ariaLabel = months[mm] + ' ' + String(yy);
      return _buildMonthYearGridCell(
        instance,
        instance._state.attributes.month,
        String(ts),
        yy === y && mm === m,
        ts,
        ariaLabel,
        instance._state.monthViewCount > 12 ? months[mm] + ' ' + String(yy) : months[mm]
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
  const years = buildYearViewYears(instance._state);

  _renderMonthYearGridView(
    instance,
    container,
    false,
    instance._state.classes.yearView,
    getTranslations(instance._state.locale).ariaYearView,
    instance._state.yearViewCount,
    instance._state.yearViewCols,
    instance._state.yearViewRows,
    (i) => {
      const yy = years[i];
      const ts = ymdToTsStartOfDay(yy, 0, 1);
      const yyStr = String(yy);
      return _buildMonthYearGridCell(
        instance,
        instance._state.attributes.year,
        yyStr,
        yy === y,
        ts,
        yyStr,
        yyStr
      );
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
  const ctx = buildCtx(instance, ts);
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
 * @param {number} cellCount
 * @param {number} cols
 * @param {number} rows
 * @param {(cellIndex: number) => HTMLElement} buildCell
 * @returns {void}
 */
function _renderMonthYearGridView(instance, container, canGoUp, gridExtraClass, ariaLabel, cellCount, cols, rows, buildCell) {
  const { header: headerHook } = instance._state.render;
  const ctx = buildCtx(instance, instance._state.viewDate);

  const header = createEl('div', instance._state.classes.header);
  const headerEl = headerHook?.(ctx) || buildDefaultHeader(instance, instance._state.currentView, canGoUp);
  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);

  const viewBody = createEl('div', instance._state.classes.viewBody);
  const grid = createEl('div', instance._state.classes.grid + ' ' + gridExtraClass, { role: 'grid', 'aria-label': ariaLabel });
  const cssVarName = instance._state.currentView === 'month' ? instance._state.properties.monthViewCols : instance._state.properties.yearViewCols;
  grid.style.setProperty(cssVarName, String(cols));

  let index = 0;
  for (let r = 0; r < rows; r++) {
    if (index >= cellCount) {
      break;
    }
    const rowEl = createEl('div', instance._state.classes.gridRow + ' ' + instance._state.classes.gridRow + '--contents', { role: 'row' });
    for (let col = 0; col < cols; col++) {
      if (index >= cellCount) {
        break;
      }
      rowEl.appendChild(buildCell(index++));
    }
    grid.appendChild(rowEl);
  }

  viewBody.appendChild(grid);
  container.appendChild(viewBody);
}
