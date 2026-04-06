import lightpickrDefaults from './defaults.js';

/**
 * @param {HTMLElement} popover
 * @param {HTMLElement} target
 * @param {HTMLElement|null|undefined} pointer
 * @param {string|undefined} positionStr
 * @returns {void}
 */
export function applyStringPosition(popover, target, pointer, positionStr) {
  const [main, sec] = _parsePositionString(positionStr);
  const s = getComputedStyle(popover);
  const gx = parseFloat(s.getPropertyValue(lightpickrDefaults.properties.popoverGapX)) || 0;
  const gy = parseFloat(s.getPropertyValue(lightpickrDefaults.properties.popoverGapY)) || 0;
  const margin = parseFloat(s.getPropertyValue(lightpickrDefaults.properties.popoverViewportMargin)) || 8;
  const r = target.getBoundingClientRect();
  const w = popover.offsetWidth;
  const h = popover.offsetHeight;
  let { top, left } = _computePopoverCoords(r, w, h, main, sec, gx, gy);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.min(Math.max(margin, left), Math.max(margin, vw - w - margin));
  top = Math.min(Math.max(margin, top), Math.max(margin, vh - h - margin));
  popover.style.top = top + 'px';
  popover.style.left = left + 'px';
  popover.style.transform = '';
  _placePopoverPointer(popover, target, pointer, main, sec, s);
}

/**
 * @private
 * @param {string} raw
 * @returns {[string, string]}
 */
function _parsePositionString(raw) {
  const parts = String(raw || lightpickrDefaults.position)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return lightpickrDefaults.position.split(' ');
  }
  const main = parts[0];
  let sec = parts[1];
  if (!sec) {
    sec = main === 'top' || main === 'bottom' ? 'left' : 'top';
  }
  return [main, sec];
}

/**
 * @private
 * @param {DOMRect} r
 * @param {number} w
 * @param {string} sec
 * @param {number} gx
 * @returns {number}
 */
function _popoverLeftForBottomOrTop(r, w, sec, gx) {
  if (sec === 'right') {
    return r.right - w - gx;
  }
  if (sec === 'center') {
    return r.left + (r.width - w) / 2;
  }
  return r.left + gx;
}

/**
 * @private
 * @param {DOMRect} r
 * @param {number} h
 * @param {string} sec
 * @param {number} gy
 * @returns {number}
 */
function _popoverTopForLeftOrRight(r, h, sec, gy) {
  if (sec === 'bottom') {
    return r.bottom - h - gy;
  }
  if (sec === 'center') {
    return r.top + (r.height - h) / 2;
  }
  return r.top + gy;
}

/**
 * @private
 * @param {DOMRect} r
 * @param {number} w
 * @param {number} h
 * @param {string} main
 * @param {string} sec
 * @param {number} gx
 * @param {number} gy
 * @returns {{ top: number, left: number }}
 */
function _computePopoverCoords(r, w, h, main, sec, gx, gy) {
  let top = 0;
  let left = 0;
  if (main === 'bottom') {
    top = r.bottom + gy;
    left = _popoverLeftForBottomOrTop(r, w, sec, gx);
  } else if (main === 'top') {
    top = r.top - h - gy;
    left = _popoverLeftForBottomOrTop(r, w, sec, gx);
  } else if (main === 'right') {
    left = r.right + gx;
    top = _popoverTopForLeftOrRight(r, h, sec, gy);
  } else if (main === 'left') {
    left = r.left - w - gx;
    top = _popoverTopForLeftOrRight(r, h, sec, gy);
  } else {
    return _computePopoverCoords(r, w, h, 'bottom', 'left', gx, gy);
  }
  return { top, left };
}

/**
 * @private
 * @param {HTMLElement} popover
 * @param {HTMLElement} target
 * @param {HTMLElement|null|undefined} pointer
 * @param {string} main
 * @param {string} sec
 * @param {CSSStyleDeclaration} popoverStyle
 * @returns {void}
 */
function _placePopoverPointer(popover, target, pointer, main, sec, popoverStyle) {
  if (!(pointer instanceof HTMLElement)) {
    return;
  }
  if (popoverStyle.getPropertyValue(lightpickrDefaults.properties.pointerVisible).trim() !== '1') {
    pointer.style.display = 'none';
    return;
  }
  pointer.setAttribute(lightpickrDefaults.attributes.pointerMain, main);
  pointer.setAttribute(lightpickrDefaults.attributes.pointerSec, sec);

  const s = getComputedStyle(pointer);
  const ptrSize = parseFloat(s.getPropertyValue(lightpickrDefaults.properties.pointerSize)) || 10;
  const pad = 8;
  const tr = target.getBoundingClientRect();
  const pr = popover.getBoundingClientRect();

  if (main === 'bottom' || main === 'top') {
    if (sec === 'center') {
      const cx = tr.left + tr.width / 2 - pr.left - ptrSize / 2;
      const maxL = Math.max(pad, pr.width - ptrSize - pad);
      pointer.style.left = Math.min(Math.max(pad, cx), maxL) + 'px';
    }
  } else if (main === 'left' || main === 'right') {
    if (sec === 'center') {
      const cy = tr.top + tr.height / 2 - pr.top - ptrSize / 2;
      const maxT = Math.max(pad, pr.height - ptrSize - pad);
      pointer.style.top = Math.min(Math.max(pad, cy), maxT) + 'px';
    }
  }
}
