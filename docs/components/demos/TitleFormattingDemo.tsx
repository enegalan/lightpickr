'use client';

import {useEffect, useRef} from 'react';

export function TitleFormattingDemo() {
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
        out.push(
          new Lightpickr(refA.current, {
            navTitles: {
              day: '<b>MMMM</b> yyyy',
              month: 'Pick month — yyyy',
              year: 'yyyy1 – yyyy2'
            }
          })
        );
      }
      if (refB.current) {
        out.push(
          new Lightpickr(refB.current, {
            navTitles: {
              day: function (picker: {viewDate: number}) {
                const d = new Date(picker.viewDate);
                return (
                  'View: ' +
                  d.getFullYear() +
                  '-' +
                  String(d.getMonth() + 1).padStart(2, '0')
                );
              }
            }
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
          Static templates
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
          Dynamic title
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
