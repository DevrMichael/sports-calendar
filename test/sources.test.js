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

test('toUfcEvent mapper ESPN-event med sted', () => {
  const event = toUfcEvent({
    id: '600061267',
    date: '2026-10-24T14:00Z',
    name: 'UFC 333: Volkanovski vs. Evloev',
    competitions: [
      {
        venue: {
          fullName: 'Etihad Arena',
          address: { city: 'Abu Dhabi', country: 'United Arab Emirates' },
        },
      },
    ],
  });

  assert.deepEqual(event, {
    id: 'ufc-600061267',
    start: '2026-10-24T14:00:00.000Z',
    title: 'UFC 333: Volkanovski vs. Evloev',
    location: 'Etihad Arena, Abu Dhabi, United Arab Emirates',
    durationHours: 5,
    cancelled: false,
  });
});

test('toUfcEvent tåler manglende sted', () => {
  const event = toUfcEvent({ id: '1', date: '2026-10-24T14:00Z', name: 'UFC X' });

  assert.equal(event.location, '');
});

test('fetchUfcEvents spør etter datointervall og håndterer tom liste', async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ events: [] }) };
  };

  const events = await fetchUfcEvents({
    now: new Date('2026-10-23T12:00:00Z'),
    fetchImpl: fakeFetch,
  });

  assert.deepEqual(events, []);
  assert.match(calls[0], /dates=20261023-20270421/);
});

test('fetchUfcEvents kaster feil ved HTTP-feil', async () => {
  const fakeFetch = async () => ({ ok: false, status: 500 });

  await assert.rejects(fetchUfcEvents({ now: new Date(), fetchImpl: fakeFetch }), /svarte 500/);
});
