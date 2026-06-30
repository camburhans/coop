import { PanelGrid } from '@/components/shell/panel-grid';
import { AiNote } from '@/components/ui/ai-note';
import { EnergyTag, type Energy } from '@/components/ui/energy-tag';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';
import { PriorityBar, type Priority } from '@/components/ui/priority-bar';
import { RecallMeter } from '@/components/ui/recall-meter';

/**
 * Dashboard ("/") — the command console's home surface.
 *
 * Four gilded panels in the locked layout: Priorities leads (top-left,
 * hero-weight 7×2), Today's Calendar sits beside it (top-right), and the floor
 * row carries the Finance hero (left) and the Scripture foundation (right).
 *
 * Everything here is a STATIC placeholder — no database, no wiring. Each panel
 * looks real but reads clearly as not-yet-wired via mono "PLACEHOLDER" /
 * "AWAITING SPRINT N" markers. Real data lands in later sprints (Finance →
 * Sprint 3, Priorities/Calendar → the Productivity module in Sprint 4).
 */

const PRIORITIES: ReadonlyArray<{
  rank: string;
  priority: Priority;
  title: string;
  meta: string;
  energy: Energy;
}> = [
    { rank: '01', priority: 'HIGH', title: 'Draft the strategy memo', meta: 'DUE TODAY · DEEP WORK', energy: 'HIGH' },
    {
      rank: '02',
      priority: 'MEDIUM',
      title: 'Prepare the review agenda',
      meta: 'TODAY · BEFORE 15:00',
      energy: 'MEDIUM',
    },
    { rank: '03', priority: 'LOW', title: 'Ship the Q3 roadmap', meta: 'ONGOING GOAL · 68% DONE', energy: 'MEDIUM' },
    { rank: '04', priority: 'LOW', title: 'Read 12 books this year', meta: 'ONGOING GOAL · 7 / 12', energy: 'LOW' },
    { rank: '05', priority: 'LOW', title: 'Reply to the intro email', meta: 'TODAY · LOW PRIORITY', energy: 'LOW' },
  ];

const EVENTS: ReadonlyArray<{ time: string; title: string; meta: string; now: boolean }> = [
  { time: '07:00', title: 'Deep work — strategy memo', meta: '90 MIN · PROTECTED', now: true },
  { time: '09:30', title: 'Standup — product team', meta: 'VIDEO · 6 ATTENDEES', now: false },
  { time: '12:30', title: 'Lunch — downtown', meta: 'PERSONAL · 1 HR', now: false },
  { time: '15:00', title: 'Quarterly review call', meta: 'VIDEO · INVESTORS', now: false },
  { time: '18:30', title: 'Gym — strength session', meta: 'PERSONAL · 60 MIN', now: false },
];

const SPARK_FILL =
  'M0 52 L22 49 L44 53 L66 44 L88 47 L110 38 L132 42 L154 33 L176 37 L198 27 L220 31 L242 22 L264 26 L286 17 L308 20 L318 13 L318 70 L0 70 Z';
const SPARK_LINE =
  'M0 52 L22 49 L44 53 L66 44 L88 47 L110 38 L132 42 L154 33 L176 37 L198 27 L220 31 L242 22 L264 26 L286 17 L308 20 L318 13';

export default function DashboardPage() {
  return (
    <PanelGrid>
      {/* PILLAR · MISSION — Priorities lead (top-left, 7×2) */}
      <Panel label="Priorities · Mission" meta="PLACEHOLDER · TODAY + ONGOING" className="p-priorities">
        <ul className="plist">
          {PRIORITIES.map((item) => (
            <li key={item.rank} className="prow">
              <span className="rank">{item.rank}</span>
              <PriorityBar priority={item.priority} />
              <div className="task">
                <span>{item.title}</span>
                <small>{item.meta}</small>
              </div>
              <EnergyTag energy={item.energy} />
            </li>
          ))}
        </ul>
        <AiNote>
          These are <em>placeholder</em> priorities — real ranking arrives when the Productivity module
          is wired in Sprint 4.
        </AiNote>
      </Panel>

      {/* SECONDARY — Today's Calendar (top-right) */}
      <Panel label="Today's Calendar" meta="PLACEHOLDER · 5 EVENTS" className="p-calendar">
        <div className="cal-countdown">
          <span className="cd-dot" aria-hidden />
          NEXT COMMITMENT IN <em>2H 30M</em> · STANDUP 09:30
        </div>
        <div className="cal-rail">
          {EVENTS.map((event) => (
            <div key={event.time} className={event.now ? 'cal-ev is-now' : 'cal-ev'}>
              <div className="cal-node" aria-hidden />
              <div className="cal-time">
                {event.time}
                {event.now ? <span className="now-tag">NOW</span> : null}
              </div>
              <div className="cal-title">{event.title}</div>
              <div className="cal-meta">{event.meta}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* PILLAR · STEWARDSHIP — Finance hero (floor-left, hero-weight) */}
      <Panel label="Finance · Stewardship" meta="AWAITING SPRINT 3" className="p-finance">
        <div className="networth-label">TOTAL NET WORTH</div>
        <div className="networth">$1,284,910</div>

        <div className="fin-status">
          <div className="delta">+$8,240 · +0.65% THIS MONTH</div>
          <span className="budget-chip is-ok">ON TRACK</span>
        </div>

        <svg className="spark" viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dashSparkStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--gold)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--gold-hi)" />
            </linearGradient>
            <linearGradient id="dashSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--gold)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path fill="url(#dashSparkFill)" d={SPARK_FILL} />
          <path className="line" stroke="url(#dashSparkStroke)" d={SPARK_LINE} />
          <circle cx="318" cy="13" r="3" fill="var(--good)" />
        </svg>

        <div className="accounts">
          <div className="acct">
            <b>CHECKING</b>
            <strong>$24,180</strong>
            <i>OPERATING · LIQUID</i>
          </div>
          <div className="acct">
            <b>SAVINGS</b>
            <strong>$86,400</strong>
            <i>6-MONTH RESERVE</i>
          </div>
          <div className="acct">
            <b>INVESTMENTS</b>
            <strong>$1,174,330</strong>
            <i className="is-up">+1.2% TODAY</i>
          </div>
        </div>

        <div className="bills">
          <span className="bills-lbl">UPCOMING BILLS · NEXT 7 DAYS</span>
          <span className="bills-val">
            <em>$3,420</em> · 4 DUE
          </span>
        </div>

        <Label className="mt-5 block">PLACEHOLDER FIGURES · AWAITING SPRINT 3</Label>
      </Panel>

      {/* PILLAR · FOUNDATION — Scripture (floor-right) */}
      <Panel label="Scripture · Foundation" meta="PLACEHOLDER · RECALL TRAINING" className="p-verse">
        <div className="verse-ref mb-4">PROVERBS 3:5–6</div>
        <p className="verse-text">
          <span className="dropcap">T</span>
          rust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy
          ways acknowledge him, and he shall direct thy paths.
        </p>
        <div className="mt-auto pt-6">
          <RecallMeter value={40} label="COMPLETE · DAY 12 / 30" />
          <AiNote>
            A <em>placeholder</em> passage — your memory work begins when Scripture is wired in a later
            sprint.
          </AiNote>
        </div>
      </Panel>
    </PanelGrid>
  );
}
