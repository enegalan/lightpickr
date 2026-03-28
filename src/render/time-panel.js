import { pad2 } from '../core/utils.js';
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
  const clock = _formatClock12Parts(h, m);

  const layout = createEl('div', 'lp-time-layout');

  const display = createEl('div', 'lp-time-display-block');
  const makeSpan = (cls, text) => {
    const el = createEl('span', cls);
    el.textContent = text;
    return el;
  };

  display.appendChild(makeSpan('lp-time-display-hours', clock.hourStr));
  display.appendChild(makeSpan('lp-time-display-sep', ':'));
  display.appendChild(makeSpan('lp-time-display-minutes', clock.minuteStr));
  display.appendChild(document.createTextNode(' '));
  display.appendChild(makeSpan('lp-time-display-ampm', clock.ampm));

  const slidersCol = createEl('div', 'lp-time-sliders-col');

  const makeSlider = (type, value, min, max, step) => {
    const el = createEl('input', `lp-time-slider lp-time-slider--${type}`, {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      'data-lp-time': type,
      'aria-label': type === 'hours' ? 'Hours' : 'Minutes',
      'aria-valuemin': String(min),
      'aria-valuemax': String(max)
    });
    const v = String(value);
    el.value = v;
    el.setAttribute('aria-valuenow', v);
    el.setAttribute('aria-valuetext', clock.fullLabel);
    return el;
  };

  const rowHours = createEl('div', 'lp-time-slider-row lp-time-slider-row--hours');
  rowHours.appendChild(makeSlider('hours', h, s.minHours, s.maxHours, s.hoursStep));

  const rowMinutes = createEl('div', 'lp-time-slider-row lp-time-slider-row--minutes');
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
  const block = root.querySelector('.lp-time-display-block');
  if (!block) {
    return;
  }

  const hoursSpan = block.querySelector('.lp-time-display-hours');
  const minutesSpan = block.querySelector('.lp-time-display-minutes');
  const ampmSpan = block.querySelector('.lp-time-display-ampm');
  if (!hoursSpan || !minutesSpan || !ampmSpan) {
    return;
  }

  const s = instance._state;
  const { hours, minutes } = s.timePart;
  const { hourStr, minuteStr, ampm, fullLabel } = _formatClock12Parts(hours, minutes);

  hoursSpan.textContent = hourStr;
  minutesSpan.textContent = minuteStr;
  ampmSpan.textContent = ampm;

  const hoursRange = root.querySelector('input[data-lp-time="hours"]');
  const minutesRange = root.querySelector('input[data-lp-time="minutes"]');

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
 * @returns {{ hourStr: string, minuteStr: string, ampm: 'AM'|'PM', fullLabel: string }}
 */
function _formatClock12Parts(hours24, minutes) {
  const h = Math.max(0, Math.min(23, Math.floor(hours24)));
  const m = Math.max(0, Math.min(59, Math.floor(minutes)));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hourStr = pad2(h12);
  const minuteStr = pad2(m);
  return {
    hourStr,
    minuteStr,
    ampm,
    fullLabel: hourStr + ':' + minuteStr + ' ' + ampm
  };
}
