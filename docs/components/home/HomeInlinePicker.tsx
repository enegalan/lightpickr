'use client';

import {useEffect, useRef} from 'react';

export function HomeInlinePicker() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !mountRef.current) return;

      pickerRef.current = new Lightpickr(mountRef.current, {
        inline: true,
      });
    })();

    return () => {
      cancelled = true;
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, []);

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-3">
      <div
        ref={mountRef}
        className="flex min-h-[min(22rem,55vh)] w-full max-w-max justify-center"
        aria-label="Lightpickr calendar demo"
      />
    </div>
  );
}
