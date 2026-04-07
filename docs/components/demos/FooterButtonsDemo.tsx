'use client';

import {useEffect, useRef} from 'react';
import {demoFieldWrapClassName, demoInputClassName, loadLightpickr} from '@/lib/lightpickr_demo';

export function FooterButtonsDemo() {
  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);
  const pickersRef = useRef<Array<{destroy: () => void}>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await loadLightpickr();
      if (cancelled) return;
      const out: Array<{destroy: () => void}> = [];
      if (refA.current) {
        out.push(new Lightpickr(refA.current, {buttons: ['today', 'clear']}));
      }
      if (refB.current) {
        out.push(
          new Lightpickr(refB.current, {
            buttons: [
              {
                className: 'lp-doc-footer-btn-block',
                content: 'Next Monday',
                onClick: function (picker: {selectDate: (d: Date) => void}) {
                  const d = new Date();
                  const day = d.getDay();
                  const add = (8 - day) % 7 || 7;
                  d.setDate(d.getDate() + add);
                  picker.selectDate(d);
                },
              },
            ],
          })
        );
      }
      pickersRef.current = out;
    })();
    return () => {
      cancelled = true;
      pickersRef.current.forEach((p) => p.destroy());
      pickersRef.current = [];
    };
  }, []);

  return (
    <div className={`${demoFieldWrapClassName} space-y-4`}>
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase text-fd-muted-foreground">
          Today + clear
        </span>
        <input
          ref={refA}
          type="text"
          readOnly
          className={demoInputClassName}
        />
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase text-fd-muted-foreground">
          Custom action
        </span>
        <input
          ref={refB}
          type="text"
          readOnly
          className={demoInputClassName}
        />
      </div>
    </div>
  );
}
