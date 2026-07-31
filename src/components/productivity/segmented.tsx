'use client';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  /** Accessible group name (announced by screen readers). */
  ariaLabel: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Let the pills wrap onto multiple rows (`.seg-wrap`). For groups too wide for
   * one line — the finance account-type control has seven options.
   */
  wrap?: boolean;
}

/**
 * Segmented — the gilded pill-group control from the productivity prototype
 * (`.seg` / `.seg-btn`). Replaces a native `<select>` for the small, fixed
 * enum choices (status, priority) in the create/edit modals.
 *
 * Implemented as an ARIA radiogroup so it is fully keyboard-reachable: arrow
 * keys move focus/selection, matching native radio semantics.
 */
export function Segmented<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  wrap,
}: SegmentedProps<T>) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    if (index === -1) return;
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = options[(index + delta + options.length) % options.length];
    if (next) onChange(next.value);
  }

  return (
    <div
      className={wrap ? 'seg seg-wrap' : 'seg'}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={active ? 'seg-btn active' : 'seg-btn'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
