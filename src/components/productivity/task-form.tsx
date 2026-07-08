'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Project, Task } from '@prisma/client';

import { submitJson } from './client-api';
import { toDateInputValue } from './format';
import { ENERGY_OPTIONS, PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './options';

interface TaskFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  task?: Task;
  /** Projects for the "assign to project" select. */
  projects: Pick<Project, 'id' | 'name'>[];
  /** Pre-select this project on a fresh create (e.g. when the list is filtered). */
  defaultProjectId?: string;
  onClose: () => void;
}

/**
 * TaskForm — create/edit a task.
 *
 * Client Component. Fields: title, project (optional, with "No project"),
 * status, priority, energy, dueDate, notes. Submits to the task Route Handlers
 * (POST /api/tasks or PATCH /api/tasks/[id]); on success it `router.refresh()`es
 * and closes. Handler validation errors render inline per field.
 */
export function TaskForm({ task, projects, defaultProjectId, onClose }: TaskFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(task?.title ?? '');
  const [projectId, setProjectId] = useState<string>(task?.projectId ?? defaultProjectId ?? '');
  const [status, setStatus] = useState<string>(task?.status ?? 'TODO');
  const [priority, setPriority] = useState<string>(task?.priority ?? 'MEDIUM');
  const [energy, setEnergy] = useState<string>(task?.energy ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));
  const [notes, setNotes] = useState(task?.notes ?? '');

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
      status,
      priority,
      energy,
      dueDate: dueDate ? dueDate : null,
      notes: notes.trim() ? notes.trim() : null,
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
    <form className="pform" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          className="field-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={200}
        />
        {errors.title ? <span className="field-error">{errors.title}</span> : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="task-project">
          Project
        </label>
        <select
          id="task-project"
          className="field-input"
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
        {errors.projectId ? <span className="field-error">{errors.projectId}</span> : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="task-status">
            Status
          </label>
          <select
            id="task-status"
            className="field-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {TASK_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="task-priority">
            Priority
          </label>
          <select
            id="task-priority"
            className="field-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="task-energy">
            Energy
          </label>
          <select
            id="task-energy"
            className="field-input"
            value={energy}
            onChange={(e) => setEnergy(e.target.value)}
          >
            {ENERGY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="task-due">
          Due date
        </label>
        <input
          id="task-due"
          type="date"
          className="field-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {errors.dueDate ? <span className="field-error">{errors.dueDate}</span> : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="task-notes">
          Notes
        </label>
        <textarea
          id="task-notes"
          className="field-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {errors.notes ? <span className="field-error">{errors.notes}</span> : null}
      </div>

      {formError ? <p className="form-error">{formError}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
