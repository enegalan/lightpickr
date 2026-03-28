/**
 * @param {HTMLElement} el
 * @param {{ html?: string, classes?: string, disabled?: boolean, attrs?: Record<string, string|number|undefined> }} out
 * @returns {HTMLElement}
 */
export function applyRenderCellPatch(el, out) {
  if (typeof out.html === 'string') {
    el.innerHTML = out.html;
  }

  if (typeof out.classes === 'string' && out.classes.trim()) {
    const classes = out.classes.split(/\s+/).filter(Boolean);
    for (let i = 0; i < classes.length; i++) {
      el.classList.add(classes[i]);
    }
  }

  if (out.disabled === true && 'disabled' in el) {
    // Force non-interactive behavior for custom unavailable cells.
    el.disabled = true;
  }

  if (out.attrs && typeof out.attrs === 'object') {
    const keys = Object.keys(out.attrs);
    for (let i = 0; i < keys.length; i++) {
      const value = out.attrs[keys[i]];
      if (value === undefined) {
        el.removeAttribute(keys[i]);
      } else {
        el.setAttribute(keys[i], String(value));
      }
    }
  }
  return el;
}
