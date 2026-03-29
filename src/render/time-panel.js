import { pad2, getTranslations } from '../core/utils.js';
import { createEl } from './dom.js';
import { buildDayCtx } from './context.js';

/**
 * @param {object} instance
 * @param {HTMLElement} container
 * @returns {void}
 */
export function renderTimePanel(instance, container) {
  const s = instance._state;
  const wrap = createEl('div', s.classes.timePanel);

  const timeCtx = buildDayCtx(instance, s.viewDate, false);
  const hookEl = s.render.time?.(timeCtx);
  if (hookEl) {
    wrap.appendChild(hookEl);
    container.appendChild(wrap);
    return;
  }

  const { hours: h, minutes: m } = s.timePart;
  const ui = getTranslations(s);
  const clock = _formatClock12Parts(h, m, ui.am, ui.pm);

  const layout = createEl('div', s.classes.timeLayout);

  const display = createEl('div', s.classes.timeDisplayBlock);
  const makeSpan = (cls, text) => {
    const el = createEl('span', cls);
    el.textContent = text;
    return el;
  };

  display.appendChild(makeSpan(s.classes.timeDisplayHours, clock.hourStr));
  display.appendChild(makeSpan(s.classes.timeDisplaySep, ':'));
  display.appendChild(makeSpan(s.classes.timeDisplayMinutes, clock.minuteStr));
  display.appendChild(document.createTextNode(' '));
  display.appendChild(makeSpan(s.classes.timeDisplayAmpm, clock.ampm));

  const slidersCol = createEl('div', s.classes.timeSlidersCol);

  const makeSlider = (type, value, min, max, step) => {
    const el = createEl('input', s.classes.timeSlider + ' ' + s.classes.timeSlider + '--' + type, {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      [s.attributes.time]: type,
      'aria-label': type === 'hours' ? ui.ariaTimeHours : ui.ariaTimeMinutes,
      'aria-valuemin': String(min),
      'aria-valuemax': String(max)
    });
    const v = String(value);
    el.value = v;
    el.setAttribute('aria-valuenow', v);
    el.setAttribute('aria-valuetext', clock.fullLabel);
    return el;
  };

  const rowHours = createEl('div', s.classes.timeSliderRow + ' ' + s.classes.timeSliderRow + '--hours');
  rowHours.appendChild(makeSlider('hours', h, s.minHours, s.maxHours, s.hoursStep));

  const rowMinutes = createEl('div', s.classes.timeSliderRow + ' ' + s.classes.timeSliderRow + '--minutes');
  rowMinutes.appendChild(makeSlider('minutes', m, s.minMinutes, s.maxMinutes, s.minutesStep));

  slidersCol.appendChild(rowHours);
  slidersCol.appendChild(rowMinutes);

  layout.appendChild(display);
  layout.appendChild(slidersCol);
  wrap.appendChild(layout);

  container.appendChild(wrap);
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function syncTimePanelDom(instance) {
  const root = instance.$datepicker;
  const block = root.querySelector('.' + s.classes.timeDisplayBlock);
  if (!block) {
    return;
  }

  const hoursSpan = block.querySelector('.' + s.classes.timeDisplayHours);
  const minutesSpan = block.querySelector('.' + s.classes.timeDisplayMinutes);
  const ampmSpan = block.querySelector('.' + s.classes.timeDisplayAmpm);
  if (!hoursSpan || !minutesSpan || !ampmSpan) {
    return;
  }

  const s = instance._state;
  const ui = getTranslations(s);
  const { hours, minutes } = s.timePart;
  const { hourStr, minuteStr, ampm, fullLabel } = _formatClock12Parts(hours, minutes, ui.am, ui.pm);

  hoursSpan.textContent = hourStr;
  minutesSpan.textContent = minuteStr;
  ampmSpan.textContent = ampm;

  const hoursRange = root.querySelector('input[' + s.attributes.time + '="hours"]');
  const minutesRange = root.querySelector('input[' + s.attributes.time + '="minutes"]');

  const hv = String(hours);
  const mv = String(minutes);

  if (hoursRange instanceof HTMLInputElement) {
    if (hoursRange.value !== hv) {
      hoursRange.value = hv;
    }
    hoursRange.setAttribute('aria-valuenow', hv);
    hoursRange.setAttribute('aria-valuetext', fullLabel);
  }
  if (minutesRange instanceof HTMLInputElement) {
    if (minutesRange.value !== mv) {
      minutesRange.value = mv;
    }
    minutesRange.setAttribute('aria-valuenow', mv);
    minutesRange.setAttribute('aria-valuetext', fullLabel);
  }
}

/**
 * @private
 * @param {number} hours24
 * @param {number} minutes
 * @param {string} amStr
 * @param {string} pmStr
 * @returns {{ hourStr: string, minuteStr: string, ampm: string, fullLabel: string }}
 */
function _formatClock12Parts(hours24, minutes, amStr, pmStr) {
  const h = Math.max(0, Math.min(23, Math.floor(hours24)));
  const m = Math.max(0, Math.min(59, Math.floor(minutes)));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? amStr : pmStr;
  const hourStr = pad2(h12);
  const minuteStr = pad2(m);
  return {
    hourStr,
    minuteStr,
    ampm,
    fullLabel: hourStr + ':' + minuteStr + ' ' + ampm
  };
}
