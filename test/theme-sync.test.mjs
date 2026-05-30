import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

function setupDom(html, prefersDark) {
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    url: 'https://example.test/'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.window.matchMedia = (query) => ({
    matches: prefersDark === true && query.indexOf('dark') >= 0,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    }
  });

  return dom;
}

function hasDarkTheme(picker) {
  return picker.$datepicker.classList.contains('lp--dark');
}

async function flushMutations() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

{
  setupDom('<!doctype html><html><body><div id="host"></div></body></html>', false);
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), false);
  picker.destroy();
}

{
  setupDom('<!doctype html><html class="dark"><body><div id="host"></div></body></html>', false);
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), true);
  picker.destroy();
}

{
  setupDom(
    '<!doctype html><html style="color-scheme: light"><body><div id="host"></div></body></html>',
    true
  );
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), false);
  picker.destroy();
}

{
  setupDom(
    '<!doctype html><html><head><style>html { color-scheme: light dark; }</style></head><body><div id="host"></div></body></html>',
    true
  );
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), false);
  picker.destroy();
}

{
  setupDom(
    '<!doctype html><html><head><style>html { color-scheme: light dark; }</style></head><body><div id="host"></div></body></html>',
    true
  );
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), false);
  document.documentElement.classList.add('dark');
  await flushMutations();
  assert.equal(hasDarkTheme(picker), true);
  document.documentElement.classList.remove('dark');
  await flushMutations();
  assert.equal(hasDarkTheme(picker), false);
  picker.destroy();
}

{
  setupDom('<!doctype html><html data-theme="light"><body><div id="host"></div></body></html>', true);
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), false);
  picker.destroy();
}

{
  setupDom('<!doctype html><html><body><div id="host"></div></body></html>', true);
  const { default: Lightpickr } = await import('../src/index.js');
  const host = document.querySelector('#host');
  const picker = new Lightpickr(host, { inline: true });
  assert.equal(hasDarkTheme(picker), true);
  picker.destroy();
}

console.log('theme-sync OK');
