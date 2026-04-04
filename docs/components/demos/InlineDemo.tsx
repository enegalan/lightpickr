'use client';

import {useEffect, useRef} from 'react';

export function InlineDemo() {
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
    <div
      ref={mountRef}
      aria-label="Inline Lightpickr demo"
    />
  );
}
