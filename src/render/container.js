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
  const s = instance._state;
  const hooks = s.render;
  instance.$datepicker.innerHTML = '';
  let cn =
    s.classes.container +
    ' ' +
    (s.inline ? s.classes.inline : s.classes.popover) +
    (s.onlyTime ? ' ' + s.classes.container + '--only-time' : '');
  if (!s.inline && typeof s.position !== 'function') {
    cn += ' ' + s.classes.popoverAnim;
  }
  if (!s.inline && s.visible && typeof s.position !== 'function') {
    cn += ' ' + s.classes.popoverOpen;
  }
  instance.$datepicker.className = cn.trim();
  if (!s.inline) {
    if (typeof s.position === 'function') {
      instance.$datepicker.style.display = s.visible ? '' : 'none';
    } else {
      instance.$datepicker.style.removeProperty('display');
    }
  }

  let container = instance.$datepicker;
  if (hooks.container) {
    const ctx = buildCtx(instance, s.viewDate);
    const custom = hooks.container(ctx);
    if (custom) {
      instance.$datepicker.appendChild(custom);
      container = custom;
    }
  }

  if (s.onlyTime) {
    renderTimePanel(instance, container);
  } else if (s.currentView === 'day') {
    renderDayView(instance, container);
  } else if (s.currentView === 'month') {
    renderMonthView(instance, container);
  } else if (s.currentView === 'year') {
    renderYearView(instance, container);
  } else if (s.currentView === 'time') {
    renderDayView(instance, container);
    renderTimePanel(instance, container);
  }
  renderFooter(instance, container);

  if (!s.inline && !s.isMobile && instance.$pointer) {
    instance.$datepicker.appendChild(instance.$pointer);
  }

  instance._pluginOnRender();

  bindHandlers(instance);
}
