import { createStateFromOptions, mergeOptionsIntoState } from './core/state.js';
import { navigateNextPrev, navigateUp, navigateDown, setCurrentViewState, setViewDateState, setFocusDateState } from './core/navigation.js';
import { applyDaySelection, applyRangeEndpointDrag, clearSelectionState, selectDateExplicit, unselectDate } from './core/selection.js';
import { setTimePart, cloneSelectedDates, formatDate, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay, parseSelectedDates, timestampToPickerDate } from './utils/time.js';
import { syncTimePanelDom } from './render/time-panel.js';
import { attachDelegatedHandlers, syncPendingRangeHoverClasses } from './render/handlers.js';
import { renderContainer } from './render/container.js';
import { getViewDatesFromState } from './render/context.js';
import { parseElementNumber } from './render/dom.js';
import { applyStringPosition } from './core/positioning.js';
import { isDayNavigationKey, nextStateAfterDayViewKey, nextStateAfterMonthGridKey, nextStateAfterViewHierarchyKey, nextStateAfterYearGridKey, stateWithDefaultDayFocus, stateWithDefaultMonthGridFocus, stateWithDefaultYearGridFocus } from './core/keyboard.js';
import lightpickrDefaults from './core/defaults.js';

/**
 * @param {string|HTMLElement} target
 * @param {import('./core/state.js').LightpickrOptions} options
 * @returns {void}
 */
function Lightpickr(target, options) {
  const el = target instanceof HTMLElement ? target : document.querySelector(target);
  if (!el) {
    throw new Error('Lightpickr: target not found');
  }
  /** @type {HTMLElement} */
  this.$el = el;
  /** @type {import('./core/state.js').LightpickrOptions} */
  this._options = Object.assign({}, options || {});
  /** @type {import('./core/state.js').LightpickrInternalState} */
  this._state = createStateFromOptions(this._options);
  if (this._options.inline == null) {
    // When isMobile is enabled, default to a modal popover even when the target
    // is a wrapper element.
    /** @type {boolean} */
    this._state.inline = this._state.isMobile ? false : !_isTextInputLike(this.$el);
  }
  /** @type {HTMLElement} */
  this.$datepicker = document.createElement('div');
  this.$datepicker.className = this._state.classes.container;
  /** @type {boolean} */
  this.isDestroyed = false;
  /** @type {boolean} */
  this.visible = this._state.inline;
  this._state.visible = this._state.inline;
  /** @type {{ onInit?: () => void, onRender?: () => void, onSelect?: () => void, onDestroy?: () => void }[]} */
  this._plugins = [];
  /** @type {(() => void)[]} */
  this._delegateOffs = [];
  /** @type {((ev: MouseEvent) => void)|null} */
  this._docDown = null;
  /** @type {((done: () => void) => void)|null} */
  this._positionHideCleanup = null;
  /** @type {number|null} */
  this._pendingRangeHoverTs = null;
  /** @type {RangeDrag|null} */
  this._rangeDrag = null;
  /** @type {HTMLElement|null} */
  this.$backdrop = null;
  /** @type {HTMLElement[]} */
  this._boundShowTargets = [];
  /** @type {((ev: KeyboardEvent) => void)|null} */
  this._docKeydownEsc = null;
  /** @type {((ev: KeyboardEvent) => void)|null} */
  this._datepickerKeydown = null;
  /** @type {HTMLElement} */
  this.$pointer = document.createElement('i');
  this.$pointer.className = this._state.classes.popoverPointer;
  this.$pointer.setAttribute('aria-hidden', 'true');

  this._mount();
  renderContainer(this);
  attachDelegatedHandlers(this, this.$datepicker);
  this._bindCalendarKeyboard();
  this._bindTarget();
}

/**
 * @returns {number[]|number[][]}
 */
Lightpickr.prototype.getSelectedPayload = function () {
  return cloneSelectedDates(this._state.selectedDates);
};

/**
 * @returns {void}
 */
Lightpickr.prototype.show = function () {
  if (this.isDestroyed || this._state.inline) {
    return;
  }
  let next = Object.assign({}, this._state);
  next.onShow(false, { datepicker: this });
  next.visible = true;
  if (!next.inline && !next.onlyTime) {
    next = _reseedKeyboardFocusForView(next);
  }
  if (this.$backdrop) {
    this.$backdrop.style.display = 'flex';
  }
  this.$datepicker.style.display = '';
  this._attachDocListener();
  this._attachEscapeListener();
  this._commit(next, { emitSelect: false, popoverInitialOpen: true });
  this._state.onShow(true, { datepicker: this });
  _scheduleFocusActiveKeyboardCell(this);
};

/**
 * @returns {void}
 */
Lightpickr.prototype.hide = function () {
  if (this.isDestroyed || this._state.inline) {
    return;
  }
  const self = this;
  this._state.onHide(false, { datepicker: this });
  const finishHide = function () {
    const next = Object.assign({}, self._state);
    next.visible = false;
    if (self.$backdrop) {
      self.$backdrop.style.display = 'none';
    }
    self.$datepicker.style.display = 'none';
    self._detachDocListener();
    self._detachEscapeListener();
    self._commit(next, { emitSelect: false });
    self._state.onHide(true, { datepicker: self });
  };
  const hook = this._positionHideCleanup;
  if (typeof hook === 'function') {
    this._positionHideCleanup = null;
    hook(finishHide);
  } else {
    finishHide();
  }
};

/**
 * @returns {void}
 */
Lightpickr.prototype.next = function () {
  const next = navigateNextPrev(this._state, 1);
  this._commit(next, { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.prev = function () {
  const next = navigateNextPrev(this._state, -1);
  this._commit(next, { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.up = function () {
  const next = navigateUp(this._state);
  this._commit(next, { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.down = function () {
  const next = navigateDown(this._state);
  this._commit(next, { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @param {object} opts
 * @param {boolean} opts.close
 * @returns {void}
 */
Lightpickr.prototype.selectDate = function (date, opts) {
  const canSelect = (value) => {
    const ts = toTimestamp(value);
    if (ts == null) {
      return false;
    }
    return this._state.onBeforeSelect({
      date: timestampToPickerDate(ts, this._state),
      datepicker: this
    }) !== false;
  };
  if (Array.isArray(date) && date.length && Array.isArray(date[0])) {
    if (!this._state.range) {
      return;
    }
    const next = Object.assign({}, this._state);
    next.selectedDates = /** @type {number[][]} */ (parseSelectedDates({ range: true, multipleEnabled: false, multipleLimit: this._state.multipleLimit }, date));
    this._commit(next, { emitSelect: true, selectTrigger: 'select' });
    if (opts && opts.close && this._state.autoClose) {
      this.hide();
    }
    return;
  }
  if (Array.isArray(date)) {
    let cur = this._state;
    for (let i = 0; i < date.length; i++) {
      if (!canSelect(date[i])) {
        continue;
      }
      const r = selectDateExplicit(cur, date[i]);
      cur = r.state;
    }
    this._commit(cur, { emitSelect: true, selectTrigger: 'select' });
  } else {
    if (!canSelect(date)) {
      return;
    }
    const r = selectDateExplicit(this._state, date);
    this._commit(r.state, { emitSelect: r.changed, selectTrigger: 'select' });
  }
  if (_shouldCloseAfterSelect(this._state)) {
    this.hide();
  }
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.unselectDate = function (date) {
  const r = unselectDate(this._state, date);
  this._commit(r.state, { emitSelect: r.changed, selectTrigger: 'unselect' });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.clear = function () {
  const next = clearSelectionState(this._state);
  this._commit(next, { emitSelect: true, selectTrigger: 'clear' });
};

/**
 * @param {number|Date|string} date
 * @param {string} formatOverride
 * @returns {string}
 */
Lightpickr.prototype.formatDate = function (date, formatOverride) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return '';
  }
  const pickFmt = formatOverride != null ? formatOverride : this._state.format;
  if (typeof pickFmt === 'function') {
    return String(pickFmt(timestampToPickerDate(ts, this._state)));
  }
  return formatDate(pickFmt, ts, this._state.enableTime ? this._state.timePart : null, this._state);
};

/**
 * @returns {void}
 */
Lightpickr.prototype.destroy = function () {
  if (this.isDestroyed) {
    return;
  }
  this._unbindTarget();
  this._positionHideCleanup = null;
  this._detachDocListener();
  this._detachEscapeListener();
  this._unbindCalendarKeyboard();
  this._delegateOffs.forEach(function (fn) {
    fn();
  });
  this._delegateOffs = [];
  if (this.$backdrop && this.$backdrop.parentNode) {
    this.$backdrop.parentNode.removeChild(this.$backdrop);
    this.$backdrop = null;
  } else if (this.$datepicker.parentNode) {
    this.$datepicker.parentNode.removeChild(this.$datepicker);
  }
  this._state.onDestroy();
  for (let i = 0; i < this._plugins.length; i++) {
    const p = this._plugins[i];
    if (p.onDestroy) {
      p.onDestroy();
    }
  }
  this.isDestroyed = true;
};

/**
 * @param {import('./core/state.js').LightpickrOptions} newOpts
 * @returns {void}
 */
Lightpickr.prototype.update = function (newOpts) {
  const next = mergeOptionsIntoState(this._state, newOpts || {});
  const isMobileChanged = next.isMobile !== this._state.isMobile;
  const showEventChanged = next.showEvents.join('::') !== this._state.showEvents.join('::');
  if (isMobileChanged && !next.inline) {
    if (next.isMobile) {
      if (!this.$backdrop) {
        this.$backdrop = document.createElement('div');
        this.$backdrop.className = this._state.classes.mobileBackdrop;
      }
      if (this.$datepicker.parentNode) {
        this.$datepicker.parentNode.removeChild(this.$datepicker);
      }
      this.$backdrop.appendChild(this.$datepicker);
      if (!this.$backdrop.parentNode) {
        document.body.appendChild(this.$backdrop);
      }
      this.$datepicker.classList.add(this._state.classes.mobile);
      this.$backdrop.style.display = this._state.visible ? 'flex' : 'none';
    } else if (this.$backdrop) {
      if (this.$datepicker.parentNode) {
        this.$datepicker.parentNode.removeChild(this.$datepicker);
      }
      document.body.appendChild(this.$datepicker);
      if (this.$backdrop.parentNode) {
        this.$backdrop.parentNode.removeChild(this.$backdrop);
      }
      this.$backdrop = null;
      this.$datepicker.classList.remove(this._state.classes.mobile);
    }
  }
  if (showEventChanged) {
    this._unbindTarget();
    this._state = next;
    this._bindTarget();
  }
  this._commit(next, { emitSelect: false });
};

/**
 * @param {string} view
 * @param {object} params
 * @returns {void}
 */
Lightpickr.prototype.setCurrentView = function (view, params) {
  const next = setCurrentViewState(this._state, view, params);
  this._commit(next, { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.setViewDate = function (date) {
  const next = setViewDateState(this._state, date);
  this._commit(next, { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.setFocusDate = function (date) {
  const next = setFocusDateState(this._state, date);
  this._commit(next, { emitSelect: false });
};

/**
 * @param {string} view
 * @returns {number[]}
 */
Lightpickr.prototype.getViewDates = function (view) {
  return getViewDatesFromState(this._state, view);
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.disableDate = function (date) {
  const ts = startOfDayTs(toTimestamp(date));
  if (ts == null || !Number.isFinite(ts)) {
    return;
  }
  const next = Object.assign({}, this._state);
  const arr = next.disabledDatesSorted.slice();
  if (arr.indexOf(ts) < 0) {
    arr.push(ts);
    arr.sort(function (a, b) {
      return a - b;
    });
  }
  next.disabledDatesSorted = arr;
  this._commit(next, { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.enableDate = function (date) {
  const ts = startOfDayTs(toTimestamp(date));
  if (ts == null || !Number.isFinite(ts)) {
    return;
  }
  const next = Object.assign({}, this._state);
  next.disabledDatesSorted = next.disabledDatesSorted.filter(function (x) {
    return x !== ts;
  });
  this._commit(next, { emitSelect: false });
};

/**
 * @param {function} plugin
 * @returns {void}
 */
Lightpickr.prototype.use = function (plugin) {
  if (typeof plugin !== 'function') {
    return;
  }
  const api = plugin(this) || {};
  this._plugins.push(api);
  if (api.onInit) {
    api.onInit();
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._mount = function () {
  this.$datepicker.setAttribute(this._state.attributes.root, '');
  if (this._state.inline) {
    this.$el.appendChild(this.$datepicker);
    this.$datepicker.classList.add(this._state.classes.inline);
  } else {
    if (this._state.isMobile) {
      this.$backdrop = document.createElement('div');
      this.$backdrop.className = this._state.classes.mobileBackdrop;
      this.$backdrop.style.display = 'none';
      this.$backdrop.appendChild(this.$datepicker);
      document.body.appendChild(this.$backdrop);
      this.$datepicker.classList.add(this._state.classes.mobile);
    } else {
      document.body.appendChild(this.$datepicker);
      this.$datepicker.classList.remove(this._state.classes.mobile);
    }
    this.$datepicker.classList.add(this._state.classes.popover);
    this.$datepicker.setAttribute('role', 'dialog');
    this.$datepicker.setAttribute('aria-modal', 'true');
    this.$datepicker.style.display = 'none';
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._syncFooterHandlers = function () {
  const actions = this.$datepicker.querySelectorAll('[' + this._state.attributes.footerAction + ']');
  for (let i = 0; i < actions.length; i++) {
    const el = actions[i];
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    if (el.getAttribute(this._state.attributes.footerBound) === '1') {
      continue;
    }
    el.setAttribute(this._state.attributes.footerBound, '1');
    el.addEventListener('click', () => {
      const action = el.getAttribute(this._state.attributes.footerAction);
      if (action === 'today') {
        const next = Object.assign({}, this._state);
        const now = new Date();
        next.viewDate = ymdToTsStartOfDay(now.getFullYear(), now.getMonth(), 1);
        this._commit(next, { emitSelect: false });
      } else if (action === 'clear') {
        this.clear();
      }
    });
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._attachRangeDragHandlers = function () {
  if (!this._state.range || !this._state.dynamicRange) {
    return;
  }
  const root = this.$datepicker;
  const startDrag = (ev) => {
    if (!(ev.target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = ev.target.closest('[' + this._state.attributes.day + ']');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    if (!(dayBtn.classList.contains(this._state.classes.cellRangeStart) || dayBtn.classList.contains(this._state.classes.cellRangeEnd))) {
      return;
    }
    const ts = parseElementNumber(dayBtn, this._state.attributes.day);
    if (ts == null) {
      return;
    }
    const day = startOfDayTs(ts);
    const ranges = /** @type {number[][]} */ (this._state.selectedDates);
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
    this._rangeDrag = { rangeIndex: rangeIndex, edge: edge };
  };
  const moveDrag = (ev) => {
    if (!this._rangeDrag) {
      return;
    }
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = target.closest('[' + this._state.attributes.day + ']');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    const ts = parseElementNumber(dayBtn, this._state.attributes.day);
    if (ts == null) {
      return;
    }
    const out = applyRangeEndpointDrag(this._state, this._rangeDrag.rangeIndex, this._rangeDrag.edge, ts);
    if (!out.changed) {
      return;
    }
    this._commit(out.state, { emitSelect: false });
  };
  const endDrag = () => {
    if (!this._rangeDrag) {
      return;
    }
    this._rangeDrag = null;
    this._emitSelect('range-drag');
    this._pluginOnSelect();
  };
  root.addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag);
  this._delegateOffs.push(function () {
    root.removeEventListener('pointerdown', startDrag);
    document.removeEventListener('pointermove', moveDrag);
    document.removeEventListener('pointerup', endDrag);
  });
};

/**
 * @private
 * @returns {HTMLElement}
 */
Lightpickr.prototype._defaultPositionReference = function () {
  const root = this.$el;
  if (_isTextInputLike(root)) {
    return root;
  }
  const fields = root.querySelectorAll('input, textarea');
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const hostRoot = field.closest('[' + this._state.attributes.root + ']');
    if (hostRoot && root.contains(hostRoot) && hostRoot !== this.$datepicker) {
      continue;
    }
    return field;
  }
  return root;
};

/**
 * @private
 * @returns {HTMLElement}
 */
Lightpickr.prototype._getPositionReference = function () {
  const a = this._state.anchor;
  if (a != null) {
    if (typeof a === 'string') {
      const found = document.querySelector(a);
      if (found) {
        return found;
      }
    } else if (a instanceof HTMLElement) {
      return a;
    }
  }
  return this._defaultPositionReference();
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._bindTarget = function () {
  const self = this;
  const bindField = function (el) {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const events = self._state.showEvents;
    for (let i = 0; i < events.length; i++) {
      const eventName = events[i];
      const listener = function () {
        self.show();
      };
      if (eventName === 'focus') {
        el.addEventListener('focus', listener, true);
        self._boundShowTargets.push({ el: el, eventName: 'focus', listener: listener, capture: true });
        el.addEventListener('focusin', listener);
        self._boundShowTargets.push({ el: el, eventName: 'focusin', listener: listener, capture: false });
        continue;
      }
      el.addEventListener(eventName, listener);
      self._boundShowTargets.push({ el: el, eventName: eventName, listener: listener, capture: false });
    }
  };
  bindField(this.$el);
  const ref = this._getPositionReference();
  if (ref !== this.$el) {
    bindField(ref);
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._unbindTarget = function () {
  for (let i = 0; i < this._boundShowTargets.length; i++) {
    const entry = this._boundShowTargets[i];
    entry.el.removeEventListener(entry.eventName, entry.listener, Boolean(entry.capture));
  }
  this._boundShowTargets = [];
};

/**
 * @private
 * @param {boolean} isViewChange
 * @returns {void}
 */
Lightpickr.prototype._positionPopover = function (isViewChange) {
  if (this._state.inline || this._state.isMobile) {
    return;
  }
  const anchorEl = this._getPositionReference();
  if (typeof this._state.position === 'function') {
    const ret = this._state.position({
      $datepicker: this.$datepicker,
      $target: this.$el,
      $anchor: anchorEl,
      $pointer: this.$pointer,
      isViewChange: !!isViewChange,
      done: function () {}
    });
    if (typeof ret === 'function') {
      this._positionHideCleanup = ret;
    } else if (!isViewChange) {
      this._positionHideCleanup = null;
    }
    return;
  }
  this._positionHideCleanup = null;
  const posStr = typeof this._state.position === 'string' ? this._state.position : lightpickrDefaults.position;
  applyStringPosition(this.$datepicker, anchorEl, this.$pointer, posStr);
};

/**
 * @private
 * @param {MouseEvent} ev
 * @returns {void}
 */
Lightpickr.prototype._onDocMouseDown = function (ev) {
  const t = ev.target;
  if (!(t instanceof Node)) {
    return;
  }
  if (this.$datepicker.contains(t) || this.$el.contains(t)) {
    return;
  }
  if (this.$backdrop && this.$backdrop === t) {
    this.hide();
    return;
  }
  const ref = this._getPositionReference();
  if (ref && ref.contains(t)) {
    return;
  }
  this.hide();
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._attachDocListener = function () {
  const self = this;
  if (this._docDown) {
    return;
  }
  this._docDown = function (ev) {
    self._onDocMouseDown(ev);
  };
  document.addEventListener('mousedown', this._docDown);
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._detachDocListener = function () {
  if (this._docDown) {
    document.removeEventListener('mousedown', this._docDown);
    this._docDown = null;
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._focusActiveKeyboardCell = function () {
  if (this.isDestroyed) {
    return;
  }
  const sel = '[' + this._state.attributes.day + '][tabindex="0"], [' + this._state.attributes.month + '][tabindex="0"], [' + this._state.attributes.year + '][tabindex="0"]';
  const el = this.$datepicker.querySelector(sel);
  if (el instanceof HTMLElement) {
    el.focus();
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._attachEscapeListener = function () {
  if (this._state.inline || this._docKeydownEsc) {
    return;
  }
  const self = this;
  this._docKeydownEsc = function (ev) {
    if (ev.key === 'Escape' && self.visible && !self._state.inline) {
      ev.preventDefault();
      self.hide();
    }
  };
  document.addEventListener('keydown', this._docKeydownEsc);
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._detachEscapeListener = function () {
  if (this._docKeydownEsc) {
    document.removeEventListener('keydown', this._docKeydownEsc);
    this._docKeydownEsc = null;
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._bindCalendarKeyboard = function () {
  if (this._datepickerKeydown) {
    return;
  }
  const self = this;
  this._datepickerKeydown = function (ev) {
    self._onDatepickerKeydown(ev);
  };
  this.$datepicker.addEventListener('keydown', this._datepickerKeydown, true);
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._unbindCalendarKeyboard = function () {
  if (this._datepickerKeydown) {
    this.$datepicker.removeEventListener('keydown', this._datepickerKeydown, true);
    this._datepickerKeydown = null;
  }
};

/**
 * @private
 * @param {KeyboardEvent} ev
 * @returns {void}
 */
Lightpickr.prototype._onDatepickerKeydown = function (ev) {
  if (this.isDestroyed || this._state.onlyTime) {
    return;
  }
  const key = ev.key;

  const hierRaw = nextStateAfterViewHierarchyKey(this._state, key, ev.altKey);
  if (hierRaw != null) {
    const next = _reseedKeyboardFocusForView(hierRaw);
    ev.preventDefault();
    if (_keyboardStateMeaningfullyChanged(this._state, next)) {
      this._commit(next, { emitSelect: false });
      _scheduleFocusActiveKeyboardCell(this);
    }
    return;
  }

  if (!isDayNavigationKey(key)) {
    return;
  }

  const monthOrYear = (this._state.currentView === 'month' || this._state.currentView === 'year') ? this._state.currentView : null;

  if (monthOrYear !== null) {
    const seedFn = monthOrYear === 'month' ? stateWithDefaultMonthGridFocus : stateWithDefaultYearGridFocus;
    const nextFn = monthOrYear === 'month' ? nextStateAfterMonthGridKey : nextStateAfterYearGridKey;
    let working = this._state;
    if (working.focusDate == null) {
      const seeded = seedFn(working, getViewDatesFromState(working, monthOrYear));
      if (seeded !== working) {
        ev.preventDefault();
        this._commit(seeded, { emitSelect: false });
        working = this._state;
      }
    }
    ev.preventDefault();
    const next = nextFn(working, ev.key, ev.shiftKey, getViewDatesFromState(working, monthOrYear));
    if (next !== working) {
      this._commit(next, { emitSelect: false });
      _scheduleFocusActiveKeyboardCell(this);
    }
    return;
  }

  if (this._state.currentView !== 'day' && this._state.currentView !== 'time') {
    return;
  }

  const dayDates = getViewDatesFromState(this._state, 'day');
  if (this._state.focusDate == null) {
    const seeded = stateWithDefaultDayFocus(this._state, dayDates);
    if (seeded !== this._state) {
      ev.preventDefault();
      this._commit(seeded, { emitSelect: false });
    }
  }
  ev.preventDefault();
  const next = nextStateAfterDayViewKey(this._state, key, ev.shiftKey, getViewDatesFromState(this._state, 'day'));
  if (next !== this._state) {
    this._commit(next, { emitSelect: false });
    _scheduleFocusActiveKeyboardCell(this);
  }
};

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @param {object} opts
 * @param {boolean} opts.emitSelect
 * @param {string} opts.selectTrigger
 * @param {boolean} opts.popoverInitialOpen
 * @returns {void}
 */
Lightpickr.prototype._commit = function (next, opts) {
  const prev = this._state;
  const changed = (opts && opts.emitSelect) && _selectionChanged(prev, next);
  this._state = next;
  this.visible = next.visible;
  if (next.pendingRangeStart == null) {
    this._pendingRangeHoverTs = null;
  }
  renderContainer(this);
  attachDelegatedHandlers(this, this.$datepicker);
  this._attachRangeDragHandlers();
  this._syncFooterHandlers();
  syncPendingRangeHoverClasses(this);
  this._emitViewEvents(prev, next);
  this._emitFocus(prev, next);
  if (changed) {
    this._emitSelect((opts && opts.selectTrigger) || 'select');
    this._pluginOnSelect();
  }
  this._syncInput();
  if (!this._state.inline && this._state.visible) {
    const isViewChange = !(opts && opts.popoverInitialOpen);
    this._positionPopover(isViewChange);
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._pluginOnRender = function () {
  _invokePluginHook(this._plugins, 'onRender');
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._pluginOnSelect = function () {
  _invokePluginHook(this._plugins, 'onSelect');
};

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {void}
 */
Lightpickr.prototype._emitViewEvents = function (prev, next) {
  if (prev.viewDate !== next.viewDate) {
    const parts = tsToYmd(next.viewDate);
    const decadeStart = Math.floor(parts.y / 10) * 10;
    next.onChangeViewDate({
      month: parts.m,
      year: parts.y,
      decade: [decadeStart, decadeStart + 9],
      datepicker: this
    });
  }
  if (prev.currentView !== next.currentView) {
    const map = {
      day: 'days',
      month: 'months',
      year: 'years',
      time: 'time'
    };
    next.onChangeView(map[next.currentView]);
  }
};

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {void}
 */
Lightpickr.prototype._emitFocus = function (prev, next) {
  if (prev.focusDate === next.focusDate || next.focusDate == null) {
    return;
  }
  next.onFocus({
    date: timestampToPickerDate(next.focusDate, next),
    datepicker: this
  });
};

/**
 * @private
 * @returns {{ dates: Date[], formattedDates: string[] }}
 */
Lightpickr.prototype._buildSelectedParts = function () {
  const timePart = this._state.enableTime ? this._state.timePart : null;
  /** @type {Date[]} */
  const dates = [];
  /** @type {string[]} */
  const formattedDates = [];

  /**
   * @param {number} ts
   * @returns {void}
   */
  const appendDate = (ts) => {
    dates.push(timestampToPickerDate(ts, this._state));
  };

  if (this._state.range) {
    const ranges = /** @type {number[][]} */ (this._state.selectedDates);
    for (let i = 0; i < ranges.length; i++) {
      appendDate(ranges[i][0]);
      appendDate(ranges[i][1]);
    }
  } else {
    const selectedDates = /** @type {number[]} */ (this._state.selectedDates);
    for (let i = 0; i < selectedDates.length; i++) {
      appendDate(selectedDates[i]);
    }
  }

  if (typeof this._state.format === 'string') {
    if (this._state.range) {
      const ranges = /** @type {number[][]} */ (this._state.selectedDates);
      for (let i = 0; i < ranges.length; i++) {
        formattedDates.push(formatDate(this._state.format, ranges[i][0], timePart, this._state));
        formattedDates.push(formatDate(this._state.format, ranges[i][1], timePart, this._state));
      }
    } else {
      const selectedDates = /** @type {number[]} */ (this._state.selectedDates);
      for (let i = 0; i < selectedDates.length; i++) {
        formattedDates.push(formatDate(this._state.format, selectedDates[i], timePart, this._state));
      }
    }
  } else {
    const fn = /** @type {(d: Date | Date[]) => string} */ (this._state.format);
    if (this._state.range) {
      const ranges = /** @type {number[][]} */ (this._state.selectedDates);
      for (let i = 0; i < ranges.length; i++) {
        const pair = [timestampToPickerDate(ranges[i][0], this._state), timestampToPickerDate(ranges[i][1], this._state)];
        const segment = String(fn(pair));
        formattedDates.push(segment, segment);
      }
    } else if (this._state.multipleEnabled) {
      if (dates.length === 0) {
        return { dates: dates, formattedDates: formattedDates };
      }
      const segment = String(fn(dates));
      for (let i = 0; i < dates.length; i++) {
        formattedDates.push(segment);
      }
    } else {
      for (let i = 0; i < dates.length; i++) {
        formattedDates.push(String(fn(dates[i])));
      }
    }
  }

  return { dates: dates, formattedDates: formattedDates };
};

/**
 * @private
 * @param {'select'|'unselect'|'clear'|'range-drag'|'time'} trigger
 * @returns {void}
 */
Lightpickr.prototype._emitSelect = function (trigger) {
  const parts = this._buildSelectedParts();
  const dates = parts.dates;
  const formattedDates = parts.formattedDates;
  const multiLike = this._state.range || this._state.multipleEnabled;
  this._state.onSelect({
    date: multiLike ? dates : dates[0] || null,
    dates: dates,
    formattedDate: multiLike ? formattedDates : formattedDates[0] || '',
    formattedDates: formattedDates,
    trigger: trigger,
    datepicker: this
  });
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._emitTimeChange = function () {
  const primaryTs = (() => {
    if (this._state.range) {
      const ranges = /** @type {number[][]} */ (this._state.selectedDates);
      if (ranges.length > 0) {
        return ranges[ranges.length - 1][1];
      }
      return this._state.viewDate;
    }
    const dates = /** @type {number[]} */ (this._state.selectedDates);
    if (dates.length > 0) {
      return dates[dates.length - 1];
    }
    return this._state.viewDate;
  })();
  this._state.onTimeChange({
    date: primaryTs != null ? timestampToPickerDate(primaryTs, this._state) : null,
    formattedDate:
      primaryTs == null
        ? ''
        : typeof this._state.format === 'function'
          ? String(/** @type {(d: Date | Date[]) => string} */ (this._state.format)(timestampToPickerDate(primaryTs, this._state)))
          : formatDate(this._state.format, primaryTs, this._state.enableTime ? this._state.timePart : null, this._state),
    datepicker: this
  });
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._syncInput = function () {
  if (!_isTextInputLike(this.$el)) {
    return;
  }
  const tp = this._state.enableTime ? this._state.timePart : null;
  if (typeof this._state.format === 'string') {
    if (this._state.range) {
      const parts = /** @type {number[][]} */ (this._state.selectedDates).map(
        (pair) => formatDate(this._state.format, pair[0], tp, this._state) + ' – ' + formatDate(this._state.format, pair[1], tp, this._state)
      );
      this.$el.value = parts.join(this._state.multipleSeparator);
    } else {
      const dates = /** @type {number[]} */ (this._state.selectedDates);
      if (!dates.length && !this._state.onlyTime) {
        this.$el.value = '';
      } else {
        const rows =
          dates.length > 0 ? dates : this._state.onlyTime ? [this._state.viewDate] : [];
        this.$el.value = rows.map((d) => formatDate(this._state.format, d, tp, this._state)).join(this._state.multipleSeparator);
      }
    }
    return;
  }

  const fn = /** @type {(d: Date | Date[]) => string} */ (this._state.format);
  if (this._state.range) {
    const parts = /** @type {number[][]} */ (this._state.selectedDates).map((pair) =>
      String(fn([timestampToPickerDate(pair[0], this._state), timestampToPickerDate(pair[1], this._state)]))
    );
    this.$el.value = parts.join(this._state.multipleSeparator);
    return;
  }

  const tss = /** @type {number[]} */ (this._state.selectedDates);
  if (!tss.length && !this._state.onlyTime) {
    this.$el.value = '';
    return;
  }
  const rows = tss.length > 0 ? tss : this._state.onlyTime ? [this._state.viewDate] : [];
  if (!rows.length) {
    this.$el.value = '';
    return;
  }
  if (this._state.multipleEnabled) {
    this.$el.value = String(fn(rows.map((ts) => timestampToPickerDate(ts, this._state))));
  } else {
    this.$el.value = String(fn(timestampToPickerDate(rows[0], this._state)));
  }
};

/**
 * @private
 * @param {number} ts
 * @returns {void}
 */
Lightpickr.prototype._handleDayClick = function (ts) {
  const allowSelect = this._state.onBeforeSelect({
    date: timestampToPickerDate(ts, this._state),
    datepicker: this
  });
  if (allowSelect === false) {
    return;
  }
  const r = applyDaySelection(this._state, ts);
  if (!r.changed) {
    return;
  }
  if (this._state.moveToOtherMonthsOnSelect) {
    const currentMonth = tsToYmd(this._state.viewDate).m;
    const clicked = tsToYmd(ts);
    if (clicked.m !== currentMonth) {
      r.state.viewDate = ymdToTsStartOfDay(clicked.y, clicked.m, 1);
    }
  }
  this._commit(r.state, { emitSelect: true, selectTrigger: 'select' });
  if (_shouldCloseAfterSelect(this._state)) {
    this.hide();
  }
};

/**
 * @private
 * @param {number} monthIndex
 * @returns {void}
 */
Lightpickr.prototype._handleMonthPick = function (monthIndex) {
  const y = tsToYmd(this._state.viewDate).y;
  const next = Object.assign({}, this._state);
  next.viewDate = ymdToTsStartOfDay(y, monthIndex, 1);
  next.currentView = this._state.allowedViews.indexOf('day') >= 0 ? 'day' : this._state.allowedViews[0];
  this._commit(next, { emitSelect: false });
};

/**
 * @private
 * @param {number} year
 * @returns {void}
 */
Lightpickr.prototype._handleYearPick = function (year) {
  const m = tsToYmd(this._state.viewDate).m;
  const next = Object.assign({}, this._state);
  next.viewDate = ymdToTsStartOfDay(year, m, 1);
  next.currentView = this._state.allowedViews.indexOf('month') >= 0 ? 'month' : this._state.allowedViews[0];
  this._commit(next, { emitSelect: false });
};

/**
 * @private
 * @param {number} dayIndex
 * @returns {void}
 */
Lightpickr.prototype._handleDayNameClick = function (dayIndex) {
  this._state.onClickDayName({
    dayIndex: dayIndex,
    datepicker: this
  });
};

/**
 * @private
 * @param {Event} ev
 * @returns {void}
 */
Lightpickr.prototype._onTimeInputChange = function (ev) {
  const t = ev.target;
  if (!(t instanceof HTMLInputElement) || !this.$datepicker.contains(t)) {
    return;
  }
  const kind = t.getAttribute(this._state.attributes.time);
  const applyTime = (h, mm) => {
    if (!Number.isFinite(h) || !Number.isFinite(mm)) {
      return;
    }
    this._state = setTimePart(this._state, h, mm);
    syncTimePanelDom(this);
    this._syncInput();
    this._emitTimeChange();
    this._emitSelect('time');
  };
  if (kind === 'hours' || kind === 'minutes') {
    const h = kind === 'hours' ? Number(t.value) : this._state.timePart.hours;
    const mm = kind === 'minutes' ? Number(t.value) : this._state.timePart.minutes;
    applyTime(h, mm);
    return;
  }
  if (kind !== 'clock') {
    return;
  }
  const parts = String(t.value).split(':');
  applyTime(Number(parts[0]), Number(parts[1]));
};

Object.defineProperties(Lightpickr.prototype, {
  viewDate: {
    get: function () {
      return this._state.viewDate;
    }
  },
  currentView: {
    get: function () {
      return this._state.currentView;
    }
  },
  selectedDates: {
    get: function () {
      return cloneSelectedDates(this._state.selectedDates);
    }
  },
  focusDate: {
    get: function () {
      return this._state.focusDate;
    }
  },
  disabledDates: {
    get: function () {
      return this._state.disabledDatesSorted.slice();
    }
  }
});

/**
 * @private
 * @param {unknown} el
 * @returns {boolean}
 */
function _isTextInputLike(el) {
  return el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} state
 * @returns {import('./core/state.js').LightpickrInternalState}
 */
function _reseedKeyboardFocusForView(state) {
  if (state.onlyTime) {
    return state;
  }
  if (state.currentView === 'month') {
    return stateWithDefaultMonthGridFocus(state, getViewDatesFromState(state, 'month'));
  }
  if (state.currentView === 'year') {
    return stateWithDefaultYearGridFocus(state, getViewDatesFromState(state, 'year'));
  }
  if (state.currentView === 'day' || state.currentView === 'time') {
    return stateWithDefaultDayFocus(state, getViewDatesFromState(state, 'day'));
  }
  return state;
}

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
 * @param {import('./core/state.js').LightpickrInternalState} state
 * @returns {boolean}
 */
function _shouldCloseAfterSelect(state) {
  if (!state.autoClose) {
    return false;
  }
  if (!state.range && !state.multipleEnabled) {
    return true;
  }
  return state.range && !state.pendingRangeStart;
}

/**
 * @private
 * @returns {void}
 */
function _scheduleFocusActiveKeyboardCell(self) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(function () {
      self._focusActiveKeyboardCell();
    });
  } else {
    setTimeout(function () {
      self._focusActiveKeyboardCell();
    }, 0);
  }
}

/**
 * @private
 * @param {{ onRender?: () => void, onSelect?: () => void }[]} plugins
 * @param {'onRender'|'onSelect'} methodName
 * @returns {void}
 */
function _invokePluginHook(plugins, methodName) {
  for (let i = 0; i < plugins.length; i++) {
    const fn = plugins[i][methodName];
    if (typeof fn === 'function') {
      fn();
    }
  }
}

export default Lightpickr;
