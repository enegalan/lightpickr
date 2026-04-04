'use client';

import {useEffect, useRef} from 'react';
import type {LightpickrPositionContext} from '@/types/lightpickr_position_context';

export function ManualPositionDemo() {
  const ref = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;

      pickerRef.current = new Lightpickr(ref.current, {
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
      });
    })();

    return () => {
      cancelled = true;
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, []);

  return (
    <div className="my-4 max-w-xs">
      <input
        ref={ref}
        type="text"
        readOnly
        placeholder="Focus to open (centered on field)"
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
        aria-label="Demo field for manual position option"
      />
    </div>
  );
}
