const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_PAST_MS = DAY_MS;
const KEEP_FUTURE_DAYS = 180;

export function mergeSource(previous, current, prefix, now) {
  const currentIds = new Set(current.map((event) => event.id));
  const nowIso = now.toISOString();

  const stamped = current.map((event) => ({
    ...event,
    cancelled: event.cancelled ?? false,
    stamp: previous.find((old) => old.id === event.id)?.stamp ?? nowIso,
  }));

  const removed = previous
    .filter((event) => event.id.startsWith(prefix) && !currentIds.has(event.id))
    .filter((event) => new Date(event.start) > now)
    .map((event) => ({ ...event, cancelled: true }));

  return [...stamped, ...removed];
}

export function keepInWindow(events, now) {
  const earliest = now.getTime() - KEEP_PAST_MS;
  const latest = now.getTime() + KEEP_FUTURE_DAYS * DAY_MS;
  return events.filter((event) => {
    const start = new Date(event.start).getTime();
    return start >= earliest && start <= latest;
  });
}
