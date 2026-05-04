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
    const nav = createEl('div', instance._state.classes.nav);

    const prev = createEl('button', instance._state.classes.navButton, { type: 'button', [instance._state.attributes.nav]: 'prev' });
    prev.innerHTML = instance._state.prevHtml;
    const prevDisabled = isNavOutOfRange(instance._state, -1);

    const next = createEl('button', instance._state.classes.navButton, { type: 'button', [instance._state.attributes.nav]: 'next' });
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
    const title = createEl(titleTag, instance._state.classes.titleButton + (canGoUp ? '' : ' ' + instance._state.classes.titleButton + '--disabled'), canGoUp ? { type: 'button', [instance._state.attributes.nav]: 'title' } : {});
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
    const resolver = (instance._state.navTitles || {})[view];
    if (typeof resolver === 'function') {
        return String(resolver(instance));
    }

    const rawTemplate = typeof resolver === 'string' ? resolver : '';
    return formatDate(rawTemplate, instance._state.viewDate, null, instance._state);
}
