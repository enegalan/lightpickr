'use client';

import {useRef} from 'react';
import {useLightpickrInstance} from '@/lib/lightpickr_demo';

export function InlineDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  useLightpickrInstance(
    mountRef,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        inline: true,
      }),
    []
  );

  return <div ref={mountRef} aria-label="Inline Lightpickr demo" />;
}
