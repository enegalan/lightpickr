'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function MonthSelectionDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  useLightpickrInstance(
    mountRef,
    (Lightpickr, el) =>
      new Lightpickr(el, {
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
      }),
    []
  );

  return (
    <div
      ref={mountRef}
      className={demoFieldWrapClassName}
      aria-label="Month-only Lightpickr demo"
    />
  );
}
