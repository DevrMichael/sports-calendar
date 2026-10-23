# Sportskalender

Henter Manchester United-kamper (Premier League og Champions League) fra football-data.org og UFC-events fra ESPNs offentlige API, og skriver dem til en `.ics`-feed som Google Kalender kan abonnere på. ESPN-endepunktet er uoffisielt og kan endre seg uten varsel.

## Oppsett

1. Kopier `.env.example` til `.env` og legg inn `FOOTBALL_DATA_TOKEN`. `.env` er gitignored.
2. Kjør `npm test` og `npm run build`. Resultatet havner i `docs/calendar.ics`.
3. Legg `FOOTBALL_DATA_TOKEN` som GitHub Actions secret.
4. Slå på GitHub Pages: Settings → Pages → Deploy from branch `main`, mappe `/docs`.

## Legge til i Google Kalender

1. Åpne Google Kalender på nett.
2. Under «Andre kalendere» klikk + → «Fra URL».
3. Lim inn `https://DevrMichael.github.io/sports-calendar/calendar.ics`.

Google henter abonnerte kalendre på nytt omtrent hvert 12.–24. time, så endringer kan ta opptil et døgn å vises.

## Hvordan det oppdateres

GitHub Action (`.github/workflows/update-calendar.yml`) kjører hver dag kl. 05 UTC og kan også kjøres manuelt. Den committer bare hvis `docs/calendar.ics` har endret seg.

Hendelser har stabil ID, så en flyttet kamp erstatter den gamle. Kamper som forsvinner fra kilden markeres som avlyst (`STATUS:CANCELLED`) så lenge de ligger i fremtiden.
