'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function FormatFunctionDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        format(date: Date | Date[]) {
          const d = Array.isArray(date) ? date[0] : date;
          return d.toLocaleString('ja', {
            year: 'numeric',
            day: '2-digit',
            month: 'long',
          });
        },
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input
        ref={ref}
        type="text"
        readOnly
        placeholder="Pick a date"
        className={demoInputClassName}
        aria-label="Demo: format as function with ja locale"
      />
    </div>
  );
}
