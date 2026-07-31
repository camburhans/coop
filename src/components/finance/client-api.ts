/**
 * Thin client-side helpers for talking to the finance Route Handlers.
 *
 * Per the locked data-access pattern (tech.md): reads happen in Server
 * Components via `src/lib/finance/`; mutations go through these fetch calls to
 * the Route Handlers under `/api/{accounts,transactions}`, which call the same
 * services. No Server Actions. Callers `router.refresh()` on success.
 *
 * Feature-scoped, mirroring `components/productivity/client-api.ts`, rather
 * than reaching across the module boundary — and because finance needs one
 * thing productivity does not: {@link deleteJson} reports the STATUS and the
 * server's message so the accounts panel can surface a refused (409) delete
 * calmly instead of treating it as a generic failure.
 *
 * The handlers answer validation failures with
 * `{ error: 'ValidationError', issues: [{ path, message }] }` (see
 * `lib/api/http.ts`); {@link submitJson} unpacks those into per-field errors so
 * the forms can render them inline.
 */

export interface SubmitResult {
  ok: boolean;
  /** Field-level messages keyed by the zod issue path (e.g. `amount`). */
  fieldErrors: Record<string, string>;
  /** A form-level message when the failure is not field-specific. */
  formError: string | null;
}

/** Read `{ error }` / `{ issues }` out of an error response body. */
async function readError(res: Response): Promise<{
  fieldErrors: Record<string, string>;
  message: string | null;
}> {
  const data: unknown = await res.json().catch(() => null);
  const fieldErrors: Record<string, string> = {};
  let message: string | null = null;

  if (data && typeof data === 'object') {
    const issues = (data as { issues?: unknown }).issues;
    if (Array.isArray(issues)) {
      for (const issue of issues) {
        const path = String(issue?.path ?? '');
        if (path) fieldErrors[path] = String(issue?.message ?? 'Invalid value');
      }
    }
    const errMsg = (data as { error?: unknown }).error;
    if (typeof errMsg === 'string' && errMsg !== 'ValidationError') message = errMsg;
  }

  return { fieldErrors, message };
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

    const { fieldErrors, message } = await readError(res);
    let formError = message;
    if (!formError && Object.keys(fieldErrors).length === 0) {
      formError = 'Something went wrong. Please try again.';
    }
    return { ok: false, fieldErrors, formError };
  } catch {
    return { ok: false, fieldErrors: {}, formError: 'Network error. Please try again.' };
  }
}

export interface DeleteResult {
  ok: boolean;
  /** The HTTP status, or 0 when the request never completed. 409 = refused by a guard. */
  status: number;
  /** The server's message, when it sent one. */
  error: string | null;
}

export async function deleteJson(url: string): Promise<DeleteResult> {
  try {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) return { ok: true, status: res.status, error: null };
    const { message } = await readError(res);
    return { ok: false, status: res.status, error: message };
  } catch {
    return { ok: false, status: 0, error: 'Network error. Please try again.' };
  }
}
