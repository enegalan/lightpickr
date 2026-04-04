'use client';

import {useEffect, useRef} from 'react';

export function RangeDemo() {
  const ref = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;
      pickerRef.current = new Lightpickr(ref.current, {
        range: true,
        minDate: '2024-01-01',
        maxDate: '2027-12-31',
        disabledDates: ['2025-06-10', '2025-06-11', '2025-06-12'],
        onBeforeSelect: function ({date}: {date: Date}) {
          return date.getDay() !== 2;
        }
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
