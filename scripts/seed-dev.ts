/**
 * Dev-database seed.
 *
 * Populates the DEV Postgres with a realistic spread so the dashboard and the
 * productivity module render against lifelike data: a handful of projects
 * across statuses/priorities, a dozen tasks (mixed priority/energy, a few
 * dated, a couple standalone, some done), a few of today's calendar events
 * (one ongoing so the "now" node lights up) plus one tomorrow, and one current
 * verse so the Scripture panel has real serif text.
 *
 *   pnpm db:seed          # insert the spread
 *   pnpm db:seed:reset    # wipe the seeded tables first, then insert
 *
 * SAFETY: this inserts and (with --reset) DELETES rows. It refuses to run
 * unless DATABASE_URL clearly points at the dev database — the connection
 * string must contain "5433" or "coop_dev". It must NEVER touch production.
 */
import {
  Prisma,
  PrismaClient,
  Energy,
  Priority,
  ProjectStatus,
  TaskStatus,
} from '@prisma/client';

// Load .env FIRST so the guard below and the Prisma client both see
// DATABASE_URL — a bare `tsx` process does not auto-load .env.
try {
  process.loadEnvFile();
} catch {
  // .env is optional if DATABASE_URL is already exported in the environment.
}

// ---------------------------------------------------------------------------
// Dev-database guard — refuse to run against anything that isn't obviously dev.
// ---------------------------------------------------------------------------
const dbUrl = process.env.DATABASE_URL ?? '';
if (!(dbUrl.includes('5433') || dbUrl.includes('coop_dev'))) {
  console.error(
    'REFUSING TO RUN: DATABASE_URL does not look like the DEV database.\n' +
    'It must contain "5433" or "coop_dev". This script inserts (and with\n' +
    '--reset deletes) rows and must never touch production.',
  );
  process.exit(1);
}

const RESET = process.argv.includes('--reset');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Date helpers — all built from the server's LOCAL day so the seeded calendar
// lands in the same "today" window the dashboard reads (listTodayEvents).
// ---------------------------------------------------------------------------

/** A @db.Date value N days from today (local midnight). Negative = past. */
function dateOffset(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/** A timestamp today at the given local hour:minute. */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** A timestamp tomorrow at the given local hour:minute. */
function tomorrowAt(hour: number, minute = 0): Date {
  const d = todayAt(hour, minute);
  d.setDate(d.getDate() + 1);
  return d;
}

/** `now` shifted by a number of minutes. */
function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

async function reset(): Promise<void> {
  console.log('--reset: wiping seeded tables (tasks, projects, calendar events, verses)…');
  // Tasks first: Task.projectId is onDelete: SetNull, so deleting projects
  // would orphan rather than remove tasks. Wipe children explicitly.
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.calendarEvent.deleteMany({});
  await prisma.verse.deleteMany({});
}

async function main(): Promise<void> {
  console.log('--- seed-dev (DEV database only) ---');
  console.log(`DATABASE_URL: ${dbUrl.replace(/:[^:@/]+@/, ':***@')}\n`);

  if (RESET) {
    await reset();
  }

  // -------------------------------------------------------------------------
  // Projects — across statuses and priorities.
  // -------------------------------------------------------------------------
  const consoleProject = await prisma.project.create({
    data: {
      name: 'Command Console Buildout',
      description: 'Sprint 2 — the gilded dashboard shell and productivity module.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH, // the active, high-priority one
      dueDate: dateOffset(9),
    },
  });

  const scriptureProject = await prisma.project.create({
    data: {
      name: 'Scripture Memory Plan',
      description: 'A steady weekly rhythm through Proverbs.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.MEDIUM,
    },
  });

  const garageProject = await prisma.project.create({
    data: {
      name: 'Garage Workshop Buildout',
      description: 'On hold until the console work ships.',
      status: ProjectStatus.PAUSED, // the paused one
      priority: Priority.MEDIUM,
    },
  });

  const taxProject = await prisma.project.create({
    data: {
      name: '2025 Tax Filing',
      description: 'Filed and closed out.',
      status: ProjectStatus.DONE, // the done one
      priority: Priority.LOW,
      dueDate: dateOffset(-40),
    },
  });

  console.log('Created 4 projects (ACTIVE·HIGH, ACTIVE·MED, PAUSED·MED, DONE·LOW).');

  // -------------------------------------------------------------------------
  // Tasks — ~10 across the projects + 2 standalone. Mixed priority/energy,
  // a few dated (overdue / today / future), a couple DONE.
  // -------------------------------------------------------------------------
  const tasks: Prisma.TaskCreateManyInput[] = [
    // Command Console Buildout
    {
      projectId: consoleProject.id,
      title: 'Wire the dev seed script',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      energy: Energy.HIGH,
      dueDate: dateOffset(0), // today
      notes: 'Guarded to the dev DB; supports --reset.',
    },
    {
      projectId: consoleProject.id,
      title: 'Add loading and error states',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      energy: Energy.MEDIUM,
      dueDate: dateOffset(2), // future
    },
    {
      projectId: consoleProject.id,
      title: 'Mobile pass at 760px',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      energy: Energy.HIGH,
    },
    {
      projectId: consoleProject.id,
      title: 'Port the productivity prototype CSS',
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      energy: Energy.LOW,
    },
    // Scripture Memory Plan
    {
      projectId: scriptureProject.id,
      title: 'Memorize Proverbs 3:5–6',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      energy: Energy.MEDIUM,
      dueDate: dateOffset(4), // future
    },
    {
      projectId: scriptureProject.id,
      title: 'Review last week’s passage',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      energy: Energy.LOW,
    },
    // Garage Workshop Buildout (paused)
    {
      projectId: garageProject.id,
      title: 'Order the pegboard and hooks',
      status: TaskStatus.BLOCKED,
      priority: Priority.LOW,
      energy: Energy.MEDIUM,
      notes: 'Blocked until the console work ships.',
    },
    {
      projectId: garageProject.id,
      title: 'Measure the wall studs',
      status: TaskStatus.DONE,
      priority: Priority.LOW,
      energy: Energy.HIGH,
    },
    // 2025 Tax Filing (done)
    {
      projectId: taxProject.id,
      title: 'Submit the federal return',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      energy: Energy.LOW,
      dueDate: dateOffset(-42),
    },
    {
      projectId: taxProject.id,
      title: 'Archive receipts',
      status: TaskStatus.DONE,
      priority: Priority.LOW,
      energy: Energy.LOW,
    },
    // Standalone (no project)
    {
      projectId: null,
      title: 'Renew car registration',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      energy: Energy.MEDIUM,
      dueDate: dateOffset(-3), // overdue
    },
    {
      projectId: null,
      title: 'Call the dentist',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      energy: Energy.LOW,
    },
  ];

  const createdTasks = await prisma.task.createMany({ data: tasks });
  console.log(`Created ${createdTasks.count} tasks (10 across projects + 2 standalone).`);

  // -------------------------------------------------------------------------
  // Calendar — a few events TODAY (one ongoing for the "now" node) + tomorrow.
  // -------------------------------------------------------------------------
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: 'Morning standup',
        startsAt: todayAt(9, 0),
        endsAt: todayAt(9, 30),
        location: 'Home office',
      },
      {
        // Ongoing right now: started 30m ago, ends in 45m — lights the "now" node.
        title: 'Deep work · console buildout',
        startsAt: nowPlusMinutes(-30),
        endsAt: nowPlusMinutes(45),
        location: 'Studio',
      },
      {
        title: 'Evening review & planning',
        startsAt: todayAt(18, 30),
        endsAt: todayAt(19, 0),
      },
      {
        title: 'Dentist appointment',
        startsAt: tomorrowAt(10, 0),
        endsAt: tomorrowAt(10, 45),
        location: 'Downtown dental',
      },
    ],
  });
  console.log('Created 4 calendar events (3 today incl. 1 ongoing, 1 tomorrow).');

  // -------------------------------------------------------------------------
  // Verse — one current verse. Public-domain KJV.
  // -------------------------------------------------------------------------
  // Keep the "exactly one current" invariant: clear any existing current flag
  // (only relevant without --reset), then create the new current verse.
  await prisma.verse.updateMany({
    where: { isCurrent: true },
    data: { isCurrent: false },
  });
  await prisma.verse.create({
    data: {
      reference: 'Proverbs 3:5–6 (KJV)',
      text:
        'Trust in the LORD with all thine heart; and lean not unto thine own ' +
        'understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
      isCurrent: true,
    },
  });
  console.log('Set current verse: Proverbs 3:5–6 (KJV).');

  console.log('\n--- seed-dev OK ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error('\nseed-dev FAILED:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
