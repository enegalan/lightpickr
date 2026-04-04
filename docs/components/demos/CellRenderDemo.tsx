'use client';

import {useEffect, useRef} from 'react';

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
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;
      pickerRef.current = new Lightpickr(ref.current, {
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
      });
    })();
    return () => {
      cancelled = true;
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, []);

  return (
    <div className="my-4 max-w-xs">
      <input
        ref={ref}
        type="text"
        readOnly
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}
