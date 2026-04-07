'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function BasicPositioningDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        position: 'right center',
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input
        ref={ref}
        type="text"
        readOnly
        placeholder="Focus to open (popover on the right)"
        className={demoInputClassName}
      />
    </div>
  );
}
