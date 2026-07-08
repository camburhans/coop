import type { CalendarEvent } from '@prisma/client';

import { Panel } from '@/components/ui/panel';
import { listTodayEvents } from '@/lib/calendar/events';

/** "07:00" — 24-hour, server-local. */
const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** The time cell for a row — a clock time, or "ALL DAY". */
function eventTime(event: CalendarEvent): string {
  return event.allDay ? 'ALL DAY' : TIME_FMT.format(event.startsAt);
}

/** "90 MIN" / "1 HR" / "1H 30M" from a minute count. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} HR` : `${hours}H ${rem}M`;
}

/** Mono meta: duration (when known) then an uppercased location. */
function eventMeta(event: CalendarEvent): string {
  const parts: string[] = [];
  if (event.allDay) {
    parts.push('ALL DAY');
  } else if (event.endsAt) {
    parts.push(formatDuration(Math.round((event.endsAt.getTime() - event.startsAt.getTime()) / 60000)));
  }
  if (event.location) parts.push(event.location.toUpperCase());
  return parts.join(' · ');
}

/** An event is "now" while it is underway: all-day today, or start ≤ now < end. */
function isOngoing(event: CalendarEvent, now: Date): boolean {
  if (event.allDay) return true;
  const start = event.startsAt.getTime();
  const end = event.endsAt ? event.endsAt.getTime() : start;
  return start <= now.getTime() && now.getTime() < end;
}

/** "2H 30M" / "45M" until a future moment. */
function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return hours > 0 ? `${hours}H ${mins}M` : `${mins}M`;
}

/**
 * Today's Calendar — the day's timeline (top-right, 5×2).
 *
 * Async Server Component. Reads {@link listTodayEvents} for the server-local
 * day. A mono "next commitment in …" countdown (computed from the events) leads
 * into a vertical timeline; the ongoing event carries the indigo "now" node and
 * a static "NOW" tag. Read-only in V1 — no creation UI; it simply reflects the
 * rows. Empty by default until the seed lands.
 */
export async function CalendarPanel() {
  const now = new Date();
  const events = await listTodayEvents(now);

  const next = events.find((event) => event.startsAt.getTime() > now.getTime());

  return (
    <Panel label="Today's Calendar" meta={`${events.length} SCHEDULED`} className="p-calendar">
      {events.length === 0 ? (
        <p className="panel-empty">No events today.</p>
      ) : (
        <>
          <div className="cal-countdown">
            <span className="cd-dot" aria-hidden />
            {next ? (
              <>
                NEXT COMMITMENT IN <em>{formatCountdown(next.startsAt.getTime() - now.getTime())}</em> ·{' '}
                {next.title.toUpperCase()} {eventTime(next)}
              </>
            ) : (
              <>NOTHING FURTHER TODAY</>
            )}
          </div>

          <div className="cal-rail">
            {events.map((event) => {
              const nowEvent = isOngoing(event, now);
              return (
                <div key={event.id} className={nowEvent ? 'cal-ev is-now' : 'cal-ev'}>
                  <div className="cal-node" aria-hidden />
                  <div className="cal-time">
                    {eventTime(event)}
                    {nowEvent ? <span className="now-tag">NOW</span> : null}
                  </div>
                  <div className="cal-title">{event.title}</div>
                  {eventMeta(event) ? <div className="cal-meta">{eventMeta(event)}</div> : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
