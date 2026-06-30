import { OWNER_NAME } from '@/config/owner';

/**
 * Pick the time-aware lead + soft voice clause for the current hour.
 *
 * Standard morning/afternoon/evening, with two off-hours moods in C.O.O.P.'s
 * voice: before 5 it's "Still up"; from 22:00 it's "Late shift". The soft
 * clause is intentionally generic — it carries no wired data in Sprint 2.
 */
function greetingFor(hour: number): { lead: string; voice: string } {
  if (hour < 5) return { lead: 'Still up', voice: "I'll keep the lights low." };
  if (hour < 12) return { lead: 'Good morning', voice: "Let's set the day in order." };
  if (hour < 17) return { lead: 'Good afternoon', voice: 'Here is where things stand.' };
  if (hour < 22) return { lead: 'Good evening', voice: 'Winding the day down.' };
  return { lead: 'Late shift', voice: "I'll keep the lights low." };
}

/**
 * Greeting — C.O.O.P. addressing the owner in the command bar.
 *
 * Server Component. Renders "{lead}, {OWNER_NAME}." with a softer voice clause
 * (text-soft) after it. Time-aware via the server clock at render; it does not
 * tick (only the LiveClock does).
 */
export function Greeting() {
  const { lead, voice } = greetingFor(new Date().getHours());

  return (
    <h1 className="greeting">
      {lead}, {OWNER_NAME}. <span className="voice-soft">{voice}</span>
    </h1>
  );
}
