import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body><input id="a" /><input id="b" /><input id="c" /></body></html>', {
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

{
  const input = document.querySelector('#a');
  const picker = new Lightpickr(input, {
    inline: true,
    format(date) {
      return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
    }
  });
  picker.selectDate('2026-03-15');
  assert.ok(input.value.includes('March'));
  assert.ok(input.value.includes('2026'));
  picker.destroy();
}

{
  const input = document.querySelector('#b');
  const picker = new Lightpickr(input, {
    inline: true,
    multiple: true,
    format(dates) {
      assert.ok(Array.isArray(dates));
      return dates.map((d) => d.getDate()).join('|');
    }
  });
  picker.selectDate(['2026-04-01', '2026-04-02']);
  assert.equal(input.value, '1|2');
  picker.destroy();
}

{
  const input = document.querySelector('#c');
  const picker = new Lightpickr(input, {
    inline: true,
    range: true,
    format(pair) {
      assert.ok(Array.isArray(pair));
      assert.equal(pair.length, 2);
      return pair[0].getMonth() + 1 + ':' + pair[1].getDate();
    }
  });
  picker.selectDate([['2026-05-10', '2026-05-20']]);
  assert.equal(input.value, '5:20');
  picker.destroy();
}
