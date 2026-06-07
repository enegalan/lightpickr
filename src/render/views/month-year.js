import { viewPage } from '../../core/calendar-grid.js';
import { createEl } from '../../utils/common.js';
import { getTranslations, fromLocale } from '../../utils/locale.js';
import { isFocusDay, isMonthDisabled, isMonthSelected, isYearDisabled, tsToYmd, ymdToTsStartOfDay } from '../../utils/time.js';
import { buildCtx } from '../context.js';
import { mountViewHeader } from '../header.js';

/**
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderMonthView(instance, container) {
  const months = fromLocale(instance._state.locale, instance._state.monthsField);
  const { items: stamps } = viewPage(instance._state, 'month');

  _renderMonthYearGridView(
    instance,
    container,
    instance._state.allowedViews.indexOf('year') >= 0,
    instance._state.classes.monthView,
    getTranslations(instance._state.locale).ariaMonthGrid,
    stamps.length,
    instance._state.monthViewCols,
    instance._state.monthViewRows,
    (i) => {
      const ts = stamps[i];
      const { y: yy, m: mm } = tsToYmd(ts);
      const ariaLabel = `${months[mm]} ${String(yy)}`;
      return _buildMonthYearGridCell(
        instance,
        'month',
        instance._state.attributes.month,
        String(ts),
        isMonthSelected(instance._state, yy, mm),
        ts,
        ariaLabel,
        instance._state.monthViewCount > 12 ? `${months[mm]} ${String(yy)}` : months[mm],
      );
    },
  );
}

/**
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderYearView(instance, container) {
  const { items: years } = viewPage(instance._state, 'year');

  _renderMonthYearGridView(
    instance,
    container,
    false,
    instance._state.classes.yearView,
    getTranslations(instance._state.locale).ariaYearView,
    years.length,
    instance._state.yearViewCols,
    instance._state.yearViewRows,
    (i) => {
      const yy = years[i];
      const ts = ymdToTsStartOfDay(yy, 0, 1);
      const yyStr = String(yy);
      return _buildMonthYearGridCell(
        instance,
        'year',
        instance._state.attributes.year,
        yyStr,
        isMonthSelected(instance._state, yy),
        ts,
        yyStr,
        yyStr,
      );
    },
  );
}

/**
 * @private
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {'month'|'year'} kind
 * @param {string} dataAttr
 * @param {string} dataValueStr
 * @param {boolean} selected
 * @param {number} ts
 * @param {string} ariaLabel
 * @param {string} textContent
 * @returns {HTMLElement}
 */
function _buildMonthYearGridCell(instance, kind, dataAttr, dataValueStr, selected, ts, ariaLabel, textContent) {
  const { y, m } = tsToYmd(ts);
  const isDisabled = kind === 'month' ? isMonthDisabled(instance._state, y, m) : isYearDisabled(instance._state, y);

  if (typeof instance._state.render.cell === 'function') {
    const ctx = buildCtx(instance, ts);
    ctx.isDisabled = isDisabled;
    const custom = instance._state.render.cell(ctx);
    if (custom instanceof HTMLElement) {
      if (!custom.getAttribute(dataAttr)) {
        custom.setAttribute(dataAttr, dataValueStr);
      }
      return custom;
    }
  }

  const isFocused = isFocusDay(instance._state.focusDate, ts);
  const cellClass =
    instance._state.classes.cell +
    (selected ? ` ${instance._state.classes.cellSelected}` : '') +
    (isDisabled ? ` ${instance._state.classes.cellDisabled}` : '') +
    (isFocused ? ` ${instance._state.classes.cellFocused}` : '');
  const attrs = {
    type: 'button',
    [dataAttr]: dataValueStr,
    role: 'gridcell',
    tabindex: isFocused ? '0' : '-1',
    'aria-selected': selected ? 'true' : 'false',
    'aria-disabled': isDisabled ? 'true' : 'false',
    'aria-label': ariaLabel,
  };
  const el = createEl('button', cellClass, attrs);
  el.textContent = textContent;
  if (isDisabled) {
    el.disabled = true;
  }

  return el;
}

/**
 * @private
 * @param {import('../../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @param {boolean} canGoUp
 * @param {string} gridExtraClass
 * @param {string} ariaLabel
 * @param {number} cellCount
 * @param {number} cols
 * @param {number} rows
 * @param {(cellIndex: number) => HTMLElement} buildCell
 * @returns {void}
 */
function _renderMonthYearGridView(
  instance,
  container,
  canGoUp,
  gridExtraClass,
  ariaLabel,
  cellCount,
  cols,
  rows,
  buildCell,
) {
  mountViewHeader(instance, container, instance._state.currentView, canGoUp);

  const viewBody = createEl('div', instance._state.classes.viewBody);
  const grid = createEl('div', `${instance._state.classes.grid} ${gridExtraClass}`, {
    role: 'grid',
    'aria-label': ariaLabel,
  });

  let index = 0;
  for (let r = 0; r < rows; r++) {
    if (index >= cellCount) {
      break;
    }
    const rowEl = createEl('div', `${instance._state.classes.gridRow} ${instance._state.classes.gridRow}--contents`, {
      role: 'row',
    });
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
