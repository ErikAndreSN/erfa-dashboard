import type { CandidateProfile } from "./CandidateExplorer";

// Espen søker på dataoppdraget. Emner og erfaring er hentet fra CV-en hans;
// teksten om ham er skrevet for demoen.
export const espenProfile: CandidateProfile = {
  degree: "Bachelor · 2024–2027",
  about:
    "Jeg er fra Kristiansand og studerer IT og e-business på Kristiania. Jeg liker å forstå hvordan ting henger sammen, enten det er en database, en bestillingsflyt eller et konferanseoppsett på Holmenkollen. Ved siden av studiene er jeg CTO i en studentoppstart, der jeg jobber med datainnsamling og databaser.\n\nJeg er strukturert, rolig når det er travelt og spør heller én gang for mye enn å gjette. Fra Forsvaret og årene som kveldsleder på MENY har jeg lært å ta ansvar og få et team til å trekke i samme retning. På fritiden løper jeg, går skiturer i Marka og baker pizza fra bunnen.",
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
  experience: [
    {
      role: "CTO",
      place: "SideQuest SB",
      kind: "Deltid",
      start: "2026-02",
      location: "Oslo",
      text: "Teknologiansvarlig. Jobber med datainnsamling, databasestruktur og systemdesign, og driver prosjektet med metoder fra IT-prosjektledelse.",
    },
    {
      role: "Webdesigner og digital plattformkonfigurator",
      place: "Landøy Brød & Pizza",
      kind: "Deltid",
      start: "2025-09",
      location: "Oslo",
      text: "Designer og setter opp nettbutikk og bestillingsflyt for restauranter i Superb og Ordin, fra første inntrykk til fullført bestilling.",
    },
    {
      role: "Kurs og konferanse",
      place: "Scandic Holmenkollen",
      kind: "Deltid",
      start: "2025-01",
      location: "Oslo",
      text: "Planlegger, rigger og klargjør møter, kurs og konferanser sammen med kollegene.",
    },
    {
      role: "Ledende menig, SITS",
      place: "Forsvaret",
      kind: "Verneplikt",
      start: "2023-01",
      end: "2023-12",
      location: "Bergen",
      text: "Ledet et vaktlag, planla fysisk trening for medsoldater og var ledsager for blinde skiløpere under Ridderrennet.",
    },
    {
      role: "Butikkmedarbeider og netthandel",
      place: "MENY",
      kind: "Deltid",
      start: "2021-09",
      end: "2024-08",
      location: "Kristiansand",
      text: "Jobbet i kolonial og netthandel, og var kveldsleder ved behov.",
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
};

// De fire faste demostudentene er fiktive. Alt innhold er skrevet for demoen.
export const saraProfile: CandidateProfile = {
  degree: "Bachelor · 2024–2027",
  about:
    "Jeg heter Sara og går tredje året på markedsføring og ledelse ved Kristiania. Jeg er den i gruppa som alltid spør «hvem er det egentlig vi snakker til?», og jeg elsker å gjøre kompliserte budskap enkle. Det siste året har jeg drevet Instagram for en kafé og skrevet nyhetsbrev for studentforeningen.\n\nJeg jobber best med en tydelig brief, korte tilbakemeldingsrunder og litt frihet til å prøve ting. Utenfor skolen løper jeg langs Akerselva, fotograferer med et gammelt analogkamera og leser alt jeg kommer over om merkevarer. Jeg leverer det jeg lover, til avtalt tid.",
  courses: [
    {
      name: "Markedsføringsledelse",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Markedsføring"],
    },
    {
      name: "Forbrukeratferd",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Kundeinnsikt"],
    },
    {
      name: "Digital markedsføring",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Sosiale medier", "SEO"],
      about:
        "Lagde en kanalplan og målte effekten av betalte og organiske innlegg.",
    },
    {
      name: "Kommunikasjon og tekst",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Tekst", "Copywriting"],
      about:
        "Skrev kampanjetekster og lærte å tilpasse tonen til ulike kanaler.",
    },
    {
      name: "Merkevareledelse",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Merkevare"],
    },
    {
      name: "Markedsanalyse",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Analyse"],
    },
    {
      name: "Innholdsmarkedsføring",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Sosiale medier", "Tekst", "Canva"],
      about:
        "Lagde en innholdskalender og visuelle maler i Canva for en ekte kunde.",
    },
    {
      name: "Søkemotoroptimalisering",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["SEO", "Google Analytics"],
    },
    {
      name: "Bacheloroppgave",
      term: "Vår 2027",
      status: "Kommer",
      tags: ["Prosjektarbeid"],
    },
  ],
  experience: [
    {
      role: "Ansvarlig for sosiale medier",
      place: "Kafé Lykke",
      kind: "Deltid",
      start: "2025-03",
      location: "Oslo",
      text: "Planlegger og lager innhold til Instagram og TikTok. Følgertallet er doblet på ett år.",
    },
    {
      role: "Kommunikasjonsansvarlig",
      place: "Markedsføringsforeningen ved Kristiania",
      kind: "Frivillig",
      start: "2024-09",
      location: "Oslo",
      text: "Skriver nyhetsbrev og lager plakater og innlegg til arrangementer.",
    },
    {
      role: "Butikkmedarbeider",
      place: "Bokhuset Grünerløkka",
      kind: "Deltid",
      start: "2022-08",
      end: "2025-02",
      location: "Oslo",
      text: "Kundeservice, vareplassering og ukentlige anbefalinger på butikkens Instagram.",
    },
  ],
  projects: [
    {
      title: "Kampanje for gjenbruksuka",
      context: "Kristiania · Vår 2026",
      text: "Konsept, tekster og seks innlegg for en studentkampanje om gjenbruk. Nådde 12 000 visninger.",
      tags: ["Sosiale medier", "Tekst", "Canva"],
    },
    {
      title: "SEO-gjennomgang for en nettbutikk",
      context: "Eget prosjekt · 2025",
      text: "Kartla søkeord og skrev om ti produktsider. Organisk trafikk økte med 30 prosent på tre måneder.",
      tags: ["SEO", "Tekst"],
    },
  ],
};

export const jonasProfile: CandidateProfile = {
  degree: "Bachelor · 2025–2028",
  about:
    "Jeg heter Jonas og studerer økonomi og administrasjon på BI, andre året. Jeg har alltid likt tall, men det jeg egentlig liker er å finne historien i dem. Et regneark med tusen rader gjør meg mer nysgjerrig enn stresset. Ved siden av studiene jobber jeg som regnskapsassistent, og jeg er kasserer i håndballklubben der jeg spilte som junior.\n\nJeg er grundig, liker å dobbeltsjekke og sier fra tidlig hvis noe ikke stemmer. Når jeg ikke sitter med Excel, trener jeg et jentelag i håndball, spiller sjakk på nett og lager altfor avansert taco på fredager.",
  courses: [
    {
      name: "Matematikk for økonomer",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Matematikk"],
    },
    {
      name: "Finansregnskap",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Regnskap", "Excel"],
    },
    {
      name: "Organisasjon og ledelse",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Ledelse"],
    },
    {
      name: "Statistikk",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Dataanalyse", "Excel"],
      about:
        "Regresjon, hypotesetesting og analyse av store datasett i Excel og R.",
    },
    {
      name: "Mikroøkonomi",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Økonomi"],
    },
    {
      name: "Bedriftsøkonomisk analyse",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Excel", "Dataanalyse"],
      about:
        "Lønnsomhetsanalyser og budsjettmodeller for bedrifter, bygget i Excel.",
    },
    {
      name: "Datadrevet beslutningstaking",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Power BI", "Dataanalyse"],
      about: "Bygger dashbord i Power BI som ledere kan ta beslutninger på.",
    },
    {
      name: "Investering og finansiering",
      term: "Vår 2027",
      status: "Kommer",
      tags: ["Finans"],
    },
  ],
  experience: [
    {
      role: "Regnskapsassistent",
      place: "Tallverket Regnskap",
      kind: "Deltid",
      start: "2025-10",
      location: "Oslo",
      text: "Fører bilag, avstemmer kontoer og lager månedsrapporter i Excel for små kunder.",
    },
    {
      role: "Kundeservice",
      place: "Nordlys Strøm",
      kind: "Sommerjobb",
      start: "2025-06",
      end: "2025-08",
      location: "Oslo",
      text: "Svarte på spørsmål om fakturaer og avtaler, og laget en oversikt over de vanligste henvendelsene.",
    },
    {
      role: "Kasserer og juniortrener",
      place: "Sørbyen IL",
      kind: "Frivillig",
      start: "2024-01",
      location: "Oslo",
      text: "Fører klubbens regnskap, lager budsjett for sesongen og trener et jentelag på 12 år.",
    },
  ],
  projects: [
    {
      title: "Dashbord for klubbøkonomien",
      context: "Sørbyen IL · 2026",
      text: "Samlet tre års regnskap i Power BI, slik at styret ser utgiftene for hvert lag.",
      tags: ["Power BI", "Excel"],
    },
    {
      title: "Hva bruker studenter penger på?",
      context: "BI · Vår 2026",
      text: "Spørreundersøkelse med 240 svar, analysert i Excel og presentert for kullet.",
      tags: ["Dataanalyse", "Excel"],
    },
  ],
};

export const linaProfile: CandidateProfile = {
  degree: "Bachelor · 2024–2027",
  about:
    "Jeg heter Lina og går tredje året på interaksjonsdesign ved NTNU i Gjøvik. Jeg blir oppriktig glad når noen sier «å, var det bare det?» etter å ha prøvd noe jeg har designet. Jeg starter alltid med å snakke med brukerne, og har gjennomført over førti brukertester i studier og oppdrag.\n\nJeg er nysgjerrig, rolig og ganske direkte, og trives best i små team der alle tør å si hva de mener. På fritiden syr jeg mine egne klær, spiller i et lite band og arrangerer brettspillkvelder for hele kullet. Jeg gleder meg til å bruke det jeg kan på ekte problemer.",
  courses: [
    {
      name: "Introduksjon til interaksjonsdesign",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Design"],
    },
    {
      name: "Visuell kommunikasjon",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["Design", "Typografi"],
    },
    {
      name: "Programmering for designere",
      term: "Høst 2024",
      status: "Fullført",
      tags: ["HTML og CSS"],
    },
    {
      name: "Brukersentrert design",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Brukertesting", "Design"],
      about:
        "Planla og gjennomførte brukertester, og gjorde funnene om til konkrete endringer.",
    },
    {
      name: "Prototyping",
      term: "Vår 2025",
      status: "Fullført",
      tags: ["Figma", "Prototyping"],
      about:
        "Bygde klikkbare prototyper i Figma og testet dem med ekte brukere.",
    },
    {
      name: "Universell utforming",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Tilgjengelighet"],
    },
    {
      name: "Brukerundersøkelser",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Brukertesting", "Intervju"],
    },
    {
      name: "Tjenestedesign",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Tjenestedesign"],
    },
    {
      name: "Designsystemer",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Figma", "Design"],
    },
    {
      name: "Avansert interaksjonsdesign",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Design", "Figma"],
    },
    {
      name: "Kvantitative metoder i UX",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Brukertesting", "Analyse"],
    },
    {
      name: "Bacheloroppgave",
      term: "Vår 2027",
      status: "Kommer",
      tags: ["Prosjektarbeid"],
    },
  ],
  experience: [
    {
      role: "UX-designer",
      place: "Mjøsa Digital",
      kind: "Deltid",
      start: "2025-08",
      location: "Gjøvik",
      text: "Designer og tester nye funksjoner i en bookingapp sammen med to utviklere.",
    },
    {
      role: "Arrangør og designer",
      place: "Brettspillklubben Gjøvik",
      kind: "Frivillig",
      start: "2024-10",
      location: "Gjøvik",
      text: "Arrangerer månedlige spillkvelder og lager plakater og nettside for klubben.",
    },
    {
      role: "Barista",
      place: "Kafé Strand",
      kind: "Deltid",
      start: "2023-06",
      end: "2024-08",
      location: "Hamar",
      text: "Laget kaffe, tok imot bestillinger og laget ny meny og skilting.",
    },
  ],
  projects: [
    {
      title: "Ny bestillingsflyt for en bookingapp",
      context: "Mjøsa Digital · 2026",
      text: "Redesign basert på tolv brukertester. Andelen fullførte bestillinger økte fra 61 til 78 prosent.",
      tags: ["Figma", "Brukertesting"],
    },
    {
      title: "Tilgjengelighetsrevisjon av en studentportal",
      context: "NTNU · Høst 2025",
      text: "Testet portalen med skjermleser og fem brukere, og leverte en prioritert liste med forbedringer.",
      tags: ["Brukertesting", "Tilgjengelighet"],
    },
  ],
};

export const emilProfile: CandidateProfile = {
  degree: "Bachelor · 2025–2028",
  about:
    "Jeg heter Emil, studerer film og medieproduksjon på Kristiania og har klippet video siden jeg fikk min første mobil. Jeg liker korte formater der hvert sekund må fortjene plassen sin, og jeg bruker gjerne en ekstra time på å finne riktig overgang eller lydeffekt.\n\nVed siden av studiene filmer jeg arrangementer for studentene og lager innhold for et treningssenter. Jeg er selvstendig, men liker å vise tidlige utkast så vi raskt finner riktig retning. På fritiden spiller jeg fotball, ser altfor mye film og tar bilder på reise. Jeg gleder meg til å lage noe folk faktisk ser ferdig.",
  courses: [
    {
      name: "Filmspråk og fortelling",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Historiefortelling"],
    },
    {
      name: "Kamera og lys",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Foto", "Video"],
    },
    {
      name: "Medieproduksjon",
      term: "Høst 2025",
      status: "Fullført",
      tags: ["Video"],
    },
    {
      name: "Klipp og etterarbeid",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Videoklipping", "Premiere Pro"],
      about:
        "Klippet kortfilm og reklame i Premiere Pro, med vekt på rytme og lyd.",
    },
    {
      name: "Lyddesign",
      term: "Vår 2026",
      status: "Fullført",
      tags: ["Lyd"],
    },
    {
      name: "Innhold for sosiale medier",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["SoMe", "Videoklipping"],
      about:
        "Lager korte videoer for TikTok og Reels, og måler hva som holder på seerne.",
    },
    {
      name: "Fargekorrigering",
      term: "Høst 2026",
      status: "Pågår",
      tags: ["Premiere Pro", "DaVinci Resolve"],
    },
    {
      name: "Dokumentarproduksjon",
      term: "Vår 2027",
      status: "Kommer",
      tags: ["Video"],
    },
  ],
  experience: [
    {
      role: "Videoprodusent",
      place: "Puls Trening",
      kind: "Frilans",
      start: "2026-01",
      location: "Oslo",
      text: "Lager to korte treningsvideoer i uka til Instagram og TikTok.",
    },
    {
      role: "Fotograf og videograf",
      place: "Filmklubben ved Kristiania",
      kind: "Frivillig",
      start: "2025-09",
      location: "Oslo",
      text: "Filmer og klipper korte filmer fra fester, debatter og konserter.",
    },
    {
      role: "Butikkmedarbeider",
      place: "Sportshuset Lillestrøm",
      kind: "Deltid",
      start: "2022-05",
      end: "2025-07",
      location: "Lillestrøm",
      text: "Kundeservice og salg, og ansvar for butikkens korte produktvideoer.",
    },
  ],
  projects: [
    {
      title: "Film fra fadderuka",
      context: "Kristiania · 2025",
      text: "To minutter fra en uke med 40 timer råmateriale. Over 15 000 visninger på Instagram.",
      tags: ["Videoklipping", "Premiere Pro"],
    },
    {
      title: "Kortfilmen «Siste tog»",
      context: "Klipp og etterarbeid · Vår 2026",
      text: "Klipp, lyd og farge på en sju minutter lang kortfilm som ble vist på skolens filmkveld.",
      tags: ["Videoklipping", "Premiere Pro"],
    },
  ],
};

// Et kort utkast til resten av søkerne, satt sammen av det de har oppgitt.
const openers = [
  "Jeg blir motivert av oppgaver der jeg ser resultatet med en gang, og liker å jobbe tett med dem jeg lager noe for.",
  "Jeg er den som gjerne holder trådene i et gruppeprosjekt, og jeg liker at ting blir ordentlig gjort.",
  "Jeg er nysgjerrig av natur og prøver gjerne nye verktøy og måter å jobbe på før jeg bestemmer meg.",
];
const middles = [
  "Jeg jobber best med en tydelig brief og korte tilbakemeldingsrunder underveis.",
  "Jeg sier fra tidlig hvis noe er uklart, og jeg leverer det jeg har lovet til avtalt tid.",
  "Jeg liker å vise tidlige utkast, slik at vi raskt finner riktig retning sammen.",
];
const hobbies = [
  "trener jeg mye og er ofte på tur i skogen",
  "spiller jeg i et band og tar bilder på reise",
  "lager jeg mat for venner og leser mye",
  "spiller jeg fotball og ser altfor mange serier",
];
const generic = ["Sosiale medier", "Tekst", "Video", "Foto", "Analyse"];
const word = (skill: string) =>
  generic.includes(skill) ? skill.toLowerCase() : skill;

export function poolAbout(
  student: {
    name: string;
    study: string;
    school: string;
    semester: string;
    skills: string[];
  },
  pick: (n: number) => number,
) {
  const [a, b, c] = student.skills.map(word),
    from = <T,>(list: T[], n: number) =>
      list[Math.floor(pick(n) * list.length)];
  return [
    `Jeg heter ${student.name.split(" ")[0]} og går ${student.semester} på ${student.study.toLowerCase()} ved ${student.school}. ${from(openers, 1)} Det jeg kan best er ${a} og ${b}, og jeg bruker ${c} i nesten alt jeg lager.`,
    `${from(middles, 2)} På fritiden ${from(hobbies, 3)}. Jeg søker oppdrag fordi jeg vil bruke det jeg lærer på ekte oppgaver, få tilbakemelding fra folk i bransjen og bygge en portefølje jeg er stolt av.`,
  ].join("\n\n");
}
