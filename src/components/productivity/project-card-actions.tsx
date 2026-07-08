'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Project } from '@prisma/client';

import { deleteJson } from './client-api';
import { Modal } from './modal';
import { ProjectForm } from './project-form';

/**
 * ProjectCardActions — the edit/delete controls on a project card.
 *
 * Client Component, rendered as a SIBLING of the card's filter link (not
 * inside it) so these buttons never trigger the ?projectId= navigation. Edit
 * opens a pre-filled {@link ProjectForm}; Delete confirms via `window.confirm`
 * (fine for V1) then DELETEs — the service orphans the project's tasks
 * (projectId → null) rather than deleting them, so standalone work survives.
 */
export function ProjectCardActions({ project }: { project: Project }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Delete "${project.name}"? Its tasks are kept and become unassigned.`,
    );
    if (!ok) return;
    setDeleting(true);
    const success = await deleteJson(`/api/projects/${project.id}`);
    if (success) router.refresh();
    else setDeleting(false);
  }

  return (
    <div className="card-actions">
      <button
        type="button"
        className="icon-btn"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${project.name}`}
        title="Edit project"
      >
        <Pencil aria-hidden strokeWidth={1.6} />
      </button>
      <button
        type="button"
        className="icon-btn is-danger"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${project.name}`}
        title="Delete project"
      >
        <Trash2 aria-hidden strokeWidth={1.6} />
      </button>

      {editing ? (
        <Modal title="EDIT PROJECT" onClose={() => setEditing(false)}>
          <ProjectForm project={project} onClose={() => setEditing(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
