import type { ProjectWithTaskCount } from '@/lib/productivity/projects';

import { ProjectCard } from './project-card';

interface ProjectListProps {
  projects: ProjectWithTaskCount[];
  /** The active ?projectId= filter, if any, so the matching card highlights. */
  selectedProjectId?: string;
}

/**
 * ProjectList — the Projects panel body.
 *
 * Server Component. Renders the service-ordered projects (active-first, then
 * priority, then most-recently-updated) as {@link ProjectCard}s, or a calm
 * empty state when there are none.
 */
export function ProjectList({ projects, selectedProjectId }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <p className="prod-empty">
        <span>No projects yet. Create one to group your work.</span>
      </p>
    );
  }

  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          selected={project.id === selectedProjectId}
        />
      ))}
    </div>
  );
}
