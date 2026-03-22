import { createStateFromOptions, mergeOptionsIntoState } from './core/state.js';
import { navigateNextPrev, navigateUp, navigateDown, setCurrentViewState, setViewDateState, setFocusDateState } from './core/navigation.js';
import {
  applyDaySelection,
  clearSelectionState,
  selectDateExplicit,
  unselectDate
} from './core/selection.js';
import { formatDate, startOfDayTs, toTimestamp, tsToYmd, ymdToTsStartOfDay } from './core/utils.js';
import { setTimePart } from './core/time.js';
import { attachDelegatedHandlers, getViewDates, renderFull, syncPendingRangeHoverClasses } from './render/renderer.js';
import { applyStringPosition } from './core/positioning.js';

/**
 * @param {string|HTMLElement} target
 * @returns {HTMLElement|null}
 */
function resolveTarget(target) {
  if (target instanceof HTMLElement) {
    return target;
  }
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    return el;
  }
  return null;
}

/**
 * @param {import('./core/state.js').LightpickrInternalState} a
 * @param {import('./core/state.js').LightpickrInternalState} b
 * @returns {boolean}
 */
/**
 * @param {unknown} el
 * @returns {boolean}
 */
function isTextInputLike(el) {
  return el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

function selectionChanged(a, b) {
  const sa = a.selectedDates;
  const sb = b.selectedDates;
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

function Lightpickr(target, options) {
  const el = resolveTarget(target);
  if (!el) {
    throw new Error('Lightpickr: target not found');
  }
  this.$el = el;
  this._options = Object.assign({}, options || {});
  this._state = createStateFromOptions(this._options);
  if (this._options.inline == null) {
    this._state.inline = !isTextInputLike(this.$el);
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

  this.$pointer = document.createElement('i');
  this.$pointer.className = this._state.classes.popoverPointer;
  this.$pointer.setAttribute('aria-hidden', 'true');

  this._mount();
  renderFull(this);
  attachDelegatedHandlers(this, this.$datepicker);
  this._bindTarget();
}

Lightpickr.prototype._mount = function () {
  this.$datepicker.setAttribute('data-lp-root', '');
  if (this._state.inline) {
    this.$el.appendChild(this.$datepicker);
    this.$datepicker.classList.add('lp--inline');
  } else {
    document.body.appendChild(this.$datepicker);
    this.$datepicker.classList.add('lp--popover');
    this.$datepicker.setAttribute('role', 'dialog');
    this.$datepicker.style.display = 'none';
  }
};

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

Lightpickr.prototype._bindTarget = function () {
  const self = this;
  const bindField = function (el) {
    if (isTextInputLike(el)) {
      el.addEventListener('focus', function () {
        self.show();
      });
      el.addEventListener('click', function () {
        self.show();
      });
    }
  };
  bindField(this.$el);
  const ref = this._getPositionReference();
  if (ref !== this.$el) {
    bindField(ref);
  }
};

Lightpickr.prototype._positionPopover = function (isViewChange) {
  if (this._state.inline) {
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

Lightpickr.prototype._onDocMouseDown = function (ev) {
  const t = ev.target;
  if (!(t instanceof Node)) {
    return;
  }
  if (this.$datepicker.contains(t) || this.$el.contains(t)) {
    return;
  }
  const ref = this._getPositionReference();
  if (ref && ref.contains(t)) {
    return;
  }
  this.hide();
};

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

Lightpickr.prototype._detachDocListener = function () {
  if (this._docDown) {
    document.removeEventListener('mousedown', this._docDown);
    this._docDown = null;
  }
};

Lightpickr.prototype._commit = function (next, opts) {
  const prev = this._state;
  const emit = opts && opts.emitChange;
  const changed = emit && selectionChanged(prev, next);
  this._state = next;
  this.visible = next.visible;
  if (next.pendingRangeStart == null) {
    this._pendingRangeHoverTs = null;
  }
  renderFull(this);
  attachDelegatedHandlers(this, this.$datepicker);
  syncPendingRangeHoverClasses(this);
  if (changed) {
    this._state.onChange(this.getSelectedPayload());
    this._pluginOnSelect();
  }
  this._syncInput();
  if (!this._state.inline && this._state.visible) {
    const isViewChange = !(opts && opts.popoverInitialOpen);
    this._positionPopover(isViewChange);
  }
};

Lightpickr.prototype._pluginOnRender = function () {
  for (let i = 0; i < this._plugins.length; i++) {
    const p = this._plugins[i];
    if (p.onRender) {
      p.onRender();
    }
  }
};

Lightpickr.prototype._pluginOnSelect = function () {
  for (let i = 0; i < this._plugins.length; i++) {
    const p = this._plugins[i];
    if (p.onSelect) {
      p.onSelect();
    }
  }
};

Lightpickr.prototype.getSelectedPayload = function () {
  const s = this._state;
  if (s.range) {
    return cloneRanges(/** @type {number[][]} */ (s.selectedDates));
  }
  return /** @type {number[]} */ (s.selectedDates).slice();
};

Lightpickr.prototype._syncInput = function () {
  if (!isTextInputLike(this.$el)) {
    return;
  }
  const s = this._state;
  const tp = s.enableTime ? s.timePart : null;
  if (s.range) {
    const ranges = /** @type {number[][]} */ (s.selectedDates);
    const parts = ranges.map((pair) => formatDate(s.format, pair[0], tp) + ' – ' + formatDate(s.format, pair[1], tp));
    this.$el.value = parts.join(', ');
  } else {
    const dates = /** @type {number[]} */ (s.selectedDates);
    if (!dates.length) {
      this.$el.value = '';
    } else {
      this.$el.value = dates.map((d) => formatDate(s.format, d, tp)).join(', ');
    }
  }
};

/**
 * @param {number[][]} ranges
 * @returns {number[][]}
 */
function cloneRanges(ranges) {
  return ranges.map((p) => p.slice());
}

Lightpickr.prototype.show = function () {
  if (this.isDestroyed || this._state.inline) {
    return;
  }
  const next = Object.assign({}, this._state);
  next.visible = true;
  this.$datepicker.style.display = '';
  this._attachDocListener();
  this._commit(next, { emitChange: false, popoverInitialOpen: true });
  this._state.onShow();
};

Lightpickr.prototype.hide = function () {
  if (this.isDestroyed || this._state.inline) {
    return;
  }
  const self = this;
  const finishHide = function () {
    const next = Object.assign({}, self._state);
    next.visible = false;
    self.$datepicker.style.display = 'none';
    self._detachDocListener();
    self._commit(next, { emitChange: false });
    self._state.onHide();
  };
  const hook = this._positionHideCleanup;
  if (typeof hook === 'function') {
    this._positionHideCleanup = null;
    hook(finishHide);
  } else {
    finishHide();
  }
};

Lightpickr.prototype.next = function () {
  const next = navigateNextPrev(this._state, 1);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.prev = function () {
  const next = navigateNextPrev(this._state, -1);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.up = function () {
  const next = navigateUp(this._state);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.down = function () {
  const next = navigateDown(this._state);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.selectDate = function (date, opts) {
  const s = this._state;
  if (Array.isArray(date) && date.length && Array.isArray(date[0])) {
    if (!s.range) {
      return;
    }
    const next = Object.assign({}, s);
    const pairs = /** @type {number[][]} */ (date)
      .map(function (pair) {
        const a = toTimestamp(pair[0]);
        const b = toTimestamp(pair[1]);
        if (a == null || b == null) {
          return null;
        }
        const x = startOfDayTs(a);
        const y = startOfDayTs(b);
        return [Math.min(x, y), Math.max(x, y)];
      })
      .filter(Boolean);
    next.selectedDates = pairs.slice(-s.multipleLimit);
    this._commit(next, { emitChange: true });
    if (opts && opts.close && s.closeOnSelect) {
      this.hide();
    }
    return;
  }
  if (Array.isArray(date)) {
    let cur = s;
    for (let i = 0; i < date.length; i++) {
      const r = selectDateExplicit(cur, date[i]);
      cur = r.state;
    }
    this._commit(cur, { emitChange: true });
  } else {
    const r = selectDateExplicit(s, date);
    this._commit(r.state, { emitChange: r.changed });
  }
  if (this._state.closeOnSelect && !this._state.range && !this._state.multipleEnabled) {
    this.hide();
  }
  if (this._state.closeOnSelect && this._state.range && !this._state.pendingRangeStart) {
    this.hide();
  }
};

Lightpickr.prototype.unselectDate = function (date) {
  const r = unselectDate(this._state, date);
  this._commit(r.state, { emitChange: r.changed });
};

Lightpickr.prototype.clear = function () {
  const next = clearSelectionState(this._state);
  this._commit(next, { emitChange: true });
};

Lightpickr.prototype.formatDate = function (date, fmt) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return '';
  }
  return formatDate(fmt || this._state.format, ts, this._state.enableTime ? this._state.timePart : null);
};

Lightpickr.prototype.destroy = function () {
  if (this.isDestroyed) {
    return;
  }
  this._positionHideCleanup = null;
  this._detachDocListener();
  this._delegateOffs.forEach(function (fn) {
    fn();
  });
  this._delegateOffs = [];
  if (this.$datepicker.parentNode) {
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

Lightpickr.prototype.update = function (newOpts) {
  const next = mergeOptionsIntoState(this._state, newOpts || {});
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.setCurrentView = function (view, params) {
  const next = setCurrentViewState(this._state, view, params);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.setViewDate = function (date) {
  const next = setViewDateState(this._state, date);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.setFocusDate = function (date) {
  const next = setFocusDateState(this._state, date);
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.getViewDates = function (view) {
  return getViewDates(this, view);
};

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
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype.enableDate = function (date) {
  const ts = startOfDayTs(toTimestamp(date));
  if (ts == null || !Number.isFinite(ts)) {
    return;
  }
  const next = Object.assign({}, this._state);
  next.disabledDatesSorted = next.disabledDatesSorted.filter(function (x) {
    return x !== ts;
  });
  this._commit(next, { emitChange: false });
};

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

Lightpickr.prototype._handleDayClick = function (ts) {
  const r = applyDaySelection(this._state, ts);
  if (!r.changed) {
    return;
  }
  this._commit(r.state, { emitChange: true });
  if (this._state.closeOnSelect && !this._state.range && !this._state.multipleEnabled) {
    this.hide();
  }
  if (this._state.closeOnSelect && this._state.range && !this._state.pendingRangeStart) {
    this.hide();
  }
};

Lightpickr.prototype._handleMonthPick = function (monthIndex) {
  const s = this._state;
  const y = tsToYmd(s.viewDate).y;
  const next = Object.assign({}, s);
  next.viewDate = ymdToTsStartOfDay(y, monthIndex, 1);
  next.currentView = 'day';
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype._handleYearPick = function (year) {
  const s = this._state;
  const m = tsToYmd(s.viewDate).m;
  const next = Object.assign({}, s);
  next.viewDate = ymdToTsStartOfDay(year, m, 1);
  next.currentView = 'month';
  this._commit(next, { emitChange: false });
};

Lightpickr.prototype._onTimeInputChange = function (ev) {
  const t = ev.target;
  if (!(t instanceof HTMLInputElement) || !this.$datepicker.contains(t)) {
    return;
  }
  const kind = t.getAttribute('data-lp-time');
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
  this._commit(next, { emitChange: false });
  this._syncInput();
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
      const s = this._state;
      if (s.range) {
        return cloneRanges(/** @type {number[][]} */ (s.selectedDates));
      }
      return /** @type {number[]} */ (s.selectedDates).slice();
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