const SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const MATCH_DURATION_HOURS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 20;

export async function fetchNationalTeamEvents({
  team = 'Norway',
  leagues = ['uefa.nations', 'uefa.euroq', 'fifa.friendly'],
  now,
  days = 180,
  fetchImpl = fetch,
}) {
  const dates = Array.from({ length: days }, (_, offset) =>
    formatDay(new Date(now.getTime() + offset * DAY_MS)),
  );
  const requests = dates.flatMap((date) => leagues.map((league) => ({ date, league })));

  const events = [];
  for (let index = 0; index < requests.length; index += BATCH_SIZE) {
    const batch = requests.slice(index, index + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((request) => fetchDay({ ...request, fetchImpl })),
    );
    events.push(...results.flat().filter((event) => event.title.includes(team)));
  }

  return [...new Map(events.map((event) => [event.id, event])).values()];
}

async function fetchDay({ date, league, fetchImpl }) {
  const response = await fetchImpl(`${SCOREBOARD_BASE}/${league}/scoreboard?dates=${date}`);
  if (!response.ok) {
    throw new Error(`ESPN svarte ${response.status} for ${league} ${date}`);
  }

  const body = await response.json();
  return (body.events ?? []).map(toNationalTeamEvent);
}

export function toNationalTeamEvent(event) {
  const venue = event.competitions?.[0]?.venue;
  return {
    id: `nt-${event.id}`,
    start: new Date(event.date).toISOString(),
    title: event.name,
    location: [venue?.fullName, venue?.address?.city, venue?.address?.country].filter(Boolean).join(', '),
    durationHours: MATCH_DURATION_HOURS,
    cancelled: false,
  };
}

function formatDay(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}
