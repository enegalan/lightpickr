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
const { viewPage } = await import('../src/core/calendar-grid.js');
const { buildDefaultHeader } = await import('../src/render/header.js');
const { navigateViewPage } = await import('../src/core/navigation.js');
const { createStateFromOptions } = await import('../src/core/state.js');
const { tsToYmd } = await import('../src/utils/time.js');

const input = document.querySelector('#x');
const p = new Lightpickr(input, { inline: false });
assert.equal(p._state.dayViewCols, 7);
p.update({ dayViewCols: 4 });
assert.equal(p._state.dayViewCols, 4);
p.update({ monthViewCount: 12, monthViewRows: 2, monthViewCols: 4 });
assert.equal(p._state.monthViewRows, 2);
p.update({ monthViewCount: 8, monthViewRadius: 1, startDate: '2026-06-15' });
const gridOpts = {
  monthViewRows: 2,
  monthViewCols: 2,
  monthViewCount: 12,
  yearViewRows: 2,
  yearViewCols: 2,
  yearViewCount: 12,
};
const monthPage = createStateFromOptions({ ...gridOpts, view: 'month', startDate: '2026-01-15' });
assert.deepEqual(
  viewPage(monthPage, 'month').items.map((ts) => tsToYmd(ts).m),
  [0, 1, 2, 3],
);
assert.deepEqual(
  viewPage({ ...monthPage, viewDate: navigateViewPage(monthPage, 1) }, 'month').items.map((ts) => tsToYmd(ts).m),
  [4, 5, 6, 7],
);
const decPage = createStateFromOptions({ ...gridOpts, view: 'month', startDate: '2026-12-15' });
assert.deepEqual(
  viewPage(decPage, 'month').items.map((ts) => tsToYmd(ts).m),
  [8, 9, 10, 11],
);
const dayHost = document.createElement('div');
document.body.appendChild(dayHost);
const fromDay = new Lightpickr(dayHost, { inline: true, selectedDates: ['2026-12-15'], ...gridOpts });
fromDay.up();
assert.deepEqual(
  viewPage(fromDay._state, 'month').items.map((ts) => tsToYmd(ts).m),
  [8, 9, 10, 11],
);
fromDay.destroy();

const indexHost = document.createElement('div');
document.body.appendChild(indexHost);
const indexCfg = new Lightpickr(indexHost, {
  inline: true,
  monthViewRows: 2,
  monthViewCols: 3,
  monthViewCount: 5,
});
indexCfg.selectDate('2026-06-18');
indexCfg.up();
assert.deepEqual(
  viewPage(indexCfg._state, 'month').items.map((ts) => tsToYmd(ts).m),
  [5, 6, 7, 8, 9],
);
indexCfg.destroy();

const crossYearHost = document.createElement('div');
document.body.appendChild(crossYearHost);
const crossYear = new Lightpickr(crossYearHost, {
  inline: true,
  view: 'month',
  startDate: '2025-12-15',
  monthViewRows: 2,
  monthViewCols: 2,
  monthViewCount: 4,
  monthViewRadius: 1,
  navTitles: { month: 'yyyy', year: 'yyyy1 - yyyy2' },
});
const crossTitle = buildDefaultHeader(crossYear, 'month', true).querySelector('.lp-title-btn');
assert.equal(crossTitle.innerHTML, '2025 - 2026');
crossYear.destroy();

const singleYearHost = document.createElement('div');
document.body.appendChild(singleYearHost);
const singleYear = new Lightpickr(singleYearHost, {
  inline: true,
  view: 'month',
  startDate: '2026-06-15',
  ...gridOpts,
  navTitles: { month: 'yyyy', year: 'yyyy1 - yyyy2' },
});
const singleTitle = buildDefaultHeader(singleYear, 'month', true).querySelector('.lp-title-btn');
assert.equal(singleTitle.innerHTML, '2026');
singleYear.destroy();

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
