'use client';

import {useRef} from 'react';
import type {LightpickrPositionContext} from '@/types/lightpickr_position_context';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

export function ManualPositionDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        autoClose: true,
        position({$datepicker, $target, $pointer}: LightpickrPositionContext) {
          const coords = $target.getBoundingClientRect();
          const dpHeight = $datepicker.clientHeight;
          const dpWidth = $datepicker.clientWidth;

          const top = coords.top + coords.height / 2 - dpHeight / 2;
          const left = coords.left + coords.width / 2 - dpWidth / 2;

          $datepicker.style.position = 'fixed';
          $datepicker.style.left = `${left}px`;
          $datepicker.style.top = `${top}px`;

          $pointer.style.display = 'none';
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
        placeholder="Focus to open (centered on field)"
        className={demoInputClassName}
        aria-label="Demo field for manual position option"
      />
    </div>
  );
}
