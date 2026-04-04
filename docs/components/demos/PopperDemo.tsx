'use client';

import {createPopper} from '@popperjs/core';
import {useEffect, useRef} from 'react';
import type {LightpickrPositionContext} from '@/types/lightpickr_position_context';

export function PopperDemo() {
  const ref = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<{destroy: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
      if (cancelled || !ref.current) return;

      let popper: ReturnType<typeof createPopper> | null = null;
      pickerRef.current = new Lightpickr(ref.current, {
        position: function (ctx: LightpickrPositionContext) {
          const anchor = ctx.$anchor || ctx.$target;
          const $pointer = ctx.$pointer;
          if (popper) {
            popper.destroy();
            popper = null;
          }
          popper = createPopper(anchor, ctx.$datepicker, {
            placement: 'bottom-start',
            modifiers: [
              {
                name: 'flip',
                options: {
                  padding: {
                    top: 64,
                  },
                },
              },
              {
                name: 'offset',
                options: {
                  offset: [0, 20],
                },
              },
              {
                name: 'arrow',
                options: {
                  element: $pointer,
                },
              },
            ],
          });
          popper.update();
          return function (hideDone: () => void) {
            if (popper) {
              popper.destroy();
              popper = null;
            }
            hideDone();
          };
        }
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
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}
