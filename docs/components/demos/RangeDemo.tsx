'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function RangeDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        range: true,
        minDate: '2024-01-01',
        maxDate: '2027-12-31',
        disabledDates: ['2025-06-10', '2025-06-11', '2025-06-12'],
        onBeforeSelect: function ({date}: {date: Date}) {
          return date.getDay() !== 2;
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
