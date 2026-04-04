'use client';

import {useEffect, useRef} from 'react';

export function FooterButtonsDemo() {
  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);
  const pickersRef = useRef<Array<{destroy: () => void}>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {default: Lightpickr} = await import('lightpickr');
      await import('lightpickr/lightpickr.css');
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
                }
              }
            ]
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
    <div className="my-4 max-w-xs space-y-4">
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase text-fd-muted-foreground">
          Today + clear
        </span>
        <input
          ref={refA}
          type="text"
          readOnly
          className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
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
          className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
