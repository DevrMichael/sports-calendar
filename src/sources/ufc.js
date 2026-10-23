const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard';
const EVENT_DURATION_HOURS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchUfcEvents({ now, days = 180, fetchImpl = fetch }) {
  const from = formatDay(now);
  const to = formatDay(new Date(now.getTime() + days * DAY_MS));
  const response = await fetchImpl(`${SCOREBOARD_URL}?dates=${from}-${to}&limit=200`);
  if (!response.ok) {
    throw new Error(`ESPN svarte ${response.status}`);
  }

  const body = await response.json();
  return (body.events ?? []).map(toUfcEvent);
}

export function toUfcEvent(event) {
  const venue = event.competitions?.[0]?.venue;
  return {
    id: `ufc-${event.id}`,
    start: new Date(event.date).toISOString(),
    title: event.name,
    location: [venue?.fullName, venue?.address?.city, venue?.address?.country].filter(Boolean).join(', '),
    durationHours: EVENT_DURATION_HOURS,
    cancelled: false,
  };
}

function formatDay(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}
