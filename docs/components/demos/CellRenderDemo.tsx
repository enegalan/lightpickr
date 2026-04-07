'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

const DAY_MARKERS = [
  {day: 1, emoji: '🎊', title: 'Start of month'},
  {day: 3, emoji: '⚡', title: 'Sprint'},
  {day: 7, emoji: '☕', title: 'Coffee & planning'},
  {day: 10, emoji: '🎯', title: 'Checkpoint'},
  {day: 14, emoji: '💝', title: 'Mid-month'},
  {day: 18, emoji: '🌙', title: 'Late focus'},
  {day: 21, emoji: '🚀', title: 'Ship window'},
  {day: 24, emoji: '🍕', title: 'Team lunch'},
  {day: 28, emoji: '✨', title: 'Wrap-up'},
  {day: 31, emoji: '🎂', title: 'Month end'},
];

type Ctx = {
  date: number;
  isSelected: boolean;
  isDisabled: boolean;
  isToday: boolean;
  isOutside: boolean;
  isFocused: boolean;
  state: {currentView: string; selectOtherMonths: boolean};
};

export function CellRenderDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        render: {
          cell(ctx: Ctx) {
            const view = ctx.state.currentView;
            if (view !== 'day' && view !== 'time') {
              return;
            }
            const dayOfMonth = new Date(ctx.date).getDate();
            const marker = DAY_MARKERS.find((d) => d.day === dayOfMonth);
            if (!marker) {
              return;
            }
            const b = document.createElement('button');
            b.type = 'button';
            b.className = [
              'lp-cell',
              ctx.isSelected && 'lp-cell--selected',
              ctx.isDisabled && 'lp-cell--disabled',
              ctx.isToday && 'lp-cell--today',
              ctx.isOutside && 'lp-cell--outside',
            ]
              .filter(Boolean)
              .join(' ');
            b.setAttribute('data-lp-day', String(ctx.date));
            b.setAttribute('role', 'gridcell');
            b.setAttribute('tabindex', ctx.isFocused ? '0' : '-1');
            b.setAttribute('aria-selected', ctx.isSelected ? 'true' : 'false');
            const ariaDis =
              ctx.isDisabled || (ctx.isOutside && !ctx.state.selectOtherMonths) ? 'true' : 'false';
            b.setAttribute('aria-disabled', ariaDis);
            b.innerHTML =
              '<span style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.05">' +
              '<span style="font-size:1.05em" aria-hidden="true">' +
              marker.emoji +
              '</span>' +
              '<span style="font-size:0.8em;opacity:0.92">' +
              dayOfMonth +
              '</span>' +
              '</span>';
            b.title = marker.title;
            if (ctx.isDisabled || (ctx.isOutside && !ctx.state.selectOtherMonths)) {
              b.disabled = true;
            }
            return b;
          },
        },
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input ref={ref} type="text" readOnly className={demoInputClassName} />
    </div>
  );
}
