import { daysInMonth, firstWeekdayOfMonth, ymdToTsStartOfDay } from '../utils/time.js';

/** @type {number} */
export const YEAR_GRID_RADIUS = 5;

/** @type {number} */
export const YEAR_GRID_COUNT = 12;

/**
 * @param {number} centerYear
 * @returns {number}
 */
export function yearBlockStartYear(centerYear) {
  return centerYear - YEAR_GRID_RADIUS;
}

/**
 * @param {number} centerYear
 * @returns {number[]}
 */
export function yearGridYearValues(centerYear) {
  const start = yearBlockStartYear(centerYear);
  const out = [];
  for (let i = 0; i < YEAR_GRID_COUNT; i++) {
    out.push(start + i);
  }
  return out;
}

/**
 * @param {number} y
 * @param {number} m 0-11
 * @param {number} firstDayOfWeek
 * @returns {{ ts: number, outside: boolean }[]}
 */
export function buildDayMonthCells(y, m, firstDayOfWeek) {
  const dim = daysInMonth(y, m);
  const leading = (firstWeekdayOfMonth(y, m) - (firstDayOfWeek % 7) + 7) % 7;

  const prevY = m - 1 < 0 ? y - 1 : y;
  const prevM = m - 1 < 0 ? 11 : m - 1;
  const prevDim = daysInMonth(prevY, prevM);

  let dayNum = 1;
  let nextMonthDay = 1;
  const totalCells = Math.max(6, Math.ceil((leading + dim) / 7)) * 7;

  const out = [];
  for (let cell = 0; cell < totalCells; cell++) {
    let ts;
    let outside = false;
    if (cell < leading) {
      const d = prevDim - (leading - cell - 1);
      ts = ymdToTsStartOfDay(prevY, prevM, d);
      outside = true;
    } else if (dayNum <= dim) {
      ts = ymdToTsStartOfDay(y, m, dayNum++);
    } else {
      const nm = m + 1 > 11 ? 0 : m + 1;
      const ny = m + 1 > 11 ? y + 1 : y;
      ts = ymdToTsStartOfDay(ny, nm, nextMonthDay++);
      outside = true;
    }
    out.push({ ts, outside });
  }
  return out;
}
