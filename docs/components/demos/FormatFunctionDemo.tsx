'use client';

import {useEffect, useRef} from 'react';

export function FormatFunctionDemo() {
  const ref = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;
      pickerRef.current = new Lightpickr(ref.current, {
        format(date: Date | Date[]) {
          const d = Array.isArray(date) ? date[0] : date;
          return d.toLocaleString('ja', {
            year: 'numeric',
            day: '2-digit',
            month: 'long',
          });
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
        placeholder="Pick a date"
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
        aria-label="Demo: format as function with ja locale"
      />
    </div>
  );
}
