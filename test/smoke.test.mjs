import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

import lightpickrDefaults from '../src/core/defaults.js';

const dom = new JSDOM('<!doctype html><html><body><input id="d" /><div id="c"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Node = dom.window.Node;
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
