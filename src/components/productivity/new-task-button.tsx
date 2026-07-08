'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { Project } from '@prisma/client';

import { Modal } from './modal';
import { TaskForm } from './task-form';

interface NewTaskButtonProps {
  projects: Pick<Project, 'id' | 'name'>[];
  /** Pre-select this project on the fresh task (e.g. when the list is filtered). */
  defaultProjectId?: string;
}

/**
 * NewTaskButton — the "New Task" affordance for the Tasks panel head.
 *
 * Client Component. Toggles a {@link Modal} holding a blank {@link TaskForm},
 * pre-selecting the active project filter when there is one. Conditional
 * render, no animation (Sprint 2).
 */
export function NewTaskButton({ projects, defaultProjectId }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="new-btn" onClick={() => setOpen(true)}>
        <Plus aria-hidden strokeWidth={2} />
        New Task
      </button>
      {open ? (
        <Modal title="NEW TASK" onClose={() => setOpen(false)}>
          <TaskForm
            projects={projects}
            defaultProjectId={defaultProjectId}
            onClose={() => setOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  );
}
