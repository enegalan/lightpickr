import { createStateFromOptions, mergeOptionsIntoState } from './core/state.js';
import { navigateNextPrev, navigateUp, navigateDown, setCurrentViewState, setViewDateState, setFocusDateState } from './core/navigation.js';
import { clearSelection, selectDate, unselectDate } from './core/selection.js';
import { cloneSelectedDates, formatDate, startOfDayTs, toTimestamp, parseSelectedDates, timestampToPickerDate } from './utils/time.js';
import { bindDocListeners, syncInstanceClasses, scheduleFocusActiveKeyboardCell, emitEvents } from './render/handlers.js';
import { renderContainer } from './render/container.js';
import { getViewDates } from './utils/view.js';
import { applyStringPosition } from './core/positioning.js';
import { reseedKeyboardFocusForView } from './core/keyboard.js';
import { createEl, isTextInputLike, noop } from './utils/common.js';
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
  /** @type {import('./core/state.js').LightpickrInternalState} */
  this._state = createStateFromOptions(options);
  if (options?.inline == null) {
    // When isMobile is enabled, default to a modal popover even when the target
    // is a wrapper element.
    /** @type {boolean} */
    this._state.inline = this._state.isMobile ? false : !isTextInputLike(this.$el);
  }
  /** @type {HTMLElement} */
  this.$datepicker = createEl('div', this._state.classes.container);
  /** @type {boolean} */
  this.isDestroyed = false;
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
  /** @type {MutationObserver|null} */
  this._themeMutationObserver = null;
  /** @type {HTMLElement} */
  this.$pointer = createEl('i', this._state.classes.popoverPointer, { 'aria-hidden': 'true' });

  this._mount();
  renderContainer(this);
  this._bindThemeSync();
  this._bindTarget();
}

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
    next = reseedKeyboardFocusForView(next);
  }
  if (this.$backdrop) {
    if (typeof this._state.position === 'function') {
      this.$backdrop.style.display = 'flex';
    } else {
      this.$backdrop.classList.add(this._state.classes.mobileBackdropOpen);
      this.$backdrop.style.removeProperty('display');
    }
  }
  if (typeof this._state.position === 'function') {
    this.$datepicker.style.display = '';
  } else {
    this.$datepicker.style.removeProperty('display');
  }
  bindDocListeners(this);
  this._commit(next, { emitSelect: false, popoverInitialOpen: true });
  this._state.onShow(true, { datepicker: this });
  scheduleFocusActiveKeyboardCell(this);
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
      if (typeof self._state.position === 'function') {
        self.$backdrop.style.display = 'none';
      } else {
        self.$backdrop.classList.remove(self._state.classes.mobileBackdropOpen);
        self.$backdrop.style.removeProperty('display');
      }
    }
    if (typeof self._state.position === 'function') {
      self.$datepicker.style.display = 'none';
    } else {
      self.$datepicker.style.removeProperty('display');
    }
    self._detachListeners();
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
  this._commit(navigateNextPrev(this._state, 1), { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.prev = function () {
  this._commit(navigateNextPrev(this._state, -1), { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.up = function () {
  this._commit(navigateUp(this._state), { emitSelect: false });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.down = function () {
  this._commit(navigateDown(this._state), { emitSelect: false });
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
      const r = selectDate(cur, toTimestamp(date[i]));
      cur = r.state;
    }
    this._commit(cur, { emitSelect: true, selectTrigger: 'select' });
  } else {
    if (!canSelect(date)) {
      return;
    }
    const r = selectDate(this._state, toTimestamp(date));
    this._commit(r.state, { emitSelect: r.changed, selectTrigger: 'select' });
  }
  if (this._shouldCloseAfterSelect()) {
    this.hide();
  }
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.unselectDate = function (date) {
  const r = unselectDate(this._state, toTimestamp(date));
  this._commit(r.state, { emitSelect: r.changed, selectTrigger: 'unselect' });
};

/**
 * @returns {void}
 */
Lightpickr.prototype.clear = function () {
  this._commit(clearSelection(this._state), { emitSelect: true, selectTrigger: 'clear' });
};

/**
 * @param {number|Date|string} date
 * @param {string} format
 * @returns {string}
 */
Lightpickr.prototype.formatDate = function (date, format) {
  const ts = toTimestamp(date);
  if (ts == null) {
    return '';
  }
  const pickFmt = format != null ? format : this._state.format;
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
  this._detachListeners();
  this._unbindCalendarKeyboard();
  this._unbindThemeSync();
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
        this.$backdrop = createEl('div', this._state.classes.mobileBackdrop);
      }
      if (this.$datepicker.parentNode) {
        this.$datepicker.parentNode.removeChild(this.$datepicker);
      }
      this.$backdrop.appendChild(this.$datepicker);
      if (!this.$backdrop.parentNode) {
        document.body.appendChild(this.$backdrop);
      }
      this.$datepicker.classList.add(this._state.classes.mobile);
      if (typeof next.position === 'function') {
        this.$backdrop.style.display = next.visible ? 'flex' : 'none';
      } else if (next.visible) {
        this.$backdrop.classList.add(next.classes.mobileBackdropOpen);
        this.$backdrop.style.removeProperty('display');
      } else {
        this.$backdrop.classList.remove(next.classes.mobileBackdropOpen);
        this.$backdrop.style.removeProperty('display');
      }
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
  this._commit(setCurrentViewState(this._state, view, params), { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.setViewDate = function (date) {
  this._commit(setViewDateState(this._state, date), { emitSelect: false });
};

/**
 * @param {number|Date|string} date
 * @returns {void}
 */
Lightpickr.prototype.setFocusDate = function (date) {
  this._commit(setFocusDateState(this._state, date), { emitSelect: false });
};

/**
 * @param {string} view
 * @returns {number[]}
 */
Lightpickr.prototype.getViewDates = function (view) {
  return getViewDates(view, this._state);
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
      const backdropStyles = typeof this._state.position === 'function' ? { display: 'none' } : {};
      this.$backdrop = createEl('div', this._state.classes.mobileBackdrop, {}, backdropStyles);
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
    if (typeof this._state.position === 'function') {
      this.$datepicker.style.display = 'none';
    } else {
      this.$datepicker.style.removeProperty('display');
    }
  }
};

/**
 * @private
 * @returns {HTMLElement}
 */
Lightpickr.prototype._getPositionReference = function () {
  const a = this._state.anchor;
  if (typeof a === 'string') {
    const found = document.querySelector(a);
    if (found) {
      return found;
    }
  } else if (a instanceof HTMLElement) {
    return a;
  }
  // Default position reference
  if (isTextInputLike(this.$el)) {
    return this.$el;
  }
  const fields = this.$el.querySelectorAll('input, textarea');
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const hostRoot = field.closest('[' + this._state.attributes.root + ']');
    if (hostRoot && this.$el.contains(hostRoot) && hostRoot !== this.$datepicker) {
      continue;
    }
    return field;
  }
  return this.$el;
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
  const anchorEl = this._getPositionReference();
  if (typeof this._state.position === 'function') {
    const ret = this._state.position({
      $datepicker: this.$datepicker,
      $target: this.$el,
      $anchor: anchorEl,
      $pointer: this.$pointer,
      isViewChange: !!isViewChange,
      done: noop
    });
    this._positionHideCleanup = typeof ret === 'function' ? ret : null;
    return;
  }
  this._positionHideCleanup = null;
  const posStr = typeof this._state.position === 'string' ? this._state.position : lightpickrDefaults.position;
  applyStringPosition(this.$datepicker, anchorEl, this.$pointer, posStr);
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._detachListeners = function () {
  if (this._docDown) {
    document.removeEventListener('mousedown', this._docDown);
    this._docDown = null;
  }
  if (this._docKeydownEsc) {
    document.removeEventListener('keydown', this._docKeydownEsc);
    this._docKeydownEsc = null;
  }
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
 * @param {import('./core/state.js').LightpickrInternalState} next
 * @param {object} opts
 * @param {boolean} opts.emitSelect
 * @param {string} opts.selectTrigger
 * @param {boolean} opts.popoverInitialOpen
 * @returns {void}
 */
Lightpickr.prototype._commit = function (next, opts) {
  const prevState = this._state;
  this._state = next;
  if (next.pendingRangeStart == null) {
    this._pendingRangeHoverTs = null;
  }
  renderContainer(this);
  this._syncThemeMode();
  syncInstanceClasses(this);
  emitEvents(this, prevState, next, opts);
  if (!this._state.inline && !this._state.isMobile && this._state.visible) {
    this._positionPopover(!(opts && opts.popoverInitialOpen));
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._bindThemeSync = function () {
  const self = this;
  this._syncThemeMode();
  if (!window.MutationObserver) {
    return;
  }
  this._themeMutationObserver = new window.MutationObserver(function () {
    self._syncThemeMode();
  });
  const attrs = {
    attributes: true,
    attributeFilter: ['class', 'style'],
  };
  this._themeMutationObserver.observe(document.documentElement, attrs);
  if (document.body) {
    this._themeMutationObserver.observe(document.body, attrs);
  }
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._unbindThemeSync = function () {
  if (!this._themeMutationObserver) {
    return;
  }
  this._themeMutationObserver.disconnect();
  this._themeMutationObserver = null;
};

/**
 * @private
 * @returns {void}
 */
Lightpickr.prototype._syncThemeMode = function () {
  const root = this.$datepicker;
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const darkClass = document.documentElement.classList.contains('dark') || document.body && document.body.classList.contains('dark');

  const documentColorScheme = window.getComputedStyle(document.documentElement).colorScheme || '';
  const hasLightKeyword = documentColorScheme.indexOf('light') >= 0;
  const hasDarkKeyword = documentColorScheme.indexOf('dark') >= 0;

  let shouldUseDark = false;

  if (hasLightKeyword && !hasDarkKeyword) {
    shouldUseDark = false;
  } else if (hasDarkKeyword && !hasLightKeyword) {
    shouldUseDark = true;
  } else if (darkClass) {
    shouldUseDark = true;
  } else if (typeof window.matchMedia === 'function') {
    shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  shouldUseDark ? root.classList.add('lp--dark') : root.classList.remove('lp--dark');
  shouldUseDark ? root.classList.remove('lp--light') : root.classList.add('lp--light');
};

/**
 * @private
 * @param {import('./core/state.js').LightpickrInternalState} state
 * @returns {boolean}
 */
Lightpickr.prototype._shouldCloseAfterSelect = function () {
  if (!this._state.autoClose) {
    return false;
  }
  if (!this._state.range && !this._state.multipleEnabled) {
    return true;
  }
  return this._state.range && !this._state.pendingRangeStart;
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

Object.defineProperties(Lightpickr.prototype, {
  visible: {
    get: function () {
      return this._state.visible;
    }
  },
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
