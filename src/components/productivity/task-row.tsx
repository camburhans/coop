'use client';

import { Check, Pencil, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Project, Task } from '@prisma/client';

import { deleteJson, submitJson } from './client-api';
import { DeleteButton } from './delete-button';
import { formatDueDate, isOverdue } from './format';
import { STATUS_LABEL } from './options';
import { isTaskDone, priorityTier, projectStatusTier } from './view';

interface TaskRowProps {
  task: Task;
  /** 1-based position in the currently visible (filtered) list. */
  index: number;
  /** The task's project (name + status) for the chip, or null when standalone. */
  project: Pick<Project, 'name' | 'status'> | null;
  onEdit: () => void;
}

/**
 * TaskRow — one task (`.task-row`).
 *
 * Client Component owning its own complete/reopen toggle and delete. A mono
 * index, a priority-tiered accent, the title + a mono meta line (project chip +
 * real status label), then the priority pill (real label, projected colour),
 * due date, and the complete/reopen control. Toggling PATCHes DONE↔TODO and
 * `router.refresh()`es; the shared server ranking then sinks completed work to
 * the bottom on the next render.
 */
export function TaskRow({ task, index, project, onEdit }: TaskRowProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const done = isTaskDone(task.status);
  const tier = priorityTier(task.priority);
  const overdue = isOverdue(task.dueDate, task.status);
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  async function toggle() {
    setBusy(true);
    const result = await submitJson(`/api/tasks/${task.id}`, 'PATCH', {
      status: done ? 'TODO' : 'DONE',
    });
    if (result.ok) router.refresh();
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    const ok = await deleteJson(`/api/tasks/${task.id}`);
    if (ok) router.refresh();
    setBusy(false);
  }

  return (
    <div className={done ? 'task-row done' : 'task-row'}>
      <span className="task-num">{String(index).padStart(2, '0')}</span>
      <span className="task-accent" data-prio={tier} aria-hidden />

      <div className="task-body">
        <span className="task-title" title={task.title}>
          {task.title}
        </span>
        <div className="task-meta">
          {project ? (
            <span
              className="proj-chip"
              data-status={projectStatusTier(project.status)}
              title={project.name}
            >
              {project.name}
            </span>
          ) : (
            <span className="proj-chip none">NO PROJECT</span>
          )}
          <span>{STATUS_LABEL[task.status] ?? task.status}</span>
        </div>
      </div>

      <div className="task-actions">
        <span className={`prio ${tier}`}>{task.priority}</span>
        {due ? <span className={overdue ? 'task-due overdue' : 'task-due'}>DUE {due}</span> : null}

        <button
          type="button"
          className={done ? 'complete-btn is-done' : 'complete-btn'}
          onClick={toggle}
          disabled={busy}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        >
          {done ? (
            <>
              <RotateCcw aria-hidden strokeWidth={1.8} />
              Reopen
            </>
          ) : (
            <>
              <Check aria-hidden strokeWidth={2.2} />
              Complete
            </>
          )}
        </button>

        <div className="row-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onEdit}
            aria-label={`Edit ${task.title}`}
            title="Edit"
          >
            <Pencil aria-hidden strokeWidth={1.6} />
          </button>
          <DeleteButton label={task.title} onConfirm={remove} disabled={busy} />
        </div>
      </div>
    </div>
  );
}
