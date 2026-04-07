import { formatDate } from '../utils/time.js';
import { createEl } from '../utils/common.js';
import { isNavOutOfRange } from '../core/navigation.js';

/**
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @param {boolean} canGoUp
 * @returns {HTMLElement}
 */
export function buildDefaultHeader(instance, view, canGoUp) {
    const c = instance._state.classes;

    const nav = createEl('div', c.nav);

    const prev = createEl('button', c.navButton, { type: 'button', [instance._state.attributes.nav]: 'prev' });
    prev.innerHTML = instance._state.prevHtml;
    const prevDisabled = isNavOutOfRange(instance._state, -1);

    const next = createEl('button', c.navButton, { type: 'button', [instance._state.attributes.nav]: 'next' });
    next.innerHTML = instance._state.nextHtml;
    const nextDisabled = isNavOutOfRange(instance._state, 1);

    if (prevDisabled) {
        prev.disabled = true;
        prev.setAttribute('aria-disabled', 'true');
    }
    if (nextDisabled) {
        next.disabled = true;
        next.setAttribute('aria-disabled', 'true');
    }

    const titleTag = canGoUp ? 'button' : 'span';
    const title = createEl(titleTag, c.titleButton + (canGoUp ? '' : ' ' + c.titleButton + '--disabled'), canGoUp ? { type: 'button', [instance._state.attributes.nav]: 'title' } : {});
    title.innerHTML = _formatHeaderTitle(instance, view);

    nav.appendChild(prev);
    nav.appendChild(title);
    nav.appendChild(next);
    return nav;
}

/**
 * @private
 * @param {object} instance
 * @param {'day'|'month'|'year'} view
 * @returns {string}
 */
function _formatHeaderTitle(instance, view) {
    const s = instance._state;
    const titles = s.navTitles || {};
    const resolver = titles[view];
    if (typeof resolver === 'function') {
        return String(resolver(instance));
    }

    const rawTemplate = typeof resolver === 'string' ? resolver : '';
    return formatDate(rawTemplate, s.viewDate, null, s);
}
