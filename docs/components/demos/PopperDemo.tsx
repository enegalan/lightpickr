'use client';

import {createPopper, type Instance, type Options} from '@popperjs/core';
import {useRef} from 'react';
import type {LightpickrPositionContext} from '@/types/lightpickr_position_context';
import {demoFieldWrapClassName, demoInputClassName, useLightpickrInstance} from '@/lib/lightpickr_demo';

function createLightpickrPopperPosition(
  getOptions: (ctx: LightpickrPositionContext) => Options
): (ctx: LightpickrPositionContext) => (hideDone: () => void) => void {
  let popper: Instance | null = null;
  return function position(ctx: LightpickrPositionContext) {
    const anchor = ctx.$anchor || ctx.$target;
    if (popper) {
      popper.destroy();
      popper = null;
    }
    popper = createPopper(anchor, ctx.$datepicker, getOptions(ctx));
    popper.update();
    return function (hideDone: () => void) {
      if (popper) {
        popper.destroy();
        popper = null;
      }
      hideDone();
    };
  };
}

export function PopperDemo() {
  const ref = useRef<HTMLInputElement>(null);
  useLightpickrInstance(
    ref,
    (Lightpickr, el) =>
      new Lightpickr(el, {
        position: createLightpickrPopperPosition((ctx) => ({
          strategy: 'absolute',
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
                element: ctx.$pointer,
              },
            },
          ],
        })),
      }),
    []
  );

  return (
    <div className={demoFieldWrapClassName}>
      <input ref={ref} type="text" readOnly className={demoInputClassName} />
    </div>
  );
}
