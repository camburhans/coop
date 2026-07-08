'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Modal } from './modal';
import { ProjectForm } from './project-form';

/**
 * NewProjectButton — the "New Project" affordance for the Projects panel head.
 *
 * Client Component. Toggles a {@link Modal} holding a blank {@link ProjectForm}.
 * Conditional render, no animation (Sprint 2).
 */
export function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="new-btn" onClick={() => setOpen(true)}>
        <Plus aria-hidden strokeWidth={2} />
        New Project
      </button>
      {open ? (
        <Modal title="NEW PROJECT" onClose={() => setOpen(false)}>
          <ProjectForm onClose={() => setOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}
