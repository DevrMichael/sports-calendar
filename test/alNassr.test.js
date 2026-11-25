import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAlNassrEvents, toAlNassrEvent } from '../src/sources/alNassr.js';

test('toAlNassrEvent mapper kamp med sted', () => {
  const event = toAlNassrEvent({
    id: '501',
    date: '2026-11-28T12:15Z',
    name: 'Al Nassr at Al Hazem',
    competitions: [{ venue: { fullName: 'King Abdullah Sport City Stadium', address: { city: 'Buraidah', country: 'Saudi Arabia' } } }],
  });

  assert.deepEqual(event, {
    id: 'an-501',
    start: '2026-11-28T12:15:00.000Z',
    title: 'Al Nassr at Al Hazem',
    location: 'King Abdullah Sport City Stadium, Buraidah, Saudi Arabia',
    durationHours: 2,
    cancelled: false,
  });
});

test('fetchAlNassrEvents henter terminlisten', async () => {
  const fakeFetch = async (url) => {
    assert.match(url, /teams\/817\/schedule/);
    return {
      ok: true,
      json: async () => ({ events: [{ id: '501', date: '2026-11-28T12:15Z', name: 'Al Nassr at Al Hazem' }] }),
    };
  };

  const events = await fetchAlNassrEvents({ fetchImpl: fakeFetch });
  assert.deepEqual(events.map((event) => event.id), ['an-501']);
});

test('fetchAlNassrEvents kaster feil ved HTTP-feil', async () => {
  const fakeFetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(fetchAlNassrEvents({ fetchImpl: fakeFetch }), /svarte 503/);
});
