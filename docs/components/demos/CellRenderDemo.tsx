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

export function CellRenderDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        onRenderCell: function ({date, cellType}: {date: Date; cellType: string}) {
          if (cellType !== 'day') {
            return;
          }
          const dayOfMonth = date.getDate();
          const marker = DAY_MARKERS.find((d) => d.day === dayOfMonth);
          if (!marker) {
            return;
          }
          return {
            html:
              '<span style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.05">' +
              '<span style="font-size:1.05em" aria-hidden="true">' +
              marker.emoji +
              '</span>' +
              '<span style="font-size:0.8em;opacity:0.92">' +
              dayOfMonth +
              '</span>' +
              '</span>',
            attrs: {title: marker.title},
          };
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
