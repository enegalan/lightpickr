import assert from 'node:assert/strict';
import { formatDate, startOfDayTs } from '../src/utils/time.js';
import en from '../src/locale/en.js';

const tsMarch15 = startOfDayTs(new Date(2026, 2, 15).getTime());

assert.equal(formatDate('YYYY-MM-DD', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), '2026-03-15');
assert.equal(formatDate('d/M/yy', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), '15/3/26');
assert.equal(formatDate('dd-MM-yyyy', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), '15-03-2026');
assert.equal(formatDate('E · EEEE', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), 'Su · Sunday');
assert.equal(formatDate('MMM MMMM', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), 'Mar March');
assert.equal(
  formatDate('yyyy1–yyyy2', startOfDayTs(new Date(2026, 0, 1).getTime()), null, { locale: en, monthsField: 'monthsShort' }),
  '2021–2032'
);
assert.equal(formatDate('T', tsMarch15, null, { locale: en, monthsField: 'monthsShort' }), String(tsMarch15));

const tsWithTime = new Date(2026, 2, 15, 9, 7, 0, 0).getTime();
assert.equal(formatDate('HH:mm', tsWithTime, { hours: 9, minutes: 7 }, { locale: en, monthsField: 'monthsShort' }), '09:07');
