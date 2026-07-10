'use client';

import { Pencil } from 'lucide-react';

import type { Project } from '@prisma/client';

import { DeleteButton } from './delete-button';
import { formatDueDate, isPastDue } from './format';
import { STATUS_LABEL } from './options';
import { projectStatusTier, type TaskTally } from './view';

interface ProjectCardProps {
  project: Project;
  /** Completion tally for this project's tasks (drives the progress bar). */
  tally: TaskTally;
  /** True when this project is the active task filter. */
  selected: boolean;
  /** Toggle this project as the task filter. */
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * ProjectCard — one project (`.proj-card`).
 *
 * Client Component. A status-tiered left accent (gold=active, indigo=done,
 * faint=planned), the name, a status pill showing the REAL status label but
 * coloured by its projected tier, task count, optional due date, and a
 * completion progress bar. The card itself is the filter toggle (a keyboard-
 * reachable `role="button"`); edit/delete sit in `.row-actions` and stop
 * propagation so they never trigger the filter.
 */
export function ProjectCard({
  project,
  tally,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const tier = projectStatusTier(project.status);
  const due = project.dueDate ? formatDueDate(project.dueDate) : null;
  const overdue = isPastDue(project.dueDate) && tier !== 'done';

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Only the card surface itself toggles — never a keypress on a nested button.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      className={selected ? 'proj-card sel' : 'proj-card'}
      data-status={tier}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <div className="proj-title-row">
        <h3 className="proj-name" title={project.name}>
          {project.name}
        </h3>
        <div className="row-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${project.name}`}
            title="Edit"
          >
            <Pencil aria-hidden strokeWidth={1.6} />
          </button>
          <DeleteButton label={project.name} onConfirm={onDelete} />
        </div>
      </div>

      <div className="proj-meta-row">
        <span className={`pstatus ${tier}`}>{STATUS_LABEL[project.status] ?? project.status}</span>
        <span className="proj-meta">
          {tally.total} {tally.total === 1 ? 'TASK' : 'TASKS'}
        </span>
        {due ? <span className={overdue ? 'proj-meta overdue' : 'proj-meta'}>· DUE {due}</span> : null}
      </div>

      <div className="proj-prog">
        <div className="proj-prog-fill" style={{ width: `${tally.pct}%` }} />
      </div>
      <span className="proj-prog-lbl">
        {tally.done} / {tally.total} DONE · {tally.pct}%
      </span>
    </div>
  );
}
