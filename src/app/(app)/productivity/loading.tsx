import { Panel } from '@/components/ui/panel';

/**
 * /productivity loading state.
 *
 * A calm, STATIC skeleton in the module's two-column frame (Projects | Tasks).
 * Muted low-opacity blocks stand in for the project cards and task rows while
 * the server page resolves. No shimmer or motion (that is Sprint 5).
 */

function Bar({ className }: { className: string }) {
  return <div className={`h-3 rounded bg-panel-deep opacity-60 ${className}`} aria-hidden />;
}

function Block() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel-deep/40 p-4">
      <Bar className="w-1/2" />
      <Bar className="w-full" />
    </div>
  );
}

export default function ProductivityLoading() {
  return (
    <div className="prod prod-grid">
      <Panel className="prod-projects">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">Projects</span>
            <span className="lbl-dim">loading…</span>
          </div>
        </header>
        <div className="flex flex-col gap-3">
          <Block />
          <Block />
          <Block />
        </div>
      </Panel>

      <Panel className="prod-tasks">
        <header className="panel-head">
          <div className="panel-head-title">
            <span className="panel-label">Tasks</span>
            <span className="lbl-dim">loading…</span>
          </div>
        </header>
        <div className="flex flex-col gap-3">
          <Block />
          <Block />
          <Block />
          <Block />
        </div>
      </Panel>
    </div>
  );
}
