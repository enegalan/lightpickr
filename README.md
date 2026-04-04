# Lightpickr

[![npm version](https://img.shields.io/npm/v/lightpickr.svg)](https://www.npmjs.com/package/lightpickr)
[![license](https://img.shields.io/npm/l/lightpickr.svg)](https://www.npmjs.com/package/lightpickr)

**Dependency-free** JavaScript datepicker with a ready-made UI, CSS-variable theming, ranges, optional time, and plugins. ~15KB gzipped.

## Documentation

Full guides, API reference, options, events, accessibility, examples, and theming live in the **documentation site** in this repo: [`docs/`](./docs/). The content source is under [`docs/content/docs/`](./docs/content/docs/).

## Install

```bash
npm install lightpickr
```

## Usage

```js
import Lightpickr from 'lightpickr';
import 'lightpickr/lightpickr.css';

const picker = new Lightpickr('#my-input' [, options]);
```

**CDN:**

```html
<link rel="stylesheet" href="https://unpkg.com/lightpickr/lightpickr.css" />
<script src="https://unpkg.com/lightpickr/dist/lightpickr.js"></script>
<script>
  const picker = new Lightpickr('#my-input' [, options]);
</script>
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
