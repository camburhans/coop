import { LockButton } from './lock-button';

/**
 * Protected landing page (the authenticated root, "/").
 *
 * Sprint 1 placeholder whose only job is to prove the auth flow end-to-end:
 * reaching it at all means a valid session passed the proxy. Sprint 2 replaces
 * this with the real dashboard shell.
 *
 * Lives in the (app) route group, which the proxy protects.
 */
export default function AppLandingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <p>C.O.O.P. is online.</p>
      <LockButton />
    </main>
  );
}
