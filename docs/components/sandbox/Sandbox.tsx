'use client';

import Link from 'next/link';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DynamicCodeBlock} from 'fumadocs-ui/components/dynamic-codeblock';
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  Eye,
  Globe,
  Info,
  LayoutGrid,
  LayoutTemplate,
  MousePointerClick,
  PanelTop,
  Puzzle,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import {Popover, PopoverContent, PopoverTrigger} from 'fumadocs-ui/components/ui/popover';
import {demoInputClassName, loadLightpickr} from '@/lib/lightpickr_demo';
import {optionHelp} from '@/components/sandbox/sandbox-help';
import {
  DEFAULT_FORM_STATE,
  FORMAT_PRESETS,
  POSITION_PRESETS,
  SANDBOX_PRESETS,
  applyPreset,
  buildPickerOptions,
  serializeOptionsCode,
  type SandboxFormState,
} from '@/components/sandbox/sandbox-options';

type LightpickrInstance = {destroy: () => void; update?: (opts: object) => void};

const controlClass =
  'w-full rounded-md border border-fd-border bg-fd-background px-2.5 py-1.5 text-sm text-fd-foreground transition-colors disabled:cursor-not-allowed disabled:border-fd-border/40 disabled:bg-fd-muted/40 disabled:text-fd-muted-foreground disabled:opacity-70';
const labelClass = 'text-xs font-medium text-fd-muted-foreground';
const sectionTitleClass = 'text-sm font-semibold text-fd-foreground';

function OptionLabel({
  label,
  help,
  disabled,
}: {
  label: string;
  help?: string;
  disabled?: boolean;
}) {
  const text = help ?? optionHelp(label);
  return (
    <span className={`inline-flex items-center gap-1.5 ${disabled ? 'text-fd-muted-foreground/80' : ''}`}>
      <span className={labelClass}>{label}</span>
      {text ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 rounded-full text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
              aria-label={`About ${label}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="max-w-[16rem] p-3 text-xs leading-relaxed text-fd-foreground"
          >
            {text}
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  );
}

function Switch({
  checked,
  onChange,
  label,
  help,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${disabled ? 'cursor-not-allowed border-fd-border/40 bg-fd-muted/30 opacity-60' : 'cursor-pointer border-fd-border/60 bg-fd-card/50'}`}
    >
      <OptionLabel label={label} help={help} disabled={disabled} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-fd-primary' : 'bg-fd-border'} ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform ${checked ? 'bg-fd-card/40 translate-x-4' : 'bg-white'}`}
        />
      </button>
    </label>
  );
}

function Field({
  label,
  help,
  disabled,
  children,
}: {
  label: string;
  help?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 ${disabled ? 'opacity-60' : ''}`}
      aria-disabled={disabled || undefined}
    >
      <OptionLabel label={label} help={help} disabled={disabled} />
      {children}
    </div>
  );
}

function Accordion({
  title,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="overflow-hidden rounded-xl border border-fd-border/80 bg-fd-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-fd-accent/30"
      >
        <span className={`inline-flex items-center gap-2 ${sectionTitleClass}`}>
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-fd-muted-foreground" strokeWidth={1.75} aria-hidden /> : null}
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="space-y-3 border-t border-fd-border/60 px-4 py-3">{children}</div> : null}
    </div>
  );
}

function useSandboxPicker(mountMode: 'inline' | 'popover', state: SandboxFormState) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<LightpickrInstance | null>(null);
  const mountModeRef = useRef(mountMode);

  useEffect(() => {
    let cancelled = false;
    let localPicker: LightpickrInstance | null = null;

    const run = async () => {
      const target = mountMode === 'inline' ? inlineRef.current : inputRef.current;
      if (!target) {
        return;
      }

      const options = buildPickerOptions(state);

      if (pickerRef.current && mountModeRef.current === mountMode) {
        pickerRef.current.update?.(options);
        return;
      }

      pickerRef.current?.destroy();
      pickerRef.current = null;

      const {default: Lightpickr} = await loadLightpickr();
      if (cancelled || !target) {
        return;
      }

      localPicker = new Lightpickr(target, options);
      pickerRef.current = localPicker;
      mountModeRef.current = mountMode;
    };

    run();

    return () => {
      cancelled = true;
      localPicker?.destroy();
      if (pickerRef.current === localPicker) {
        pickerRef.current = null;
      }
    };
  }, [mountMode, state]);

  return {inputRef, inlineRef};
}

export function Sandbox() {
  const [state, setState] = useState<SandboxFormState>(DEFAULT_FORM_STATE);
  const [activePreset, setActivePreset] = useState('default');
  const [copied, setCopied] = useState(false);

  const patch = useCallback((partial: Partial<SandboxFormState>) => {
    setActivePreset('custom');
    setState((prev) => {
      const next = {...prev, ...partial};
      if (partial.onlyTime) {
        next.enableTime = true;
        next.range = false;
        next.multipleMode = 'off';
      }
      if (partial.range) {
        next.multipleMode = 'off';
      }
      if (partial.multipleMode && partial.multipleMode !== 'off') {
        next.range = false;
      }
      return next;
    });
  }, []);

  const mountMode = state.inline ? 'inline' : 'popover';
  const {inputRef, inlineRef} = useSandboxPicker(mountMode, state);

  const code = useMemo(() => serializeOptionsCode(state), [state]);

  const applyPresetById = (id: string) => {
    setActivePreset(id);
    setState(applyPreset(id));
  };

  const reset = () => {
    setActivePreset('default');
    setState({...DEFAULT_FORM_STATE});
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const selectionDisabled = state.onlyTime;
  const rangeDisabled = selectionDisabled || state.multipleMode !== 'off';
  const multipleDisabled = selectionDisabled || state.range;

  return (
    <div className="relative -mx-4 mt-2 overflow-hidden rounded-2xl border border-fd-border bg-fd-background/80 md:-mx-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--color-fd-primary)_0%,transparent_55%)] opacity-[0.12] dark:opacity-[0.2]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.25] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-fd-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-fd-border)_1px,transparent_1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-fd-border/70 bg-fd-card/60 p-3 backdrop-blur-sm">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
            <LayoutTemplate className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Presets
          </span>
          {SANDBOX_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPresetById(preset.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activePreset === preset.id
                  ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                  : 'border-fd-border bg-fd-background text-fd-foreground hover:border-fd-primary/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-background px-3 py-1 text-xs font-medium text-fd-foreground transition-colors hover:border-fd-primary/50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
          <div className="order-2 space-y-3 lg:order-1 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
            <Accordion title="Mounting" icon={Puzzle} defaultOpen>
              <Switch label="inline" checked={state.inline} onChange={(v) => patch({inline: v})} />
              <Switch label="isMobile" checked={state.isMobile} onChange={(v) => patch({isMobile: v})} />
              <Field label="position" disabled={state.inline || state.isMobile}>
                <select
                  className={controlClass}
                  value={state.position}
                  disabled={state.inline || state.isMobile}
                  onChange={(e) => patch({position: e.target.value})}
                >
                  {POSITION_PRESETS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </Field>
              <div className={`space-y-2 ${state.inline ? 'opacity-60' : ''}`}>
                <OptionLabel label="showEvent" disabled={state.inline} />
                <Switch
                  label="focus"
                  checked={state.showEventFocus}
                  onChange={(v) => patch({showEventFocus: v})}
                  disabled={state.inline}
                />
                <Switch
                  label="click"
                  checked={state.showEventClick}
                  onChange={(v) => patch({showEventClick: v})}
                  disabled={state.inline}
                />
                <Switch
                  label="mousedown"
                  checked={state.showEventMousedown}
                  onChange={(v) => patch({showEventMousedown: v})}
                  disabled={state.inline}
                />
              </div>
            </Accordion>

            <Accordion title="Selection" icon={MousePointerClick} defaultOpen>
              <Switch
                label="range"
                checked={state.range}
                onChange={(v) => patch({range: v})}
                disabled={rangeDisabled}
              />
              <Field label="multiple" disabled={multipleDisabled}>
                <select
                  className={controlClass}
                  value={state.multipleMode}
                  disabled={multipleDisabled}
                  onChange={(e) => patch({multipleMode: e.target.value as SandboxFormState['multipleMode']})}
                >
                  <option value="off">false</option>
                  <option value="unlimited">true (unlimited)</option>
                  <option value="limited">number limit</option>
                </select>
              </Field>
              {state.multipleMode === 'limited' ? (
                <Field label="multiple limit" disabled={multipleDisabled}>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className={controlClass}
                    value={state.multipleLimit}
                    disabled={multipleDisabled}
                    onChange={(e) => patch({multipleLimit: Number(e.target.value) || 1})}
                  />
                </Field>
              ) : null}
              <Switch
                label="dynamicRange"
                checked={state.dynamicRange}
                onChange={(v) => patch({dynamicRange: v})}
                disabled={!state.range}
              />
              <Switch label="autoClose" checked={state.autoClose} onChange={(v) => patch({autoClose: v})} />
              <Field label="multipleSeparator">
                <input
                  className={controlClass}
                  value={state.multipleSeparator}
                  onChange={(e) => patch({multipleSeparator: e.target.value})}
                />
              </Field>
            </Accordion>

            <Accordion title="Dates" icon={Calendar}>
              <Field label="startDate">
                <input
                  type="date"
                  className={controlClass}
                  value={state.startDate}
                  onChange={(e) => patch({startDate: e.target.value})}
                />
              </Field>
              <Field label="minDate">
                <input
                  type="date"
                  className={controlClass}
                  value={state.minDate}
                  onChange={(e) => patch({minDate: e.target.value})}
                />
              </Field>
              <Field label="maxDate">
                <input
                  type="date"
                  className={controlClass}
                  value={state.maxDate}
                  onChange={(e) => patch({maxDate: e.target.value})}
                />
              </Field>
              <Field label="disabledDates (comma-separated)">
                <input
                  className={controlClass}
                  placeholder="2025-06-10, 2025-06-11"
                  value={state.disabledDates}
                  onChange={(e) => patch({disabledDates: e.target.value})}
                />
              </Field>
              <Field label="selectedDates (comma-separated)">
                <input
                  className={controlClass}
                  placeholder="2025-06-15"
                  value={state.selectedDates}
                  onChange={(e) => patch({selectedDates: e.target.value})}
                />
              </Field>
              <Switch label="showOtherMonths" checked={state.showOtherMonths} onChange={(v) => patch({showOtherMonths: v})} />
              <Switch label="selectOtherMonths" checked={state.selectOtherMonths} onChange={(v) => patch({selectOtherMonths: v})} />
              <Switch
                label="moveToOtherMonthsOnSelect"
                checked={state.moveToOtherMonthsOnSelect}
                onChange={(v) => patch({moveToOtherMonthsOnSelect: v})}
              />
              <Switch
                label="disableNavWhenOutOfRange"
                checked={state.disableNavWhenOutOfRange}
                onChange={(v) => patch({disableNavWhenOutOfRange: v})}
              />
            </Accordion>

            <Accordion title="Time" icon={Clock}>
              <Switch
                label="enableTime"
                checked={state.enableTime}
                onChange={(v) => patch({enableTime: v})}
                disabled={state.onlyTime}
              />
              <Switch label="onlyTime" checked={state.onlyTime} onChange={(v) => patch({onlyTime: v})} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="minHours">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className={controlClass}
                    value={state.minHours}
                    onChange={(e) => patch({minHours: Number(e.target.value)})}
                  />
                </Field>
                <Field label="maxHours">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    className={controlClass}
                    value={state.maxHours}
                    onChange={(e) => patch({maxHours: Number(e.target.value)})}
                  />
                </Field>
                <Field label="minMinutes">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className={controlClass}
                    value={state.minMinutes}
                    onChange={(e) => patch({minMinutes: Number(e.target.value)})}
                  />
                </Field>
                <Field label="maxMinutes">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className={controlClass}
                    value={state.maxMinutes}
                    onChange={(e) => patch({maxMinutes: Number(e.target.value)})}
                  />
                </Field>
                <Field label="hoursStep">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={controlClass}
                    value={state.hoursStep}
                    onChange={(e) => patch({hoursStep: Number(e.target.value)})}
                  />
                </Field>
                <Field label="minutesStep">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className={controlClass}
                    value={state.minutesStep}
                    onChange={(e) => patch({minutesStep: Number(e.target.value)})}
                  />
                </Field>
              </div>
            </Accordion>

            <Accordion title="Views" icon={LayoutGrid}>
              <Field label="view">
                <select
                  className={controlClass}
                  value={state.view}
                  onChange={(e) => patch({view: e.target.value as SandboxFormState['view']})}
                >
                  <option value="day">day</option>
                  <option value="month">month</option>
                  <option value="year">year</option>
                </select>
              </Field>
              <div className="space-y-2">
                <OptionLabel label="allowedViews" />
                <Switch label="day" checked={state.allowedViewsDay} onChange={(v) => patch({allowedViewsDay: v})} />
                <Switch label="month" checked={state.allowedViewsMonth} onChange={(v) => patch({allowedViewsMonth: v})} />
                <Switch label="year" checked={state.allowedViewsYear} onChange={(v) => patch({allowedViewsYear: v})} />
              </div>
              <Field label="dayViewCols">
                <input
                  type="number"
                  min={1}
                  max={7}
                  className={controlClass}
                  value={state.dayViewCols}
                  onChange={(e) => patch({dayViewCols: Number(e.target.value)})}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="monthViewCount">
                  <input type="number" min={1} max={24} className={controlClass} value={state.monthViewCount} onChange={(e) => patch({monthViewCount: Number(e.target.value)})} />
                </Field>
                <Field label="monthViewRadius">
                  <input type="number" min={0} max={12} className={controlClass} value={state.monthViewRadius} onChange={(e) => patch({monthViewRadius: Number(e.target.value)})} />
                </Field>
                <Field label="monthViewCols">
                  <input type="number" min={1} max={6} className={controlClass} value={state.monthViewCols} onChange={(e) => patch({monthViewCols: Number(e.target.value)})} />
                </Field>
                <Field label="monthViewRows">
                  <input type="number" min={1} max={6} className={controlClass} value={state.monthViewRows} onChange={(e) => patch({monthViewRows: Number(e.target.value)})} />
                </Field>
                <Field label="yearViewCount">
                  <input type="number" min={1} max={24} className={controlClass} value={state.yearViewCount} onChange={(e) => patch({yearViewCount: Number(e.target.value)})} />
                </Field>
                <Field label="yearViewRadius">
                  <input type="number" min={0} max={12} className={controlClass} value={state.yearViewRadius} onChange={(e) => patch({yearViewRadius: Number(e.target.value)})} />
                </Field>
                <Field label="yearViewCols">
                  <input type="number" min={1} max={6} className={controlClass} value={state.yearViewCols} onChange={(e) => patch({yearViewCols: Number(e.target.value)})} />
                </Field>
                <Field label="yearViewRows">
                  <input type="number" min={1} max={6} className={controlClass} value={state.yearViewRows} onChange={(e) => patch({yearViewRows: Number(e.target.value)})} />
                </Field>
              </div>
            </Accordion>

            <Accordion title="Locale & format" icon={Globe}>
              <Field label="locale">
                <select
                  className={controlClass}
                  value={state.locale}
                  onChange={(e) => patch({locale: e.target.value as SandboxFormState['locale']})}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </Field>
              <Field label="firstDay">
                <select
                  className={controlClass}
                  value={state.firstDay}
                  onChange={(e) => patch({firstDay: Number(e.target.value)})}
                >
                  <option value={0}>0 (Sunday)</option>
                  <option value={1}>1 (Monday)</option>
                  <option value={2}>2 (Tuesday)</option>
                  <option value={3}>3 (Wednesday)</option>
                  <option value={4}>4 (Thursday)</option>
                  <option value={5}>5 (Friday)</option>
                  <option value={6}>6 (Saturday)</option>
                </select>
              </Field>
              <div className="space-y-2">
                <OptionLabel label="weekends" />
                <Switch label="Saturday (6)" checked={state.weekendSat} onChange={(v) => patch({weekendSat: v})} />
                <Switch label="Sunday (0)" checked={state.weekendSun} onChange={(v) => patch({weekendSun: v})} />
              </div>
              <Field label="format">
                <select
                  className={controlClass}
                  value={state.formatPreset}
                  onChange={(e) => patch({formatPreset: e.target.value})}
                >
                  {FORMAT_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </Field>
              {state.formatPreset === 'custom' ? (
                <Field label="custom format">
                  <input
                    className={controlClass}
                    value={state.formatCustom}
                    onChange={(e) => patch({formatCustom: e.target.value})}
                  />
                </Field>
              ) : null}
              <Field label="monthsField">
                <select
                  className={controlClass}
                  value={state.monthsField}
                  onChange={(e) => patch({monthsField: e.target.value})}
                >
                  <option value="monthsShort">monthsShort</option>
                  <option value="monthsLong">monthsLong</option>
                </select>
              </Field>
              <Field label="weekdaysField">
                <select
                  className={controlClass}
                  value={state.weekdaysField}
                  onChange={(e) => patch({weekdaysField: e.target.value})}
                >
                  <option value="weekdaysShort">weekdaysShort</option>
                  <option value="weekdaysLong">weekdaysLong</option>
                </select>
              </Field>
            </Accordion>

            <Accordion title="Chrome" icon={PanelTop}>
              <Field label="navTitles.day">
                <input className={controlClass} value={state.navTitleDay} onChange={(e) => patch({navTitleDay: e.target.value})} />
              </Field>
              <Field label="navTitles.month">
                <input className={controlClass} value={state.navTitleMonth} onChange={(e) => patch({navTitleMonth: e.target.value})} />
              </Field>
              <Field label="navTitles.year">
                <input className={controlClass} value={state.navTitleYear} onChange={(e) => patch({navTitleYear: e.target.value})} />
              </Field>
              <Field label="prevHtml (optional)">
                <input className={controlClass} placeholder="default SVG chevron" value={state.prevHtml} onChange={(e) => patch({prevHtml: e.target.value})} />
              </Field>
              <Field label="nextHtml (optional)">
                <input className={controlClass} placeholder="default SVG chevron" value={state.nextHtml} onChange={(e) => patch({nextHtml: e.target.value})} />
              </Field>
              <Field label="buttons">
                <select
                  className={controlClass}
                  value={state.buttonsMode}
                  onChange={(e) => patch({buttonsMode: e.target.value as SandboxFormState['buttonsMode']})}
                >
                  <option value="none">false</option>
                  <option value="todayClear">Today + Clear</option>
                </select>
              </Field>
              <p className="text-xs leading-relaxed text-fd-muted-foreground">
                Advanced hooks (<code>render</code>, <code>classes</code>, <code>attributes</code>, <code>properties</code>, <code>anchor</code>, custom <code>position</code> / <code>format</code> functions) are documented in{' '}
                <Link href="/docs/documentation/classes" className="text-fd-primary underline-offset-2 hover:underline">
                  Classes
                </Link>
                ,{' '}
                <Link href="/docs/examples" className="text-fd-primary underline-offset-2 hover:underline">
                  Examples
                </Link>
                , and{' '}
                <Link href="/docs/documentation/options#anchor" className="text-fd-primary underline-offset-2 hover:underline">
                  Options
                </Link>
                .
              </p>
            </Accordion>
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-20">
            <div className="rounded-xl border border-dashed border-fd-border/80 bg-fd-card/70 p-5 shadow-sm backdrop-blur-sm">
              <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Live preview
              </p>
              <div className="flex min-h-88 flex-col items-center justify-center gap-4">
                {mountMode === 'inline' ? (
                  <div
                    ref={inlineRef}
                    id="calendar"
                    className="flex w-full max-w-max justify-center"
                    aria-label="Inline Lightpickr preview"
                  />
                ) : (
                  <div className="w-full max-w-xs">
                    <input
                      ref={inputRef}
                      id="my-input"
                      type="text"
                      readOnly
                      placeholder={state.isMobile ? 'Tap to open calendar' : 'Focus or click to open'}
                      className={demoInputClassName}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-fd-border/80 bg-fd-card/70 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-fd-border/60 px-4 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
              <Code2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              Generated code
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-xs font-medium text-fd-foreground transition-colors hover:border-fd-primary/50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-fd-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
          <DynamicCodeBlock
            lang="js"
            code={code}
            codeblock={{
              allowCopy: false,
              keepBackground: false,
              className: 'my-0 rounded-none border-0 shadow-none',
              viewportProps: {className: 'max-h-none text-xs'},
            }}
          />
        </div>
      </div>
    </div>
  );
}
