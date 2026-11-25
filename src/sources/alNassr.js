const SCHEDULE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams';
const AL_NASSR_ID = '817';
const MATCH_DURATION_HOURS = 2;

export async function fetchAlNassrEvents({ teamId = AL_NASSR_ID, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${SCHEDULE_URL}/${teamId}/schedule?fixture=true`);
  if (!response.ok) {
    throw new Error(`ESPN svarte ${response.status} for Al Nassr`);
  }

  const body = await response.json();
  return (body.events ?? []).map(toAlNassrEvent);
}

export function toAlNassrEvent(event) {
  const venue = event.competitions?.[0]?.venue;
  return {
    id: `an-${event.id}`,
    start: new Date(event.date).toISOString(),
    title: event.name,
    location: [venue?.fullName, venue?.address?.city, venue?.address?.country].filter(Boolean).join(', '),
    durationHours: MATCH_DURATION_HOURS,
    cancelled: false,
  };
}
