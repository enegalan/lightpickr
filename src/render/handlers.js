import { applyEventKey, isDayNavigationKey } from '../core/keyboard.js';
import { setFocusDateState } from '../core/navigation.js';
import { invokePluginHook } from '../core/plugins.js';
import { selectDate, applyRangeEndpointDrag } from '../core/selection.js';
import { isSelectAllowed } from '../core/state.js';
import { createEl, isTextInputLike } from '../utils/common.js';
import {
  formatDate,
  isDayDisabled,
  isMonthDisabled,
  isYearDisabled,
  setTimePart,
  startOfDayTs,
  timestampToPickerDate,
  tsToYmd,
  ymdToTsStartOfDay,
} from '../utils/time.js';
import { syncTimePanelDom } from './time-panel.js';

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {import('../core/state.js').LightpickrInternalState|null} [prevState]
 * @returns {void}
 */
export function syncInstanceClasses(instance, prevState = null) {
  _syncPendingRangeHoverClasses(instance);
  _syncInput(instance);
  _syncTheme(instance);
  if (instance._state.inline) {
    return;
  }
  if (!prevState || instance._state.isMobile !== prevState.isMobile) {
    _syncPopoverMobile(instance);
  } else if (instance._state.isMobile && prevState.visible !== instance._state.visible) {
    _syncMobileBackdropDisplay(instance);
  }
  _syncDatepickerDisplay(instance);
}

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {import('../core/state.js').LightpickrInternalState} prevState
 * @param {import('../core/state.js').LightpickrInternalState} next
 * @param {object} options
 * @returns {void}
 */
export function emitEvents(instance, prevState, next, options = {}) {
  if (prevState.viewDate !== next.viewDate) {
    const parts = tsToYmd(next.viewDate);
    const decadeStart = Math.floor(parts.y / 10) * 10;
    next.onChangeViewDate({
      month: parts.m,
      year: parts.y,
      decade: [decadeStart, decadeStart + 9],
      datepicker: instance,
    });
  }
  if (prevState.currentView !== next.currentView) {
    next.onChangeView(next.currentView);
  }
  if (next.focusDate != null && prevState.focusDate !== next.focusDate) {
    next.onFocus({
      date: timestampToPickerDate(next.focusDate, next),
      datepicker: instance,
    });
  }
  if (options && options.emitSelect && _selectionChanged(prevState, next)) {
    _onSelect(instance, options.selectTrigger || 'select');
    invokePluginHook(instance, 'onSelect');
  }
}

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
export function bindHandlers(instance) {
  _bindDelegatedHandlers(instance);
  _bindRangeDragHandlers(instance);
  _bindCalendarKeyboard(instance);
}

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
export function bindDocListeners(instance) {
  _bindDocListener(instance);
  _bindEscapeListener(instance);
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _bindDocListener(instance) {
  if (instance._docDown) {
    return;
  }
  instance._docDown = function (ev) {
    if (!(ev.target instanceof Node) || instance.$datepicker.contains(ev.target) || instance.$el.contains(ev.target)) {
      return;
    }
    if (instance.$backdrop && instance.$backdrop === ev.target) {
      instance.hide();
      return;
    }
    if (instance._getPositionReference()?.contains(ev.target)) {
      return;
    }
    instance.hide();
  };
  document.addEventListener('mousedown', instance._docDown);
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _bindEscapeListener(instance) {
  if (instance._state.inline || instance._docKeydownEsc) {
    return;
  }
  instance._docKeydownEsc = function (ev) {
    if (ev.key === 'Escape' && instance.visible && !instance._state.inline) {
      ev.preventDefault();
      instance.hide();
    }
  };
  document.addEventListener('keydown', instance._docKeydownEsc);
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _bindCalendarKeyboard(instance) {
  if (instance._datepickerKeydown) {
    return;
  }
  instance._datepickerKeydown = function (ev) {
    if (instance.isDestroyed || instance._state.onlyTime || !isDayNavigationKey(ev.key)) {
      return;
    }
    const result = applyEventKey(instance, {
      key: ev.key,
      shiftKey: ev.shiftKey,
      altKey: ev.altKey,
    });
    if (result.type === 'noop') {
      return;
    }
    if (result.type === 'altView') {
      ev.preventDefault();
      if (
        result.prev.currentView !== result.next.currentView ||
        result.prev.viewDate !== result.next.viewDate ||
        result.prev.focusDate !== result.next.focusDate
      ) {
        instance._commit(result.next, { emitSelect: false });
        _focusCell(instance);
      }
      return;
    }
    ev.preventDefault();
    if (result.seed) {
      instance._commit(result.seed, { emitSelect: false });
    }
    if (result.next !== instance._state) {
      instance._commit(result.next, { emitSelect: false });
      _focusCell(instance);
    }
  };
  instance.$datepicker.addEventListener('keydown', instance._datepickerKeydown, true);
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _bindDelegatedHandlers(instance) {
  (instance._delegateOffs || []).forEach((fn) => fn());
  _clearPressedCellActive(instance);

  const offCellPointerDown = _delegate(
    instance.$datepicker,
    `button.${instance._state.classes.cell}`,
    'pointerdown',
    (ev, el) => {
      if (!(el instanceof HTMLButtonElement) || el.disabled) {
        return;
      }
      if (ev.pointerType === 'mouse' && ev.button !== 0) {
        return;
      }
      _clearPressedCellActive(instance);
      el.classList.add(instance._state.classes.cellActive);
      instance._pressedCellEl = el;
    },
  );

  const onDocPointerEnd = function () {
    _clearPressedCellActive(instance);
  };
  document.addEventListener('pointerup', onDocPointerEnd);
  document.addEventListener('pointercancel', onDocPointerEnd);

  const onCellPointerOut = function (ev) {
    const pressed = instance._pressedCellEl;
    const rel = ev.relatedTarget;
    if (pressed == null || ev.target !== pressed || (rel instanceof Node && pressed.contains(rel))) {
      return;
    }
    _clearPressedCellActive(instance);
  };
  instance.$datepicker.addEventListener('pointerout', onCellPointerOut, true);

  const offCellActive = function () {
    document.removeEventListener('pointerup', onDocPointerEnd);
    document.removeEventListener('pointercancel', onDocPointerEnd);
    instance.$datepicker.removeEventListener('pointerout', onCellPointerOut, true);
    _clearPressedCellActive(instance);
  };

  const off1 = _delegate(instance.$datepicker, `[${instance._state.attributes.day}]`, 'click', (_ev, el) => {
    const ts = _parseElementNumber(el, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    _onDayPick(instance, ts);
  });

  const off2 = _delegate(instance.$datepicker, `[${instance._state.attributes.nav}]`, 'click', (_ev, el) => {
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

  const off3 = _delegate(instance.$datepicker, `[${instance._state.attributes.month}]`, 'click', (_ev, el) => {
    const monthTs = _parseElementNumber(el, instance._state.attributes.month);
    if (typeof monthTs !== 'number' || !Number.isFinite(monthTs)) {
      return;
    }
    _onMonthPick(instance, monthTs);
  });

  const off4 = _delegate(instance.$datepicker, `[${instance._state.attributes.year}]`, 'click', (_ev, el) => {
    const y = _parseElementNumber(el, instance._state.attributes.year);
    if (y == null) {
      return;
    }
    _onYearPick(instance, y);
  });

  const offDayName = _delegate(instance.$datepicker, `[${instance._state.attributes.dayName}]`, 'click', (_ev, el) => {
    const dayIndex = _parseElementNumber(el, instance._state.attributes.dayName);
    if (dayIndex == null) {
      return;
    }
    instance._state.onClickDayName({ dayIndex, datepicker: instance });
  });

  const timeFn = function (ev) {
    _onTimeInputChange(instance, ev);
  };
  instance.$datepicker.addEventListener('input', timeFn);
  instance.$datepicker.addEventListener('change', timeFn);
  const off5 = function () {
    instance.$datepicker.removeEventListener('input', timeFn);
    instance.$datepicker.removeEventListener('change', timeFn);
  };

  const onRangeHoverOver = function (ev) {
    if (!instance._state.range || instance._state.pendingRangeStart == null) {
      return;
    }
    if (!(ev.target instanceof Node) || !instance.$datepicker.contains(ev.target)) {
      return;
    }
    const el = ev.target instanceof Element ? ev.target : ev.target.parentElement;
    if (el == null) {
      return;
    }
    const dayBtn = el.closest(`[${instance._state.attributes.day}]`);
    const ts = _parseElementNumber(dayBtn, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    const next = startOfDayTs(ts);
    if (instance._state.pendingRangeHoverTs === next) {
      return;
    }
    instance._state.pendingRangeHoverTs = next;
    _syncPendingRangeHoverClasses(instance);
  };

  const onRangeHoverLeave = function () {
    if (instance._state.pendingRangeHoverTs != null) {
      instance._state.pendingRangeHoverTs = null;
      _syncPendingRangeHoverClasses(instance);
    }
  };

  instance.$datepicker.addEventListener('pointerover', onRangeHoverOver);
  instance.$datepicker.addEventListener('pointerleave', onRangeHoverLeave);
  const off6 = function () {
    instance.$datepicker.removeEventListener('pointerover', onRangeHoverOver);
    instance.$datepicker.removeEventListener('pointerleave', onRangeHoverLeave);
  };

  instance._delegateOffs = [offCellPointerDown, offCellActive, off1, off2, off3, off4, offDayName, off5, off6];
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _bindRangeDragHandlers(instance) {
  if (!instance._state.range || !instance._state.dynamicRange) {
    return;
  }
  const startDrag = (ev) => {
    if (!(ev.target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = ev.target.closest(`[${instance._state.attributes.day}]`);
    if (!(dayBtn instanceof HTMLElement) || !instance.$datepicker.contains(dayBtn)) {
      return;
    }
    if (
      !(
        dayBtn.classList.contains(instance._state.classes.cellRangeStart) ||
        dayBtn.classList.contains(instance._state.classes.cellRangeEnd)
      )
    ) {
      return;
    }
    const ts = _parseElementNumber(dayBtn, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    const day = startOfDayTs(ts);
    const ranges = /** @type {number[][]} */ (instance._state.selectedDates);
    let rangeIndex = -1;
    let edge = 'start';
    for (let i = ranges.length - 1; i >= 0; i--) {
      const pair = ranges[i];
      if (pair[0] === day) {
        rangeIndex = i;
        edge = 'start';
        break;
      }
      if (pair[1] === day) {
        rangeIndex = i;
        edge = 'end';
        break;
      }
    }
    if (rangeIndex < 0) {
      return;
    }
    ev.preventDefault();
    instance._rangeDrag = { rangeIndex, edge };
  };
  const moveDrag = (ev) => {
    if (!instance._rangeDrag) {
      return;
    }
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = target.closest(`[${instance._state.attributes.day}]`);
    if (!(dayBtn instanceof HTMLElement) || !instance.$datepicker.contains(dayBtn)) {
      return;
    }
    const ts = _parseElementNumber(dayBtn, instance._state.attributes.day);
    const out = applyRangeEndpointDrag(instance, ts);
    if (!out.changed) {
      return;
    }
    instance._commit(out.state, { emitSelect: false });
  };
  const endDrag = () => {
    if (!instance._rangeDrag) {
      return;
    }
    instance._rangeDrag = null;
    _onSelect(instance, 'range-drag');
    invokePluginHook(instance, 'onSelect');
  };
  instance.$datepicker.addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag);
  instance._delegateOffs.push(() => {
    instance.$datepicker.removeEventListener('pointerdown', startDrag);
    document.removeEventListener('pointermove', moveDrag);
    document.removeEventListener('pointerup', endDrag);
  });
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _focusCell(instance) {
  if (instance.isDestroyed) {
    return;
  }
  const el = instance.$datepicker.querySelector(
    `[${instance._state.attributes.day}][tabindex="0"], [${instance._state.attributes.month}][tabindex="0"], [${instance._state.attributes.year}][tabindex="0"]`,
  );
  if (el instanceof HTMLElement) {
    el.focus({ preventScroll: true });
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncPendingRangeHoverClasses(instance) {
  const buttons = instance.$datepicker.querySelectorAll(`[${instance._state.attributes.day}]`);
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove(
      instance._state.classes.cellRangePreview,
      instance._state.classes.cellRangePreviewMid,
      instance._state.classes.cellRangePreviewStartCap,
      instance._state.classes.cellRangePreviewEndCap,
    );
  }

  if (
    !instance._state.range ||
    instance._state.pendingRangeStart == null ||
    instance._state.pendingRangeHoverTs == null
  ) {
    return;
  }

  const anchor = startOfDayTs(instance._state.pendingRangeStart);
  const hover = startOfDayTs(instance._state.pendingRangeHoverTs);
  if (anchor === hover) {
    return;
  }

  const lo = Math.min(anchor, hover);
  const hi = Math.max(anchor, hover);

  for (let i = 0; i < buttons.length; i++) {
    const ts = _parseElementNumber(buttons[i], instance._state.attributes.day);
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
      buttons[i].classList.add(instance._state.classes.cellRangePreview, instance._state.classes.cellRangePreviewMid);
      continue;
    }

    if (atLo) {
      if (!atAnchor) {
        buttons[i].classList.add(
          instance._state.classes.cellRangePreview,
          instance._state.classes.cellRangePreviewStartCap,
        );
      } else if (lo !== hi) {
        buttons[i].classList.add(instance._state.classes.cellRangePreviewStartCap);
      }
      continue;
    }
    if (atHi) {
      buttons[i].classList.add(
        atAnchor ? instance._state.classes.cellRangePreviewEndCap : instance._state.classes.cellRangePreview,
        instance._state.classes.cellRangePreviewEndCap,
      );
    }
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncInput(instance) {
  if (!isTextInputLike(instance.$el)) {
    return;
  }
  const tp = instance._state.enableTime ? instance._state.timePart : null;
  if (typeof instance._state.format === 'string') {
    if (instance._state.range) {
      const parts = /** @type {number[][]} */ (instance._state.selectedDates).map(
        (pair) =>
          `${formatDate(instance._state.format, pair[0], tp, instance._state)} – ${formatDate(instance._state.format, pair[1], tp, instance._state)}`,
      );
      instance.$el.value = parts.join(instance._state.multipleSeparator);
    } else {
      const dates = /** @type {number[]} */ (instance._state.selectedDates);
      if (!dates.length && !instance._state.onlyTime) {
        instance.$el.value = '';
      } else {
        let rows = dates;
        if (!rows.length && instance._state.onlyTime) {
          rows = [instance._state.viewDate];
        }
        instance.$el.value = rows
          .map((d) => formatDate(instance._state.format, d, tp, instance._state))
          .join(instance._state.multipleSeparator);
      }
    }
    return;
  }

  const fn = /** @type {(d: Date | Date[]) => string} */ (instance._state.format);
  if (instance._state.range) {
    const parts = /** @type {number[][]} */ (instance._state.selectedDates).map((pair) =>
      String(fn([timestampToPickerDate(pair[0], instance._state), timestampToPickerDate(pair[1], instance._state)])),
    );
    instance.$el.value = parts.join(instance._state.multipleSeparator);
    return;
  }

  const tss = /** @type {number[]} */ (instance._state.selectedDates);
  if (!tss.length && !instance._state.onlyTime) {
    instance.$el.value = '';
    return;
  }
  let rows = tss;
  if (!rows.length && instance._state.onlyTime) {
    rows = [instance._state.viewDate];
  }
  if (!rows.length) {
    instance.$el.value = '';
    return;
  }
  if (instance._state.multipleEnabled) {
    instance.$el.value = String(fn(rows.map((ts) => timestampToPickerDate(ts, instance._state))));
  } else {
    instance.$el.value = String(fn(timestampToPickerDate(rows[0], instance._state)));
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncTheme(instance) {
  if (!(instance.$datepicker instanceof HTMLElement)) {
    return;
  }
  const darkClass =
    document.documentElement.classList.contains('dark') ||
    (document.body instanceof HTMLElement && document.body.classList.contains('dark'));
  const lightClass =
    document.documentElement.classList.contains('light') ||
    (document.body instanceof HTMLElement && document.body.classList.contains('light'));
  const dataTheme =
    document.documentElement.getAttribute('data-theme') ||
    (document.body instanceof HTMLElement ? document.body.getAttribute('data-theme') : null);
  const inlineColorScheme =
    document.documentElement.style.colorScheme ||
    (document.body instanceof HTMLElement ? document.body.style.colorScheme : '');

  const documentColorScheme = window.getComputedStyle(document.documentElement).colorScheme || '';
  const hasLightKeyword = documentColorScheme.indexOf('light') >= 0;
  const hasDarkKeyword = documentColorScheme.indexOf('dark') >= 0;

  let shouldUseDark = false;

  if (darkClass || dataTheme === 'dark') {
    shouldUseDark = true;
  } else if (lightClass || dataTheme === 'light' || inlineColorScheme === 'light') {
    shouldUseDark = false;
  } else if (hasLightKeyword && !hasDarkKeyword) {
    shouldUseDark = false;
  } else if (hasDarkKeyword && !hasLightKeyword) {
    shouldUseDark = true;
  } else if (inlineColorScheme === 'dark') {
    shouldUseDark = true;
  } else if (hasLightKeyword && hasDarkKeyword) {
    shouldUseDark = false;
  } else if (typeof window.matchMedia === 'function') {
    shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const darkCls = instance._state.classes.themeDark;
  const lightCls = instance._state.classes.themeLight;
  if (shouldUseDark) {
    instance.$datepicker.classList.add(darkCls);
    instance.$datepicker.classList.remove(lightCls);
  } else {
    instance.$datepicker.classList.remove(darkCls);
    instance.$datepicker.classList.add(lightCls);
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncPopoverMobile(instance) {
  if (instance._state.isMobile) {
    if (!instance.$backdrop) {
      const backdropStyles = typeof instance._state.position === 'function' ? { display: 'none' } : {};
      instance.$backdrop = createEl('div', instance._state.classes.mobileBackdrop, {}, backdropStyles);
    }
    instance.$backdrop.appendChild(instance.$datepicker);
    if (!instance.$backdrop.parentNode) {
      document.body.appendChild(instance.$backdrop);
    }
    _syncMobileBackdropDisplay(instance);
    instance.$datepicker.classList.add(instance._state.classes.mobile);
  } else {
    instance._detachDatepicker();
    instance.$datepicker.classList.remove(instance._state.classes.mobile);
    document.body.appendChild(instance.$datepicker);
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncMobileBackdropDisplay(instance) {
  if (!instance.$backdrop) {
    return;
  }
  if (typeof instance._state.position === 'function') {
    instance.$backdrop.style.display = instance._state.visible ? 'flex' : 'none';
  } else if (instance._state.visible) {
    instance.$backdrop.classList.add(instance._state.classes.mobileBackdropOpen);
    instance.$backdrop.style.removeProperty('display');
  } else {
    instance.$backdrop.classList.remove(instance._state.classes.mobileBackdropOpen);
    instance.$backdrop.style.removeProperty('display');
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _syncDatepickerDisplay(instance) {
  if (typeof instance._state.position === 'function') {
    if (instance._state.visible) {
      instance.$datepicker.style.removeProperty('display');
    } else {
      instance.$datepicker.style.display = 'none';
    }
    return;
  }
  if (instance._state.visible) {
    instance.$datepicker.style.removeProperty('display');
    instance._state.popoverAlreadyOpened = true;
    return;
  }
  if (!instance._state.popoverAlreadyOpened) {
    instance.$datepicker.style.display = 'none';
    return;
  }
  instance.$datepicker.style.removeProperty('display');
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {{ dates: Date[], formattedDates: string[] }}
 */
function _buildSelectedParts(instance) {
  const timePart = instance._state.enableTime ? instance._state.timePart : null;
  /** @type {Date[]} */
  const dates = [];
  /** @type {string[]} */
  const formattedDates = [];

  /**
   * @param {number} ts
   * @returns {void}
   */
  const appendDate = (ts) => {
    dates.push(timestampToPickerDate(ts, instance._state));
  };

  if (instance._state.range) {
    const ranges = /** @type {number[][]} */ (instance._state.selectedDates);
    for (let i = 0; i < ranges.length; i++) {
      appendDate(ranges[i][0]);
      appendDate(ranges[i][1]);
    }
  } else {
    const selectedDates = /** @type {number[]} */ (instance._state.selectedDates);
    for (let i = 0; i < selectedDates.length; i++) {
      appendDate(selectedDates[i]);
    }
  }

  if (typeof instance._state.format === 'string') {
    if (instance._state.range) {
      const ranges = /** @type {number[][]} */ (instance._state.selectedDates);
      for (let i = 0; i < ranges.length; i++) {
        formattedDates.push(formatDate(instance._state.format, ranges[i][0], timePart, instance._state));
        formattedDates.push(formatDate(instance._state.format, ranges[i][1], timePart, instance._state));
      }
    } else {
      const selectedDates = /** @type {number[]} */ (instance._state.selectedDates);
      for (let i = 0; i < selectedDates.length; i++) {
        formattedDates.push(formatDate(instance._state.format, selectedDates[i], timePart, instance._state));
      }
    }
  } else {
    const formatFn = /** @type {(d: Date | Date[]) => string} */ (instance._state.format);
    if (instance._state.range) {
      const ranges = /** @type {number[][]} */ (instance._state.selectedDates);
      for (let i = 0; i < ranges.length; i++) {
        const pair = [
          timestampToPickerDate(ranges[i][0], instance._state),
          timestampToPickerDate(ranges[i][1], instance._state),
        ];
        const segment = String(formatFn(pair));
        formattedDates.push(segment, segment);
      }
    } else if (instance._state.multipleEnabled && dates.length > 0) {
      const segment = String(formatFn(dates));
      for (let i = 0; i < dates.length; i++) {
        formattedDates.push(segment);
      }
    } else if (dates.length > 0) {
      for (let i = 0; i < dates.length; i++) {
        formattedDates.push(String(formatFn(dates[i])));
      }
    }
  }

  return { dates, formattedDates };
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {number} ts
 * @returns {void}
 */
function _onDayPick(instance, ts) {
  if (!isSelectAllowed(instance, ts)) {
    return;
  }
  const d = startOfDayTs(ts);
  if (isDayDisabled(instance._state, d)) {
    return;
  }
  const viewYmd = tsToYmd(instance._state.viewDate);
  const clicked = tsToYmd(d);
  if ((clicked.m !== viewYmd.m || clicked.y !== viewYmd.y) && !instance._state.selectOtherMonths) {
    if (instance._state.moveToOtherMonthsOnSelect) {
      const next = setFocusDateState(instance._state, d);
      next.viewDate = ymdToTsStartOfDay(clicked.y, clicked.m, 1);
      instance._commit(next, { emitSelect: false });
      _focusCell(instance);
    }
    return;
  }
  const r = selectDate(instance._state, ts);
  if (!r.changed) {
    return;
  }
  if (instance._state.moveToOtherMonthsOnSelect) {
    const currentMonth = tsToYmd(instance._state.viewDate).m;
    const picked = tsToYmd(ts);
    if (picked.m !== currentMonth) {
      r.state.viewDate = ymdToTsStartOfDay(picked.y, picked.m, 1);
    }
  }
  instance._commit(r.state, { emitSelect: true, selectTrigger: 'select' });
  if (instance._shouldCloseAfterSelect()) {
    instance.hide();
  }
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {number} monthTs
 * @returns {void}
 */
function _onMonthPick(instance, monthTs) {
  const ymd = tsToYmd(startOfDayTs(monthTs));
  if (isMonthDisabled(instance._state, ymd.y, ymd.m)) {
    return;
  }
  const next = Object.assign({}, instance._state);
  next.viewDate = ymdToTsStartOfDay(ymd.y, ymd.m, 1);
  next.currentView = instance._state.allowedViews.indexOf('day') >= 0 ? 'day' : instance._state.allowedViews[0];
  instance._commit(next, { emitSelect: false });
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {number} year
 * @returns {void}
 */
function _onYearPick(instance, year) {
  if (isYearDisabled(instance._state, year)) {
    return;
  }
  const m = tsToYmd(instance._state.viewDate).m;
  const next = Object.assign({}, instance._state);
  next.viewDate = ymdToTsStartOfDay(year, m, 1);
  next.currentView = instance._state.allowedViews.indexOf('month') >= 0 ? 'month' : instance._state.allowedViews[0];
  instance._commit(next, { emitSelect: false });
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {Event} ev
 * @returns {void}
 */
function _onTimeInputChange(instance, ev) {
  const t = ev.target;
  if (!(t instanceof HTMLInputElement) || !instance.$datepicker.contains(t)) {
    return;
  }
  const kind = t.getAttribute(instance._state.attributes.time);
  const applyTime = (h, mm) => {
    if (!Number.isFinite(h) || !Number.isFinite(mm)) {
      return;
    }
    instance._state = setTimePart(instance._state, h, mm);
    syncTimePanelDom(instance);
    _syncInput(instance);
    _onTimeChange(instance);
    _onSelect(instance, 'time');
  };
  if (kind === 'hours' || kind === 'minutes') {
    const h = kind === 'hours' ? Number(t.value) : instance._state.timePart.hours;
    const mm = kind === 'minutes' ? Number(t.value) : instance._state.timePart.minutes;
    applyTime(h, mm);
    return;
  }
  if (kind !== 'clock') {
    return;
  }
  const parts = String(t.value).split(':');
  applyTime(Number(parts[0]), Number(parts[1]));
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _onTimeChange(instance) {
  const primaryTs = (() => {
    if (instance._state.range) {
      const ranges = /** @type {number[][]} */ (instance._state.selectedDates);
      if (ranges.length > 0) {
        return ranges[ranges.length - 1][1];
      }
      return instance._state.viewDate;
    }
    const dates = /** @type {number[]} */ (instance._state.selectedDates);
    if (dates.length > 0) {
      return dates[dates.length - 1];
    }
    return instance._state.viewDate;
  })();
  let formattedDate = '';
  if (primaryTs != null) {
    if (typeof instance._state.format === 'function') {
      formattedDate = String(
        /** @type {(d: Date | Date[]) => string} */ (instance._state.format)(
          timestampToPickerDate(primaryTs, instance._state),
        ),
      );
    } else {
      formattedDate = formatDate(
        instance._state.format,
        primaryTs,
        instance._state.enableTime ? instance._state.timePart : null,
        instance._state,
      );
    }
  }
  instance._state.onTimeChange({
    date: primaryTs != null ? timestampToPickerDate(primaryTs, instance._state) : null,
    formattedDate,
    datepicker: instance,
  });
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {string} trigger
 * @returns {void}
 */
function _onSelect(instance, trigger) {
  const parts = _buildSelectedParts(instance);
  const dates = parts.dates;
  const formattedDates = parts.formattedDates;
  const multiLike = instance._state.range || instance._state.multipleEnabled;
  instance._state.onSelect({
    date: multiLike ? dates : dates[0] || null,
    dates,
    formattedDate: multiLike ? formattedDates : formattedDates[0] || '',
    formattedDates,
    trigger,
    datepicker: instance,
  });
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInternalState} prev
 * @param {import('../core/state.js').LightpickrInternalState} next
 * @returns {boolean}
 */
function _selectionChanged(prev, next) {
  const sa = prev.selectedDates;
  const sb = next.selectedDates;
  if (sa.length !== sb.length) {
    return true;
  }
  for (let i = 0; i < sa.length; i++) {
    const xa = sa[i];
    const xb = sb[i];
    if (Array.isArray(xa) && Array.isArray(xb)) {
      if (xa[0] !== xb[0] || xa[1] !== xb[1]) {
        return true;
      }
    } else if (xa !== xb) {
      return true;
    }
  }
  return false;
}

/**
 * @private
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @returns {void}
 */
function _clearPressedCellActive(instance) {
  if (instance._pressedCellEl) {
    instance._pressedCellEl.classList.remove(instance._state.classes.cellActive);
    instance._pressedCellEl = null;
  }
}

/**
 * @private
 * @param {Element} element
 * @param {string} attr
 * @returns {number|null}
 */
function _parseElementNumber(element, attr) {
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

/**
 * @private
 * @param {ParentNode} root
 * @param {string} selector
 * @param {string} type
 * @param {(ev: Event, target: Element) => void} handler
 * @returns {() => void}
 */
function _delegate(root, selector, type, handler) {
  const fn = function (ev) {
    const match = ev.target instanceof Element ? ev.target.closest(selector) : null;
    if (match != null && root.contains(match)) {
      handler(ev, match);
    }
  };
  root.addEventListener(type, fn);
  return function () {
    root.removeEventListener(type, fn);
  };
}
