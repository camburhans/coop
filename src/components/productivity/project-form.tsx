'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Project, ProjectStatus } from '@prisma/client';

import { submitJson } from './client-api';
import { toDateInputValue } from './format';
import { PROJECT_STATUS_OPTIONS } from './options';
import { Segmented } from './segmented';

interface ProjectFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  project?: Project;
  /** Called after a successful save (post-refresh) or a cancel. */
  onClose: () => void;
}

/**
 * ProjectForm — create/edit a project, in the prototype's modal shape.
 *
 * Client Component. Surfaces only the prototype's fields: name, status
 * (segmented), due date. The richer columns are untouched (Option B): on
 * CREATE, `priority`/`description` fall to their server defaults; on EDIT the
 * PATCH omits them, and the `.partial()` update schema leaves the stored values
 * intact. Submits to the Route Handlers (no Server Actions) and
 * `router.refresh()`es on success. Handler validation errors render inline.
 */
export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project?.name ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'ACTIVE');
  const [dueDate, setDueDate] = useState(toDateInputValue(project?.dueDate));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const body = { name, status, dueDate: dueDate ? dueDate : null };

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
    <form onSubmit={handleSubmit} noValidate>
      <label className="pm-label" htmlFor="pm-name">
        Project name
      </label>
      <input
        id="pm-name"
        className="pm-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Q3 Roadmap"
        autoFocus
        maxLength={120}
      />
      {errors.name ? <span className="pm-error">{errors.name}</span> : null}

      <span className="pm-label">Status</span>
      <Segmented<ProjectStatus>
        ariaLabel="Project status"
        options={PROJECT_STATUS_OPTIONS}
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
          {submitting ? 'Saving…' : project ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
