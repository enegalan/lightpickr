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
const { tsToYmd, ymdToTsStartOfDay } = await import('../src/utils/time.js');

const input = document.querySelector('#d');
const picker = new Lightpickr(input, {
  inline: true,
  startDate: '2026-03-01',
  selectedDates: ['2026-03-01'],
  selectOtherMonths: false,
  moveToOtherMonthsOnSelect: true,
});
picker.setFocusDate('2026-03-01');

const feb28 = ymdToTsStartOfDay(2026, 1, 28);
const outsideCell = picker.$datepicker.querySelector(`[data-lp-day="${String(feb28)}"]`);
assert.ok(outsideCell instanceof HTMLButtonElement);
assert.equal(outsideCell.disabled, false);
assert.equal(outsideCell.getAttribute('aria-disabled'), 'true');

const selectedBefore = picker.selectedDates.slice();
outsideCell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
assert.deepEqual(picker.selectedDates, selectedBefore);
assert.equal(tsToYmd(picker.viewDate).m, 1);
assert.equal(tsToYmd(picker.focusDate).m, 1);

picker.setFocusDate('2026-03-01');
picker.$datepicker.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
assert.equal(tsToYmd(picker.focusDate).m, 1);
assert.equal(tsToYmd(picker.viewDate).m, 1);

picker.destroy();
