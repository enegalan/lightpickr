import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

import lightpickrDefaults from '../src/core/defaults.js';
import { ymdToTsStartOfDay } from '../src/utils/time.js';

const dom = new JSDOM('<!doctype html><html><body><input id="d" /><div id="c"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.MouseEvent = dom.window.MouseEvent;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');

assert.equal(typeof Lightpickr, 'function');

const input = document.querySelector('#d');
const showCalls = [];
const hideCalls = [];
const selectCalls = [];
const p = new Lightpickr(input, {
  inline: false,
  onShow(isFinished) {
    showCalls.push(isFinished);
  },
  onHide(isFinished) {
    hideCalls.push(isFinished);
  },
  onSelect(payload) {
    selectCalls.push(payload.trigger);
  }
});
assert.ok(p.$datepicker);
assert.equal(p.visible, false);
p.show();
assert.equal(p.visible, true);
p.hide();
assert.equal(p.visible, false);
assert.deepEqual(showCalls, [false, true]);
assert.deepEqual(hideCalls, [false, true]);
p.selectDate('2026-03-15');
p.unselectDate('2026-03-15');
assert.deepEqual(selectCalls, ['select', 'unselect']);

const container = document.querySelector('#c');
const inline = new Lightpickr(container, { inline: true, multiple: 2 });
assert.equal(inline.visible, true);
assert.equal(inline._state.inline, true);

const rangeHost = document.createElement('div');
document.body.appendChild(rangeHost);
const range = new Lightpickr(rangeHost, {
  inline: true,
  range: true,
  startDate: '2026-04-01',
  selectedDates: [['2026-04-15', '2026-04-16']]
});
const day14 = range.$datepicker.querySelector('[' + range._state.attributes.day + '="' + String(ymdToTsStartOfDay(2026, 3, 14)) + '"]');
assert.ok(day14 instanceof HTMLElement);
day14.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
assert.deepEqual(range._state.selectedDates, []);
assert.equal(range._state.pendingRangeStart, ymdToTsStartOfDay(2026, 3, 14));
const day18 = range.$datepicker.querySelector('[' + range._state.attributes.day + '="' + String(ymdToTsStartOfDay(2026, 3, 18)) + '"]');
assert.ok(day18 instanceof HTMLElement);
day18.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
assert.deepEqual(range._state.selectedDates, [[ymdToTsStartOfDay(2026, 3, 14), ymdToTsStartOfDay(2026, 3, 18)]]);
assert.equal(range._state.pendingRangeStart, null);

range.destroy();
rangeHost.remove();
inline.destroy();
p.destroy();

const onlyTimeHost = document.createElement('div');
document.body.appendChild(onlyTimeHost);
const ot = new Lightpickr(onlyTimeHost, { inline: true, onlyTime: true });
assert.equal(ot._state.onlyTime, true);
assert.equal(ot._state.enableTime, true);
assert.ok(ot.$datepicker.querySelector('.' + lightpickrDefaults.classes.timePanel));
assert.equal(ot.$datepicker.querySelector('.' + lightpickrDefaults.classes.header), null);
ot.destroy();
onlyTimeHost.remove();

console.log('smoke OK');
