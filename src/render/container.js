import { buildDayMonthRowCount } from '../core/calendar-grid.js';
import { invokePluginHook } from '../core/plugins.js';
import { buildCtx } from './context.js';
import { renderFooter } from './footer.js';
import { bindHandlers } from './handlers.js';
import { renderTimePanel } from './time-panel.js';
import { renderDayView } from './views/day.js';
import { renderMonthView, renderYearView } from './views/month-year.js';

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
export function renderContainer(instance) {
  instance.$datepicker.innerHTML = '';
  let cn = `${instance._state.classes.container} ${
    instance._state.inline ? instance._state.classes.inline : instance._state.classes.popover
  }${instance._state.onlyTime ? ` ${instance._state.classes.container}--only-time` : ''}`;
  if (!instance._state.inline && typeof instance._state.position !== 'function') {
    cn += ` ${instance._state.classes.popoverAnim}`;
  }
  if (!instance._state.inline && instance._state.visible && typeof instance._state.position !== 'function') {
    cn += ` ${instance._state.classes.popoverOpen}`;
  }
  instance.$datepicker.className = cn.trim();

  if (!instance._state.onlyTime) {
    instance.$datepicker.setAttribute(
      instance._state.properties.calendarView,
      instance._state.currentView === 'time' ? 'time' : instance._state.currentView,
    );
    instance.$datepicker.style.setProperty(instance._state.properties.dayViewCols, String(instance._state.dayViewCols));
    instance.$datepicker.style.setProperty(
      instance._state.properties.dayViewRows,
      String(buildDayMonthRowCount(instance._state)),
    );
    instance.$datepicker.style.setProperty(
      instance._state.properties.monthViewCols,
      String(instance._state.monthViewCols),
    );
    instance.$datepicker.style.setProperty(
      instance._state.properties.monthViewRows,
      String(instance._state.monthViewRows),
    );
    instance.$datepicker.style.setProperty(
      instance._state.properties.yearViewCols,
      String(instance._state.yearViewCols),
    );
    instance.$datepicker.style.setProperty(
      instance._state.properties.yearViewRows,
      String(instance._state.yearViewRows),
    );
    if (instance._state.enableTime) {
      instance.$datepicker.setAttribute(instance._state.attributes.time, '1');
    } else {
      instance.$datepicker.removeAttribute(instance._state.attributes.time);
    }
  } else {
    instance.$datepicker.removeAttribute(instance._state.properties.calendarView);
    instance.$datepicker.removeAttribute(instance._state.attributes.time);
    instance.$datepicker.style.removeProperty(instance._state.properties.dayViewCols);
    instance.$datepicker.style.removeProperty(instance._state.properties.dayViewRows);
    instance.$datepicker.style.removeProperty(instance._state.properties.monthViewCols);
    instance.$datepicker.style.removeProperty(instance._state.properties.monthViewRows);
    instance.$datepicker.style.removeProperty(instance._state.properties.yearViewCols);
    instance.$datepicker.style.removeProperty(instance._state.properties.yearViewRows);
  }

  let container = instance.$datepicker;
  if (instance._state.render.container) {
    const ctx = buildCtx(instance, instance._state.viewDate);
    const custom = instance._state.render.container(ctx);
    if (custom) {
      instance.$datepicker.appendChild(custom);
      container = custom;
    }
  }

  if (instance._state.onlyTime) {
    renderTimePanel(instance, container);
  } else if (instance._state.currentView === 'day') {
    renderDayView(instance, container);
  } else if (instance._state.currentView === 'month') {
    renderMonthView(instance, container);
  } else if (instance._state.currentView === 'year') {
    renderYearView(instance, container);
  } else if (instance._state.currentView === 'time') {
    renderDayView(instance, container);
    renderTimePanel(instance, container);
  }
  renderFooter(instance, container);

  if (!instance._state.inline && !instance._state.isMobile && instance.$pointer) {
    instance.$datepicker.appendChild(instance.$pointer);
  }

  invokePluginHook(instance, 'onRender');

  bindHandlers(instance);
}
