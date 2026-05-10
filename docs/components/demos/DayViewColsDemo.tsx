'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function DayViewColsDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  useLightpickrInstance(
    mountRef,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        inline: true,
        autoClose: false,
        dayViewCols: 6,
      }),
    []
  );

  return (
    <div
      ref={mountRef}
      className={demoFieldWrapClassName}
      aria-label="Day view columns Lightpickr demo"
    />
  );
}
