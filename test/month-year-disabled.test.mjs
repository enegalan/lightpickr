import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import lightpickrDefaults from '../src/core/defaults.js';

const dom = new JSDOM('<!doctype html><html><body><input id="d" /></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/',
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.MouseEvent = dom.window.MouseEvent;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');
const { ymdToTsStartOfDay } = await import('../src/utils/time.js');

const monthAttr = lightpickrDefaults.attributes.month;
const yearAttr = lightpickrDefaults.attributes.year;

/**
 * @param {Record<string, unknown>} opts
 * @returns {{ picker: import('../src/index.js').default, input: HTMLInputElement }}
 */
function mountInline(opts) {
  const input = document.createElement('input');
  document.body.appendChild(input);
  return { picker: new Lightpickr(input, { inline: true, ...opts }), input };
}

{
  const { picker, input } = mountInline({
    view: 'month',
    minDate: '2026-03-01',
    maxDate: '2026-04-15',
    startDate: '2026-03-15',
  });

  const jan = picker.$datepicker.querySelector(`[${monthAttr}="${String(ymdToTsStartOfDay(2026, 0, 1))}"]`);
  const mar = picker.$datepicker.querySelector(`[${monthAttr}="${String(ymdToTsStartOfDay(2026, 2, 1))}"]`);
  const may = picker.$datepicker.querySelector(`[${monthAttr}="${String(ymdToTsStartOfDay(2026, 4, 1))}"]`);
  assert.ok(jan instanceof HTMLButtonElement);
  assert.ok(mar instanceof HTMLButtonElement);
  assert.ok(may instanceof HTMLButtonElement);
  assert.equal(jan.disabled, true);
  assert.equal(mar.disabled, false);
  assert.equal(may.disabled, true);

  const viewBefore = picker.currentView;
  jan.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(picker.currentView, viewBefore);

  picker.destroy();
  input.remove();
}

{
  const { picker, input } = mountInline({
    view: 'year',
    minDate: '2026-03-01',
    maxDate: '2026-04-15',
    startDate: '2026-03-15',
  });

  const y2025 = picker.$datepicker.querySelector(`[${yearAttr}="2025"]`);
  const y2026 = picker.$datepicker.querySelector(`[${yearAttr}="2026"]`);
  const y2027 = picker.$datepicker.querySelector(`[${yearAttr}="2027"]`);
  assert.ok(y2025 instanceof HTMLButtonElement);
  assert.ok(y2026 instanceof HTMLButtonElement);
  assert.ok(y2027 instanceof HTMLButtonElement);
  assert.equal(y2025.disabled, true);
  assert.equal(y2026.disabled, false);
  assert.equal(y2027.disabled, true);

  const viewBefore = picker.currentView;
  y2025.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(picker.currentView, viewBefore);

  picker.destroy();
  input.remove();
}

{
  const { picker, input } = mountInline({ allowedViews: ['month', 'year'], format: 'YYYY-MM' });
  assert.equal(picker.currentView, 'month');
  const mar = picker.$datepicker.querySelector(`[${monthAttr}="${String(ymdToTsStartOfDay(2026, 2, 1))}"]`);
  assert.ok(mar instanceof HTMLButtonElement);
  mar.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(input.value, '2026-03');
  picker.destroy();
  input.remove();
}

{
  const { picker, input } = mountInline({ allowedViews: ['year'], view: 'year', format: 'YYYY' });
  const y2026 = picker.$datepicker.querySelector(`[${yearAttr}="2026"]`);
  assert.ok(y2026 instanceof HTMLButtonElement);
  y2026.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(input.value, '2026');
  picker.destroy();
  input.remove();
}
