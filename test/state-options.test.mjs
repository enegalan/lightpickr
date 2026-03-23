import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body><input id="x" /></body></html>', {
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

const input = document.querySelector('#x');
const p = new Lightpickr(input, { inline: false });
assert.equal(Object.prototype.hasOwnProperty.call(p._state, 'numberOfMonths'), false);
p.update({ minDate: '2026-01-01', format: 'YYYY-MM-DD' });
assert.equal(Object.prototype.hasOwnProperty.call(p._state, 'numberOfMonths'), false);
p.destroy();
