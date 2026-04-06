'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function TimeDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        enableTime: true,
        format: 'YYYY-MM-DD HH:mm',
        hoursStep: 2,
        minutesStep: 15,
        minHours: 8,
        maxHours: 18,
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input ref={ref} type="text" readOnly className={demoInputClassName} />
    </div>
  );
}
