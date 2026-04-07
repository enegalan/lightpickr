/**
 * @returns {void}
 */
export function noop() {
}

/**
 * @returns {boolean}
 */
export function truthy() {
    return true;
}

/**
 * @param {unknown} value
 * @param {number} defaultVal
 * @returns {number}
 */
export function toInt(value, defaultVal = 0) {
    return Number.isFinite(Number(value)) ? Math.floor(Number(value)) : defaultVal;
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} defaultVal
 * @returns {number}
 */
export function clampInt(value, min, max, defaultVal = 0) {
    const n = toInt(value, defaultVal);
    return Math.max(min, Math.min(max, n));
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} max
 * @returns {T[]}
 */
export function trimFifo(items, max) {
    return items.length > max ? items.slice(-max) : items.slice();
}

/**
 * @param {number} n
 * @returns {string}
 */
export function pad2(n) {
    return String(n).padStart(2, '0');
}

/**
* @param {unknown} el
* @returns {boolean}
*/
export function isTextInputLike(el) {
    return el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {Record<string, string>} [attrs]
 * @returns {HTMLElement}
 */
export function createEl(tag, className = '', attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (attrs) {
        Object.keys(attrs).forEach((k) => {
            el.setAttribute(k, attrs[k]);
        });
    }
    if (styles) {
        Object.keys(styles).forEach((k) => {
            el.style[k] = styles[k];
        });
    }
    return el;
}
