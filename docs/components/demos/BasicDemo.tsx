'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function BasicDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(ref, (Lightpickr, el) => new Lightpickr(el, {}), []);

  return (
    <div className={demoFieldWrapClassName}>
      <input
        ref={ref}
        type="text"
        readOnly
        placeholder='Choose a date'
        className={demoInputClassName}
      />
    </div>
  );
}
