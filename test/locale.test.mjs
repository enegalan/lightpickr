import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

import { defaultMonthNames, defaultWeekdayNames, DEFAULT_TRANSLATIONS, getTranslations } from '../src/utils/locale.js';
import lightpickrDefaults from '../src/core/defaults.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localeDir = join(__dirname, '../src/locale');
const localeCodes = readdirSync(localeDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => name.replace(/\.js$/, ''))
  .sort();

const localeBundles = await Promise.all(
  localeCodes.map(async (code) => {
    const mod = await import(`../src/locale/${code}.js`);
    return { code, locale: mod.default };
  })
);

/** Same order as `_buildDayGridHeadRow` with default `firstDay` 1 (Monday). */
function weekdayHeadLabels(weekdaysShort, firstDay) {
  const fd = firstDay % 7;
  const labels = [];
  for (let i = 0; i < 7; i++) {
    labels.push(weekdaysShort[(fd + i) % 7]);
  }
  return labels;
}

const DEFAULT_FIRST_DAY = 1;

for (const { code, locale } of localeBundles) {
  test(`locale/${code}.js: arrays and utils`, () => {
    assert.equal(locale.monthsShort.length, 12);
    assert.equal(locale.monthsLong.length, 12);
    assert.equal(locale.weekdaysShort.length, 7);
    assert.equal(locale.weekdaysLong.length, 7);

    assert.equal(defaultMonthNames(locale, 'monthsLong')[0], locale.monthsLong[0]);
    assert.equal(defaultMonthNames(locale, 'monthsShort')[0], locale.monthsShort[0]);
    assert.equal(defaultWeekdayNames(locale, 'weekdaysShort')[0], locale.weekdaysShort[0]);
    assert.equal(defaultWeekdayNames(locale, 'weekdaysShort')[6], locale.weekdaysShort[6]);

    const ui = getTranslations(locale);
    assert.equal(ui.btnToday, locale.btnToday);
    assert.equal(ui.ariaDayGrid, locale.ariaDayGrid);
  });
}

test('getTranslations: default and partial override', () => {
  assert.equal(getTranslations('default').btnToday, DEFAULT_TRANSLATIONS.btnToday);
  assert.equal(getTranslations({ btnToday: 'Hoy' }).btnToday, 'Hoy');
  assert.equal(getTranslations({ btnToday: 'Hoy' }).btnClear, DEFAULT_TRANSLATIONS.btnClear);
});

test('defaultMonthNames/defaultWeekdayNames: string locale uses built-in bundle', () => {
  assert.equal(defaultMonthNames('default', 'monthsShort')[0], lightpickrDefaults.locale.monthsShort[0]);
  assert.equal(defaultWeekdayNames(null, 'weekdaysShort')[0], lightpickrDefaults.locale.weekdaysShort[0]);
});

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

for (const { code, locale } of localeBundles) {
  test(`locale/${code}.js: Lightpickr DOM`, () => {
    const input = document.querySelector('#x');
    const picker = new Lightpickr(input, { inline: true, locale });
    const headCells = picker.$datepicker.querySelectorAll('.' + lightpickrDefaults.classes.row + '--head .' + lightpickrDefaults.classes.headCell);
    assert.equal(headCells.length, 7);
    const expected = weekdayHeadLabels(locale.weekdaysShort, DEFAULT_FIRST_DAY);
    for (let i = 0; i < 7; i++) {
      assert.equal(headCells[i].textContent, expected[i]);
    }
    const dayGrid = picker.$datepicker.querySelector('.' + lightpickrDefaults.classes.grid + '[role="grid"]');
    assert.ok(dayGrid);
    assert.equal(dayGrid.getAttribute('aria-label'), locale.ariaDayGrid);
    picker.destroy();
  });
}

test('footer: custom btn labels', () => {
  const input = document.querySelector('#x');
  const pickerFooter = new Lightpickr(input, {
    inline: true,
    locale: { btnToday: 'Hoy', btnClear: 'Vac' },
    buttons: ['today', 'clear']
  });
  const footerBtns = pickerFooter.$datepicker.querySelectorAll('[' + lightpickrDefaults.attributes.footerAction + ']');
  assert.equal(footerBtns[0].textContent, 'Hoy');
  assert.equal(footerBtns[1].textContent, 'Vac');
  pickerFooter.destroy();
});
