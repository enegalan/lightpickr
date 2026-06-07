import { clampInt } from '../utils/common.js';
import {
  addMonths,
  daysInMonth,
  firstWeekdayOfMonth,
  tsToYmd,
  yearBlockStart,
  ymdToTsStartOfDay,
} from '../utils/time.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
export function buildMonthViewTimestamps(state) {
  const { y, m } = tsToYmd(state.viewDate);
  const out = [];
  const n = clampInt(state.monthViewCount, 1, Number.MAX_SAFE_INTEGER, 1);
  let ts;
  if (n === 12) {
    ts = ymdToTsStartOfDay(y, 0, 1);
  } else {
    const radius = state.monthViewRadius >= n ? 0 : clampInt(state.monthViewRadius, 0, n - 1, 0);
    ts = addMonths(ymdToTsStartOfDay(y, m, 1), -radius).ts;
  }
  for (let i = 0; i < n; i++) {
    out.push(ts);
    ({ ts } = addMonths(ts, 1));
  }
  return out;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
export function buildYearViewYears(state) {
  const n = clampInt(state.yearViewCount, 1, Number.MAX_SAFE_INTEGER, 1);
  const y = tsToYmd(state.viewDate).y;
  const start = yearBlockStart(y, n, state.yearViewRadius);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(start + i);
  }
  return out;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {'month'|'year'} kind
 * @returns {{ items: number[], offset: number, all: number[], size: number }}
 */
export function viewPage(state, kind) {
  const isMonth = kind === 'month';
  const all = isMonth ? buildMonthViewTimestamps(state) : buildYearViewYears(state);
  const size =
    clampInt(isMonth ? state.monthViewCols : state.yearViewCols, 1, Number.MAX_SAFE_INTEGER, 1) *
    clampInt(isMonth ? state.monthViewRows : state.yearViewRows, 1, Number.MAX_SAFE_INTEGER, 1);
  let offset = 0;
  if (size < all.length) {
    let idx = 0;
    if (isMonth) {
      const { y, m } = tsToYmd(state.viewDate);
      idx = all.findIndex((ts) => {
        const cell = tsToYmd(ts);
        return cell.y === y && cell.m === m;
      });
      if (idx < 0) {
        idx = all.findIndex((ts) => ts >= ymdToTsStartOfDay(y, m, 1));
        if (idx < 0) {
          idx = all.length - 1;
        }
      }
    } else {
      const y = tsToYmd(state.viewDate).y;
      idx = all.indexOf(y);
      if (idx < 0) {
        idx = all.findIndex((yy) => yy >= y);
        if (idx < 0) {
          idx = all.length - 1;
        }
      }
    }
    offset = Math.floor(idx / size) * size;
  }
  return { all, size, offset, items: size >= all.length ? all : all.slice(offset, offset + size) };
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number}
 */
export function buildDayMonthRowCount(state) {
  const { y, m } = tsToYmd(state.viewDate);
  const dim = daysInMonth(y, m);
  const leading = (firstWeekdayOfMonth(y, m) - (state.firstDay % 7) + 7) % 7;
  const cols = 7;
  if (state.showOtherMonths) {
    const totalCells = Math.max(6, Math.ceil((leading + dim) / cols)) * cols;
    return totalCells / cols;
  }
  return Math.floor((leading + dim - 1) / cols) + 1;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {{ ts: number, outside: boolean, col: number, row: number }[]}
 */
export function buildDayMonthCells(state) {
  const { y, m } = tsToYmd(state.viewDate);
  const dim = daysInMonth(y, m);
  const leading = (firstWeekdayOfMonth(y, m) - (state.firstDay % 7) + 7) % 7;
  const cols = 7;

  const prevY = m - 1 < 0 ? y - 1 : y;
  const prevM = m - 1 < 0 ? 11 : m - 1;
  const prevDim = daysInMonth(prevY, prevM);

  let dayNum = 1;
  let nextMonthDay = 1;
  const totalCells = Math.max(6, Math.ceil((leading + dim) / cols)) * cols;

  const out = [];
  for (let cell = 0; cell < totalCells; cell++) {
    let outside = false;
    let year, month, day;
    if (cell < leading) {
      outside = true;
      year = prevY;
      month = prevM;
      day = prevDim - (leading - cell - 1);
    } else if (dayNum <= dim) {
      year = y;
      month = m;
      day = dayNum++;
    } else {
      outside = true;
      year = m + 1 > 11 ? y + 1 : y;
      month = m + 1 > 11 ? 0 : m + 1;
      day = nextMonthDay++;
    }
    if (outside && !state.showOtherMonths) {
      continue;
    }
    out.push({
      ts: ymdToTsStartOfDay(year, month, day),
      outside,
      col: cell % cols,
      row: Math.floor(cell / cols),
    });
  }
  return out;
}
