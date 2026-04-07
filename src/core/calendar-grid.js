import { daysInMonth, firstWeekdayOfMonth, tsToYmd, ymdToTsStartOfDay } from '../utils/time.js';

/**
 * @param {number} viewYear
 * @param {number} viewMonth
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
export function buildMonthViewTimestamps(state) {
  const { y } = tsToYmd(state.viewDate);
  const out = [];
  const n = Math.max(1, Math.floor(state.monthViewCount));
  for (let mm = 0; mm < n; mm++) {
    out.push(ymdToTsStartOfDay(y, mm, 1));
  }
  return out;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {number[]}
 */
export function buildYearViewYears(state) {
  const n = Math.max(1, Math.floor(state.yearViewCount));
  const y = tsToYmd(state.viewDate).y;
  const start = n === 12 ? Math.floor(y / 12) * 12 : y - state.yearViewRadius;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(start + i);
  }
  return out;
}

/**
 * @param {number} y
 * @param {number} m
 * @param {import('./state.js').LightpickrInternalState} state
 * @returns {{ ts: number, outside: boolean }[]}
 */
export function buildDayMonthCells(state) {
  const { y, m } = tsToYmd(state.viewDate);
  const dim = daysInMonth(y, m);
  const leading = (firstWeekdayOfMonth(y, m) - (state.firstDay % 7) + 7) % 7;

  const prevY = m - 1 < 0 ? y - 1 : y;
  const prevM = m - 1 < 0 ? 11 : m - 1;
  const prevDim = daysInMonth(prevY, prevM);

  let dayNum = 1;
  let nextMonthDay = 1;
  const totalCells = Math.max(6, Math.ceil((leading + dim) / 7)) * 7;

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
    out.push({ ts: ymdToTsStartOfDay(year, month, day), outside });
  }
  return out;
}
