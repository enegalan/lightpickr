'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function MobileDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        isMobile: true,
        autoClose: true,
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input
        ref={ref}
        type="text"
        readOnly
        placeholder="Focus or tap to open modal"
        className={demoInputClassName}
      />
    </div>
  );
}
