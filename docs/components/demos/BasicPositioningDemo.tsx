'use client';

import {useEffect, useRef} from 'react';

export function BasicPositioningDemo() {
  const ref = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;
      pickerRef.current = new Lightpickr(ref.current, {
        position: 'right center',
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
        placeholder="Focus to open (popover on the right)"
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}
