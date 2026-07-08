import { X } from 'lucide-react';
import Link from 'next/link';

import { NewProjectButton } from '@/components/productivity/new-project-button';
import { NewTaskButton } from '@/components/productivity/new-task-button';
import { ProjectList } from '@/components/productivity/project-list';
import { TaskList } from '@/components/productivity/task-list';
import { Panel } from '@/components/ui/panel';
import { listProjects } from '@/lib/productivity/projects';
import { listTasks } from '@/lib/productivity/tasks';

/**
 * /productivity — the Focus module, and the first REAL data surface.
 *
 * Server Component. Reads projects (with task counts) and the ranked task
 * queue straight from the service layer (reads-in-RSC, per tech.md), then
 * renders two gilded panels: Projects and Tasks. A project card links to
 * `?projectId=`, which filters the task queue here on the server (no client
 * state). Mutations happen in the client forms/rows via the Route Handlers.
 *
 * Rendered per request (dynamic): the data is live and sits behind the auth
 * proxy, and it must reflect the ?projectId filter, so it is never static.
 */
export const dynamic = 'force-dynamic';

interface ProductivityPageProps {
  searchParams: Promise<{ projectId?: string | string[] }>;
}

export default async function ProductivityPage({ searchParams }: ProductivityPageProps) {
  const rawProjectId = (await searchParams).projectId;
  const requestedId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

  const projects = await listProjects();

  // Only honour the filter when it names a project that still exists — a stale
  // or malformed id falls back to the full queue rather than an empty view.
  const selectedProject = requestedId ? projects.find((p) => p.id === requestedId) : undefined;
  const selectedId = selectedProject?.id;

  const tasks = await listTasks(selectedId ? { projectId: selectedId } : {});
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  const openTasks = tasks.filter((t) => t.status !== 'DONE').length;
  const doneTasks = tasks.length - openTasks;

  return (
    <div className="prod-layout">
      <Panel className="prod-panel">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">Projects</span>
            {projects.length > 0 ? (
              <span className="panel-head-count">{projects.length} total</span>
            ) : null}
          </div>
          <div className="panel-head-actions">
            <NewProjectButton />
          </div>
        </header>
        <ProjectList projects={projects} selectedProjectId={selectedId} />
      </Panel>

      <Panel className="prod-panel">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">
              {selectedProject ? `Tasks · ${selectedProject.name}` : 'Tasks'}
            </span>
            {tasks.length > 0 ? (
              <span className="panel-head-count">
                {openTasks} open{doneTasks > 0 ? ` · ${doneTasks} done` : ''}
              </span>
            ) : null}
          </div>
          <div className="panel-head-actions">
            {selectedId ? (
              <Link className="clear-filter" href="/productivity">
                <X aria-hidden strokeWidth={1.8} size={11} />
                Clear filter
              </Link>
            ) : null}
            <NewTaskButton projects={projectOptions} defaultProjectId={selectedId} />
          </div>
        </header>
        <TaskList tasks={tasks} projects={projectOptions} />
      </Panel>
    </div>
  );
}
