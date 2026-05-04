import { buildCtx } from './context.js';
import { renderTimePanel } from './time-panel.js';
import { renderDayView } from './views/day.js';
import { renderMonthView, renderYearView } from './views/month-year.js';
import { renderFooter } from './footer.js';
import { bindHandlers } from './handlers.js';

/**
 * @param {object} instance
 * @returns {void}
 */
export function renderContainer(instance) {
  instance.$datepicker.innerHTML = '';
  let cn =
    instance._state.classes.container +
    ' ' +
    (instance._state.inline ? instance._state.classes.inline : instance._state.classes.popover) +
    (instance._state.onlyTime ? ' ' + instance._state.classes.container + '--only-time' : '');
  if (!instance._state.inline && typeof instance._state.position !== 'function') {
    cn += ' ' + instance._state.classes.popoverAnim;
  }
  if (!instance._state.inline && instance._state.visible && typeof instance._state.position !== 'function') {
    cn += ' ' + instance._state.classes.popoverOpen;
  }
  instance.$datepicker.className = cn.trim();

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

  instance._pluginOnRender();

  bindHandlers(instance);
}
