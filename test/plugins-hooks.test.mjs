import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body><input id="p" /></body></html>', {
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

const input = document.querySelector('#p');
const hooks = { onInit: 0, onRender: 0, onSelect: 0, onDestroy: 0 };

const p = new Lightpickr(input, { inline: true });
p.use(() => ({
  onInit() {
    hooks.onInit += 1;
  },
  onRender() {
    hooks.onRender += 1;
  },
  onSelect() {
    hooks.onSelect += 1;
  },
  onDestroy() {
    hooks.onDestroy += 1;
  }
}));

assert.equal(hooks.onInit, 1);
assert.equal(hooks.onRender, 0);

p.selectDate('2026-06-01');
assert.ok(hooks.onRender >= 1);
assert.ok(hooks.onSelect >= 1);

p.destroy();
assert.equal(hooks.onDestroy, 1);
