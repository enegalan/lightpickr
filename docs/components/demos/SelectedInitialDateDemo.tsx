'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function SelectedInitialDateDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        selectedDates: [new Date()],
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input ref={ref} type="text" readOnly className={demoInputClassName} />
    </div>
  );
}
