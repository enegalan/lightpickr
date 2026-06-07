import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><input id="x" /></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/',
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Node = dom.window.Node;
global.MouseEvent = dom.window.MouseEvent;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');

const input = document.querySelector('#x');
const p = new Lightpickr(input, { inline: false });
assert.equal(p._state.dayViewCols, 7);
p.update({ dayViewCols: 4 });
assert.equal(p._state.dayViewCols, 4);
assert.equal(Object.prototype.hasOwnProperty.call(p._state, 'numberOfMonths'), false);
p.update({ minDate: '2026-01-01', format: 'YYYY-MM-DD' });
assert.equal(Object.prototype.hasOwnProperty.call(p._state, 'numberOfMonths'), false);

const inlineHost = document.createElement('div');
document.body.appendChild(inlineHost);
const inline = new Lightpickr(inlineHost, { inline: true });

inline.disableDate('2026-06-15');
assert.equal(inline.disabledDates.length, 1);
inline.enableDate('2026-06-15');
assert.equal(inline.disabledDates.length, 0);

inline.disableDate('2026-06-15');
inline.update({});
assert.equal(inline.disabledDates.length, 1);

inline.update({ weekdaysField: 'weekdaysLong' });
assert.equal(inline._state.weekdaysField, 'weekdaysLong');

inline.destroy();

const timeHost = document.createElement('div');
document.body.appendChild(timeHost);
const withTime = new Lightpickr(timeHost, { inline: true, enableTime: true });
withTime.setCurrentView('month');
assert.equal(withTime.currentView, 'month');
withTime.destroy();

p.destroy();
