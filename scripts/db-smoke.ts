/**
 * One-off smoke test for the unified data model.
 *
 * Inserts a Project, two Tasks linked to it, and one polymorphic Link row
 * (Task -> Project, relation "belongs_to"), reads them back, prints them,
 * then deletes everything it created and exits.
 *
 * SAFETY: this inserts and deletes rows. Only ever run it against the DEV
 * database. Once prod holds real data, never point this script at it.
 *
 *   pnpm db:smoke
 */
import {
  PrismaClient,
  ProjectStatus,
  Priority,
  TaskStatus,
  Energy,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('--- db:smoke starting (DEV database only) ---\n');

  // 1. Insert a sample Project.
  const project = await prisma.project.create({
    data: {
      name: 'Smoke Test Project',
      description: 'Created by db:smoke — safe to delete.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.MEDIUM,
    },
  });
  console.log('Created Project:', project.id, `(${project.name})`);

  // 2. Insert two Tasks linked to the Project via the real FK.
  const taskA = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Smoke Task A',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      energy: Energy.LOW,
    },
  });
  const taskB = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Smoke Task B',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.LOW,
      energy: Energy.HIGH,
    },
  });
  console.log('Created Tasks:', taskA.id, '/', taskB.id);

  // 3. Insert one polymorphic Link (Task -> Project). Even though a real FK
  //    already ties the task to the project, this proves the Link table works.
  const link = await prisma.link.create({
    data: {
      fromType: 'task',
      fromId: taskA.id,
      toType: 'project',
      toId: project.id,
      relation: 'belongs_to',
    },
  });
  console.log('Created Link:', link.id, `(${link.fromType} -> ${link.toType}, "${link.relation}")`);

  // 4. Read them back.
  console.log('\n--- read-back ---');
  const projectWithTasks = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { tasks: { orderBy: { title: 'asc' } } },
  });
  console.log(
    `Project "${projectWithTasks.name}" has ${projectWithTasks.tasks.length} task(s):`,
  );
  for (const t of projectWithTasks.tasks) {
    console.log(`  - ${t.title} [status=${t.status}, priority=${t.priority}, energy=${t.energy}]`);
  }

  const links = await prisma.link.findMany({
    where: { fromType: 'task', toType: 'project', toId: project.id },
  });
  console.log(`Links pointing at this project: ${links.length}`);
  for (const l of links) {
    console.log(`  - ${l.fromType}:${l.fromId} --${l.relation}--> ${l.toType}:${l.toId}`);
  }

  // 5. Delete everything created. Link has no FK, so remove it explicitly.
  //    Tasks use onDelete: SetNull, so delete them explicitly before the
  //    project rather than relying on cascade.
  console.log('\n--- cleanup ---');
  await prisma.link.delete({ where: { id: link.id } });
  const deletedTasks = await prisma.task.deleteMany({
    where: { id: { in: [taskA.id, taskB.id] } },
  });
  await prisma.project.delete({ where: { id: project.id } });
  console.log(`Deleted 1 link, ${deletedTasks.count} tasks, 1 project.`);

  // 6. Confirm nothing remains.
  const remaining = await prisma.project.count({ where: { id: project.id } });
  console.log(`Projects remaining with that id: ${remaining}`);

  console.log('\n--- db:smoke OK ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error('db:smoke FAILED:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
