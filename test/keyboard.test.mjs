import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body><input id="d" /></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Node = dom.window.Node;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');

const input = document.querySelector('#d');
const p = new Lightpickr(input, {
  inline: false,
  startDate: '2026-03-01',
  selectedDates: ['2026-03-01']
});
p.show();
assert.ok(p.focusDate != null);
const before = p.focusDate;
p.$datepicker.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
assert.notEqual(p.focusDate, before);

document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
assert.equal(p.visible, false);

p.show();
p.$datepicker.dispatchEvent(
  new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true, cancelable: true })
);
assert.equal(p._state.currentView, 'month');
const monthFocusBefore = p.focusDate;
p.$datepicker.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
assert.notEqual(p.focusDate, monthFocusBefore);

const pr = new Lightpickr(document.createElement('div'), {
  inline: true,
  range: true,
  startDate: '2026-03-01'
});
assert.equal(pr.visible, true);
assert.equal(pr._state.focusDate, null);
pr.$datepicker.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
assert.ok(pr._state.focusDate != null);

pr.destroy();
p.destroy();
