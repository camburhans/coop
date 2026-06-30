'use client';

import { useEffect, useState } from 'react';

interface LiveClockProps {
  className?: string;
}

function formatClock(date: Date): string {
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes}:${seconds} ${meridiem}`;
}

/**
 * LiveClock — the ONE ticking element in Sprint 2.
 *
 * Client Component. Renders the local time as mono 12-hour "h:mm:ss AM/PM" and
 * updates every second. Starts as a neutral placeholder so the server-rendered
 * markup and the first client render agree (no hydration mismatch); the real
 * time fills in on mount. Everything else in the console is static.
 */
export function LiveClock({ className }: LiveClockProps) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className={className} suppressHydrationWarning>
      {time ?? '--:--:-- --'}
    </time>
  );
}
