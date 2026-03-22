# Lightpickr

Dependency-free JavaScript datepicker with default UI, CSS-variable theming, render callbacks, range and time support, and optional plugins.

## Install / build

```bash
npm install
npm run build
```

Outputs:

- `dist/lightpickr.js` — single browser bundle (IIFE), global `Lightpickr`
- `dist/lightpickr.css` — base theme (all layout and colors via CSS custom properties)

```html
<link rel="stylesheet" href="dist/lightpickr.css" />
<script src="dist/lightpickr.js"></script>
<script>
  const picker = new Lightpickr('#my-input', { enableTime: true });
</script>
```

### Size budget

`npm run size` reports gzipped size of `dist/lightpickr.js`. The **stretch goal** is 5KB gzip; the current MVP build is smaller than the **7KB gzip** gate enforced by the script. Further trimming (fewer views, slimmer defaults, or optional modules) can move toward 5KB.

## Mounting

- Target is an `<input>` → popover (unless `inline: true`). The calendar is appended to `document.body` and positioned with `position: fixed` relative to the target (see **`position`** below). The root keeps the `lp--popover` class on every render so `top` / `left` from JS are not ignored (`position` would otherwise stay `static`).
- Target is a non-input element → inline calendar inside that element.

## Selection model

**Single-date mode** is always the baseline when neither multiple nor range is active. It is not toggled via a separate option.

### `multiple`

- `false` / omitted / `0` / `1` → multiple off (single date when `range` is false).
- `true` → treated as `2`.
- Integer `n` where `n > 1` → cap on selections.
- When **`range: true`**, this cap is the **maximum number of ranges** (each range is `[start, end]` in day precision).

### `range`

- `true` → range selection: first click sets anchor, second click closes the range. Further pairs add ranges up to `multiple` cap (FIFO eviction of the oldest range when over cap).
- `false` → no range mode.

Internal storage:

- Non-range: `selectedDates` is `number[]` (timestamps, start of day).
- Range: `selectedDates` is `number[][]` (pairs of start/end timestamps).

## Options

| Option | Type | Default | Notes |
|--------|------|---------|--------|
| `inline` | `boolean` | auto from target | `input` → popover; container → inline |
| `multiple` | `boolean \| number` | `false` | See semantics above |
| `range` | `boolean` | `false` | |
| `enableTime` | `boolean` | `false` | Adds a time row; default control is `<input type="time">` |
| `minDate` | `number \| Date \| string` | `null` | Start of day |
| `maxDate` | `number \| Date \| string` | `null` | Start of day |
| `disabledDates` | array | `[]` | Day-level |
| `locale` | `'default' \| { months?, weekdays? }` | `'default'` | Custom short month/weekday labels |
| `firstDayOfWeek` | `number` | `1` | `0` = Sunday |
| `numberOfMonths` | `number` | `1` | **MVP:** option is accepted for API compatibility but only one month is rendered |
| `format` | `string` | `'YYYY-MM-DD'` | Tokens: `YYYY`, `MM`, `DD`, `HH`, `mm` |
| `closeOnSelect` | `boolean` | `true` | Hides popover when a selection “commits” (single date or finished range) |
| `onChange` | `(dates) => void` | noop | `dates` is `number[]` or `number[][]` |
| `onShow` | `() => void` | noop | |
| `onHide` | `() => void` | noop | |
| `onDestroy` | `() => void` | noop | |
| `render` | object | see below | Override any render phase |
| `classes` | object | see below | Extra classes per region |
| `position` | `string \| function` | `'bottom left'` | Popover placement (ignored when `inline: true`) |
| `anchor` | `string \| HTMLElement \| null` | `null` | Element used for popover placement and outside-click ignore (see below) |

### `anchor` (popover only)

When `new Lightpickr()` is called on a **wrapper** that also contains an **inline** calendar (another `.lp`), the wrapper’s bounding box is tall and the popover would align to the bottom of that whole block.

- If **`anchor`** is set (`'#id'` or an `HTMLElement`), that node is used for `getBoundingClientRect()` and for “click outside” checks.
- If **`anchor`** is omitted, Lightpickr picks the **first `input` or `textarea`** under `$el` that is **not** inside another Lightpickr root (`[data-lp-root]`, set on each calendar container). This avoids skipping your field when a parent uses the class **`lp`** for layout only (`.closest('.lp')` would wrongly treat that parent as “inside a calendar”).
- If `$el` is already an `input` / `textarea`, that element is used.

### `position` (popover only)

**String:** two words: main axis, then secondary alignment.

- Main: `top` | `bottom` | `left` | `right` — where the calendar sits relative to the target (e.g. `bottom` = below the field).
- Secondary: for `top`/`bottom` use `left` | `right` | `center`; for `left`/`right` use `top` | `bottom` | `center`.
- Examples: `'bottom left'` (default), `'top right'`, `'right center'`.

Gaps come from `--lp-popover-gap-x` / `--lp-popover-gap-y`. The panel is clamped inside the viewport using `--lp-popover-viewport-margin`.

**Function:** custom layout when `show()` runs and again on each view change while open.

```js
position({
  $datepicker,   // HTMLDivElement — calendar root
  $target,       // HTMLElement — element passed to `new Lightpickr(target, …)`
  $anchor,       // HTMLElement — same reference used for string positioning (see `anchor`)
  $pointer,      // HTMLElement — arrow node (hidden unless you style it; see CSS)
  isViewChange,  // true when repositioning after month/year view change, false on open
  done           // call when async positioning is finished (sync code can ignore)
}) {
  // set $datepicker.style (e.g. top/left), optionally $pointer
}
```

Return **another function** to hook into `hide()` (e.g. run a close animation). That function receives `hideDone` and must call `hideDone()` when the calendar should actually unmount from the visible state:

```js
position(ctx) {
  // …position on open…
  return function (hideDone) {
    // …optional hide animation…
    hideDone();
  };
}
```

If the position function does **not** return a hide callback on the **first** open (`isViewChange === false`), any previous hide callback is cleared. On later calls with `isViewChange === true`, omitting a return value keeps the existing hide callback.

**Pointer (string mode):** set `--lp-pointer-visible: 1` on `.lp` (or a wrapper) to show a small arrow above the panel when main position is `bottom`. Override with `classes.popoverPointer` and matching CSS if you rename the class.

## Public API

### Properties

- `$datepicker` — root element
- `$el` — target element
- `$pointer` — popover arrow element (only meaningful in popover mode)
- `viewDate`, `currentView`, `selectedDates`, `focusDate`, `visible`, `disabledDates`, `isDestroyed`

### Methods

- `show()`, `hide()`
- `next()`, `prev()` — step month/year/year-block by view
- `up()`, `down()` — view ladder `day → month → year`
- `selectDate(date | date[] | [start,end][])` — programmatic selection; for range mode you may pass an array of pairs
- `unselectDate(date)` — removes a day from multi selection, or drops any range that contains that day
- `clear()`
- `formatDate(date, format)`
- `destroy()`
- `update(partialOptions)`
- `setCurrentView(view, params?)` — `view`: `'day' \| 'month' \| 'year' \| 'time'`
- `setViewDate(date)`, `setFocusDate(date | null)`
- `getViewDates(view?)` — timestamps currently represented in the active grid
- `disableDate(date)`, `enableDate(date)`
- `use(plugin)` — see Plugins

## Render callbacks

Each callback receives a **context** object:

```ts
{
  date: number,       // primary cell timestamp (start of day)
  viewDate: number,
  isSelected, isDisabled, isToday, isInRange, isRangeStart, isRangeEnd,
  isFocused, isOutside,
  state: object,      // snapshot for reads
  instance: Lightpickr
}
```

Hooks (all optional):

- `render.container(ctx)` — wrap root; return an element to host the rest
- `render.header(ctx)`, `render.nav(ctx)`, `render.grid(ctx)`
- `render.dayCell(ctx)`, `render.monthCell(ctx)`, `render.yearCell(ctx)`
- `render.time(ctx)`, `render.footer(ctx)`

Default UI fills missing hooks with vanilla DOM.

## Class map (`classes`)

Default keys (all overridable): `container`, `header`, `nav`, `grid`, `cell`, `cellSelected`, `cellDisabled`, `cellToday`, `cellRange`, `cellRangeStart`, `cellRangeEnd`, `cellOutside`, `cellFocused`, `navButton`, `titleButton`, `timePanel`, `footer`, `popoverPointer`.

## Theming contract

`dist/lightpickr.css` defines **only** custom properties for visual values on `.lp` (spacing, typography, surfaces, interactive states, popover anchors). Override tokens in your stylesheet after including base CSS:

```css
.my-theme .lp {
  --lp-accent: #0d9488;
  --lp-cell-size: 2.5rem;
}
```

## Plugins

```js
picker.use(function (instance) {
  return {
    onInit() {},
    onRender() {},
    onSelect() {},
    onDestroy() {}
  };
});
```

Range and time are **core** features, not plugins.

## Development

```bash
npm run build   # dist bundle + CSS copy
npm test        # jsdom smoke test (source modules)
npm run size    # gzip size report
```

## License

MIT
