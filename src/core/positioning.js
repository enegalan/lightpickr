/**
 * @param {string} raw
 * @returns {[string, string]}
 */
export function parsePositionString(raw) {
  const parts = String(raw || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return ['bottom', 'left'];
  }
  const main = parts[0];
  let sec = parts[1];
  if (!sec) {
    sec = main === 'top' || main === 'bottom' ? 'left' : 'top';
  }
  return [main, sec];
}

/**
 * @param {HTMLElement} el
 * @returns {{ gx: number, gy: number }}
 */
export function readPopoverGap(el) {
  const s = getComputedStyle(el);
  const gx = parseFloat(s.getPropertyValue('--lp-popover-gap-x')) || 0;
  const gy = parseFloat(s.getPropertyValue('--lp-popover-gap-y')) || 0;
  return { gx, gy };
}

/**
 * @param {DOMRect} r
 * @param {number} w
 * @param {number} h
 * @param {string} main
 * @param {string} sec
 * @param {number} gx
 * @param {number} gy
 * @returns {{ top: number, left: number }}
 */
export function computePopoverCoords(r, w, h, main, sec, gx, gy) {
  let top = 0;
  let left = 0;
  if (main === 'bottom') {
    top = r.bottom + gy;
    if (sec === 'right') {
      left = r.right - w - gx;
    } else if (sec === 'center') {
      left = r.left + (r.width - w) / 2;
    } else {
      left = r.left + gx;
    }
  } else if (main === 'top') {
    top = r.top - h - gy;
    if (sec === 'right') {
      left = r.right - w - gx;
    } else if (sec === 'center') {
      left = r.left + (r.width - w) / 2;
    } else {
      left = r.left + gx;
    }
  } else if (main === 'right') {
    left = r.right + gx;
    if (sec === 'bottom') {
      top = r.bottom - h - gy;
    } else if (sec === 'center') {
      top = r.top + (r.height - h) / 2;
    } else {
      top = r.top + gy;
    }
  } else if (main === 'left') {
    left = r.left - w - gx;
    if (sec === 'bottom') {
      top = r.bottom - h - gy;
    } else if (sec === 'center') {
      top = r.top + (r.height - h) / 2;
    } else {
      top = r.top + gy;
    }
  } else {
    return computePopoverCoords(r, w, h, 'bottom', 'left', gx, gy);
  }
  return { top, left };
}

/**
 * @param {number} left
 * @param {number} top
 * @param {number} w
 * @param {number} h
 * @param {number} margin
 * @returns {{ top: number, left: number }}
 */
export function clampToViewport(left, top, w, h, margin) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minL = margin;
  const minT = margin;
  const maxL = Math.max(margin, vw - w - margin);
  const maxT = Math.max(margin, vh - h - margin);
  return {
    left: Math.min(Math.max(minL, left), maxL),
    top: Math.min(Math.max(minT, top), maxT)
  };
}

/**
 * @param {HTMLElement} popover
 * @param {HTMLElement} target
 * @param {HTMLElement|null|undefined} pointer
 * @param {string|undefined} positionStr
 */
export function applyStringPosition(popover, target, pointer, positionStr) {
  const [main, sec] = parsePositionString(positionStr || 'bottom left');
  const { gx, gy } = readPopoverGap(popover);
  const s = getComputedStyle(popover);
  const margin = parseFloat(s.getPropertyValue('--lp-popover-viewport-margin')) || 8;
  const r = target.getBoundingClientRect();
  const w = popover.offsetWidth;
  const h = popover.offsetHeight;
  let { top, left } = computePopoverCoords(r, w, h, main, sec, gx, gy);
  const c = clampToViewport(left, top, w, h, margin);
  popover.style.top = c.top + 'px';
  popover.style.left = c.left + 'px';
  popover.style.transform = '';
  placePopoverPointer(popover, target, pointer, main);
}

/**
 * @param {HTMLElement} popover
 * @param {HTMLElement} target
 * @param {HTMLElement|null|undefined} pointer
 * @param {string} main
 */
function placePopoverPointer(popover, target, pointer, main) {
  if (!(pointer instanceof HTMLElement)) {
    return;
  }
  const vis = getComputedStyle(popover).getPropertyValue('--lp-pointer-visible').trim();
  if (vis !== '1' || main !== 'bottom') {
    pointer.style.display = 'none';
    return;
  }
  pointer.style.display = '';
  const tr = target.getBoundingClientRect();
  const pr = popover.getBoundingClientRect();
  const ptrW = pointer.offsetWidth || 12;
  const ptrH = pointer.offsetHeight || 8;
  const cx = tr.left + tr.width / 2 - pr.left;
  pointer.style.left = Math.min(Math.max(8, cx - ptrW / 2), pr.width - ptrW - 8) + 'px';
  pointer.style.top = -ptrH + 'px';
}
