# Lightpickr

**Dependency-free** JavaScript datepicker with a ready-made UI, CSS-variable theming, ranges, optional time, and plugins.

---

## Quick start

```bash
npm install
npm run build
```

In your HTML:

```html
<link rel="stylesheet" href="dist/lightpickr.css" />
<script src="dist/lightpickr.js"></script>
<script>
  const picker = new Lightpickr('#my-input', { enableTime: true });
</script>
```

- `dist/lightpickr.js` — single browser bundle (IIFE), global `Lightpickr`
- `dist/lightpickr.css` — base styles; color and spacing via **custom properties** (`--lp-*`)

---

## Usage examples

**Single date** (default):

```js
new Lightpickr('#date');
```

**Range** (first click start, second end; multiple ranges depend on `multiple`):

```js
new Lightpickr('#range', { range: true });
```

**Multiple separate dates** (max 5):

```js
new Lightpickr('#many', { multiple: 5 });
```

**With time:**

```js
new Lightpickr('#appointment', { enableTime: true });
```

**Always-visible calendar** (target is a container, not only an `input`):

```js
new Lightpickr('#calendar-root', { inline: true });
```

---

## Options

| Option | Type | Default | Notes |
|--------|------|---------|--------|
| `inline` | `boolean` | *auto* | Omitted: `input` / `textarea` → popover (`false`); other target → inline (`true`). |
| `multiple` | `boolean \| number` | `false` | `false` / omitted / `0` / `1` → multiple off. `true` → unlimited. Integer `n > 1` → max selections, or max **ranges** when `range: true`. |
| `range` | `boolean` | `false` | First click anchor, second closes range; FIFO eviction only when `multiple` is finite. |
| `enableTime` | `boolean` | `false` | Time row; default control is `<input type="time">`. |
| `minDate` | `number \| Date \| string \| null` | `null` | Interpreted at start of day. |
| `maxDate` | `number \| Date \| string \| null` | `null` | Interpreted at start of day. |
| `disabledDates` | `array` | `[]` | Day-level; entries as number, `Date`, or string. |
| `locale` | `'default' \| object` | `'default'` | Supports `months`, `monthsShort`, `monthsLong`, `weekdays`, `firstDay`. |
| `firstDay` | `number` | `1` | First weekday. Priority: `firstDay` → `firstDayOfWeek` → `locale.firstDay` → `1`. |
| `firstDayOfWeek` | `number` | `1` | Backward-compatible alias for `firstDay`. |
| `weekends` | `number[]` | `[6, 0]` | Weekend day indexes used for weekend cell styling. |
| `isMobile` | `boolean` | `false` | Popover in centered modal with backdrop. |
| `startDate` | `number \| Date \| string \| null` | `null` | Initial date used for `viewDate`. |
| `selectedDates` | `(Date \| string \| number)[] \| false` | `false` | Initial selection. In range mode accepts `[start, end]` pairs. |
| `numberOfMonths` | `number` | `1` | Not read from options yet; internal value is always `1` (reserved for future use). |
| `format` | `string` | `'YYYY-MM-DD'` | Tokens: `YYYY`, `MM`, `DD`, `HH`, `mm`. |
| `view` | `'days' \| 'months' \| 'years'` | `'days'` | Initial calendar view (ignored by `onlyTime`). |
| `allowedViews` | `string \| string[]` | all | Allowed calendar views (`days`, `months`, `years`). |
| `showOtherMonths` | `boolean` | `true` | Show leading/trailing month day cells in day grid. |
| `selectOtherMonths` | `boolean` | `true` | Whether outside-month cells can be selected. |
| `moveToOtherMonthsOnSelect` | `boolean` | `true` | Move current month when selecting an outside-month cell. |
| `disableNavWhenOutOfRange` | `boolean` | `true` | Disable prev/next when target period is outside min/max. |
| `monthsField` | `string` | `'monthsShort'` | Locale key used to render month labels. |
| `multipleSeparator` | `string` | `', '` | Separator between multiple values / ranges in input value. |
| `dynamicRange` | `boolean` | `true` | Drag range start/end handles after range is created. |
| `buttons` | `false \| string \| string[] \| object \| object[]` | `false` | Footer actions (`today`, `clear`) and custom buttons. |
| `showEvent` | `string \| string[]` | `'focus'` | Target event(s) that open the calendar. |
| `autoClose` | `boolean` | `true` | Alias for `closeOnSelect`. |
| `closeOnSelect` | `boolean` | `true` | Hides popover when selection commits (single date or finished range). |
| `prevHtml` | `string` | SVG | Previous navigation button HTML. |
| `nextHtml` | `string` | SVG | Next navigation button HTML. |
| `navTitles` | `object` | defaults | Templates/callbacks for `days`, `months`, `years` titles. |
| `minHours` | `number` | `0` | Minimum hours value for time controls. |
| `maxHours` | `number` | `24` | Maximum hours option (internally clamped to 23). |
| `minMinutes` | `number` | `0` | Minimum minutes value for time controls. |
| `maxMinutes` | `number` | `59` | Maximum minutes value for time controls. |
| `hoursStep` | `number` | `1` | Step for hours controls. |
| `minutesStep` | `number` | `1` | Step for minutes controls. |
| `onChange` | `(dates) => void` | no-op | `dates` is `number[]` or `number[][]` in range mode. |
| `onShow` | `() => void` | no-op | |
| `onHide` | `() => void` | no-op | |
| `onDestroy` | `() => void` | no-op | |
| `render` | `object` | built-in hooks | Optional hooks per region; see [Render](#render-render). |
| `classes` | `object` | built-in map | Merged over default class names; see [Extra classes](#extra-classes-classes). |
| `position` | `string \| function` | `'bottom left'` | Popover placement; ignored when `inline: true`. See [Position and anchor](#position-and-anchor-popover). |
| `anchor` | `string \| HTMLElement \| null` | `null` | Reference for layout and outside-click handling. See [Position and anchor](#position-and-anchor-popover). |

---

## Public API

### Constructor

`new Lightpickr(target, options?)`

- **`target`** — CSS selector string or `HTMLElement`. Throws if the element is not found.
- **`options`** — Optional object; see [Options](#options). If `inline` is omitted, it is inferred: `input` / `textarea` → popover; any other element → inline calendar.

### Instance fields

| Member | Type | Description |
|--------|------|-------------|
| `$el` | `HTMLElement` | Element you passed as `target` (resolved from a selector). |
| `$datepicker` | `HTMLDivElement` | Root of the calendar UI (`data-lp-root`). Inline: inside `$el`; popover: appended to `document.body`. |
| `$pointer` | `HTMLElement` | Popover arrow node (string `position` mode; style with CSS / `--lp-pointer-visible`). Meaningless in inline mode. |
| `visible` | `boolean` | Whether the calendar is shown (`true` always when `inline`; popover toggles with `show` / `hide`). |
| `isDestroyed` | `boolean` | Set to `true` after `destroy()`; further use of the instance is unsafe. |

### Getters

| Getter | Type | Description |
|--------|------|-------------|
| `viewDate` | `number` | Start-of-day timestamp for the period being viewed. |
| `currentView` | `'day' \| 'month' \| 'year' \| 'time'` | Active view. |
| `selectedDates` | `number[] \| number[][]` | **Copy** of the selection: flat timestamps in non-range mode; array of `[start, end]` pairs in range mode (each bound is start-of-day). |
| `focusDate` | `number \| null` | Keyboard/focus highlight timestamp, or `null`. |
| `disabledDates` | `number[]` | **Copy** of disabled day timestamps (sorted, start-of-day). |

### Methods

#### `show()` / `hide()`

Popover only. **No-op** if `isDestroyed` or `inline`.  

- **`show()`** — Displays the panel, attaches the document mousedown listener for outside clicks, runs `onShow`, repositions.  
- **`hide()`** — If a custom `position` function returned a hide callback, that runs first; it must eventually invoke the provided `hideDone` (see [Position and anchor](#position-and-anchor-popover)). Then the panel is hidden, the document listener removed, and `onHide` runs.

#### `next()` / `prev()`

Step the current view backward (`prev`) or forward (`next`):

| `currentView` | Effect |
|---------------|--------|
| `day` | Previous / next month (from `viewDate`). |
| `month` | Previous / next year. |
| `year` | Previous / next 12-year block. |
| `time` | Same as `day` (month step on `viewDate`). |

#### `up()` / `down()`

Change granularity along **day → month → year** (not including `time`):

- **`up()`** — From `day` → `month` → `year`. From `time` → `day`.
- **`down()`** — From `year` → `month` → `day`. No change if already on `day`.

#### `selectDate(date, opts?)` / `unselectDate(date)` / `clear()`

- **`selectDate(value)`** — Programmatic selection. Does nothing in the range + array-of-pairs branch if `range` is `false`.  
  - **Single value** (`Date`, timestamp, or parseable string): applies the same rules as a user click (single / multi / range).  
  - **Array of values** (not an array of pairs): applies each entry in order.  
  - **Range mode only:** array of `[start, end]` pairs — replaces selection with normalized pairs, keeping at most `multipleLimit` ranges (newest wins).  
- **`opts`** (optional second argument) — `{ close?: boolean }`. Only affects the **range + array-of-pairs** path: if `close: true` and `closeOnSelect` is true, calls `hide()` after updating.  
- **Auto-hide:** With `closeOnSelect`, after selection the popover may hide: single-date and multi-date behavior follows internal rules; for range, hides when there is no pending range start (range fully closed).  
- **`unselectDate(date)`** — In multi mode, removes that day. In range mode, removes any range that contains that day (by day resolution). Emits `onChange` if something changed.  
- **`clear()`** — Clears selection and emits `onChange`.

#### `formatDate(date, format?)`

Returns a string for the given `date` using **`format`** (second argument) or the instance `format` option. Uses the current `timePart` when `enableTime` is on. Returns `''` if `date` cannot be parsed to a timestamp.

#### `getSelectedPayload()`

Returns the same shape as the argument passed to **`onChange`**: a **new** `number[]` or `number[][]` (deep copy for ranges). Useful if you need the payload without waiting for a change event.

#### `update(partialOptions)`

Merges **`partialOptions`** into the live options/state. Preserves selection, `viewDate`, `focusDate`, `visible`, `currentView`, and `timePart` where applicable; `render` and `classes` are shallow-merged. Re-renders. Does not fire `onChange` by itself.

#### `setViewDate(date)` / `setFocusDate(date | null)`

- **`setViewDate`** — Sets `viewDate` to the start of that day (invalid values are ignored).  
- **`setFocusDate`** — Sets keyboard focus day, or `null` to clear.

#### `setCurrentView(view, params?)`

- **`view`** — `'day' | 'month' | 'year' | 'time'`.  
- **`params`** (optional) — `{ date?: number | Date | string }` sets `viewDate` to the start of that day when provided.

#### `getViewDates(view?)`

Returns `number[]` of start-of-day timestamps for the cells in the given view. **`view`** defaults to `currentView`. Supports **`day`** (grid including leading/trailing outside-month days), **`month`** (12 months of `viewDate`’s year), and **`year`** (12 consecutive years starting at `viewDate`’s year minus five). For **`time`**, returns an empty array (no day grid).

#### `disableDate(date)` / `enableDate(date)`

Adds or removes a **single day** (start-of-day) in the internal disabled set. Invalid dates are ignored. Does not fire `onChange`.

#### `destroy()`

Idempotent. Removes the document listener, tears down delegated handlers, removes `$datepicker` from the DOM, calls `onDestroy` and each plugin’s `onDestroy`, sets `isDestroyed` to `true`.

#### `use(plugin)`

**`plugin`** must be a **function** receiving the instance; otherwise the call does nothing. It may return an object with optional **`onInit`**, **`onRender`**, **`onSelect`**, **`onDestroy`**. `onInit` runs immediately after registration.

---

## Render (`render`)

Each function receives a **context** including: `date`, `viewDate`, `isSelected`, `isDisabled`, `isToday`, `isInRange`, `isRangeStart`, `isRangeEnd`, `isFocused`, `isOutside`, `state`, `instance`.

Optional hooks: `container`, `header`, `nav`, `grid`, `dayCell`, `monthCell`, `yearCell`, `time`, `footer`. If you omit one, Lightpickr uses its default DOM.

---

## Extra classes (`classes`)

You can add classes to specific regions. Default keys include: `container`, `header`, `nav`, `grid`, `cell`, `cellSelected`, `cellDisabled`, `cellToday`, `cellRange`, `cellRangeStart`, `cellRangeEnd`, `cellOutside`, `cellFocused`, `navButton`, `titleButton`, `timePanel`, `footer`, `popoverPointer`.

---

## Theming (CSS)

Base CSS defines **variables** on `.lp`. Override after importing:

```css
.my-theme .lp {
  --lp-accent: #0d9488;
  --lp-cell-size: 2.5rem;
}
```

---

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

---

## Position and anchor (popover)

**`anchor`** — If you mount the picker on a **wrapper** that also contains another inline calendar, the popover may align incorrectly. Pass `#id` or an `HTMLElement` for `getBoundingClientRect()` and for treating clicks as “inside the field.”

If you omit `anchor`, the **first `input` or `textarea`** under the target that is **not** inside another Lightpickr root (`[data-lp-root]`) is used. If the target is already an input/textarea, that element is used.

**`position`** — Two-word string: main axis, then alignment (e.g. `'bottom left'`, `'top right'`). Main: `top` | `bottom` | `left` | `right`; secondary depends on axis (`left`/`right`/`center` or `top`/`bottom`/`center`). Gaps and margins: `--lp-popover-gap-x`, `--lp-popover-gap-y`, `--lp-popover-viewport-margin`.

**Custom function** — Receives an object with `$datepicker`, `$target`, `$anchor`, `$pointer`, `isViewChange`, and `done` (call it if positioning is async). If you return a function on open, it runs on hide and must call `hideDone()` when the panel can actually be hidden:

```js
position(ctx) {
  // ctx.$datepicker.style.left = …
  return function (hideDone) {
    hideDone();
  };
}
```

Arrow in string mode: `--lp-pointer-visible: 1` on `.lp`.

---

## License

MIT
