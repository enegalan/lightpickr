import { startOfDayTs } from '../utils/time.js';
import { delegate, parseElementNumber } from './dom.js';

/**
 * @param {object} instance
 * @returns {void}
 */
export function syncPendingRangeHoverClasses(instance) {
  const rangePreview = instance._state.classes.cellRangePreview;
  const rangePreviewMid = instance._state.classes.cellRangePreviewMid;
  const rangePreviewStartCap = instance._state.classes.cellRangePreviewStartCap;
  const rangePreviewEndCap = instance._state.classes.cellRangePreviewEndCap;

  const buttons = instance.$datepicker.querySelectorAll('[' + instance._state.attributes.day + ']');
  for (let i = 0; i < buttons.length; i++) {
    const el = buttons[i];
    el.classList.remove(rangePreview, rangePreviewMid, rangePreviewStartCap, rangePreviewEndCap);
  }

  if (!instance._state.range || instance._state.pendingRangeStart == null) {
    return;
  }

  const hoverRaw = instance._pendingRangeHoverTs;
  if (hoverRaw == null) {
    return;
  }

  const anchor = startOfDayTs(instance._state.pendingRangeStart);
  const hover = startOfDayTs(hoverRaw);
  if (anchor === hover) {
    return;
  }

  const lo = Math.min(anchor, hover);
  const hi = Math.max(anchor, hover);

  for (let i = 0; i < buttons.length; i++) {
    const el = /** @type {HTMLButtonElement} */ (buttons[i]);
    const ts = parseElementNumber(el, instance._state.attributes.day);
    if (ts == null) {
      continue;
    }

    const d = startOfDayTs(ts);
    if (d < lo || d > hi) {
      continue;
    }

    const atLo = d === lo;
    const atHi = d === hi;
    const atMid = d > lo && d < hi;
    const atAnchor = d === anchor;

    if (atMid || (atLo && atHi)) {
      el.classList.add(rangePreview, rangePreviewMid);
      continue;
    }

    if (atLo) {
      if (!atAnchor) {
        el.classList.add(rangePreview, rangePreviewStartCap);
      }
      continue;
    }
    if (atHi) {
      el.classList.add(atAnchor ? rangePreviewEndCap : rangePreview, rangePreviewEndCap);
    }
  }
}

/**
 * @param {object} instance
 * @param {HTMLElement} root
 * @returns {void}
 */
export function attachDelegatedHandlers(instance, root) {
  const offs = instance._delegateOffs || [];
  offs.forEach((fn) => fn());

  const off1 = delegate(root, '[' + instance._state.attributes.day + ']', 'click', function (_ev, el) {
    const ts = parseElementNumber(el, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    instance._handleDayClick(ts);
  });

  const off2 = delegate(root, '[' + instance._state.attributes.nav + ']', 'click', function (_ev, el) {
    if (el instanceof HTMLButtonElement && el.disabled) {
      return;
    }
    const act = el.getAttribute(instance._state.attributes.nav);
    if (act === 'prev') {
      instance.prev();
    } else if (act === 'next') {
      instance.next();
    } else if (act === 'title') {
      instance.up();
    }
  });

  const off3 = delegate(root, '[' + instance._state.attributes.month + ']', 'click', function (_ev, el) {
    const monthIndex = parseElementNumber(el, instance._state.attributes.month);
    if (monthIndex == null) {
      return;
    }
    instance._handleMonthPick(monthIndex);
  });

  const off4 = delegate(root, '[' + instance._state.attributes.year + ']', 'click', function (_ev, el) {
    const y = parseElementNumber(el, instance._state.attributes.year);
    if (y == null) {
      return;
    }
    instance._handleYearPick(y);
  });

  const offDayName = delegate(root, '[' + instance._state.attributes.dayName + ']', 'click', function (_ev, el) {
    const dayIndex = parseElementNumber(el, instance._state.attributes.dayName);
    if (dayIndex == null) {
      return;
    }
    instance._handleDayNameClick(dayIndex);
  });

  const timeFn = function (ev) {
    instance._onTimeInputChange(ev);
  };
  root.addEventListener('input', timeFn);
  root.addEventListener('change', timeFn);
  const off5 = function () {
    root.removeEventListener('input', timeFn);
    root.removeEventListener('change', timeFn);
  };

  const onRangeHoverOver = function (ev) {
    if (!instance._state.range || instance._state.pendingRangeStart == null) {
      return;
    }
    if (!(ev.target instanceof Node) || !root.contains(ev.target)) {
      return;
    }
    let el = ev.target instanceof Element ? ev.target : ev.target.parentElement;
    if (el == null) {
      return;
    }
    const dayBtn = el.closest('[' + instance._state.attributes.day + ']');
    const ts = parseElementNumber(dayBtn, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    const next = startOfDayTs(ts);
    if (instance._pendingRangeHoverTs === next) {
      return;
    }
    instance._pendingRangeHoverTs = next;
    syncPendingRangeHoverClasses(instance);
  };

  const onRangeHoverLeave = function () {
    if (instance._pendingRangeHoverTs != null) {
      instance._pendingRangeHoverTs = null;
      syncPendingRangeHoverClasses(instance);
    }
  };

  root.addEventListener('mouseover', onRangeHoverOver);
  root.addEventListener('pointerover', onRangeHoverOver);
  root.addEventListener('mouseleave', onRangeHoverLeave);
  root.addEventListener('pointerleave', onRangeHoverLeave);
  const off6 = function () {
    root.removeEventListener('mouseover', onRangeHoverOver);
    root.removeEventListener('pointerover', onRangeHoverOver);
    root.removeEventListener('mouseleave', onRangeHoverLeave);
    root.removeEventListener('pointerleave', onRangeHoverLeave);
  };

  instance._delegateOffs = [off1, off2, off3, off4, offDayName, off5, off6];
}
