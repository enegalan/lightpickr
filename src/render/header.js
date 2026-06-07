import { viewPage } from '../core/calendar-grid.js';
import { isNavOutOfRange } from '../core/navigation.js';
import { createEl } from '../utils/common.js';
import { formatDate, tsToYmd } from '../utils/time.js';
import { buildCtx } from './context.js';

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @param {'day'|'month'|'year'} view
 * @param {boolean} canGoUp
 * @returns {void}
 */
export function mountViewHeader(instance, container, view, canGoUp) {
  const ctx = buildCtx(instance, instance._state.viewDate);
  const { header: headerHook } = instance._state.render;
  const header = createEl('div', instance._state.classes.header);
  const headerEl = headerHook?.(ctx) || buildDefaultHeader(instance, view, canGoUp);
  if (headerEl) {
    header.appendChild(headerEl);
  }
  container.appendChild(header);
}

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {'day'|'month'|'year'} view
 * @param {boolean} canGoUp
 * @returns {HTMLElement}
 */
export function buildDefaultHeader(instance, view, canGoUp) {
  const nav = createEl('div', instance._state.classes.nav);

  const prev = createEl('button', instance._state.classes.navButton, {
    type: 'button',
    [instance._state.attributes.nav]: 'prev',
  });
  prev.innerHTML = instance._state.prevHtml;

  const next = createEl('button', instance._state.classes.navButton, {
    type: 'button',
    [instance._state.attributes.nav]: 'next',
  });
  next.innerHTML = instance._state.nextHtml;

  if (isNavOutOfRange(instance._state, -1)) {
    prev.disabled = true;
    prev.setAttribute('aria-disabled', 'true');
  }
  if (isNavOutOfRange(instance._state, 1)) {
    next.disabled = true;
    next.setAttribute('aria-disabled', 'true');
  }

  const title = createEl(
    canGoUp ? 'button' : 'span',
    instance._state.classes.titleButton + (canGoUp ? '' : ` ${instance._state.classes.titleButton}--disabled`),
    canGoUp ? { type: 'button', [instance._state.attributes.nav]: 'title' } : {},
  );
  title.innerHTML = _formatHeaderTitle(instance, view);

  nav.appendChild(prev);
  nav.appendChild(title);
  nav.appendChild(next);
  return nav;
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {'day'|'month'|'year'} view
 * @returns {string}
 */
function _formatHeaderTitle(instance, view) {
  let titleView = view;
  /** @type {{ start: number, end: number }|null} */
  let blockYears = null;
  if (view === 'month') {
    const { items } = viewPage(instance._state, 'month');
    const y1 = tsToYmd(items[0]).y;
    const y2 = tsToYmd(items[items.length - 1]).y;
    if (y1 !== y2) {
      titleView = 'year';
      blockYears = { start: y1, end: y2 };
    }
  }
  const resolver = (instance._state.navTitles || {})[titleView];
  if (typeof resolver === 'function') {
    return String(resolver(instance));
  }

  const rawTemplate = typeof resolver === 'string' ? resolver : '';
  return formatDate(rawTemplate, instance._state.viewDate, null, instance._state, blockYears);
}
