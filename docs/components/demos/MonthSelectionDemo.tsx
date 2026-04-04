'use client';

import {useEffect, useRef} from 'react';

export function MonthSelectionDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !mountRef.current) return;
      pickerRef.current = new Lightpickr(mountRef.current, {
        inline: true,
        view: 'month',
        allowedViews: ['month', 'year'],
        autoClose: false,
        format: 'YYYY-MM',
        startDate: new Date(),
        selectedDates: [new Date()],
        onChangeViewDate(payload: {
          month: number;
          year: number;
          datepicker: {selectDate: (d: Date) => void};
        }) {
          const {month, year, datepicker} = payload;
          datepicker.selectDate(new Date(year, month, 1));
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
    <div
      ref={mountRef}
      className="my-4 max-w-xs"
      aria-label="Month-only Lightpickr demo"
    />
  );
}
