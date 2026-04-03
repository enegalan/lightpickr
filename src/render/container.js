import { buildDayCtx } from './context.js';
import { renderTimePanel } from './time-panel.js';
import { renderDayView } from './views/day.js';
import { renderMonthView, renderYearView } from './views/month-year.js';
import { renderFooter } from './footer.js';

/**
 * @param {object} instance
 * @returns {void}
 */
export function renderContainer(instance) {
  const s = instance._state;
  const hooks = s.render;
  const root = instance.$datepicker;
  root.innerHTML = '';
  root.className = s.classes.container;
  root.classList.add(s.inline ? s.classes.inline : s.classes.popover);
  if (s.onlyTime) {
    root.classList.add(s.classes.container + '--only-time');
  }

  let container = root;
  if (hooks.container) {
    const ctx = buildDayCtx(instance, s.viewDate, false);
    const custom = hooks.container(ctx);
    if (custom) {
      root.appendChild(custom);
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

  if (!s.inline && instance.$pointer) {
    root.appendChild(instance.$pointer);
  }

  instance._pluginOnRender();
}
