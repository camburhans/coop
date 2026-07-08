'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Project } from '@prisma/client';

import { submitJson } from './client-api';
import { toDateInputValue } from './format';
import { PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from './options';

interface ProjectFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  project?: Project;
  /** Called after a successful save (post-refresh) or a cancel. */
  onClose: () => void;
}

/**
 * ProjectForm — create/edit a project.
 *
 * Client Component. Fields: name, description, status, priority, dueDate.
 * Submits to the project Route Handlers (POST /api/projects or PATCH
 * /api/projects/[id]); on success it `router.refresh()`es the Server-Component
 * tree and closes. Validation errors from the handler render inline per field.
 * No Server Actions — Route Handlers only, per tech.md.
 */
export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<string>(project?.status ?? 'ACTIVE');
  const [priority, setPriority] = useState<string>(project?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(toDateInputValue(project?.dueDate));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const body = {
      name,
      description: description.trim() ? description.trim() : null,
      status,
      priority,
      dueDate: dueDate ? dueDate : null,
    };

    const result = await submitJson(
      project ? `/api/projects/${project.id}` : '/api/projects',
      project ? 'PATCH' : 'POST',
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
        <label className="field-label" htmlFor="project-name">
          Name
        </label>
        <input
          id="project-name"
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={120}
        />
        {errors.name ? <span className="field-error">{errors.name}</span> : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="project-description">
          Description
        </label>
        <textarea
          id="project-description"
          className="field-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description ? <span className="field-error">{errors.description}</span> : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="project-status">
            Status
          </label>
          <select
            id="project-status"
            className="field-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {PROJECT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="project-priority">
            Priority
          </label>
          <select
            id="project-priority"
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
      </div>

      <div className="field">
        <label className="field-label" htmlFor="project-due">
          Due date
        </label>
        <input
          id="project-due"
          type="date"
          className="field-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {errors.dueDate ? <span className="field-error">{errors.dueDate}</span> : null}
      </div>

      {formError ? <p className="form-error">{formError}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : project ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  );
}
