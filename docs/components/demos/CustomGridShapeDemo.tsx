'use client';

import {useRef} from 'react';
import {demoFieldWrapClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function CustomGridShapeDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  useLightpickrInstance(
    mountRef,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        inline: true,
        view: 'month',
        allowedViews: ['month', 'year'],
        autoClose: false,
        monthViewCount: 8,
        monthViewRadius: 1,
        monthViewCols: 4,
        monthViewRows: 2,
        yearViewCount: 15,
        yearViewRadius: 7,
        yearViewCols: 5,
        yearViewRows: 3,
      }),
    []
  );

  return (
    <div
      ref={mountRef}
      className={demoFieldWrapClassName}
      aria-label="Custom month/year grid shape Lightpickr demo"
    />
  );
}
