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

/**
 * @param {Element} element
 * @param {string} attr
 * @returns {number|null}
 */
export function parseElementNumber(element, attr) {
  if (!(element instanceof Element)) {
    return null;
  }
  const raw = element.getAttribute(attr);
  if (raw == null) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
