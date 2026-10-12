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

## Samarbeid

Bidragsytere trenger skrivetilgang til det private GitHub-repoet.
Lag en egen gren for hver endring, for eksempel `codex/bedre-sokerkort`,
og åpne en pull request til `main`. Kjør `npm run build` før endringen slås sammen.

Når repoet er koblet til Vercel, kan Vercel lage forhåndsvisninger av pull requests
og oppdatere den delte demoen fra `main`. Vercel-tilgang og GitHub-tilgang er separate.
For private repoer må også Vercels krav til teammedlemskap og abonnement være oppfylt
for at andre bidragsyteres commits skal kunne publiseres automatisk.

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
