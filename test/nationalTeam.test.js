import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchNationalTeamEvents, toNationalTeamEvent } from '../src/sources/nationalTeam.js';

test('toNationalTeamEvent mapper landskamp med sted', () => {
  const event = toNationalTeamEvent({
    id: '401',
    date: '2026-11-14T17:00Z',
    name: 'Wales at Norway',
    competitions: [{ venue: { fullName: 'Ullevaal Stadion', address: { city: 'Oslo', country: 'Norway' } } }],
  });

  assert.deepEqual(event, {
    id: 'nt-401',
    start: '2026-11-14T17:00:00.000Z',
    title: 'Wales at Norway',
    location: 'Ullevaal Stadion, Oslo, Norway',
    durationHours: 2,
    cancelled: false,
  });
});

test('fetchNationalTeamEvents beholder bare kamper med Norge', async () => {
  const fakeFetch = async (url) => {
    const matchday = url.includes('dates=20261114');
    return {
      ok: true,
      json: async () => ({
        events: matchday
          ? [
              { id: '401', date: '2026-11-14T17:00Z', name: 'Wales at Norway', competitions: [] },
              { id: '402', date: '2026-11-14T19:00Z', name: 'Spain at Portugal', competitions: [] },
            ]
          : [],
      }),
    };
  };

  const events = await fetchNationalTeamEvents({
    now: new Date('2026-11-14T00:00:00Z'),
    days: 2,
    fetchImpl: fakeFetch,
  });

  assert.deepEqual(events.map((event) => event.id), ['nt-401']);
});

test('fetchNationalTeamEvents kaster feil ved HTTP-feil', async () => {
  const fakeFetch = async () => ({ ok: false, status: 503 });

  await assert.rejects(
    fetchNationalTeamEvents({ now: new Date(), days: 1, fetchImpl: fakeFetch }),
    /svarte 503/,
  );
});
