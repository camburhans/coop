import { ProductivityBoard } from '@/components/productivity/board';
import { listProjects } from '@/lib/productivity/projects';
import { listTasks } from '@/lib/productivity/tasks';

/**
 * /productivity — the Focus module, and the first REAL data surface.
 *
 * Server Component. Reads every project and the full ranked task queue straight
 * from the service layer (reads-in-RSC, per tech.md), then hands them to the
 * client {@link ProductivityBoard}, which owns filtering and the create/edit
 * modals. Filtering is client-side now (the whole set is loaded), so the page
 * takes no search params; mutations flow through the Route Handlers and
 * `router.refresh()` re-runs this loader.
 *
 * Rendered per request (dynamic): the data is live and sits behind the auth
 * proxy, so it is never statically cached.
 */
export const dynamic = 'force-dynamic';

export default async function ProductivityPage() {
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);

  return <ProductivityBoard projects={projects} tasks={tasks} />;
}
