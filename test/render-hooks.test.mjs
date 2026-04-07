import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

import lightpickrDefaults from '../src/core/defaults.js';

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test/'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.getComputedStyle = dom.window.getComputedStyle;

const { default: Lightpickr } = await import('../src/index.js');

const host = document.querySelector('#host');
const headerClass = lightpickrDefaults.classes.header;
const navAttr = lightpickrDefaults.attributes.nav;
const monthAttr = lightpickrDefaults.attributes.month;

function findHeaderRoot(picker) {
  return picker.$datepicker.querySelector('.' + headerClass);
}

{
  let ctxSeen = null;
  const p = new Lightpickr(host, {
    inline: true,
    render: {
      header(ctx) {
        ctxSeen = ctx;
        const el = document.createElement('div');
        el.setAttribute('data-test', 'custom-header');
        el.textContent = 'from-header';
        return el;
      }
    }
  });
  const headerRoot = findHeaderRoot(p);
  assert.ok(headerRoot);
  const custom = headerRoot.querySelector('[data-test="custom-header"]');
  assert.ok(custom);
  assert.equal(custom.textContent, 'from-header');
  assert.ok(ctxSeen && typeof ctxSeen.date === 'number');
  assert.equal(ctxSeen.instance, p);
  p.destroy();
}

{
  const p = new Lightpickr(host, {
    inline: true,
    render: {
      header() {
        return null;
      }
    }
  });
  const root = findHeaderRoot(p);
  assert.ok(root.querySelector('[' + navAttr + '="prev"]'));
  assert.ok(root.querySelector('[' + navAttr + '="next"]'));
  p.destroy();
}

{
  const p = new Lightpickr(host, {
    inline: true,
    view: 'month',
    render: {
      header(ctx) {
        assert.equal(ctx.state.currentView, 'month');
        const el = document.createElement('div');
        el.setAttribute('data-test', 'month-header');
        return el;
      }
    }
  });
  const custom = findHeaderRoot(p).querySelector('[data-test="month-header"]');
  assert.ok(custom);
  p.destroy();
}

{
  const p = new Lightpickr(host, {
    inline: true,
    view: 'year',
    render: {
      header(ctx) {
        assert.equal(ctx.state.currentView, 'year');
        const el = document.createElement('div');
        el.setAttribute('data-test', 'year-header');
        return el;
      }
    }
  });
  const custom = findHeaderRoot(p).querySelector('[data-test="year-header"]');
  assert.ok(custom);
  p.destroy();
}

{
  const p = new Lightpickr(host, {
    inline: true,
    view: 'month',
    startDate: '2026-06-01',
    render: {
      cell(ctx) {
        if (ctx.state.currentView !== 'month' || new Date(ctx.date).getMonth() !== 0) {
          return;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute(monthAttr, '0');
        b.setAttribute('role', 'gridcell');
        b.setAttribute('tabindex', '-1');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('aria-label', 'January');
        b.className = lightpickrDefaults.classes.cell + ' cell-hook-jan';
        b.textContent = 'Jan';
        return b;
      }
    }
  });
  const janBtn = p.$datepicker.querySelector('[' + monthAttr + '="0"]');
  assert.ok(janBtn && janBtn.classList.contains('cell-hook-jan'));
  p.destroy();
}

console.log('render-hooks OK');
