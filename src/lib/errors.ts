/**
 * Framework-agnostic domain errors shared by the service layer and the HTTP
 * layer.
 *
 * These are kept free of any Next.js or Prisma imports so the services (and
 * the plain-node tsx smoke script that drives them) can throw and catch them
 * without pulling the framework into the module graph. The HTTP layer
 * (`src/lib/api/http.ts`) maps them to status codes; direct callers can catch
 * them by type.
 */

/** A requested record does not exist. Maps to HTTP 404. */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** The request was malformed or references something invalid. Maps to HTTP 400. */
export class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * The request conflicts with the current state of a resource, so it is refused
 * rather than applied. Maps to HTTP 409.
 *
 * Sprint 3's account-delete guard throws this: deleting an account that still
 * has transactions is blocked (the schema would cascade-delete real financial
 * records, which we never do silently). The caller must remove or reassign the
 * transactions first.
 */
export class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}
