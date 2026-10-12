import type { CandidateProfile } from "./CandidateExplorer";

// Espen søker på dataoppdraget. Emner og jobber er hentet fra CV-en hans;
// teksten om personen er skrevet for demoen.
export const espenProfile: CandidateProfile = {
  degree: "Bachelor · 2024–2027",
  courses: [
    {
      name: "Introduksjon til programmering",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Python", "Programmering"],
    },
    {
      name: "Digital teknologi",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["IT-grunnlag"],
    },
    {
      name: "Bedriftsøkonomi",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Økonomi"],
    },
    {
      name: "Databaser",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Databaser", "SQL", "Datamodellering"],
      about:
        "Modellerte og bygde relasjonsdatabaser, og skrev SQL-spørringer mot ekte datasett.",
    },
    {
      name: "Kreativt webprosjekt",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["HTML og CSS", "Webdesign"],
    },
    {
      name: "Samfunn og bærekraft",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Bærekraft"],
    },
    {
      name: "Informasjonssikkerhet",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Personvern", "Sikkerhet"],
    },
    {
      name: "Digital markedsføring",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Kundereise", "Google Analytics"],
    },
    {
      name: "Undersøkelsesmetoder",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Dataanalyse", "Spørreundersøkelser", "Excel"],
      about:
        "Planla en spørreundersøkelse, renset svarene og analyserte dem i Excel.",
    },
    {
      name: "Enterprise systems",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["ERP", "Forretningsprosesser"],
    },
    {
      name: "Smidig prosjekt",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Scrum", "Prosjektledelse"],
    },
    {
      name: "Data management for analytics",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Dataanalyse", "Databaser", "Power BI", "Datavisualisering"],
      about:
        "Henter, rydder og kobler data fra flere kilder, og bygger dashbord i Power BI.",
    },
    {
      name: "IT og innovasjon",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Innovasjon", "Forretningsutvikling"],
    },
    {
      name: "Bachelorprosjekt",
      term: "Vår 2027",
      status: "Kommer",
      tags: ["Prosjektarbeid"],
    },
  ],
  projects: [
    {
      title: "Datamodell for en formidlingsplattform",
      context: "SideQuest · 2026",
      text: "Designet databasen for brukere, oppdrag og søknader, med tilgang styrt etter rolle.",
      tags: ["Databaser", "Systemdesign"],
    },
    {
      title: "Nettbutikk og bestillingsflyt",
      context: "Landøy Brød & Pizza · 2025",
      text: "Laget visuell profil og satte opp bestillingen fra meny til betaling i Superb og Ordin.",
      tags: ["Webdesign", "Kundereise"],
    },
    {
      title: "Sprintbasert teamprosjekt",
      context: "Smidig prosjekt · Vår 2026",
      text: "Scrum master for et team på fem, med to ukers sprinter og demo for oppdragsgiveren.",
      tags: ["Scrum", "Prosjektledelse"],
    },
  ],
  jobs: [
    {
      role: "CTO",
      place: "SideQuest SB",
      period: "Feb. 2026 – nå",
      text: "Teknologiansvarlig. Jobber med datainnsamling, databasestruktur og systemdesign, og driver prosjektet med metoder fra IT-prosjektledelse.",
    },
    {
      role: "Webdesigner og plattformkonfigurator",
      place: "Landøy Brød & Pizza",
      period: "Sep. 2025 – nå",
      text: "Designer og setter opp nettbutikk og bestillingsflyt for restauranter, fra første inntrykk til fullført bestilling.",
    },
    {
      role: "Kurs og konferanse",
      place: "Scandic Holmenkollen",
      period: "Jan. 2025 – nå",
      text: "Planlegger, rigger og klargjør møter, kurs og konferanser sammen med kollegene.",
    },
    {
      role: "Ledende menig",
      place: "Forsvaret, Bergen",
      period: "2023",
      text: "Ledet et vaktlag og planla fysisk trening for medsoldater på ulike nivåer.",
    },
    {
      role: "Butikkmedarbeider og netthandel",
      place: "MENY, Kristiansand",
      period: "2021 – 2024",
      text: "Jobbet i kolonial og netthandel, og var kveldsleder ved behov.",
    },
  ],
  person: {
    pitch:
      "Jeg tar Data management for analytics dette semesteret og vil gjerne bruke det på ekte data. Som CTO i en studentoppstart jobber jeg allerede med datainnsamling og databaser, så jeg vet hvor mye det betyr at dataene er ryddige før man trekker konklusjoner.",
    intro:
      "Jeg er fra Kristiansand og flyttet til Oslo for å studere. Jeg liker å forstå hvordan ting henger sammen, enten det er en database, en bestillingsflyt eller et konferanseoppsett på Holmenkollen.",
    week: [
      {
        when: "Hverdager",
        what: "Forelesninger og gruppearbeid på Kristiania.",
      },
      {
        when: "Kvelder",
        what: "Utvikling og planlegging i oppstarten, og et par økter på treningssenteret.",
      },
      {
        when: "Helger",
        what: "Kurs og konferanse på Scandic Holmenkollen, eller tur i Marka.",
      },
    ],
    workStyle: [
      "Deler store oppgaver i små steg og viser fremdrift underveis.",
      "Holder roen når det er travelt. Det lærte jeg som kveldsleder på MENY.",
      "Spør heller én gang for mye enn å gjette hva dere mener.",
    ],
    interests: [
      "Løping og styrketrening",
      "Skiturer i Marka",
      "Pizza fra bunnen",
      "Teknologi og oppstart",
    ],
    fact: "Under Ridderrennet var jeg ledsager for blinde skiløpere. Det lærte meg mye om å kommunisere tydelig og å ta ansvar for andres trygghet.",
  },
};
