'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Priority, Project, Task, TaskStatus } from '@prisma/client';

import { submitJson } from './client-api';
import { toDateInputValue } from './format';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './options';
import { Segmented } from './segmented';

interface TaskFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  task?: Task;
  /** Projects for the "linked project" select. */
  projects: Pick<Project, 'id' | 'name'>[];
  /** Pre-select this project on a fresh create (e.g. when a project filter is active). */
  defaultProjectId?: string | null;
  onClose: () => void;
}

/**
 * TaskForm — create/edit a task, in the prototype's modal shape.
 *
 * Client Component. Surfaces only the prototype's fields: title, linked
 * project, priority (segmented), status (segmented), due date. `energy` and
 * `notes` are untouched (Option B): CREATE lets them fall to their server
 * defaults (energy MEDIUM, notes null); EDIT omits them so the `.partial()`
 * update schema preserves whatever is stored. Submits to the Route Handlers and
 * `router.refresh()`es on success; handler validation errors render inline.
 */
export function TaskForm({ task, projects, defaultProjectId, onClose }: TaskFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(task?.title ?? '');
  const [projectId, setProjectId] = useState<string>(task?.projectId ?? defaultProjectId ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO');
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const body = {
      title,
      projectId: projectId ? projectId : null,
      priority,
      status,
      dueDate: dueDate ? dueDate : null,
    };

    const result = await submitJson(
      task ? `/api/tasks/${task.id}` : '/api/tasks',
      task ? 'PATCH' : 'POST',
      body,
    );

    if (result.ok) {
      router.refresh();
      onClose();
      return;
    }

    setErrors(result.fieldErrors);
    setFormError(result.formError);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="pm-label" htmlFor="pm-title">
        Task
      </label>
      <input
        id="pm-title"
        className="pm-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        autoFocus
        maxLength={200}
      />
      {errors.title ? <span className="pm-error">{errors.title}</span> : null}

      <label className="pm-label" htmlFor="pm-project">
        Linked project
      </label>
      <select
        id="pm-project"
        className="pm-input pm-select"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {errors.projectId ? <span className="pm-error">{errors.projectId}</span> : null}

      <span className="pm-label">Priority</span>
      <Segmented<Priority>
        ariaLabel="Task priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={setPriority}
      />

      <span className="pm-label">Status</span>
      <Segmented<TaskStatus>
        ariaLabel="Task status"
        options={TASK_STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
      />

      <label className="pm-label" htmlFor="pm-due">
        Due date <span className="opt">optional</span>
      </label>
      <input
        id="pm-due"
        type="date"
        className="pm-input"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      {errors.dueDate ? <span className="pm-error">{errors.dueDate}</span> : null}

      {formError ? <p className="pm-form-error">{formError}</p> : null}

      <div className="pm-foot">
        <button type="button" className="pm-cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="pm-save" disabled={submitting}>
          {submitting ? 'Saving…' : task ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
