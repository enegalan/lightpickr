import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

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
global.KeyboardEvent = dom.window.KeyboardEvent;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');

/**
 * @param {Record<string, unknown>} opts
 * @returns {{ prev: HTMLButtonElement, next: HTMLButtonElement, picker: import('../src/index.js').default }}
 */
function mountInline(opts) {
  const input = document.createElement('input');
  document.body.appendChild(input);
  const picker = new Lightpickr(input, { inline: true, disableNavWhenOutOfRange: true, ...opts });
  const prev = picker.$datepicker.querySelector('[data-lp-nav="prev"]');
  const next = picker.$datepicker.querySelector('[data-lp-nav="next"]');
  assert.ok(prev instanceof HTMLButtonElement);
  assert.ok(next instanceof HTMLButtonElement);
  return { prev, next, picker };
}

{
  const { prev, next, picker } = mountInline({
    minDate: '2026-03-01',
    maxDate: '2026-03-31',
    startDate: '2026-03-15',
  });
  assert.equal(prev.disabled, true);
  assert.equal(next.disabled, true);
  picker.destroy();
}

{
  const { prev, next, picker } = mountInline({
    minDate: '2026-03-01',
    maxDate: '2026-04-15',
    startDate: '2026-03-15',
  });
  assert.equal(prev.disabled, true);
  assert.equal(next.disabled, false);
  picker.destroy();
}

{
  const { prev, next, picker } = mountInline({
    minDate: '2026-03-01',
    startDate: '2026-06-15',
  });
  assert.equal(prev.disabled, false);
  assert.equal(next.disabled, false);
  picker.destroy();
}

{
  const { prev, next, picker } = mountInline({
    minDate: '2026-03-01',
    maxDate: '2026-03-31',
    startDate: '2026-03-15',
    disableNavWhenOutOfRange: false,
  });
  assert.equal(prev.disabled, false);
  assert.equal(next.disabled, false);
  picker.destroy();
}
