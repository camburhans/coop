'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { Project, Task } from '@prisma/client';

import { AiNote } from '@/components/ui/ai-note';
import { Panel } from '@/components/ui/panel';
import { OWNER_NAME } from '@/config/owner';

import { deleteJson } from './client-api';
import { FilterChips, type FilterValue } from './filter-chips';
import { ProdModal } from './prod-modal';
import { ProjectCard } from './project-card';
import { ProjectForm } from './project-form';
import { TaskForm } from './task-form';
import { TaskRow } from './task-row';
import { isTaskDone, priorityTier, tallyTasks, type TaskTally } from './view';

interface ProductivityBoardProps {
  /** All projects, in the service's default order. */
  projects: Project[];
  /** All tasks, already in the shared rank order. */
  tasks: Task[];
}

type ModalState =
  | { kind: 'project'; item?: Project }
  | { kind: 'task'; item?: Task };

const EMPTY_TALLY: TaskTally = { total: 0, done: 0, pct: 0 };

/**
 * ProductivityBoard — the interactive Projects + Tasks surface.
 *
 * Client Component. Receives the full project/task sets from the server page
 * and owns two pieces of genuine client state: the task filter and the
 * create/edit modal. Filtering, per-project completion tallies, chip counts and
 * C.O.O.P.'s foot-note read are all derived here from the loaded data, so the
 * view reacts instantly with no server round-trip. Mutations still go through
 * the Route Handlers (in the forms/rows) followed by `router.refresh()`, which
 * re-runs the server page and feeds fresh props back in while this component's
 * filter selection persists.
 */
export function ProductivityBoard({ projects, tasks }: ProductivityBoardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  // A filter can outlive its project (delete, or a project that vanished on
  // refresh). Fall back to "all" rather than showing a permanently empty list.
  const effectiveFilter: FilterValue =
    typeof filter === 'string' && filter !== 'none' && !projects.some((p) => p.id === filter)
      ? null
      : filter;

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, name: p.name })),
    [projects],
  );

  const projectMeta = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const tallies = useMemo(() => {
    const map = new Map<string, TaskTally>();
    for (const p of projects) {
      map.set(
        p.id,
        tallyTasks(tasks.filter((t) => t.projectId === p.id)),
      );
    }
    return map;
  }, [projects, tasks]);

  const counts = useMemo(() => {
    const byProject: Record<string, number> = {};
    for (const p of projects) byProject[p.id] = 0;
    let none = 0;
    for (const t of tasks) {
      const key = t.projectId;
      if (!key) none += 1;
      else if (key in byProject) byProject[key] = (byProject[key] ?? 0) + 1;
    }
    return { all: tasks.length, none, byProject };
  }, [projects, tasks]);

  const visibleTasks = useMemo(() => {
    if (effectiveFilter === null) return tasks;
    if (effectiveFilter === 'none') return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === effectiveFilter);
  }, [tasks, effectiveFilter]);

  const openCount = useMemo(
    () => tasks.filter((t) => !isTaskDone(t.status)).length,
    [tasks],
  );

  const note = useMemo(() => {
    if (tasks.length === 0) return "No tasks yet — add one and I'll keep it in view.";
    if (openCount === 0) return `Every task is complete. Beautifully done, ${OWNER_NAME}.`;
    const highOpen = tasks.filter(
      (t) => !isTaskDone(t.status) && priorityTier(t.priority) === 'high',
    ).length;
    if (highOpen > 0) {
      return `${highOpen} high-priority ${highOpen === 1 ? 'task needs' : 'tasks need'
        } you first — clear those before the rest.`;
    }
    return `${openCount} open ${openCount === 1 ? 'task' : 'tasks'
      }, nothing urgent. Steady as she goes.`;
  }, [tasks, openCount]);

  async function deleteProject(id: string) {
    const ok = await deleteJson(`/api/projects/${id}`);
    if (!ok) return;
    if (filter === id) setFilter(null);
    router.refresh();
  }

  const modalTitle = modal
    ? modal.kind === 'project'
      ? modal.item
        ? 'Edit Project'
        : 'New Project'
      : modal.item
        ? 'Edit Task'
        : 'New Task'
    : '';

  return (
    <div className="prod prod-grid">
      <Panel className="prod-projects">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">Projects</span>
            <span className="lbl-dim">{projects.length} total</span>
          </div>
          <button type="button" className="prod-add" onClick={() => setModal({ kind: 'project' })}>
            <Plus aria-hidden strokeWidth={2} />
            Add project
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="prod-empty">
            <h4>No projects yet</h4>
            <p>Group related work — create your first project.</p>
          </div>
        ) : (
          <div className="proj-list">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                tally={tallies.get(p.id) ?? EMPTY_TALLY}
                selected={effectiveFilter === p.id}
                onSelect={() => setFilter(effectiveFilter === p.id ? null : p.id)}
                onEdit={() => setModal({ kind: 'project', item: p })}
                onDelete={() => deleteProject(p.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="prod-tasks">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">Tasks</span>
            <span className="lbl-dim">{openCount} open</span>
          </div>
          <button type="button" className="prod-add" onClick={() => setModal({ kind: 'task' })}>
            <Plus aria-hidden strokeWidth={2} />
            Add task
          </button>
        </header>

        <FilterChips
          projects={projectOptions}
          counts={counts}
          value={effectiveFilter}
          onChange={setFilter}
        />

        {visibleTasks.length === 0 ? (
          <div className="prod-empty">
            <h4>No tasks here</h4>
            <p>
              {effectiveFilter === null
                ? 'Add your first task to get moving.'
                : 'Nothing in this view yet.'}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {visibleTasks.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                index={i + 1}
                project={t.projectId ? (projectMeta.get(t.projectId) ?? null) : null}
                onEdit={() => setModal({ kind: 'task', item: t })}
              />
            ))}
          </div>
        )}

        <AiNote className="task-note">{note}</AiNote>
      </Panel>

      {modal ? (
        <ProdModal title={modalTitle} onClose={() => setModal(null)}>
          {modal.kind === 'project' ? (
            <ProjectForm project={modal.item} onClose={() => setModal(null)} />
          ) : (
            <TaskForm
              task={modal.item}
              projects={projectOptions}
              defaultProjectId={
                typeof effectiveFilter === 'string' && effectiveFilter !== 'none'
                  ? effectiveFilter
                  : null
              }
              onClose={() => setModal(null)}
            />
          )}
        </ProdModal>
      ) : null}
    </div>
  );
}
