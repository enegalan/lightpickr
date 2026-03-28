# Lightpickr

[![npm version](https://img.shields.io/npm/v/lightpickr.svg)](https://www.npmjs.com/package/lightpickr)
[![license](https://img.shields.io/npm/l/lightpickr.svg)](https://www.npmjs.com/package/lightpickr)

**Dependency-free** JavaScript datepicker with a ready-made UI, CSS-variable theming, ranges, optional time, and plugins.
~ 15KB gzipped.

---

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
| `locale` | `'default' \| object` | `'default'` | English by default. Available locales are in `lightpickr/locale/`. Object may include `months` / `monthsShort` / `monthsLong` (length 12), `weekdays` (length 7, Sun-first), `firstDay`, `ariaDayGrid`, `ariaMonthGrid`, `ariaYearGrid`, `ariaTimeHours`, `ariaTimeMinutes`, `btnToday`, `btnClear`, `am`, `pm`. |
| `firstDay` | `number` | `1` | First weekday. Priority: `firstDay` → `firstDayOfWeek` → `locale.firstDay` → `1`. |
| `firstDayOfWeek` | `number` | `1` | Backward-compatible alias for `firstDay`. |
| `weekends` | `number[]` | `[6, 0]` | Weekend day indexes used for weekend cell styling. |
| `isMobile` | `boolean` | `false` | Popover in centered modal with backdrop. |
| `startDate` | `number \| Date \| string \| null` | `null` | Initial date used for `viewDate`. |
| `selectedDates` | `(Date \| string \| number)[] \| false` | `false` | Initial selection. In range mode accepts `[start, end]` pairs. |
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
| `onSelect` | `({ date, dates, formattedDate, formattedDates, trigger, datepicker }) => void` | no-op | Fires when selecting, unselecting, clearing, range drag end, or time change. |
| `onBeforeSelect` | `({ date, datepicker }) => boolean` | `() => true` | Returning `false` cancels selection. |
| `onChangeViewDate` | `({ month, year, decade, datepicker }) => void` | no-op | Fires when `viewDate` changes. |
| `onChangeView` | `(view) => void` | no-op | `view`: `days`, `months`, `years`, `time`. |
| `onRenderCell` | `({ date, cellType, datepicker }) => { html?, classes?, disabled?, attrs? }` | no-op | Per-cell customization for `day`, `month`, `year`. |
| `onShow` | `(isFinished, { datepicker }) => void` | no-op | Called with `false` at start and `true` at finish. |
| `onHide` | `(isFinished, { datepicker }) => void` | no-op | Called with `false` at start and `true` at finish. |
| `onClickDayName` | `({ dayIndex, datepicker }) => void` | no-op | Enables clickable weekday headers. |
| `onFocus` | `({ date, datepicker }) => void` | no-op | Fires when focused date changes. |
| `onTimeChange` | `({ date, formattedDate, datepicker }) => void` | no-op | Fires when time controls change. |
| `onDestroy` | `() => void` | no-op | |
| `render` | `object` | built-in hooks | Optional hooks for `container`, `header`, `nav`, `grid`, `time`, `footer`. |
| `classes` | `object` | built-in map | Merged over default class names; see [Extra classes](#extra-classes-classes). |
| `position` | `string \| function` | `'bottom left'` | Popover placement; ignored when `inline: true`. See [Position and anchor](#position-and-anchor-popover). |
| `anchor` | `string \| HTMLElement \| null` | `null` | Reference for layout and outside-click handling. See [Position and anchor](#position-and-anchor-popover). |

---

## Date string inputs

String values passed to options and methods (`minDate`, `maxDate`, `disabledDates`, `selectedDates`, `selectDate`, etc.) are strictly parsed:

- `YYYY-MM-DD` — start of day.
- `YYYY-MM-DD HH:mm`, `YYYY-MM-DDTHH:mm`, optional seconds (`:ss`) — local time.
- `YYYY/MM/DD` — start of day.
- `YYYY/MM/DD HH:mm` or `YYYY/MM/DDTHH:mm`, optional seconds (`:ss`) — local time.
- `YYYY.MM.DD` — start of day.
- `YYYY.MM.DD HH:mm` or `YYYY.MM.DDTHH:mm`, optional seconds (`:ss`) — local time.

**Fallback**

If nothing above matches, the string is passed to `Date.parse` (behavior depends on the engine; ISO 8601 with `Z` is interpreted as that instant in UTC).

`Date` instances and finite numeric timestamps are always accepted. Invalid dates are ignored.

---

## Keyboard

With focus inside the calendar (popover opens on a focusable **day**, **month**, or **year** cell):

**View level (coarser / finer)**

- **Alt + ArrowUp** — same as **`up()`**: `day` → `month` → `year`; from **time** → `day`.
- **Alt + ArrowDown** — same as **`down()`**: `year` → `month` → `day`.

**Day** and **day + time** (`currentView` `day` or `time`)

- **Arrow keys** — move the focused day.
- **PageUp** / **PageDown** — previous / next month (same day-of-month when possible).
- **Shift + PageUp** / **Shift + PageDown** — move by one calendar year (same month/day when possible).
- **Home** / **End** — first / last day of the focused week row.
- **Enter** on a focused day — same as clicking that day.

**Month** (`currentView` `month`)

- **Arrow keys** move between months; **Home** / **End** move to the first / last month in the **row**.
- **PageUp** / **PageDown** — previous / next **year**, keeping the **same month index** in the new year.
- **Shift + PageUp** / **Shift + PageDown** — move **one calendar year** on the underlying day focus (same as day view).

**Year** (`currentView` `year`)

- **Arrow keys** and **Home** / **End** behave like the month grid.
- **PageUp** / **PageDown** — previous / next **12-year** block; focus moves to the **same slot** in the new block.
- **Shift + PageUp** / **Shift + PageDown** — move **one calendar year**.

Opening a **popover** focuses the active cell for the current view so keys work without tabbing first. **Escape** closes the popover.

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
| `$pointer` | `HTMLElement` | Popover pointer element; only used when `position` is a string. Shown when `.lp` has `--lp-pointer-visible: 1` (see [Position and anchor](#position-and-anchor-popover)). Unused in inline mode. |
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
- **`unselectDate(date)`** — In multi mode, removes that day. In range mode, removes any range that contains that day (by day resolution). Emits `onSelect` if something changed.  
- **`clear()`** — Clears selection and emits `onSelect`.

#### `formatDate(date, format?)`

Returns a string for the given `date` using **`format`** (second argument) or the instance `format` option. Uses the current `timePart` when `enableTime` is on. Returns `''` if `date` cannot be parsed to a timestamp.

#### `getSelectedPayload()`

Returns a **new** `number[]` or `number[][]` (deep copy for ranges). Useful for reading raw selected timestamps from the instance.

#### `update(partialOptions)`

Merges **`partialOptions`** into the live options/state. Preserves selection, `viewDate`, `focusDate`, `visible`, `currentView`, and `timePart` where applicable; `render` and `classes` are shallow-merged. Re-renders. Does not fire `onSelect` by itself.

#### `setViewDate(date)` / `setFocusDate(date | null)`

- **`setViewDate`** — Sets `viewDate` to the start of that day (invalid values are ignored).  
- **`setFocusDate`** — Sets keyboard focus day, or `null` to clear.

#### `setCurrentView(view, params?)`

- **`view`** — `'day' | 'month' | 'year' | 'time'`.  
- **`params`** (optional) — `{ date?: number | Date | string }` sets `viewDate` to the start of that day when provided.

#### `getViewDates(view?)`

Returns `number[]` of start-of-day timestamps for the cells in the given view. **`view`** defaults to `currentView`. Supports **`day`** (grid including leading/trailing outside-month days), **`month`** (12 months of `viewDate`’s year), and **`year`** (12 consecutive years starting at `viewDate`’s year minus five). For **`time`**, returns an empty array (no day grid).

#### `disableDate(date)` / `enableDate(date)`

Adds or removes a **single day** (start-of-day) in the internal disabled set. Invalid dates are ignored. Does not fire `onSelect`.

#### `destroy()`

Idempotent. Removes the document listener, tears down delegated handlers, removes `$datepicker` from the DOM, calls `onDestroy` and each plugin’s `onDestroy`, sets `isDestroyed` to `true`.

#### `use(plugin)`

**`plugin`** must be a **function** receiving the instance; otherwise the call does nothing. It may return an object with optional **`onInit`**, **`onRender`**, **`onSelect`**, **`onDestroy`**. `onInit` runs immediately after registration.

---

## onRenderCell

`onRenderCell({ date, cellType, datepicker })` runs for every visible `day`, `month`, and `year` cell.

Return object fields:

- `html` (`string`) to replace cell inner HTML
- `classes` (`string`) to append extra classes
- `disabled` (`boolean`) to mark the cell as non-interactive
- `attrs` (`Record<string, string | number | undefined>`) to set/remove attributes (`undefined` removes)

Example:

```js
new Lightpickr('#el', {
  onRenderCell({ date, cellType }) {
    if (cellType === 'day' && date.getDate() === 12) {
      return {
        disabled: true,
        classes: 'is-custom-disabled',
        attrs: {
          title: 'Unavailable'
        }
      };
    }
  }
});
```

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

**`anchor`** — If you mount the picker on a **wrapper** that also contains another inline calendar, the popover may align incorrectly. Pass `#id` or an `HTMLElement` for `getBoundingClientRect()` and for treating clicks as "inside the field."

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

**Popover arrow:** With a two-word `position` string, the library can show a small pointer from the panel toward the anchor. It reads `--lp-pointer-visible` on the calendar root (`.lp`): **`1`** means show and position the pointer; anything else hides it. The default CSS sets **`1`** on `.lp--popover` and **`0`** on the mobile centered popover (no pointer). Use your own rules on `.lp` to adapt the pointer to your needs.

---

## License

MIT
