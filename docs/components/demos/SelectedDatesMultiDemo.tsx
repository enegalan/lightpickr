'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function SelectedDatesMultiDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) => {
      const startDate = new Date('2021-07-20');
      return new Lightpickr(el, {
        startDate,
        multiple: true,
        selectedDates: [startDate, '2021-07-25', 1626307200000],
      });
    },
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input ref={ref} type="text" readOnly className={demoInputClassName} />
    </div>
  );
}
