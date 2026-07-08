import type { Project, Task } from '@prisma/client';

import { TaskRow } from './task-row';

interface TaskListProps {
  /** Tasks already in the shared rank order (see `rankTasks`); NOT re-ranked here. */
  tasks: Task[];
  /** Projects, used to resolve each task's project name and feed edit forms. */
  projects: Pick<Project, 'id' | 'name'>[];
}

/**
 * TaskList — the Tasks panel body.
 *
 * Server Component. Renders the tasks in the order it receives them (the
 * service already sorted them through the shared `rankTasks`, so ranking is
 * never duplicated here) as {@link TaskRow}s numbered by position. Falls back
 * to the calm empty state when there is nothing queued.
 */
export function TaskList({ tasks, projects }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="prod-empty">
        <span>Nothing queued. Add a task.</span>
      </p>
    );
  }

  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <ol className="tlist">
      {tasks.map((task, i) => (
        <TaskRow
          key={task.id}
          task={task}
          rank={i + 1}
          projectName={task.projectId ? nameById.get(task.projectId) ?? null : null}
          projects={projects}
        />
      ))}
    </ol>
  );
}
