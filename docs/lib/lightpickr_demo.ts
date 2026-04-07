'use client';

import {useEffect, useRef, type DependencyList, type RefObject} from 'react';

export const demoInputClassName = 'w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm';

export const demoFieldWrapClassName = 'my-4 max-w-xs';

type LightpickrCtor = new (el: HTMLElement, opts: object) => {destroy: () => void};

export async function loadLightpickr(): Promise<{default: LightpickrCtor}> {
  const mod = await import('lightpickr');
  await import('lightpickr/lightpickr.css');
  return mod;
}

export function useLightpickrInstance<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  init: (Lightpickr: LightpickrCtor, el: T) => {destroy: () => void},
  deps: DependencyList = []
): void {
  const pickerRef = useRef<{destroy: () => void} | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await loadLightpickr();
      if (cancelled || !targetRef.current) {
        return;
      }
      (window as any).Lightpickr = pickerRef.current = init(Lightpickr, targetRef.current);
    })();
    return () => {
      cancelled = true;
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, deps);
}
