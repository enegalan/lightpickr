import Link from 'next/link';
import { DM_Sans, Fraunces } from 'next/font/google';
import {
  Accessibility,
  ArrowRight,
  CalendarRange,
  Clock,
  Layers,
  Package,
  Palette,
  Puzzle,
  Terminal,
} from 'lucide-react';
import { HomeInlinePicker } from '@/components/home/HomeInlinePicker';
import { gitConfig } from '@/lib/shared';

const githubRepoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
});

const sans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
});

const features = [
  {
    icon: Package,
    title: 'No extra dependencies',
    body: 'One package, one CSS file. Built-in formatting—no peer date library or Popper in the bundle.',
  },
  {
    icon: CalendarRange,
    title: 'Single days or ranges',
    body: 'Pick one date or a span with min/max bounds, disabled days, and vetoes via onBeforeSelect.',
  },
  {
    icon: Clock,
    title: 'Optional time',
    body: 'Same component when you need a datetime: steps for hours and minutes, sensible defaults.',
  },
  {
    icon: Palette,
    title: 'CSS-variable theming',
    body: 'BEM classes plus variables so the picker looks like the rest of your UI, not a foreign skin.',
  },
  {
    icon: Puzzle,
    title: 'Plugins',
    body: 'Register small extensions with setup/teardown hooks instead of patching internals.',
  },
  {
    icon: Accessibility,
    title: 'Built for real UIs',
    body: 'Keyboard navigation, focus trap, and ARIA labels so popover mode stays usable.',
  },
];

export default function HomePage() {
  return (
    <div className={`flex flex-1 flex-col ${sans.className}`}>
      <section className="relative isolate overflow-hidden border-b border-fd-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,var(--color-fd-primary)_0%,transparent_50%)] opacity-[0.18] dark:opacity-[0.28]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklab,var(--color-fd-primary)_35%,transparent)_0%,transparent_42%)] opacity-60 dark:opacity-40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(var(--color-fd-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-fd-border)_1px,transparent_1px)`,
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 75% 65% at 50% -5%,black_22%,transparent_65%)',
          }}
        />
        <div className="mx-auto w-full max-w-(--fd-layout-width) px-4 pb-20 pt-14 md:pb-28 md:pt-20">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_min(26rem,100%)] lg:items-center lg:gap-16">
            <div className="order-1 flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card/90 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-fd-foreground shadow-sm backdrop-blur-md dark:bg-fd-card/50">
                  <Layers className="size-3.5 shrink-0 text-fd-primary" aria-hidden />
                  ~15 kB gzipped
                </span>
                <span className="h-1 w-1 rounded-full bg-fd-border" aria-hidden />
                <span className="text-xs font-medium text-fd-muted-foreground">npm · ESM &amp; UMD</span>
              </div>
              <h1
                className={`${display.className} mt-7 max-w-4xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.02em] text-balance sm:text-5xl md:text-[2.85rem] lg:text-[3.15rem]`}
              >
                A datepicker that fits your stack,{' '}
                <span className="bg-linear-to-r from-fd-primary via-fd-primary to-fd-muted-foreground/80 bg-clip-text text-transparent dark:to-fd-muted-foreground/70">
                  not the other way around.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fd-muted-foreground text-pretty md:text-lg">
                Dependency-free dates and ranges, optional time, CSS-variable theming, plugins, and
                accessibility defaults—popover, portal, or inline.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/docs"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-fd-primary px-6 text-sm font-semibold text-fd-primary-foreground shadow-md shadow-fd-primary/20 transition-[transform,box-shadow] hover:shadow-lg hover:shadow-fd-primary/25 active:scale-[0.99]"
                >
                  Get started
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/docs/examples"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-fd-border bg-fd-background/80 px-6 text-sm font-semibold text-fd-foreground backdrop-blur-sm transition-colors hover:border-fd-primary/30 hover:bg-fd-accent/40"
                >
                  View examples
                </Link>
                <a
                  href={githubRepoUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="inline-flex h-12 items-center justify-center px-4 text-sm font-medium text-fd-muted-foreground underline-offset-4 hover:text-fd-foreground hover:underline"
                >
                  GitHub
                </a>
              </div>
            </div>
            <div className="order-2 flex w-full flex-col items-center lg:items-end">
              <HomeInlinePicker />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-(--fd-layout-width) px-4 py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-fd-border to-transparent"
        />
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:gap-y-12">
          <div className="lg:col-span-5 lg:pt-2">
            <h2
              className={`${display.className} text-sm font-semibold tracking-wide text-fd-primary md:text-base`}
            >
              Capabilities
            </h2>
            <p
              className={`${display.className} mt-3 text-2xl font-semibold leading-tight tracking-tight md:text-3xl`}
            >
              Booking, scheduling, forms—one API
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground md:text-base">
              Custom positioning, animated open/close, footer actions, and per-cell rendering when
              you need them.
            </p>
            <div className="mt-8 rounded-2xl border border-fd-border bg-linear-to-br from-fd-muted/25 to-transparent p-5 shadow-sm dark:from-fd-muted/15">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                <Terminal className="size-3.5" aria-hidden />
                Install
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-fd-border bg-fd-background/80 px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-fd-foreground tabular-nums dark:bg-fd-background/50">
                <code>npm install lightpickr</code>
              </pre>
              <Link
                href="/docs"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fd-primary hover:underline"
              >
                Read the docs
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:mt-0">
            {features.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card/50 p-6 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-fd-primary/35 hover:shadow-md hover:shadow-fd-primary/5 dark:bg-fd-card/30"
              >
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-fd-primary/10 text-fd-primary ring-1 ring-fd-primary/15 transition-[background-color,transform] group-hover:scale-105 group-hover:bg-fd-primary/15">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="pr-10 font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative border-t border-fd-border py-16 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_100%,var(--color-fd-primary)_0%,transparent_55%)] opacity-[0.08] dark:opacity-[0.14]"
        />
        <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-lg">
            <h2
              className={`${display.className} text-2xl font-semibold tracking-tight md:text-3xl`}
            >
              Ready to integrate?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground md:text-base">
              Install, wire an input or inline mount, then explore live examples for Popper, ranges,
              time, and custom cells.
            </p>
          </div>
          <Link
            href="/docs"
            className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-fd-primary px-8 text-sm font-semibold text-fd-primary-foreground shadow-md shadow-fd-primary/20 transition-[transform,box-shadow] hover:shadow-lg hover:shadow-fd-primary/25 active:scale-[0.99] md:self-center"
          >
            Open documentation
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
