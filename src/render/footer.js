import { createEl } from '../utils/common.js';
import { buildCtx } from './context.js';

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderFooter(instance, container) {
  const ctx = buildCtx(instance, instance._state.viewDate);
  const custom = instance._state.render.footer?.(ctx);
  if (custom) {
    const wrap = createEl('div', instance._state.classes.footer);
    wrap.appendChild(custom);
    container.appendChild(wrap);
    return;
  }

  if (!instance._state.buttons) {
    return;
  }

  const buttons = Array.isArray(instance._state.buttons) ? instance._state.buttons : [instance._state.buttons];
  const wrap = createEl('div', instance._state.classes.footer + ' ' + instance._state.classes.footer + '--actions');

  for (let i = 0; i < buttons.length; i++) {
    if (!buttons[i] || typeof buttons[i] !== 'object') {
      continue;
    }

    const tag = buttons[i].tagName || 'button';
    const cls = instance._state.classes.footerBtn + (buttons[i].className ? ' ' + buttons[i].className : '');

    const el = createEl(tag, cls, tag === 'button' ? { type: 'button' } : {});

    const content = typeof buttons[i].content === 'function' ? buttons[i].content(instance) : buttons[i].content;
    if (content != null) {
      el.innerHTML = String(content);
    }

    if (buttons[i].attrs) {
      for (const k in buttons[i].attrs) {
        el.setAttribute(k, String(buttons[i].attrs[k]));
      }
    }

    if (typeof buttons[i].onClick === 'function') {
      el.addEventListener('click', () => buttons[i].onClick(instance));
    }

    wrap.appendChild(el);
  }

  if (wrap.children.length) {
    container.appendChild(wrap);
  }
}
