import { getTranslations } from '../utils/locale.js';
import { createEl } from './dom.js';
import { buildDayCtx } from './context.js';

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderFooter(instance, container) {
  const s = instance._state;

  const ctx = buildDayCtx(instance, s.viewDate, false);
  const custom = s.render.footer?.(ctx);
  if (custom) {
    const wrap = createEl('div', s.classes.footer);
    wrap.appendChild(custom);
    container.appendChild(wrap);
    return;
  }

  const buttons = s.buttons;
  if (!buttons) {
    return;
  }

  const arr = Array.isArray(buttons) ? buttons : [buttons];
  const wrap = createEl('div', s.classes.footer + ' ' + s.classes.footer + '--actions');

  for (let i = 0; i < arr.length; i++) {
    let def = arr[i];

    if (typeof def === 'string') {
      def = def === 'today' || def === 'clear' ? { preset: def } : null;
    } else if (!def || typeof def !== 'object') {
      def = null;
    }
    if (!def) continue;

    let el;

    if (def.preset === 'today' || def.preset === 'clear') {
      const action = def.preset;
      const ui = getTranslations(s);
      el = createEl('button', s.classes.footerBtn, {
        type: 'button',
        [s.attributes.footerAction]: action
      });
      el.textContent = action === 'today' ? ui.btnToday : ui.btnClear;
    } else {
      const tag = def.tagName || 'button';
      const cls = s.classes.footerBtn + (def.className ? ' ' + def.className : '');

      el = createEl(tag, cls, tag === 'button' ? { type: 'button' } : {});

      const content = typeof def.content === 'function' ? def.content(instance) : def.content;
      if (content != null) el.innerHTML = String(content);

      if (def.attrs) {
        for (const k in def.attrs) {
          el.setAttribute(k, String(def.attrs[k]));
        }
      }

      if (typeof def.onClick === 'function') {
        el.addEventListener('click', () => def.onClick(instance));
      }
    }
    wrap.appendChild(el);
  }

  if (wrap.children.length) {
    container.appendChild(wrap);
  }
}
