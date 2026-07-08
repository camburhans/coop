import { AiNote } from '@/components/ui/ai-note';
import { Panel } from '@/components/ui/panel';
import { RecallMeter } from '@/components/ui/recall-meter';
import { getCurrentVerse } from '@/lib/verse/verse';

import { VerseSet } from './verse-set';

/**
 * Placeholder recall figure. Real memorization tracking is the owner's later
 * method (Architecture §4) — no streak logic is built here, so the meter shows
 * a fixed, clearly-labelled placeholder rather than fabricated progress.
 */
const RECALL_PLACEHOLDER = 0;

/**
 * Scripture · Foundation — the current verse (floor-right).
 *
 * Async Server Component. Reads {@link getCurrentVerse}. The reference renders
 * in tracked gold mono; the passage in Newsreader serif italic with a
 * gold-gradient dropcap on its first letter. Below sits a (placeholder)
 * {@link RecallMeter}, C.O.O.P.'s static note, and the {@link VerseSet}
 * affordance. When no verse is set, only the empty line + affordance show.
 */
export async function VersePanel() {
  const verse = await getCurrentVerse();

  return (
    <Panel label="Scripture · Foundation" meta="FOUNDATION" className="p-verse">
      {verse ? (
        <>
          <div className="verse-ref mb-4 uppercase">{verse.reference}</div>
          <p className="verse-text">
            <span className="dropcap">{verse.text.slice(0, 1)}</span>
            {verse.text.slice(1)}
          </p>
          <div className="mt-auto pt-6">
            <RecallMeter value={RECALL_PLACEHOLDER} label="RECALL · PLACEHOLDER" />
            <AiNote>
              I&apos;ll cue your recall — <em>Sprint 4</em>.
            </AiNote>
            <VerseSet current={{ reference: verse.reference, text: verse.text }} />
          </div>
        </>
      ) : (
        <div className="mt-auto pt-6">
          <p className="panel-empty">No verse set.</p>
          <VerseSet />
        </div>
      )}
    </Panel>
  );
}
