import { notFound } from 'next/navigation';

import { AiNote } from '@/components/ui/ai-note';
import { EnergyTag } from '@/components/ui/energy-tag';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';
import { PriorityBar } from '@/components/ui/priority-bar';
import { RecallMeter } from '@/components/ui/recall-meter';
import { Sigil } from '@/components/ui/sigil';
import { StatusDot } from '@/components/ui/status-dot';

/**
 * /_design — throwaway token & primitive preview (DEV ONLY, behind auth).
 *
 * Lives in the (app) route group, so the proxy requires a session. The guard
 * below also hides it entirely in production. Renders one of every Sprint 2
 * primitive, a sample Panel with an ai-note, the three fonts (incl. a
 * Newsreader verse with a gold dropcap), and a swatch of every token. May be
 * deleted at sprint end.
 */

/** Every color token from design.md (names match the CSS var names exactly). */
const COLOR_TOKENS = [
  'bg',
  'bg-2',
  'panel',
  'panel-deep',
  'border',
  'border-hover',
  'text',
  'text-soft',
  'text-faint',
  'gold',
  'gold-hi',
  'indigo',
  'good',
  'warn',
  'alert',
] as const;

const DERIVED_TOKENS = ['glow-gold', 'glow-indigo'] as const;

const SORA_WEIGHTS: ReadonlyArray<{ label: string; className: string }> = [
  { label: '200 · extralight (display figures)', className: 'font-extralight' },
  { label: '300 · light (body default)', className: 'font-light' },
  { label: '400 · regular', className: 'font-normal' },
  { label: '500 · medium', className: 'font-medium' },
  { label: '600 · semibold', className: 'font-semibold' },
];

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-8">
      {/* ---- Header ---- */}
      <header className="mb-12 flex items-center gap-4">
        <Sigil />
        <div className="flex flex-col gap-1">
          <h1 className="font-sans text-2xl font-extralight tracking-tight text-text">
            Midnight &amp; Gilt
          </h1>
          <Label>design tokens · primitives · type</Label>
        </div>
        <span className="ml-auto inline-flex items-center gap-2">
          <StatusDot label="C.O.O.P. ready" />
          <Label>C.O.O.P. ready</Label>
        </span>
      </header>

      {/* ---- Color tokens ---- */}
      <section className="mb-14">
        <Label tone="soft">color tokens</Label>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {COLOR_TOKENS.map((token) => (
            <div
              key={token}
              className="overflow-hidden rounded-xl border border-border bg-panel-deep"
            >
              <div className="h-16 w-full" style={{ background: `var(--${token})` }} />
              <div className="px-3 py-2">
                <span className="font-mono text-[10px] tracking-wider text-text-soft">
                  --{token}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Label>derived glows</Label>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DERIVED_TOKENS.map((token) => (
              <div
                key={token}
                className="overflow-hidden rounded-xl border border-border bg-panel-deep"
              >
                <div className="h-10 w-full" style={{ background: `var(--${token})` }} />
                <div className="px-3 py-2">
                  <span className="font-mono text-[10px] tracking-wider text-text-soft">
                    --{token}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Typography ---- */}
      <section className="mb-14">
        <Label tone="soft">typography</Label>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Panel label="Sora" meta="UI · DISPLAY">
            <div className="flex flex-col gap-3">
              {SORA_WEIGHTS.map((weight) => (
                <p key={weight.label} className={`font-sans text-xl text-text ${weight.className}`}>
                  The instrument is calm.
                  <span className="ml-2 font-mono text-[10px] tracking-wider text-text-faint">
                    {weight.label}
                  </span>
                </p>
              ))}
            </div>
          </Panel>

          <Panel label="Spline Sans Mono" meta="METADATA">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-sm text-text">0123456789 · STATUS · 06:42</p>
              <p className="font-mono text-xs tracking-widest text-text-soft">
                C.O.O.P. READY · DEV · LOCAL
              </p>
              <p className="font-mono text-[10px] tracking-[0.24em] text-text-faint">
                ALL LABELS · TAGS · TIMESTAMPS
              </p>
            </div>
          </Panel>
        </div>

        {/* Newsreader verse with a gold dropcap */}
        <Panel className="mt-6" label="Newsreader" meta="SCRIPTURE ONLY">
          <p className="verse-ref mb-4">PROVERBS 3:5</p>
          <p className="verse-text">
            <span className="dropcap">T</span>
            rust in the Lord with all your heart, and do not lean on your own understanding; in
            all your ways acknowledge him, and he will make straight your paths.
          </p>
        </Panel>
      </section>

      {/* ---- Primitives ---- */}
      <section className="mb-14">
        <Label tone="soft">primitives</Label>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Panel label="Priority bar" meta="LOW · MED · HIGH · CRIT">
            <div className="flex items-center gap-8">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((priority) => (
                <span key={priority} className="flex flex-col items-center gap-2">
                  <PriorityBar priority={priority} />
                  <Label>{priority}</Label>
                </span>
              ))}
            </div>
          </Panel>

          <Panel label="Energy tag" meta="HI · MED · LO">
            <div className="flex items-center gap-3">
              <EnergyTag energy="HIGH" />
              <EnergyTag energy="MEDIUM" />
              <EnergyTag energy="LOW" />
            </div>
          </Panel>

          <Panel label="Presence" meta="INDIGO = C.O.O.P. VOICE">
            <div className="flex items-center gap-3">
              <StatusDot label="ready" />
              <span className="font-mono text-xs tracking-widest text-text-soft">READY</span>
            </div>
          </Panel>

          <Panel label="Recall meter" meta="VERSE PANEL">
            <RecallMeter value={40} label="RECALL — 30 DAYS" />
          </Panel>
        </div>
      </section>

      {/* ---- Composed sample: panel + ai-note ---- */}
      <section className="mb-14">
        <Label tone="soft">composed sample</Label>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Panel label="Priorities" meta="3 ACTIVE">
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-3">
                <PriorityBar priority="HIGH" />
                <span className="flex-1 font-sans text-sm font-light text-text">
                  Ship the design foundation
                </span>
                <EnergyTag energy="HIGH" />
              </li>
              <li className="flex items-center gap-3">
                <PriorityBar priority="MEDIUM" />
                <span className="flex-1 font-sans text-sm font-light text-text">
                  Review the Sprint 2 plan
                </span>
                <EnergyTag energy="MEDIUM" />
              </li>
              <li className="flex items-center gap-3">
                <PriorityBar priority="LOW" />
                <span className="flex-1 font-sans text-sm font-light text-text">
                  Tidy the design-reference notes
                </span>
                <EnergyTag energy="LOW" />
              </li>
            </ul>

            <AiNote>
              You have <em>one high-priority</em> item and the most energy this morning — start
              with the foundation while focus is high.
            </AiNote>
          </Panel>

          <Panel label="Gilded glass" meta="HOVER ME">
            <p className="font-sans text-sm font-light leading-relaxed text-text-soft">
              Every panel shares this primitive: a 20px radius, a backdrop blur, the warm glass
              fill, a deep shadow with a faint inset highlight, and the 1px gold gradient border
              drawn with the mask technique. Hover lifts the border and adds a low gold halo.
            </p>
            <AiNote>
              <em>Static in Sprint 2.</em> The rise-in entrance and ambient drift arrive in
              Sprint 5 — gated behind your motion preference.
            </AiNote>
          </Panel>
        </div>
      </section>
    </div>
  );
}
