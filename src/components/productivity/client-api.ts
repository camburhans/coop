/**
 * Thin client-side helpers for talking to the productivity Route Handlers.
 *
 * Per the locked data-access pattern (tech.md): reads happen in Server
 * Components via the service layer; mutations go through these fetch calls to
 * the Route Handlers under `/api`, which call the same services. No Server
 * Actions. Callers `router.refresh()` on success to revalidate.
 *
 * The handlers answer validation failures with
 * `{ error: 'ValidationError', issues: [{ path, message }] }` (see
 * `lib/api/http.ts`); {@link submitJson} unpacks those into per-field errors so
 * the forms can render them inline.
 */

export interface SubmitResult {
  ok: boolean;
  /** Field-level messages keyed by the zod issue path (e.g. `name`). */
  fieldErrors: Record<string, string>;
  /** A form-level message when the failure is not field-specific. */
  formError: string | null;
}

export async function submitJson(
  url: string,
  method: 'POST' | 'PATCH',
  body: unknown,
): Promise<SubmitResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true, fieldErrors: {}, formError: null };

    const data: unknown = await res.json().catch(() => null);
    const fieldErrors: Record<string, string> = {};
    let formError: string | null = null;

    if (data && typeof data === 'object') {
      const issues = (data as { issues?: unknown }).issues;
      if (Array.isArray(issues)) {
        for (const issue of issues) {
          const path = String(issue?.path ?? '');
          if (path) fieldErrors[path] = String(issue?.message ?? 'Invalid value');
        }
      }
      const errMsg = (data as { error?: unknown }).error;
      if (typeof errMsg === 'string' && errMsg !== 'ValidationError') formError = errMsg;
    }

    if (!formError && Object.keys(fieldErrors).length === 0) {
      formError = 'Something went wrong. Please try again.';
    }
    return { ok: false, fieldErrors, formError };
  } catch {
    return { ok: false, fieldErrors: {}, formError: 'Network error. Please try again.' };
  }
}

export async function deleteJson(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}
