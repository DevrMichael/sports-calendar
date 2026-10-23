const BASE_URL = 'https://api.football-data.org/v4';
export const MAN_UTD_TEAM_ID = 66;
const MATCH_DURATION_HOURS = 2;

export async function fetchFootballEvents({
  token,
  now,
  teamId = MAN_UTD_TEAM_ID,
  days = 180,
  fetchImpl = fetch,
}) {
  const from = now.toISOString().slice(0, 10);
  const to = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `${BASE_URL}/teams/${teamId}/matches?dateFrom=${from}&dateTo=${to}`;

  const response = await fetchImpl(url, { headers: { 'X-Auth-Token': token } });
  if (!response.ok) {
    throw new Error(`football-data.org svarte ${response.status}`);
  }

  const body = await response.json();
  return body.matches.map(toFootballEvent);
}

export function toFootballEvent(match) {
  return {
    id: `fd-${match.id}`,
    start: new Date(match.utcDate).toISOString(),
    title: `${match.competition.name}: ${match.homeTeam.name} – ${match.awayTeam.name}`,
    durationHours: MATCH_DURATION_HOURS,
    cancelled: match.status === 'CANCELLED',
  };
}
