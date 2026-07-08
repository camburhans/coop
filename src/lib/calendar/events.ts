import 'server-only';

import type { CalendarEvent } from '@prisma/client';

import { prisma } from '@/lib/db/client';

/**
 * Calendar reads for the dashboard.
 *
 * V1 is read-only: the dashboard reflects whatever `CalendarEvent` rows exist
 * (seeded, or later synced from Google / entered manually). No creation path
 * lives here yet.
 */

/**
 * Events that start on the server's local calendar day for `now`, ordered by
 * start time. The window is `[startOfDay, startOfNextDay)` built from the local
 * Y/M/D so the boundary matches the operator's day, not UTC.
 */
export async function listTodayEvents(now: Date = new Date()): Promise<CalendarEvent[]> {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.calendarEvent.findMany({
    where: { startsAt: { gte: start, lt: end } },
    orderBy: { startsAt: 'asc' },
  });
}
