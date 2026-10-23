const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
export const UFC_LEAGUE_ID = 4443;
const EVENT_DURATION_HOURS = 5;

export async function fetchUfcEvents({
  apiKey = '123',
  season = new Date().getUTCFullYear(),
  fetchImpl = fetch,
}) {
  const url = `${BASE_URL}/${apiKey}/eventsseason.php?id=${UFC_LEAGUE_ID}&s=${season}`;

  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`TheSportsDB svarte ${response.status}`);
  }

  const body = await response.json();
  return (body.events ?? []).map(toUfcEvent);
}

export function toUfcEvent(event) {
  return {
    id: `ufc-${event.idEvent}`,
    start: new Date(`${event.strTimestamp}Z`).toISOString(),
    title: event.strEvent,
    location: [event.strVenue, event.strCity, event.strCountry].filter(Boolean).join(', '),
    durationHours: EVENT_DURATION_HOURS,
    cancelled: false,
  };
}
