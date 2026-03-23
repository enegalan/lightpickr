/**
 * @param {() => void} fn
 * @returns {void}
 */
export function scheduleAnimationFrame(fn) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(fn);
  } else {
    setTimeout(fn, 0);
  }
}
