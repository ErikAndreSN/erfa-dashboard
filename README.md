# Erfa – dashboard-demo

Interaktiv designprototype for studenter og bedrifter. React, TypeScript og Vite.
Alle studenter, oppdrag og beløp er fiktive eksempeldata.

## Kjør lokalt

Bruk Node.js 22.12 eller nyere.

```bash
npm ci
npm run dev -- --port 5173
```

- Student: http://127.0.0.1:5173/
- Bedrift: http://127.0.0.1:5173/bedrift

Bygg med `npm run build`. Resultatet ligger i `dist/`.

## Hvor ligger koden?

- `src/main.tsx`: inngang, studentnavigasjon og ruting mellom flatene.
- `src/StudentOverview.tsx`: studentoversikt.
- `src/BusinessDashboard.tsx`: bedriftsoversikt, oppdragsbrett, søkere og attester.
- `src/business.css`: bedriftsstil.
- `src/reference-style.css`, `src/overview.css` og `src/erfa-theme.css`: studentstil og tema.
- `src/components/arc/`: delte grensesnittkomponenter.
- `src/brand.tsx`: merkenavn og symbol. Endre `BRAND_NAME` her for felles logo-navn.
- `public/`: illustrasjoner, demo-video og logoer.

Eldre designfiler er bevart, men er ikke egne publiserte sider.

## Registrering

`/registrer` er en registrering i tre trykk: skole (søk, f.eks. «kristiania» viser skolen og alle instituttene),
linje og semester, pluss valgfag når studenten har kommet så langt. Deretter viser siden fagene og «Dette kan du
allerede», og lagrer profilen i nettleseren før den sender studenten til `/student`.

Skoler og linjer kommer fra åpne data i DBH (HK-dir, NLOD) og ligger i `public/data/studier.json`.
Oppdater dem hvert semester (henter ~1 GB første gang og lagrer det i `.cache/`, som ikke er i git):

```bash
npm run study-data
```

Når studenten velger semester, regner registreringen ut kullet (oppstart) og når hvert valg ble tatt. Den fyller inn
fagene fra fagplanen for akkurat det kullet, og viser valgemnene linjen kunne velge det semesteret. Dataene ligger i
`public/data/studieplaner/<skole>.json`, med kilde for hver fagplan og hver valgemneliste.

**Ingenting vises uten kontroll.** Mangler en kontrollert fagplan eller valgemneliste, sier registreringen det, og
studenten søker blant alle fagene på skolen i stedet. Kontrollen (`scripts/lib/verify_plans.mjs`) laster ned kildene
på nytt og krever at

- kilden ligger på skolens eget domene (`scripts/school_domains.json`) eller er en arkivert kopi av en slik side,
- fagplanen har linjenavnet i tittelen og gjelder kullet, og valgemnelisten gjelder semesteret (det som nevnes oftest),
- hvert fag, valgemne og hver regel for hvem som kan velge et emne står i kilden (reglene ordrett, ved emnet),
- regelen åpner for linjen («Kan kun velges av: BA i IT (… E-business …)»), og at emner med regel ikke mangler den.

```bash
npm run plans:check     # sjekk alle lagrede planer mot kildene (ingen API-nøkkel)
npm run plans:test      # sjekk at kontrollen stopper 25 typer feil (og godtar de riktige dataene)
```

**Skoler med åpne data hentes uten AI.** Høyskolen Kristiania har et åpent API i studieportalen med fagplanen for
hvert kull, valgemnene per kull (med pakker og delemner) og emnebeskrivelser per semester. Kontrollen henter API-et
på nytt og sammenligner hver emnekode med fagplanen for kullet:

```bash
npm run import:kristiania                    # alle linjene (tar 15–30 min første gang, ingen API-nøkkel)
npm run import:kristiania -- --id 8253-2110  # én linje
```

Plassholdere i fagplanen («Valgemner», «Utveksling») blir aldri vist som emner; da søker studenten blant skolens fag.

Nye planer for skoler uten åpne data lages med Claude og nettsøk. Hver fagplan og valgemneliste må bestå kontrollen over og en egen Claude-kontroll
som leser kilden; feiler ett punkt, forkastes hele listen (se `.cache/studieplaner-rapport.json`). Legg
`ANTHROPIC_API_KEY=...` i `.env.anthropic` (aldri i git; ikke `.env.local`, den skriver `vercel env pull` over), prøv på noen linjer først, og kjør så resten. `--budget` stopper ved
et beløp i dollar, og ferdige linjer hoppes over neste gang:

```bash
npm run plans -- --inst 8253 --limit 5
npm run plans -- --inst 8253 --budget 100
npm run plans -- --budget 2000
```

Valgemnelister skifter hvert semester. Kjør `npm run plans:check` jevnlig; endrer en skole siden, feiler kontrollen.

**Ferdigheter** hentes fra læringsutbyttet i emnebeskrivelsen til hvert fag (i versjonen for semesteret studenten hadde
faget). Hver ferdighet har en setning ordrett fra delen «Ferdigheter» eller «Generell kompetanse» – aldri «Kunnskap» – og
verktøy som «JavaScript» eller «Wireshark» må stå i den setningen eller i emnets liste over arbeidsverktøy. Emnet må også
si at det inngår i linjen. `npm run plans:check` sjekker dette, og registreringen viser hvilket fag og hvilken setning en
ferdighet kommer fra. Ferdigheter uten kilde vises ikke.

For å måle hvor riktige ferdighetene er, vurderer mennesker dem i et regneark:

```bash
npm run skills:review               # lager vurdering/ferdigheter.csv (åpne i Excel/Numbers, fyll inn «riktig»)
npm run skills:review -- --score    # andel riktige av det som vises (mål ≥ 95 %) og andel funnet (≈ 80 %)
```

Linjer uten fagplan bruker et anslag fra `public/data/ferdigheter.json` til ferdighetene:

```bash
npm run enrich -- --limit 20
npm run enrich
```

## Samarbeid

Repoet er åpent: https://github.com/ErikAndreSN/erfa-dashboard.
Alle kan lese koden; for å pushe trenger du skrivetilgang (be eieren legge deg til som samarbeidspartner).
Lag en egen gren for hver endring, for eksempel `espen/bedre-matrise`,
og åpne en pull request til `main`. Kjør `npm run build` før endringen slås sammen.

Vercel lager en forhåndsvisning av hver pull request og oppdaterer den delte demoen
(https://erfa-dashboard.vercel.app) når endringer kommer inn på `main`.
Fordi repoet er åpent, publiseres også commits fra andre bidragsytere enn eieren.

## Koble til Vercel

Importer dette GitHub-repoet som et eget Vercel-prosjekt.
Repoets rot er appens rot; velg **Vite**, byggkommando **npm run build**
og resultatmappe **dist**. Ingen miljøvariabler trengs for demoen.
`vercel.json` sørger for at `/bedrift` og `/student` også fungerer ved direkte åpning.

## Hva demoen gjør

Profil, erfaringer og oppdrag lagres i nettleserens localStorage.
Hver person har sine egne eksempeldata; endringer synkroniseres ikke mellom brukere.
Nye søkere samles i en innboks per annonse med «Erfa anbefaler» (de fem beste), en oppsummering og en
sammenligningsmatrise: oppdragets ferdigheter og verktøy er kolonner (må ha / fint å ha, valgt ved publisering),
og hver søker får 0–4 per krav etter dokumentasjon (4 attest, 3 fullført oppdrag, 2 studier, 1 oppgitt selv).
Samsvar er vektet snitt der må-krav teller dobbelt. Filtre, flervalg og valgene Gå videre, Ikke nå og Lagre i talentbase. Det første oppdraget har 40 fiktive søkere.
Brettet viser Søkt som et oppsummeringskort og følger de valgte gjennom Vurderes → Tilbudt jobb → Fått jobben.
Både dra-og-slipp, tastatur og statusvalg støttes. Tilbud og aksept er bare demoregistreringer.
Valgte studenter følges opp under Oppdrag, med egne faner for Pågående og Fullførte.
Bedriften kan skrive attest og lagre kandidater i en lokal talentbase.
Oppdragsskjemaet har verktøynivå 1–5, kompetansekrav, arbeidshverdag, oppstart,
arbeidssted, tilknytningsform og timepris/totalpris. Gebyr for timepris beregnes ikke
uten bekreftet samlet honorar.
Statistikk viser uttrykkelig fiktive klikk og lagringer. Søkertall følger demoen;
kvalifiserte søknader er eksempeldata med minst 85 % samsvar per søknad.
`/bedrift?demo=qa` starter med eksempeldata og lagrer ikke endringer.

Demoen har ingen backend, ekte innlogging, betalingsfunksjon eller meldingssending.
Honorar betales direkte mellom bedrift og student utenfor plattformen.
Gebyroversikter er eksempler, ikke fakturaer.
Demoen er satt til `noindex` i Vercel-konfigurasjonen.

Talentbasen har lokale utkast for nytt samarbeid og tilbud om fast stilling.
Ingen forespørsler sendes til kandidater fra demoen.

<!-- Testendring fra Claude for å sjekke GitHub-tilkoblingen. Trygg å slette. -->
