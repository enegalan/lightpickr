import assert from 'node:assert/strict';
import { selectDate } from '../src/core/selection.js';
import { createStateFromOptions } from '../src/core/state.js';
import { startOfDayTs } from '../src/utils/time.js';

const a = startOfDayTs(new Date('2026-01-10'));
const b = startOfDayTs(new Date('2026-01-20'));
const c = startOfDayTs(new Date('2026-02-01'));

const base = createStateFromOptions(
  {
    range: true,
    selectedDates: [[a, b]],
    format: 'YYYY-MM-DD'
  },
  null
);

const first = selectDate(base, c);
assert.equal(first.changed, true);
assert.deepEqual(first.state.selectedDates, []);
assert.equal(first.state.pendingRangeStart, c);

const second = selectDate(first.state, b);
assert.equal(second.changed, true);
assert.deepEqual(second.state.selectedDates, [[b, c]]);
assert.equal(second.state.pendingRangeStart, null);

const march10 = startOfDayTs(new Date('2026-03-10'));
const march20 = startOfDayTs(new Date('2026-03-20'));
const march5 = startOfDayTs(new Date('2026-03-05'));

const stMin = createStateFromOptions(
  {
    range: true,
    view: 'day',
    selectedDates: [[march10, march20]],
    minDate: '2026-03-15',
    viewDate: '2026-03-01',
    format: 'YYYY-MM-DD'
  },
  null
);
const clrMin = selectDate(stMin, march5);
assert.equal(clrMin.changed, false);
assert.deepEqual(clrMin.state.selectedDates, stMin.selectedDates);
assert.equal(clrMin.state.pendingRangeStart, stMin.pendingRangeStart);

const feb26 = startOfDayTs(new Date('2026-02-26'));
const stOut = createStateFromOptions(
  {
    range: true,
    view: 'day',
    selectOtherMonths: false,
    selectedDates: [[march10, march20]],
    viewDate: '2026-03-01',
    format: 'YYYY-MM-DD'
  },
  null
);
const clrOut = selectDate(stOut, feb26);
assert.equal(clrOut.changed, true);
assert.deepEqual(clrOut.state.selectedDates, []);
assert.equal(clrOut.state.pendingRangeStart, feb26);

const apr14 = startOfDayTs(new Date('2026-04-14'));
const apr15 = startOfDayTs(new Date('2026-04-15'));
const apr16 = startOfDayTs(new Date('2026-04-16'));
const stSimple = createStateFromOptions(
  {
    range: true,
    selectedDates: [[apr15, apr16]],
    viewDate: '2026-04-01',
    format: 'YYYY-MM-DD'
  },
  null
);
const resetSimple = selectDate(stSimple, apr14);
assert.equal(resetSimple.changed, true);
assert.deepEqual(resetSimple.state.selectedDates, []);
assert.equal(resetSimple.state.pendingRangeStart, apr14);
