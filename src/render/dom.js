/**
 * @param {string} tag
 * @param {string} [className]
 * @param {Record<string, string>} [attrs]
 * @returns {HTMLElement}
 */
export function createEl(tag, className, attrs) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      el.setAttribute(k, attrs[k]);
    });
  }
  return el;
}

/**
 * @param {HTMLElement} el
 * @param {string} base
 * @param {string} [extra]
 */
export function applyClasses(el, base, extra) {
  const parts = [];
  if (base) {
    parts.push(base);
  }
  if (extra) {
    parts.push(extra);
  }
  el.className = parts.join(' ').trim();
}

/**
 * @param {HTMLElement} el
 * @param {string} type
 * @param {(ev: Event) => void} handler
 */
export function on(el, type, handler) {
  el.addEventListener(type, handler);
}

/**
 * @param {ParentNode} root
 * @param {string} selector
 * @param {string} type
 * @param {(ev: Event, target: Element) => void} handler
 * @returns {() => void}
 */
export function delegate(root, selector, type, handler) {
  const fn = function (ev) {
    const t = ev.target;
    if (!(t instanceof Element)) {
      return;
    }
    const match = t.closest(selector);
    if (match && root.contains(match)) {
      handler(ev, match);
    }
  };
  root.addEventListener(type, fn);
  return function () {
    root.removeEventListener(type, fn);
  };
}
