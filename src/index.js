import { createStateFromOptions, mergeOptionsIntoState } from './core/state.js';
import { navigateNextPrev, navigateUp, navigateDown, setCurrentViewState, setViewDateState, setFocusDateState } from './core/navigation.js';
import { applyDaySelection, applyRangeEndpointDrag, clearSelectionState, selectDateExplicit, unselectDate } from './core/selection.js';
import { cloneSelectedDates, formatDate, normalizeRangePairs, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from './core/utils.js';
import { setTimePart } from './core/time.js';
import { attachDelegatedHandlers, getViewDates, renderFull, syncPendingRangeHoverClasses, syncTimePanelDom } from './render/renderer.js';
import { parseDayCellTimestamp } from './render/dom.js';
import { applyStringPosition } from './core/positioning.js';

/**
 * @private
 * @param {unknown} el
 * @returns {boolean}
 */
function isTextInputLike(el) {
  return el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} prev
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @returns {boolean}
 */
function selectionChanged(prev, next) {
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
 * @param {number} ts
 * @param {import('./core/state.js').LightpickrInternalState} state
 * @returns {Date}
 */
function dateWithStateTime(ts, state) {
  const d = new Date(ts);
  if (state.enableTime) {
    d.setHours(state.timePart.hours, state.timePart.minutes, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} state
 * @returns {boolean}
 */
function shouldCloseAfterSelect(state) {
  if (!state.closeOnSelect) {
    return false;
  }
  if (!state.range && !state.multipleEnabled) {
    return true;
  }
  return state.range && !state.pendingRangeStart;
}

/**
 * @private
 * @param {string|HTMLElement} target
 * @param {import('./core/state.js').LightpickrOptions} options
 * @returns {void}
 */
function Lightpickr(target, options) {
  const el = target instanceof HTMLElement ? target : document.querySelector(target);
  if (!el) {
    throw new Error('Lightpickr: target not found');
  }
  this.$el = el;
  this._options = Object.assign({}, options || {});
  this._state = createStateFromOptions(this._options);
  if (this._options.inline == null) {
    // When isMobile is enabled, default to a modal popover even when the target
    // is a wrapper element.
    this._state.inline = this._state.isMobile ? false : !isTextInputLike(this.$el);
  }
  this.$datepicker = document.createElement('div');
  this.$datepicker.className = this._state.classes.container;
  this.isDestroyed = false;
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
  this._rangeDrag = null;
  this.$backdrop = null;
  this._boundShowTargets = [];

  this.$pointer = document.createElement('i');
  this.$pointer.className = this._state.classes.popoverPointer;
  this.$pointer.setAttribute('aria-hidden', 'true');

  this._mount();
  renderFull(this);
  attachDelegatedHandlers(this, this.$datepicker);
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
  const next = Object.assign({}, this._state);
  next.onShow(false, { datepicker: this });
  next.visible = true;
  if (this.$backdrop) {
    this.$backdrop.style.display = 'flex';
  }
  this.$datepicker.style.display = '';
  this._attachDocListener();
  this._commit(next, { emitSelect: false, popoverInitialOpen: true });
  this._state.onShow(true, { datepicker: this });
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
  const s = this._state;
  const canSelect = (value) => {
    const ts = toTimestamp(value);
    if (ts == null) {
      return false;
    }
    return this._state.onBeforeSelect({
      date: dateWithStateTime(ts, this._state),
      datepicker: this
    }) !== false;
  };
  if (Array.isArray(date) && date.length && Array.isArray(date[0])) {
    if (!s.range) {
      return;
    }
    const next = Object.assign({}, s);
    next.selectedDates = normalizeRangePairs(date, s.multipleLimit);
    this._commit(next, { emitSelect: true, selectTrigger: 'select' });
    if (opts && opts.close && s.closeOnSelect) {
      this.hide();
    }
    return;
  }
  if (Array.isArray(date)) {
    let cur = s;
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
    const r = selectDateExplicit(s, date);
    this._commit(r.state, { emitSelect: r.changed, selectTrigger: 'select' });
  }
  if (shouldCloseAfterSelect(this._state)) {
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
 * @param {string} fmt
 * @returns {string}
 */
Lightpickr.prototype.formatDate = function (date, fmt) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return '';
  }
  return formatDate(fmt || this._state.format, ts, this._state.enableTime ? this._state.timePart : null);
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
        this.$backdrop.className = 'lp-mobile-backdrop';
      }
      if (this.$datepicker.parentNode) {
        this.$datepicker.parentNode.removeChild(this.$datepicker);
      }
      this.$backdrop.appendChild(this.$datepicker);
      if (!this.$backdrop.parentNode) {
        document.body.appendChild(this.$backdrop);
      }
      this.$datepicker.classList.add('lp--mobile');
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
      this.$datepicker.classList.remove('lp--mobile');
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
  return getViewDates(this, view);
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
  this.$datepicker.setAttribute('data-lp-root', '');
  if (this._state.inline) {
    this.$el.appendChild(this.$datepicker);
    this.$datepicker.classList.add('lp--inline');
  } else {
    if (this._state.isMobile) {
      this.$backdrop = document.createElement('div');
      this.$backdrop.className = 'lp-mobile-backdrop';
      this.$backdrop.style.display = 'none';
      this.$backdrop.appendChild(this.$datepicker);
      document.body.appendChild(this.$backdrop);
      this.$datepicker.classList.add('lp--mobile');
    } else {
      document.body.appendChild(this.$datepicker);
      this.$datepicker.classList.remove('lp--mobile');
    }
    this.$datepicker.classList.add('lp--popover');
    this.$datepicker.setAttribute('role', 'dialog');
    this.$datepicker.style.display = 'none';
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._syncFooterHandlers = function () {
  const actions = this.$datepicker.querySelectorAll('[data-lp-footer-action]');
  for (let i = 0; i < actions.length; i++) {
    const el = actions[i];
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    if (el.getAttribute('data-lp-footer-bound') === '1') {
      continue;
    }
    el.setAttribute('data-lp-footer-bound', '1');
    el.addEventListener('click', () => {
      const action = el.getAttribute('data-lp-footer-action');
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
    const dayBtn = ev.target.closest('[data-lp-day]');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    if (!(dayBtn.classList.contains(this._state.classes.cellRangeStart) || dayBtn.classList.contains(this._state.classes.cellRangeEnd))) {
      return;
    }
    const ts = parseDayCellTimestamp(dayBtn);
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
    const dayBtn = target.closest('[data-lp-day]');
    if (!(dayBtn instanceof HTMLElement) || !root.contains(dayBtn)) {
      return;
    }
    const ts = parseDayCellTimestamp(dayBtn);
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
  if (isTextInputLike(root)) {
    return root;
  }
  const fields = root.querySelectorAll('input, textarea');
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const hostRoot = field.closest('[data-lp-root]');
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
  if (this._state.inline) {
    return;
  }
  if (this._state.isMobile) {
    return;
  }
  const s = this._state;
  const anchorEl = this._getPositionReference();
  if (typeof s.position === 'function') {
    const ret = s.position({
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
  const posStr = typeof s.position === 'string' ? s.position : 'bottom left';
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
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @param {object} opts
 * @param {boolean} opts.emitSelect
 * @param {string} opts.selectTrigger
 * @param {boolean} opts.popoverInitialOpen
 * @returns {void}
 */
Lightpickr.prototype._commit = function (next, opts) {
  const prev = this._state;
  const emitSelect = opts && opts.emitSelect;
  const changed = emitSelect && selectionChanged(prev, next);
  this._state = next;
  this.visible = next.visible;
  if (next.pendingRangeStart == null) {
    this._pendingRangeHoverTs = null;
  }
  renderFull(this);
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
  for (let i = 0; i < this._plugins.length; i++) {
    const p = this._plugins[i];
    if (p.onRender) {
      p.onRender();
    }
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._pluginOnSelect = function () {
  for (let i = 0; i < this._plugins.length; i++) {
    const p = this._plugins[i];
    if (p.onSelect) {
      p.onSelect();
    }
  }
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
    date: dateWithStateTime(next.focusDate, next),
    datepicker: this
  });
};

/**
 * @private
 * @returns {{ dates: Date[], formattedDates: string[] }}
 */
Lightpickr.prototype._buildSelectedParts = function () {
  const s = this._state;
  const timePart = s.enableTime ? s.timePart : null;
  /** @type {Date[]} */
  const dates = [];
  /** @type {string[]} */
  const formattedDates = [];

  const appendSelectedPart = (ts) => {
    dates.push(dateWithStateTime(ts, s));
    formattedDates.push(formatDate(s.format, ts, timePart));
  };

  if (s.range) {
    const ranges = /** @type {number[][]} */ (s.selectedDates);
    for (let i = 0; i < ranges.length; i++) {
      appendSelectedPart(ranges[i][0]);
      appendSelectedPart(ranges[i][1]);
    }
  } else {
    const selectedDates = /** @type {number[]} */ (s.selectedDates);
    for (let i = 0; i < selectedDates.length; i++) {
      appendSelectedPart(selectedDates[i]);
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
  const s = this._state;
  const parts = this._buildSelectedParts();
  const dates = parts.dates;
  const formattedDates = parts.formattedDates;
  const multiLike = s.range || s.multipleEnabled;
  s.onSelect({
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
 * @param {import('./core/state.js').LightpickrInternalState} s
 * @returns {void}
 */
Lightpickr.prototype._emitTimeChange = function () {
  const s = this._state;
  const primaryTs = (() => {
    if (s.range) {
      const ranges = /** @type {number[][]} */ (s.selectedDates);
      if (ranges.length > 0) {
        return ranges[ranges.length - 1][1];
      }
      return s.viewDate;
    }
    const dates = /** @type {number[]} */ (s.selectedDates);
    if (dates.length > 0) {
      return dates[dates.length - 1];
    }
    return s.viewDate;
  })();
  s.onTimeChange({
    date: primaryTs == null ? null : dateWithStateTime(primaryTs, s),
    formattedDate: primaryTs == null ? '' : formatDate(s.format, primaryTs, s.enableTime ? s.timePart : null),
    datepicker: this
  });
};


/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._syncInput = function () {
  if (!isTextInputLike(this.$el)) {
    return;
  }
  const s = this._state;
  const tp = s.enableTime ? s.timePart : null;
  if (s.range) {
    const ranges = /** @type {number[][]} */ (s.selectedDates);
    const parts = ranges.map((pair) => formatDate(s.format, pair[0], tp) + ' – ' + formatDate(s.format, pair[1], tp));
    this.$el.value = parts.join(s.multipleSeparator);
  } else {
    const dates = /** @type {number[]} */ (s.selectedDates);
    if (!dates.length && !s.onlyTime) {
      this.$el.value = '';
    } else {
      const rows =
        dates.length > 0
          ? dates
          : s.onlyTime
            ? [s.viewDate]
            : [];
      this.$el.value = rows.map((d) => formatDate(s.format, d, tp)).join(s.multipleSeparator);
    }
  }
};

/**
 * @private
 * @param {number} ts
 * @returns {void}
 */
Lightpickr.prototype._handleDayClick = function (ts) {
  const allowSelect = this._state.onBeforeSelect({
    date: dateWithStateTime(ts, this._state),
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
  if (shouldCloseAfterSelect(this._state)) {
    this.hide();
  }
};

/**
 * @private
 * @param {number} monthIndex
 * @returns {void}
 */
Lightpickr.prototype._handleMonthPick = function (monthIndex) {
  const s = this._state;
  const y = tsToYmd(s.viewDate).y;
  const next = Object.assign({}, s);
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
  const s = this._state;
  const m = tsToYmd(s.viewDate).m;
  const next = Object.assign({}, s);
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
  const kind = t.getAttribute('data-lp-time');
  if (kind === 'hours' || kind === 'minutes') {
    const h = kind === 'hours' ? Number(t.value) : this._state.timePart.hours;
    const mm = kind === 'minutes' ? Number(t.value) : this._state.timePart.minutes;
    if (!Number.isFinite(h) || !Number.isFinite(mm)) {
      return;
    }
    const next = setTimePart(this._state, h, mm);
    this._state = next;
    syncTimePanelDom(this);
    this._syncInput();
    this._emitTimeChange();
    this._emitSelect('time');
    return;
  }
  if (kind !== 'clock') {
    return;
  }
  const parts = String(t.value).split(':');
  const h = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) {
    return;
  }
  const next = setTimePart(this._state, h, mm);
  this._state = next;
  syncTimePanelDom(this);
  this._syncInput();
  this._emitTimeChange();
  this._emitSelect('time');
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._rebindByState = function () {
  this._unbindTarget();
  this._bindTarget();
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

export default Lightpickr;