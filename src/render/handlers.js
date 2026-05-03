import { applyEventKey, isDayNavigationKey } from '../core/keyboard.js';
import { selectDate, applyRangeEndpointDrag } from '../core/selection.js';
import { isTextInputLike } from '../utils/common.js';
import { formatDate, setTimePart, startOfDayTs, timestampToPickerDate, tsToYmd, ymdToTsStartOfDay } from '../utils/time.js';
import { syncTimePanelDom } from './time-panel.js';

/**
 * @param {object} instance
 * @returns {void}
*/
export function focusCell(instance) {
  if (instance.isDestroyed) {
    return;
  }
  const sel = '[' + instance._state.attributes.day + '][tabindex="0"], [' + instance._state.attributes.month + '][tabindex="0"], [' + instance._state.attributes.year + '][tabindex="0"]';
  const el = instance.$datepicker.querySelector(sel);
  if (el instanceof HTMLElement) {
    el.focus();
  }
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function syncInstanceClasses(instance) {
  _syncPendingRangeHoverClasses(instance);
  _syncFooterHandlers(instance);
  _syncInput(instance);
}

/**
 * @param {object} instance
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @param {object} options
 * @returns {void}
 */
export function emitEvents(instance, prevState, next, options = {}) {
  _onViewEvents(prevState, next, instance);
  _onFocus(prevState, next, instance);
  const changed = (options && options.emitSelect) && _selectionChanged(prevState, next);
  if (changed) {
    _onSelect(instance, options && options.selectTrigger || 'select');
    instance._pluginOnSelect();
  }
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function bindHandlers(instance) {
  _bindDelegatedHandlers(instance);
  _bindRangeDragHandlers(instance);
  _bindCalendarKeyboard(instance);
}

/**
 * @param {object} instance
 * @returns {void}
 */
export function bindDocListeners(instance) {
  _bindDocListener(instance);
  _bindEscapeListener(instance);
}

/**
 * @private
 * @param {object} instance
 * @returns {void}
 */
function _bindDocListener(instance) {
  if (instance._docDown) {
    return;
  }
  instance._docDown = function (ev) {
    const t = ev.target;
    if (!(t instanceof Node) || instance.$datepicker.contains(t) || instance.$el.contains(t)) {
      return;
    }
    if (instance.$backdrop && instance.$backdrop === t) {
      instance.hide();
      return;
    }
    const ref = instance._getPositionReference();
    if (ref && ref.contains(t)) {
      return;
    }
    instance.hide();
  };
  document.addEventListener('mousedown', instance._docDown);
}

/**
 * @private
 * @param {object} instance
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
};

/**
 * @private
 * @param {object} instance
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
    const result = applyEventKey(instance._state, {
      key: ev.key,
      shiftKey: ev.shiftKey,
      altKey: ev.altKey
    });
    if (result.type === 'noop') {
      return;
    }
    if (result.type === 'altView') {
      ev.preventDefault();
      if (_keyboardStateMeaningfullyChanged(result.prev, result.next)) {
        instance._commit(result.next, { emitSelect: false });
        focusCell(instance);
      }
      return;
    }
    ev.preventDefault();
    if (result.seed) {
      instance._commit(result.seed, { emitSelect: false });
    }
    if (result.next !== instance._state) {
      instance._commit(result.next, { emitSelect: false });
      focusCell(instance);
    }
  };
  instance.$datepicker.addEventListener('keydown', instance._datepickerKeydown, true);
};

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {boolean}
 */
function _keyboardStateMeaningfullyChanged(prev, next) {
  if (prev.currentView !== next.currentView) {
    return true;
  }
  if (prev.viewDate !== next.viewDate) {
    return true;
  }
  if (prev.focusDate !== next.focusDate) {
    return true;
  }
  return false;
}

/**
 * @private
 * @param {object} instance
 * @returns {void}
 */
function _bindDelegatedHandlers(instance) {
  const root = instance.$datepicker;
  const offs = instance._delegateOffs || [];
  offs.forEach((fn) => fn());
  _clearPressedCellActive(instance);

  const s = instance._state;
  const cellBtnSel = 'button.' + s.classes.cell;

  const offCellPointerDown = _delegate(root, cellBtnSel, 'pointerdown', function (ev, el) {
    if (!(el instanceof HTMLButtonElement) || el.disabled) {
      return;
    }
    if (ev.pointerType === 'mouse' && ev.button !== 0) {
      return;
    }
    _clearPressedCellActive(instance);
    el.classList.add(s.classes.cellActive);
    instance._pressedCellEl = el;
  });

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
  root.addEventListener('pointerout', onCellPointerOut, true);

  const offCellActive = function () {
    document.removeEventListener('pointerup', onDocPointerEnd);
    document.removeEventListener('pointercancel', onDocPointerEnd);
    root.removeEventListener('pointerout', onCellPointerOut, true);
    _clearPressedCellActive(instance);
  };

  const off1 = _delegate(root, '[' + instance._state.attributes.day + ']', 'click', function (_ev, el) {
    const ts = _parseElementNumber(el, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    _onDayClick(instance, ts);
  });

  const off2 = _delegate(root, '[' + instance._state.attributes.nav + ']', 'click', function (_ev, el) {
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

  const off3 = _delegate(root, '[' + instance._state.attributes.month + ']', 'click', function (_ev, el) {
    const monthTs = _parseElementNumber(el, instance._state.attributes.month);
    if (typeof monthTs !== 'number' || !Number.isFinite(monthTs)) {
      return;
    }
    _onMonthPick(instance, monthTs);
  });

  const off4 = _delegate(root, '[' + instance._state.attributes.year + ']', 'click', function (_ev, el) {
    const y = _parseElementNumber(el, instance._state.attributes.year);
    if (y == null) {
      return;
    }
    _onYearPick(instance, y);
  });

  const offDayName = _delegate(root, '[' + instance._state.attributes.dayName + ']', 'click', function (_ev, el) {
    const dayIndex = _parseElementNumber(el, instance._state.attributes.dayName);
    if (dayIndex == null) {
      return;
    }
    instance._state.onClickDayName({ dayIndex: dayIndex, datepicker: instance });
  });

  const timeFn = function (ev) {
    _onTimeInputChange(instance, ev);
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
    const ts = _parseElementNumber(dayBtn, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    const next = startOfDayTs(ts);
    if (instance._pendingRangeHoverTs === next) {
      return;
    }
    instance._pendingRangeHoverTs = next;
    _syncPendingRangeHoverClasses(instance);
  };

  const onRangeHoverLeave = function () {
    if (instance._pendingRangeHoverTs != null) {
      instance._pendingRangeHoverTs = null;
      _syncPendingRangeHoverClasses(instance);
    }
  };

  root.addEventListener('pointerover', onRangeHoverOver);
  root.addEventListener('pointerleave', onRangeHoverLeave);
  const off6 = function () {
    root.removeEventListener('pointerover', onRangeHoverOver);
    root.removeEventListener('pointerleave', onRangeHoverLeave);
  };

  instance._delegateOffs = [offCellPointerDown, offCellActive, off1, off2, off3, off4, offDayName, off5, off6];
}

/**
 * @private
 * @param {object} instance
 * @returns {void}
 */
function _bindRangeDragHandlers(instance) {
  if (!instance._state.range || !instance._state.dynamicRange) {
    return;
  }
  const root = instance.$datepicker;
  const startDrag = (ev) => {
    if (!(ev.target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = ev.target.closest('[' + instance._state.attributes.day + ']');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    if (!(dayBtn.classList.contains(instance._state.classes.cellRangeStart) || dayBtn.classList.contains(instance._state.classes.cellRangeEnd))) {
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
    instance._rangeDrag = { rangeIndex: rangeIndex, edge: edge };
  };
  const moveDrag = (ev) => {
    if (!instance._rangeDrag) {
      return;
    }
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = target.closest('[' + instance._state.attributes.day + ']');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    const ts = _parseElementNumber(dayBtn, instance._state.attributes.day);
    if (ts == null) {
      return;
    }
    const out = applyRangeEndpointDrag(instance._state, instance._rangeDrag.rangeIndex, instance._rangeDrag.edge, ts);
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
    instance._pluginOnSelect();
  };
  root.addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag);
  instance._delegateOffs.push(function () {
    root.removeEventListener('pointerdown', startDrag);
    document.removeEventListener('pointermove', moveDrag);
    document.removeEventListener('pointerup', endDrag);
  });
}

/**
 * @private
 * @param {object} instance
 * @returns {void}
 */
function _syncPendingRangeHoverClasses(instance) {
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
    const ts = _parseElementNumber(el, instance._state.attributes.day);
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
      } else if (lo !== hi) {
        el.classList.add(rangePreviewStartCap);
      }
      continue;
    }
    if (atHi) {
      el.classList.add(atAnchor ? rangePreviewEndCap : rangePreview, rangePreviewEndCap);
    }
  }
}

/**
 * @private
 * @param {object} instance
 * @returns {void}
 */
function _syncFooterHandlers(instance) {
  const actions = instance.$datepicker.querySelectorAll('[' + instance._state.attributes.footerAction + ']');
  for (let i = 0; i < actions.length; i++) {
    const el = actions[i];
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    if (el.getAttribute(instance._state.attributes.footerBound) === '1') {
      continue;
    }
    el.setAttribute(instance._state.attributes.footerBound, '1');
    el.addEventListener('click', () => {
      const action = el.getAttribute(instance._state.attributes.footerAction);
      if (action === 'today') {
        const next = Object.assign({}, instance._state);
        const now = new Date();
        next.viewDate = ymdToTsStartOfDay(now.getFullYear(), now.getMonth(), 1);
        instance._commit(next, { emitSelect: false });
      } else if (action === 'clear') {
        instance.clear();
      }
    });
  }
}

/**
 * @private
 * @param {object} instance
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
        (pair) => formatDate(instance._state.format, pair[0], tp, instance._state) + ' – ' + formatDate(instance._state.format, pair[1], tp, instance._state)
      );
      instance.$el.value = parts.join(instance._state.multipleSeparator);
    } else {
      const dates = /** @type {number[]} */ (instance._state.selectedDates);
      if (!dates.length && !instance._state.onlyTime) {
        instance.$el.value = '';
      } else {
        const rows =
          dates.length > 0 ? dates : instance._state.onlyTime ? [instance._state.viewDate] : [];
        instance.$el.value = rows.map((d) => formatDate(instance._state.format, d, tp, instance._state)).join(instance._state.multipleSeparator);
      }
    }
    return;
  }

  const fn = /** @type {(d: Date | Date[]) => string} */ (instance._state.format);
  if (instance._state.range) {
    const parts = /** @type {number[][]} */ (instance._state.selectedDates).map((pair) =>
      String(fn([timestampToPickerDate(pair[0], instance._state), timestampToPickerDate(pair[1], instance._state)]))
    );
    instance.$el.value = parts.join(instance._state.multipleSeparator);
    return;
  }

  const tss = /** @type {number[]} */ (instance._state.selectedDates);
  if (!tss.length && !instance._state.onlyTime) {
    instance.$el.value = '';
    return;
  }
  const rows = tss.length > 0 ? tss : instance._state.onlyTime ? [instance._state.viewDate] : [];
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
 * @param {object} instance
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
        const pair = [timestampToPickerDate(ranges[i][0], instance._state), timestampToPickerDate(ranges[i][1], instance._state)];
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

  return { dates: dates, formattedDates: formattedDates };
}

/**
 * @private
 * @param {object} instance
 * @param {number} ts
 * @returns {void}
 */
function _onDayClick(instance, ts) {
  const allowSelect = instance._state.onBeforeSelect({
    date: timestampToPickerDate(ts, instance._state),
    datepicker: instance
  });
  if (allowSelect === false) {
    return;
  }
  const r = selectDate(instance._state, ts);
  if (!r.changed) {
    return;
  }
  if (instance._state.moveToOtherMonthsOnSelect) {
    const currentMonth = tsToYmd(instance._state.viewDate).m;
    const clicked = tsToYmd(ts);
    if (clicked.m !== currentMonth) {
      r.state.viewDate = ymdToTsStartOfDay(clicked.y, clicked.m, 1);
    }
  }
  instance._commit(r.state, { emitSelect: true, selectTrigger: 'select' });
  if (instance._shouldCloseAfterSelect()) {
    instance.hide();
  }
}

/**
 * @private
 * @param {object} instance
 * @param {number} monthTs
 * @returns {void}
 */
function _onMonthPick(instance, monthTs) {
  const next = Object.assign({}, instance._state);
  const ymd = tsToYmd(startOfDayTs(monthTs));
  next.viewDate = ymdToTsStartOfDay(ymd.y, ymd.m, 1);
  next.currentView = instance._state.allowedViews.indexOf('day') >= 0 ? 'day' : instance._state.allowedViews[0];
  instance._commit(next, { emitSelect: false });
};

/**
 * @private
 * @param {object} instance
 * @param {number} year
 * @returns {void}
 */
function _onYearPick(instance, year) {
  const m = tsToYmd(instance._state.viewDate).m;
  const next = Object.assign({}, instance._state);
  next.viewDate = ymdToTsStartOfDay(year, m, 1);
  next.currentView = instance._state.allowedViews.indexOf('month') >= 0 ? 'month' : instance._state.allowedViews[0];
  instance._commit(next, { emitSelect: false });
}

/**
 * @private
 * @param {object} instance
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
 * @param {object} instance
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
  instance._state.onTimeChange({
    date: primaryTs != null ? timestampToPickerDate(primaryTs, instance._state) : null,
    formattedDate:
      primaryTs == null
        ? ''
        : typeof instance._state.format === 'function'
          ? String(/** @type {(d: Date | Date[]) => string} */ (instance._state.format)(timestampToPickerDate(primaryTs, instance._state)))
          : formatDate(instance._state.format, primaryTs, instance._state.enableTime ? instance._state.timePart : null, instance._state),
    datepicker: instance
  });
}

/**
 * @private
 * @param {object} instance
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
    dates: dates,
    formattedDate: multiLike ? formattedDates : formattedDates[0] || '',
    formattedDates: formattedDates,
    trigger: trigger,
    datepicker: instance
  });
}

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
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
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {void}
 */
function _onViewEvents(prev, next, instance) {
  if (prev.viewDate !== next.viewDate) {
    const parts = tsToYmd(next.viewDate);
    const decadeStart = Math.floor(parts.y / 10) * 10;
    next.onChangeViewDate({
      month: parts.m,
      year: parts.y,
      decade: [decadeStart, decadeStart + 9],
      datepicker: instance
    });
  }
  if (prev.currentView !== next.currentView) {
    next.onChangeView(next.currentView);
  }
}

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {void}
 */
function _onFocus(prev, next, instance) {
  if (prev.focusDate === next.focusDate || next.focusDate == null) {
    return;
  }
  next.onFocus({
    date: timestampToPickerDate(next.focusDate, next),
    datepicker: instance
  });
}

/**
 * @private
 * @param {object} instance
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
