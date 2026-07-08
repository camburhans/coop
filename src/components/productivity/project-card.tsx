import Link from 'next/link';

import type { ProjectStatus } from '@prisma/client';

import { PriorityBar } from '@/components/ui/priority-bar';
import type { ProjectWithTaskCount } from '@/lib/productivity/projects';

import { formatDueDate } from './format';
import { ProjectCardActions } from './project-card-actions';
import { STATUS_LABEL } from './options';

interface ProjectCardProps {
  project: ProjectWithTaskCount;
  /** True when this project is the active ?projectId= task filter. */
  selected: boolean;
}

/** Map a project status to its coloured status-pill modifier. */
const STATUS_PILL_CLASS: Record<ProjectStatus, string> = {
  ACTIVE: 'is-active',
  PAUSED: 'is-paused',
  DONE: 'is-done',
  ARCHIVED: 'is-archived',
};

/**
 * ProjectCard — one project in the Projects panel.
 *
 * Server Component. A gold left-edge accent, the name in Sora, a
 * {@link PriorityBar}, a colour-coded status pill, task count and (if set) due
 * date in mono. The card body is a link that filters the task list via
 * `?projectId=`; clicking the already-selected project clears the filter. The
 * edit/delete controls sit outside the link so they don't navigate.
 */
export function ProjectCard({ project, selected }: ProjectCardProps) {
  const taskCount = project._count.tasks;
  const href = selected ? '/productivity' : `/productivity?projectId=${project.id}`;

  return (
    <div className={selected ? 'project-card is-selected' : 'project-card'}>
      <Link href={href} className="pc-link" aria-pressed={selected}>
        <div className="pc-top">
          <PriorityBar priority={project.priority} />
          <span className="pc-name">{project.name}</span>
        </div>

        <div className="pc-meta">
          <span className={`status-pill ${STATUS_PILL_CLASS[project.status]}`}>
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
          <span className="pc-metaitem">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          {project.dueDate ? (
            <span className="pc-metaitem">Due {formatDueDate(project.dueDate)}</span>
          ) : null}
        </div>
      </Link>

      <ProjectCardActions project={project} />
    </div>
  );
}
