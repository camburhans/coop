import Link from 'next/link';

import type { Task } from '@prisma/client';

import { formatDueDate, isOverdue } from '@/components/productivity/format';
import { STATUS_LABEL } from '@/components/productivity/options';
import { AiNote } from '@/components/ui/ai-note';
import { EnergyTag } from '@/components/ui/energy-tag';
import { Panel } from '@/components/ui/panel';
import { PriorityBar } from '@/components/ui/priority-bar';
import { listTasks } from '@/lib/productivity/tasks';

/** How many ranked tasks the lead panel surfaces. */
const TOP_N = 5;

/**
 * Compose the mono meta line for a row: the due-date state, then the status.
 * Overdue dates read "OVERDUE JUL 1"; dateless tasks read "NO DUE DATE".
 */
function rowMeta(task: Task): string {
  const due = task.dueDate
    ? `${isOverdue(task.dueDate, task.status) ? 'OVERDUE' : 'DUE'} ${formatDueDate(task.dueDate)}`
    : 'NO DUE DATE';
  return `${due} · ${STATUS_LABEL[task.status] ?? task.status}`;
}

/**
 * Priorities · Mission — the dashboard's lead panel (top-left, 7×2).
 *
 * Async Server Component. Reads the shared ranked task queue via
 * {@link listTasks} (same ordering as /productivity — the two can never
 * disagree), drops finished work, and shows the top {@link TOP_N}. Each row is
 * a mono rank, a {@link PriorityBar}, the title in Sora with mono meta, and an
 * {@link EnergyTag}. The footer carries C.O.O.P.'s (static) read and a mono
 * link into the Focus module.
 */
export async function PrioritiesPanel() {
  const ranked = await listTasks();
  const open = ranked.filter((task) => task.status !== 'DONE').slice(0, TOP_N);

  return (
    <Panel label="Priorities · Mission" meta="TODAY + ONGOING" className="p-priorities">
      {open.length > 0 ? (
        <ul className="plist">
          {open.map((task, index) => (
            <li key={task.id} className="prow">
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <PriorityBar priority={task.priority} />
              <div className="task">
                <span>{task.title}</span>
                <small>{rowMeta(task)}</small>
              </div>
              <EnergyTag energy={task.energy} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-empty">All clear. Nothing queued.</p>
      )}

      <div className="panel-foot">
        <AiNote>
          C.O.O.P.&apos;s read on your day arrives in <em>Sprint 4</em>.
        </AiNote>
        <Link className="foot-link" href="/productivity">
          OPEN FOCUS →
        </Link>
      </div>
    </Panel>
  );
}
