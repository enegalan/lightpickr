export type ViewName = 'day' | 'month' | 'year';

export type MultipleMode = 'off' | 'unlimited' | 'limited';

export type ButtonsMode = 'none' | 'todayClear';

export type LocaleId = 'en' | 'es';

const LOCALE_ES = {
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  monthsLong: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  weekdaysLong: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  ariaDayGrid: 'Fechas del calendario',
  ariaMonthGrid: 'Meses',
  ariaYearView: 'Años',
  ariaTimeHours: 'Horas',
  ariaTimeMinutes: 'Minutos',
  am: 'AM',
  pm: 'PM',
};

export type SandboxFormState = {
  inline: boolean;
  isMobile: boolean;
  position: string;
  showEventFocus: boolean;
  showEventClick: boolean;
  showEventMousedown: boolean;
  autoClose: boolean;
  range: boolean;
  multipleMode: MultipleMode;
  multipleLimit: number;
  dynamicRange: boolean;
  multipleSeparator: string;
  startDate: string;
  minDate: string;
  maxDate: string;
  disabledDates: string;
  selectedDates: string;
  showOtherMonths: boolean;
  selectOtherMonths: boolean;
  moveToOtherMonthsOnSelect: boolean;
  disableNavWhenOutOfRange: boolean;
  enableTime: boolean;
  onlyTime: boolean;
  minHours: number;
  maxHours: number;
  minMinutes: number;
  maxMinutes: number;
  hoursStep: number;
  minutesStep: number;
  view: ViewName;
  allowedViewsDay: boolean;
  allowedViewsMonth: boolean;
  allowedViewsYear: boolean;
  dayViewCols: number;
  monthViewCount: number;
  monthViewRadius: number;
  monthViewCols: number;
  monthViewRows: number;
  yearViewCount: number;
  yearViewRadius: number;
  yearViewCols: number;
  yearViewRows: number;
  locale: LocaleId;
  firstDay: number;
  weekendSat: boolean;
  weekendSun: boolean;
  formatPreset: string;
  formatCustom: string;
  monthsField: string;
  weekdaysField: string;
  navTitleDay: string;
  navTitleMonth: string;
  navTitleYear: string;
  prevHtml: string;
  nextHtml: string;
  buttonsMode: ButtonsMode;
};

export const POSITION_PRESETS = [
  'bottom left',
  'bottom right',
  'top left',
  'top right',
  'left top',
  'left bottom',
  'right top',
  'right bottom',
] as const;

export const FORMAT_PRESETS = [
  {label: 'YYYY-MM-DD', value: 'YYYY-MM-DD'},
  {label: 'DD/MM/YYYY', value: 'DD/MM/YYYY'},
  {label: 'MM/DD/YYYY', value: 'MM/DD/YYYY'},
  {label: 'MMMM D, YYYY', value: 'MMMM D, YYYY'},
  {label: 'Custom', value: 'custom'},
] as const;

export const DEFAULT_NAV_TITLES = {
  day: 'MMMM, <i>yyyy</i>',
  month: 'yyyy',
  year: 'yyyy1 - yyyy2',
};

export const DEFAULT_PREV_HTML = '<svg><path d="M17 12l-5 5 5 5"/></svg>';
export const DEFAULT_NEXT_HTML = '<svg><path d="M14 12l5 5-5 5"/></svg>';

export const DEFAULT_FORM_STATE: SandboxFormState = {
  inline: false,
  isMobile: false,
  position: 'bottom left',
  showEventFocus: true,
  showEventClick: false,
  showEventMousedown: false,
  autoClose: true,
  range: false,
  multipleMode: 'off',
  multipleLimit: 3,
  dynamicRange: true,
  multipleSeparator: ', ',
  startDate: '',
  minDate: '',
  maxDate: '',
  disabledDates: '',
  selectedDates: '',
  showOtherMonths: true,
  selectOtherMonths: true,
  moveToOtherMonthsOnSelect: true,
  disableNavWhenOutOfRange: true,
  enableTime: false,
  onlyTime: false,
  minHours: 0,
  maxHours: 24,
  minMinutes: 0,
  maxMinutes: 59,
  hoursStep: 1,
  minutesStep: 1,
  view: 'day',
  allowedViewsDay: true,
  allowedViewsMonth: true,
  allowedViewsYear: true,
  dayViewCols: 7,
  monthViewCount: 12,
  monthViewRadius: 5,
  monthViewCols: 3,
  monthViewRows: 4,
  yearViewCount: 12,
  yearViewRadius: 5,
  yearViewCols: 3,
  yearViewRows: 4,
  locale: 'en',
  firstDay: 1,
  weekendSat: true,
  weekendSun: true,
  formatPreset: 'YYYY-MM-DD',
  formatCustom: 'YYYY-MM-DD',
  monthsField: 'monthsShort',
  weekdaysField: 'weekdaysShort',
  navTitleDay: DEFAULT_NAV_TITLES.day,
  navTitleMonth: DEFAULT_NAV_TITLES.month,
  navTitleYear: DEFAULT_NAV_TITLES.year,
  prevHtml: '',
  nextHtml: '',
  buttonsMode: 'none',
};

export type SandboxPreset = {
  id: string;
  label: string;
  state: Partial<SandboxFormState>;
};

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {id: 'default', label: 'Default', state: {}},
  {id: 'inline', label: 'Inline', state: {inline: true}},
  {
    id: 'range',
    label: 'Range',
    state: {range: true, minDate: '2024-01-01', maxDate: '2027-12-31'},
  },
  {
    id: 'multiple',
    label: 'Multiple',
    state: {multipleMode: 'limited', multipleLimit: 3},
  },
  {id: 'datetime', label: 'Date & time', state: {enableTime: true}},
  {id: 'timeonly', label: 'Time only', state: {onlyTime: true, inline: true}},
  {id: 'mobile', label: 'Mobile', state: {isMobile: true}},
  {
    id: 'monthview',
    label: 'Month view',
    state: {
      inline: true,
      view: 'month',
      monthViewCols: 4,
      monthViewRows: 3,
    },
  },
  {id: 'spanish', label: 'Spanish', state: {locale: 'es', inline: true}},
];

export function applyPreset(presetId: string): SandboxFormState {
  const preset = SANDBOX_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    return {...DEFAULT_FORM_STATE};
  }
  return {...DEFAULT_FORM_STATE, ...preset.state};
}

function parseDateList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function getShowEventValue(state: SandboxFormState): string | string[] | null {
  const events: string[] = [];
  if (state.showEventFocus) {
    events.push('focus');
  }
  if (state.showEventClick) {
    events.push('click');
  }
  if (state.showEventMousedown) {
    events.push('mousedown');
  }
  if (events.length === 0) {
    return null;
  }
  if (events.length === 1) {
    return events[0];
  }
  return events;
}

function getWeekendsValue(state: SandboxFormState): number[] | null {
  const weekends: number[] = [];
  if (state.weekendSat) {
    weekends.push(6);
  }
  if (state.weekendSun) {
    weekends.push(0);
  }
  if (weekends.length === 0) {
    return null;
  }
  return weekends;
}

function getAllowedViewsValue(state: SandboxFormState): ViewName[] | null {
  const views: ViewName[] = [];
  if (state.allowedViewsDay) {
    views.push('day');
  }
  if (state.allowedViewsMonth) {
    views.push('month');
  }
  if (state.allowedViewsYear) {
    views.push('year');
  }
  if (views.length === 0) {
    return null;
  }
  return views;
}

function buildFormat(state: SandboxFormState): string {
  if (state.formatPreset === 'custom') {
    return state.formatCustom.trim() || 'YYYY-MM-DD';
  }
  return state.formatPreset;
}

function buildMultiple(state: SandboxFormState): boolean | number {
  if (state.multipleMode === 'unlimited') {
    return true;
  }
  if (state.multipleMode === 'limited') {
    return Math.max(1, state.multipleLimit);
  }
  return false;
}

function buildButtons(state: SandboxFormState): false | object[] {
  if (state.buttonsMode === 'todayClear') {
    return [
      {
        content: 'Today',
        onClick: function (picker: {setViewDate: (d: Date) => void}) {
          picker.setViewDate(new Date());
        },
      },
      {
        content: 'Clear',
        onClick: function (picker: {clear: () => void}) {
          picker.clear();
        },
      },
    ];
  }
  return false;
}

function buildNavTitles(state: SandboxFormState): {day: string; month: string; year: string} {
  return {
    day: state.navTitleDay,
    month: state.navTitleMonth,
    year: state.navTitleYear,
  };
}

export function buildPickerOptions(state: SandboxFormState): Record<string, unknown> {
  const onlyTime = state.onlyTime;
  const enableTime = onlyTime || state.enableTime;
  const options: Record<string, unknown> = {
    inline: state.inline,
    isMobile: state.isMobile,
    position: state.position,
    showEvent: getShowEventValue(state),
    autoClose: state.autoClose,
    range: onlyTime ? false : state.range,
    multiple: onlyTime ? false : buildMultiple(state),
    dynamicRange: state.dynamicRange,
    multipleSeparator: state.multipleSeparator,
    showOtherMonths: state.showOtherMonths,
    selectOtherMonths: state.selectOtherMonths,
    moveToOtherMonthsOnSelect: state.moveToOtherMonthsOnSelect,
    disableNavWhenOutOfRange: state.disableNavWhenOutOfRange,
    enableTime,
    onlyTime,
    minHours: state.minHours,
    maxHours: state.maxHours,
    minMinutes: state.minMinutes,
    maxMinutes: state.maxMinutes,
    hoursStep: state.hoursStep,
    minutesStep: state.minutesStep,
    view: state.view,
    allowedViews: getAllowedViewsValue(state),
    dayViewCols: state.dayViewCols,
    monthViewCount: state.monthViewCount,
    monthViewRadius: state.monthViewRadius,
    monthViewCols: state.monthViewCols,
    monthViewRows: state.monthViewRows,
    yearViewCount: state.yearViewCount,
    yearViewRadius: state.yearViewRadius,
    yearViewCols: state.yearViewCols,
    yearViewRows: state.yearViewRows,
    firstDay: state.firstDay,
    weekends: getWeekendsValue(state),
    format: buildFormat(state),
    monthsField: state.monthsField,
    weekdaysField: state.weekdaysField,
    buttons: buildButtons(state),
  };

  if (state.startDate.trim()) {
    options.startDate = state.startDate.trim();
  }
  if (state.minDate.trim()) {
    options.minDate = state.minDate.trim();
  }
  if (state.maxDate.trim()) {
    options.maxDate = state.maxDate.trim();
  }

  const disabled = parseDateList(state.disabledDates);
  if (disabled.length) {
    options.disabledDates = disabled;
  }

  const selected = parseDateList(state.selectedDates);
  if (selected.length) {
    options.selectedDates = selected;
  }

  const navTitles = buildNavTitles(state);
  if (
    navTitles.day !== DEFAULT_NAV_TITLES.day ||
    navTitles.month !== DEFAULT_NAV_TITLES.month ||
    navTitles.year !== DEFAULT_NAV_TITLES.year
  ) {
    options.navTitles = navTitles;
  }

  if (state.prevHtml.trim()) {
    options.prevHtml = state.prevHtml.trim();
  }
  if (state.nextHtml.trim()) {
    options.nextHtml = state.nextHtml.trim();
  }

  if (state.locale === 'es') {
    options.locale = LOCALE_ES;
  }

  return options;
}

function isDefaultShowEvent(state: SandboxFormState): boolean {
  return state.showEventFocus && !state.showEventClick && !state.showEventMousedown;
}

function isDefaultWeekends(state: SandboxFormState): boolean {
  return state.weekendSat && state.weekendSun;
}

function isDefaultAllowedViews(state: SandboxFormState): boolean {
  return state.allowedViewsDay && state.allowedViewsMonth && state.allowedViewsYear;
}

function isDefaultNavTitles(state: SandboxFormState): boolean {
  return (
    state.navTitleDay === DEFAULT_NAV_TITLES.day &&
    state.navTitleMonth === DEFAULT_NAV_TITLES.month &&
    state.navTitleYear === DEFAULT_NAV_TITLES.year
  );
}

function serializeValue(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map((item) => `${padInner}${serializeValue(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    const lines = entries.map(
      ([key, val]) => `${padInner}${key}: ${serializeValue(val, indent + 1)}`
    );
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }
  return JSON.stringify(value);
}

export function serializeOptionsCode(state: SandboxFormState): string {
  const lines: string[] = ["import Lightpickr from 'lightpickr';", "import 'lightpickr/lightpickr.css';"];

  if (state.locale === 'es') {
    lines.push("import es from 'lightpickr/locale/es';");
  }

  const opts: Record<string, unknown> = {};

  if (state.inline) {
    opts.inline = true;
  }
  if (state.isMobile) {
    opts.isMobile = true;
  }
  if (state.position !== DEFAULT_FORM_STATE.position) {
    opts.position = state.position;
  }
  if (!isDefaultShowEvent(state)) {
    opts.showEvent = getShowEventValue(state);
  }
  if (!state.autoClose) {
    opts.autoClose = false;
  }

  const onlyTime = state.onlyTime;
  if (!onlyTime && state.range) {
    opts.range = true;
  }
  if (!onlyTime) {
    const multiple = buildMultiple(state);
    if (multiple !== false) {
      opts.multiple = multiple;
    }
  }
  if (!state.dynamicRange) {
    opts.dynamicRange = false;
  }
  if (state.multipleSeparator !== DEFAULT_FORM_STATE.multipleSeparator) {
    opts.multipleSeparator = state.multipleSeparator;
  }

  if (state.startDate.trim()) {
    opts.startDate = state.startDate.trim();
  }
  if (state.minDate.trim()) {
    opts.minDate = state.minDate.trim();
  }
  if (state.maxDate.trim()) {
    opts.maxDate = state.maxDate.trim();
  }
  const disabled = parseDateList(state.disabledDates);
  if (disabled.length) {
    opts.disabledDates = disabled;
  }
  const selected = parseDateList(state.selectedDates);
  if (selected.length) {
    opts.selectedDates = selected;
  }
  if (!state.showOtherMonths) {
    opts.showOtherMonths = false;
  }
  if (!state.selectOtherMonths) {
    opts.selectOtherMonths = false;
  }
  if (!state.moveToOtherMonthsOnSelect) {
    opts.moveToOtherMonthsOnSelect = false;
  }
  if (!state.disableNavWhenOutOfRange) {
    opts.disableNavWhenOutOfRange = false;
  }

  if (state.enableTime) {
    opts.enableTime = true;
  }
  if (onlyTime) {
    opts.onlyTime = true;
  }
  if (state.minHours !== DEFAULT_FORM_STATE.minHours) {
    opts.minHours = state.minHours;
  }
  if (state.maxHours !== DEFAULT_FORM_STATE.maxHours) {
    opts.maxHours = state.maxHours;
  }
  if (state.minMinutes !== DEFAULT_FORM_STATE.minMinutes) {
    opts.minMinutes = state.minMinutes;
  }
  if (state.maxMinutes !== DEFAULT_FORM_STATE.maxMinutes) {
    opts.maxMinutes = state.maxMinutes;
  }
  if (state.hoursStep !== DEFAULT_FORM_STATE.hoursStep) {
    opts.hoursStep = state.hoursStep;
  }
  if (state.minutesStep !== DEFAULT_FORM_STATE.minutesStep) {
    opts.minutesStep = state.minutesStep;
  }

  if (state.view !== DEFAULT_FORM_STATE.view) {
    opts.view = state.view;
  }
  if (!isDefaultAllowedViews(state)) {
    opts.allowedViews = getAllowedViewsValue(state);
  }
  if (state.dayViewCols !== DEFAULT_FORM_STATE.dayViewCols) {
    opts.dayViewCols = state.dayViewCols;
  }
  if (state.monthViewCount !== DEFAULT_FORM_STATE.monthViewCount) {
    opts.monthViewCount = state.monthViewCount;
  }
  if (state.monthViewRadius !== DEFAULT_FORM_STATE.monthViewRadius) {
    opts.monthViewRadius = state.monthViewRadius;
  }
  if (state.monthViewCols !== DEFAULT_FORM_STATE.monthViewCols) {
    opts.monthViewCols = state.monthViewCols;
  }
  if (state.monthViewRows !== DEFAULT_FORM_STATE.monthViewRows) {
    opts.monthViewRows = state.monthViewRows;
  }
  if (state.yearViewCount !== DEFAULT_FORM_STATE.yearViewCount) {
    opts.yearViewCount = state.yearViewCount;
  }
  if (state.yearViewRadius !== DEFAULT_FORM_STATE.yearViewRadius) {
    opts.yearViewRadius = state.yearViewRadius;
  }
  if (state.yearViewCols !== DEFAULT_FORM_STATE.yearViewCols) {
    opts.yearViewCols = state.yearViewCols;
  }
  if (state.yearViewRows !== DEFAULT_FORM_STATE.yearViewRows) {
    opts.yearViewRows = state.yearViewRows;
  }

  if (state.locale === 'es') {
    opts.locale = 'es';
  }
  if (state.firstDay !== DEFAULT_FORM_STATE.firstDay) {
    opts.firstDay = state.firstDay;
  }
  if (!isDefaultWeekends(state)) {
    opts.weekends = getWeekendsValue(state);
  }
  const format = buildFormat(state);
  if (format !== DEFAULT_FORM_STATE.formatPreset) {
    opts.format = format;
  }
  if (state.monthsField !== DEFAULT_FORM_STATE.monthsField) {
    opts.monthsField = state.monthsField;
  }
  if (state.weekdaysField !== DEFAULT_FORM_STATE.weekdaysField) {
    opts.weekdaysField = state.weekdaysField;
  }
  if (!isDefaultNavTitles(state)) {
    opts.navTitles = buildNavTitles(state);
  }
  if (state.prevHtml.trim()) {
    opts.prevHtml = state.prevHtml.trim();
  }
  if (state.nextHtml.trim()) {
    opts.nextHtml = state.nextHtml.trim();
  }
  if (state.buttonsMode === 'todayClear') {
    opts.buttons = [
      {
        content: 'Today',
        onClick: 'function (picker) { picker.setViewDate(new Date()); }',
      },
      {
        content: 'Clear',
        onClick: 'function (picker) { picker.clear(); }',
      },
    ];
  }

  const target = state.inline ? "document.querySelector('#calendar')" : "'#my-input'";

  lines.push('');
  if (state.locale === 'es') {
    if (Object.keys(opts).length) {
      const optLines = Object.entries(opts).map(([key, value]) => {
        if (key === 'locale') {
          return `  locale: es,`;
        }
        if (key === 'buttons') {
          return `  buttons: [
    {
      content: 'Today',
      onClick(picker) {
        picker.setViewDate(new Date());
      },
    },
    {
      content: 'Clear',
      onClick(picker) {
        picker.clear();
      },
    },
  ],`;
        }
        return `  ${key}: ${serializeValue(value, 1)},`;
      });
      lines.push(`new Lightpickr(${target}, {`);
      lines.push(...optLines);
      lines.push('});');
    } else {
      lines.push(`new Lightpickr(${target});`);
    }
  } else if (Object.keys(opts).length) {
    const optLines = Object.entries(opts).map(([key, value]) => {
      if (key === 'buttons') {
        return `  buttons: [
    {
      content: 'Today',
      onClick(picker) {
        picker.setViewDate(new Date());
      },
    },
    {
      content: 'Clear',
      onClick(picker) {
        picker.clear();
      },
    },
  ],`;
      }
      return `  ${key}: ${serializeValue(value, 1)},`;
    });
    lines.push(`new Lightpickr(${target}, {`);
    lines.push(...optLines);
    lines.push('});');
  } else {
    lines.push(`new Lightpickr(${target});`);
  }

  return lines.join('\n');
}
