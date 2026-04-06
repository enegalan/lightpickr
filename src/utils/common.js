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
