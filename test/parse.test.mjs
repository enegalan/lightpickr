import assert from 'node:assert/strict';
import { startOfDayTs, toTimestamp } from '../src/core/utils.js';

assert.equal(toTimestamp('2026-03-15'), startOfDayTs(new Date(2026, 2, 15).getTime()));
assert.equal(toTimestamp('2026-03-15T14:30'), new Date(2026, 2, 15, 14, 30, 0, 0).getTime());
assert.equal(toTimestamp('2026-03-15 14:30:05'), new Date(2026, 2, 15, 14, 30, 5, 0).getTime());
assert.equal(toTimestamp('2026/03/15'), startOfDayTs(new Date(2026, 2, 15).getTime()));
assert.equal(toTimestamp('2026/03/15 09:00'), new Date(2026, 2, 15, 9, 0, 0, 0).getTime());
assert.equal(toTimestamp('2026.03.15'), startOfDayTs(new Date(2026, 2, 15).getTime()));
assert.equal(toTimestamp('2026.03.15T18:45:00'), new Date(2026, 2, 15, 18, 45, 0, 0).getTime());

assert.equal(toTimestamp('2026/3/05'), null);
assert.equal(toTimestamp('20260315'), null);

assert.equal(toTimestamp('2026-13-01'), null);
assert.equal(toTimestamp('2026-02-30'), null);
assert.equal(toTimestamp(''), null);
assert.equal(toTimestamp(null), null);
