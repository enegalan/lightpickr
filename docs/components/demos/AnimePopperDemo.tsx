'use client';

import {createPopper} from '@popperjs/core';
import anime from 'animejs';
import {useEffect, useRef} from 'react';
import type {LightpickrPositionContext} from '@/types/lightpickr_position_context';

export function AnimePopperDemo() {
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
        onShow(isFinished: boolean) {
          if (isFinished && popper) {
            popper.update();
          }
        },
        position({
          $datepicker,
          $target,
          $anchor,
          $pointer,
          isViewChange,
        }: LightpickrPositionContext) {
          const reference = $anchor || $target;

          if (popper) {
            popper.destroy();
            popper = null;
          }

          popper = createPopper(reference, $datepicker, {
            placement: 'bottom',
            onFirstUpdate() {
              if (!isViewChange) {
                anime.remove($datepicker);
              }
              $datepicker.style.transformOrigin = 'center top';
              if (!isViewChange) {
                anime({
                  targets: $datepicker,
                  opacity: [0, 1],
                  rotateX: [-90, 0],
                  easing: 'spring(1.3, 80, 5, 0)',
                });
              }
            },
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 10],
                },
              },
              {
                name: 'arrow',
                options: {
                  element: $pointer,
                },
              },
              {
                name: 'computeStyles',
                options: {
                  gpuAcceleration: false,
                },
              },
            ],
          });
          popper.update();

          return function (hideDone: () => void) {
            const current = popper;
            if (!current) {
              hideDone();
              return;
            }
            const anim = anime({
              targets: $datepicker,
              opacity: 0,
              rotateX: -90,
              duration: 300,
              easing: 'easeOutCubic',
            });
            const finish = () => {
              current.destroy();
              if (popper === current) {
                popper = null;
              }
              hideDone();
            };
            (anim.finished || Promise.resolve()).then(finish);
          };
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
        className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}
