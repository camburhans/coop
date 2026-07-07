/**
 * Service-layer smoke test for the productivity backend (projects + tasks).
 *
 * This exercises the SERVICE layer directly — not the HTTP routes — creating a
 * project and tasks, asserting the shared rank order, updating/completing a
 * task, and verifying that deleting a project ORPHANS its tasks (projectId →
 * null) rather than deleting them. It cleans up everything it creates.
 *
 * SAFETY: this inserts and deletes rows, so it must only ever touch the DEV
 * database. It refuses to run unless DATABASE_URL points at dev (the connection
 * string must contain "5433" or "coop_dev"). Never point it at production.
 *
 *   pnpm prod:smoke
 *
 * The `--conditions=react-server` flag in that script makes the `server-only`
 * marker import (present on every service module) resolve to a no-op under
 * tsx; without it plain Node cannot import the service layer.
 */
import { Energy, Priority, TaskStatus, type Task } from '@prisma/client';

// Load .env FIRST so both the dev-DB guard below and the Prisma client
// (constructed when the service modules are imported) see DATABASE_URL. A bare
// `tsx` process does not auto-load .env.
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
      'It must contain "5433" or "coop_dev". This script mutates data and must\n' +
      'never touch production.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tiny assertion helper.
// ---------------------------------------------------------------------------
let assertions = 0;
function assert(condition: boolean, message: string): void {
  assertions += 1;
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function titles(tasks: readonly { title: string }[]): string {
  return tasks.map((t) => t.title).join(' → ');
}

async function main(): Promise<void> {
  // Import services AFTER .env is loaded (dynamic import defers the Prisma
  // client construction, which reads DATABASE_URL, until the var is present).
  const { prisma } = await import('@/lib/db/client');
  const { createProject, getProject, deleteProject } = await import(
    '@/lib/productivity/projects'
  );
  const {
    createTask,
    listTasks,
    getTask,
    updateTask,
    completeTask,
    deleteTask,
    rankTasks,
  } = await import('@/lib/productivity/tasks');

  console.log('--- productivity-smoke (DEV database only) ---');
  console.log(`DATABASE_URL host looks like dev: ${dbUrl.replace(/:[^:@/]+@/, ':***@')}\n`);

  // Track everything created so cleanup runs even if an assertion fails.
  let projectId: string | null = null;
  const taskIds: string[] = [];

  try {
    // 1. Create a project.
    const project = await createProject({
      name: 'Smoke: Q3 Launch',
      description: 'Created by productivity-smoke — safe to delete.',
      priority: Priority.HIGH,
      // status omitted → defaults to ACTIVE
    });
    projectId = project.id;
    console.log('1. Created project:', project.id, `(${project.name}, ${project.status})`);

    // 2. Create 3 tasks with mixed priority/energy — one due-dated, one done.
    const alpha = await createTask({
      projectId: project.id,
      title: 'Deploy hotfix',
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      energy: Energy.MEDIUM,
    });
    const bravo = await createTask({
      projectId: project.id,
      title: 'File quarterly taxes',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      energy: Energy.HIGH,
      dueDate: new Date('2026-07-10'), // the due-dated one
    });
    const charlie = await createTask({
      projectId: project.id,
      title: 'Write retro notes',
      status: TaskStatus.DONE, // the done one
      priority: Priority.HIGH,
      energy: Energy.LOW,
    });
    taskIds.push(alpha.id, bravo.id, charlie.id);
    console.log('2. Created 3 tasks (Deploy hotfix / File quarterly taxes / Write retro notes)\n');

    // 3. List (scoped to this project) and ASSERT the rank order.
    const ranked = await listTasks({ projectId: project.id });
    console.log('3. Ranked order from listTasks({ projectId }):');
    for (const t of ranked) {
      console.log(
        `     - ${t.title.padEnd(22)} [status=${t.status}, priority=${t.priority}, ` +
          `energy=${t.energy}, due=${t.dueDate ? t.dueDate.toISOString().slice(0, 10) : 'none'}]`,
      );
    }
    assert(ranked.length === 3, 'listTasks returns exactly the 3 project tasks');
    assert(
      titles(ranked) === 'Deploy hotfix → File quarterly taxes → Write retro notes',
      'rank order is Deploy hotfix → File quarterly taxes → Write retro notes',
    );
    console.log(
      '   (Deploy hotfix first: active + CRITICAL. File quarterly taxes next: active,\n' +
        '    lower priority. Write retro notes last: DONE sinks below active work even\n' +
        '    though it is HIGH priority — status group dominates priority.)\n',
    );

    // 3b. Exercise the shared rankTasks() comparator directly (pure, no DB) so
    //     the due-date and energy tiebreaks are covered too.
    type Labeled = Pick<Task, 'status' | 'priority' | 'dueDate' | 'energy'> & {
      label: string;
    };
    const synthetic: Labeled[] = [
      { label: 'no-due/high-energy', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: null, energy: Energy.HIGH },
      { label: 'due-later', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: new Date('2026-07-20'), energy: Energy.LOW },
      { label: 'no-due/low-energy', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: null, energy: Energy.LOW },
      { label: 'due-sooner', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: new Date('2026-07-10'), energy: Energy.LOW },
    ];
    const rankedSynthetic = rankTasks(synthetic);
    console.log('3b. rankTasks() direct (same status+priority) — due date then energy:');
    console.log(`     ${rankedSynthetic.map((t) => t.label).join(' → ')}`);
    assert(
      rankedSynthetic.map((t) => t.label).join(' → ') ===
        'due-sooner → due-later → no-due/high-energy → no-due/low-energy',
      'due dates sort sooner-first with nulls last; energy breaks the final tie (HIGH before LOW)',
    );
    console.log('');

    // 4. Update + complete a task.
    const bumped = await updateTask(bravo.id, {
      priority: Priority.CRITICAL,
      notes: 'Bumped ahead of the deadline.',
    });
    console.log('4. Updated "File quarterly taxes":', `priority=${bumped.priority}, notes set`);
    assert(bumped.priority === Priority.CRITICAL, 'update changed priority to CRITICAL');
    assert(bumped.notes === 'Bumped ahead of the deadline.', 'update set notes');
    assert(
      bumped.status === TaskStatus.TODO,
      'partial update did NOT reset the omitted status (still TODO)',
    );
    assert(bumped.energy === Energy.HIGH, 'partial update did NOT reset the omitted energy');

    const completed = await completeTask(alpha.id);
    console.log('   Completed "Deploy hotfix":', `status=${completed.status}`);
    assert(completed.status === TaskStatus.DONE, 'completeTask set status to DONE');
    console.log('');

    // 5. Delete a task.
    await deleteTask(charlie.id);
    const goneCharlie = await getTask(charlie.id);
    console.log('5. Deleted "Write retro notes"');
    assert(goneCharlie === null, 'deleted task is gone');
    console.log('');

    // 6. Delete the project — remaining tasks must survive with projectId=null.
    await deleteProject(project.id);
    console.log('6. Deleted project — remaining tasks should be orphaned, not deleted:');
    const orphanAlpha = await getTask(alpha.id);
    const orphanBravo = await getTask(bravo.id);
    assert((await getProject(project.id)) === null, 'project is gone');
    assert(orphanAlpha !== null, '"Deploy hotfix" survived the project deletion');
    assert(orphanBravo !== null, '"File quarterly taxes" survived the project deletion');
    assert(orphanAlpha?.projectId === null, '"Deploy hotfix" projectId set to null (not cascade-deleted)');
    assert(orphanBravo?.projectId === null, '"File quarterly taxes" projectId set to null (not cascade-deleted)');
    console.log('');

    // 7. Clean up the orphaned tasks.
    await deleteTask(alpha.id);
    await deleteTask(bravo.id);
    console.log('7. Cleaned up the two orphaned tasks.');
    assert((await getTask(alpha.id)) === null, 'cleanup removed "Deploy hotfix"');
    assert((await getTask(bravo.id)) === null, 'cleanup removed "File quarterly taxes"');

    console.log(`\n--- productivity-smoke OK (${assertions} assertions passed) ---`);
  } finally {
    // Best-effort cleanup so a mid-run failure never leaves rows behind. These
    // are no-ops on the happy path (everything is already deleted).
    if (taskIds.length > 0) {
      await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
    }
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('\nproductivity-smoke FAILED:', err);
  process.exit(1);
});
