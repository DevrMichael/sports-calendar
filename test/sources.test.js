import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchFootballEvents, toFootballEvent } from '../src/sources/footballData.js';
import { fetchUfcEvents, toUfcEvent } from '../src/sources/ufc.js';

test('toFootballEvent mapper kamp og avlysning', () => {
  const event = toFootballEvent({
    id: 42,
    utcDate: '2026-10-24T16:00:00Z',
    status: 'CANCELLED',
    competition: { name: 'Premier League' },
    homeTeam: { name: 'Manchester United FC' },
    awayTeam: { name: 'Arsenal FC' },
  });

  assert.deepEqual(event, {
    id: 'fd-42',
    start: '2026-10-24T16:00:00.000Z',
    title: 'Premier League: Manchester United FC – Arsenal FC',
    durationHours: 2,
    cancelled: true,
  });
});

test('fetchFootballEvents sender token og datoer', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ matches: [] }),
    };
  };

  const events = await fetchFootballEvents({
    token: 'test-token',
    now: new Date('2026-10-23T12:00:00Z'),
    fetchImpl: fakeFetch,
  });

  assert.deepEqual(events, []);
  assert.match(calls[0].url, /\/teams\/66\/matches\?dateFrom=2026-10-23&dateTo=2027-04/);
  assert.equal(calls[0].options.headers['X-Auth-Token'], 'test-token');
});

test('fetchFootballEvents kaster feil ved HTTP-feil', async () => {
  const fakeFetch = async () => ({ ok: false, status: 403 });

  await assert.rejects(
    fetchFootballEvents({ token: 'x', now: new Date(), fetchImpl: fakeFetch }),
    /svarte 403/,
  );
});

test('toUfcEvent normaliserer tidspunkt og sted', () => {
  const event = toUfcEvent({
    idEvent: '2558809',
    strEvent: 'UFC 333 Volkanovski vs Evloev',
    strTimestamp: '2026-10-24T16:00:00',
    strVenue: 'Etihad Arena',
    strCity: 'Abu Dhabi',
    strCountry: 'United Arab Emirates',
  });

  assert.deepEqual(event, {
    id: 'ufc-2558809',
    start: '2026-10-24T16:00:00.000Z',
    title: 'UFC 333 Volkanovski vs Evloev',
    location: 'Etihad Arena, Abu Dhabi, United Arab Emirates',
    durationHours: 5,
    cancelled: false,
  });
});

test('fetchUfcEvents håndterer tom liste', async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => ({ events: null }) });

  const events = await fetchUfcEvents({ apiKey: '123', season: 2026, fetchImpl: fakeFetch });

  assert.deepEqual(events, []);
});
