import { useEffect, useState } from "react";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Durations offered by the "auto-disable" picker in the rule editor. */
export const AUTO_DISABLE_OPTIONS = [
  { label: "15 minutes", durationMs: 15 * MINUTE },
  { label: "1 hour", durationMs: HOUR },
  { label: "4 hours", durationMs: 4 * HOUR },
  { label: "1 day", durationMs: 24 * HOUR },
];

export const getPendingExpiry = (rule: { expiresAt?: unknown } | undefined, now: number): number | null => {
  const expiresAt = rule?.expiresAt;
  return typeof expiresAt === "number" && expiresAt > now ? expiresAt : null;
};

/** "45 min", "3 h 10 min", "1 day" — rounded up, so it never reads "0 min" while still pending. */
export const formatTimeLeft = (ms: number): string => {
  const totalMinutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes ? `${hours} h ${minutes} min` : `${hours} h`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
};

/** Current time, refreshed every `intervalMs` so countdowns stay current. */
export const useNow = (intervalMs = 30 * 1000): number => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};
