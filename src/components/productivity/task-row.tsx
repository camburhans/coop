'use client';

import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Project, Task } from '@prisma/client';

import { EnergyTag } from '@/components/ui/energy-tag';
import { PriorityBar } from '@/components/ui/priority-bar';

import { deleteJson, submitJson } from './client-api';
import { formatDueDate, isOverdue } from './format';
import { Modal } from './modal';
import { STATUS_LABEL } from './options';
import { TaskForm } from './task-form';

interface TaskRowProps {
  task: Task;
  /** Resolved name of the task's project, or null when standalone. */
  projectName: string | null;
  /** 1-based position in the ranked list. */
  rank: number;
  /** Projects for the edit form's select. */
  projects: Pick<Project, 'id' | 'name'>[];
}

/**
 * TaskRow — one ranked task.
 *
 * Client Component (it owns the complete/reopen toggle + edit/delete). Shows a
 * mono rank number, a {@link PriorityBar}, the title in Sora with mono meta,
 * an {@link EnergyTag}, and the due date in mono (alert-coloured when overdue).
 * The toggle PATCHes the task's status (DONE ↔ TODO) then `router.refresh()`es;
 * a completed row renders muted and — because the shared ranking sinks DONE
 * work — drops to the bottom on the next render.
 */
export function TaskRow({ task, projectName, rank, projects }: TaskRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const done = task.status === 'DONE';
  const overdue = isOverdue(task.dueDate, task.status);

  const meta = [projectName ? projectName.toUpperCase() : 'NO PROJECT', STATUS_LABEL[task.status] ?? task.status]
    .filter(Boolean)
    .join(' · ');

  // Always clear `busy` when the request settles. The list is keyed by task id,
  // so after a successful complete the SAME row instance is reused (the task
  // still exists, just reordered as DONE) — if we left `busy` true here, the
  // Reopen and Delete buttons would stay disabled. router.refresh() re-renders
  // with fresh data; clearing busy afterwards re-enables the controls.
  async function toggle() {
    setBusy(true);
    const result = await submitJson(`/api/tasks/${task.id}`, 'PATCH', {
      status: done ? 'TODO' : 'DONE',
    });
    if (result.ok) router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setBusy(true);
    const ok = await deleteJson(`/api/tasks/${task.id}`);
    if (ok) router.refresh();
    setBusy(false);
  }

  return (
    <li className={done ? 'trow is-done' : 'trow'}>
      <span className="trow-rank">{String(rank).padStart(2, '0')}</span>
      <PriorityBar priority={task.priority} />

      <div className="trow-main">
        <span className="trow-title">{task.title}</span>
        <small className="trow-meta">{meta}</small>
      </div>

      <EnergyTag energy={task.energy} />

      {task.dueDate ? (
        <span className={overdue ? 'trow-due is-overdue' : 'trow-due'}>
          {overdue ? 'OVERDUE · ' : 'DUE '}
          {formatDueDate(task.dueDate)}
        </span>
      ) : (
        <span className="trow-due is-empty" aria-hidden />
      )}

      <div className="trow-controls">
        <button
          type="button"
          className={done ? 'toggle-btn is-done' : 'toggle-btn'}
          onClick={toggle}
          disabled={busy}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        >
          {done ? <RotateCcw aria-hidden strokeWidth={1.7} /> : <Check aria-hidden strokeWidth={2} />}
          {done ? 'Reopen' : 'Complete'}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${task.title}`}
          title="Edit task"
        >
          <Pencil aria-hidden strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className="icon-btn is-danger"
          onClick={handleDelete}
          disabled={busy}
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          <Trash2 aria-hidden strokeWidth={1.6} />
        </button>
      </div>

      {editing ? (
        <Modal title="EDIT TASK" onClose={() => setEditing(false)}>
          <TaskForm task={task} projects={projects} onClose={() => setEditing(false)} />
        </Modal>
      ) : null}
    </li>
  );
}
