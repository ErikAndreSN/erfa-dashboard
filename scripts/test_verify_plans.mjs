// Tester at kontrollen i scripts/lib/verify_plans.mjs stopper feil, med E-business på Kristiania som fasit.
// Kjøres med: npm run plans:test   (henter kildene fra nettet)
//
// Hvert tilfelle er en feil vi har sett eller kan tenke oss at en automatisk innhenting gjør.
// Bare de riktige dataene skal godkjennes.

import fs from "node:fs";
import { checkPlan, checkSkills } from "./lib/verify_plans.mjs";

const NAME = "Bachelor i informasjonsteknologi - E-business";
// Fasit: E-business, kontrollert for hånd mot nettsidene (kull 2024, valgemner vår 2026 og vår 2027).
const real = JSON.parse(fs.readFileSync("scripts/fixtures/ebiz-web.json", "utf8"));
const clone = () => JSON.parse(JSON.stringify(real));
const cases = [];
const add = (name, shouldPass, edit, programme = NAME) => {
  const plan = clone();
  edit(plan);
  cases.push({ name, shouldPass, plan, programme });
};

add("riktige data", true, () => {});
add("oppdiktet valgemne", false, (p) => p.offerings[0].options.push({ n: "Kvantefysikk for hunder", sp: 30, s: [] }));
add("liste for våren 2027 merket som våren 2026", false, (p) => (p.offerings[1].term = "2026-vår"));
add("kilde utenfor skolen", false, (p) => (p.offerings[0].source.url = "https://studentforum.example.com/valgemner"));
add("endret regel", false, (p) => (p.offerings[1].options[0].r = "Kan kun velges av: BA i IT (E-business)"));
add("emne for Data Science, uten regel", false, (p) =>
  p.offerings[1].options.push({ n: "Data Science Specialization", c: "BDS999-1", sp: 30, s: [] }),
);
add("emne for Data Science, med regel", false, (p) =>
  p.offerings[1].options.push({
    n: "Data Science Specialization",
    c: "BDS999-1",
    sp: 30,
    s: [],
    r: "Kan kun velges av: BA i Data Science og BA i kunstig intelligens",
  }),
);
add("emne som er stengt for BA i IT", false, (p) =>
  p.offerings[1].options.push({
    n: "Grunnleggende informasjonsteknologi",
    c: "TEK999-1",
    sp: 30,
    s: [],
    r: "Kan ikke velges av: BA i IT, BA i cybersikkerhet, BA i Data Science, BA i kunstig intelligens, BA i psykologi og psykisk helse, BA i digital markedsføring",
  }),
);
add("helsefag-emne uten regel", false, (p) => p.offerings[1].options.push({ n: "Exercise Physiology", c: "EPA2101", sp: 15, s: [] }));
add("fag som ikke står i fagplanen", false, (p) => p.cohorts["2024-høst"].semesters[0].push({ n: "Maskinlæring", sp: 7.5, s: [] }));
add("fagplan brukt for feil kull", false, (p) => {
  p.cohorts["2025-høst"] = p.cohorts["2024-høst"];
  delete p.cohorts["2024-høst"];
});
add("fagplan brukt for feil linje", false, (p) => (p.offerings = []), "Bachelor i informasjonsteknologi - Programmering");
add("valgemner brukt for en linje som er stengt ute", false, (p) => (p.cohorts = {}), "Bachelor i psykologi og psykisk helse");

// Ferdigheter: hver må ha et ordrett sitat fra ferdighetsdelen av læringsutbyttet i emnebeskrivelsen.
const course = (p, name) => p.cohorts["2024-høst"].semesters.flat().find((c) => c.n === name);
add("«Java» uten at emnet nevner Java", false, (p) =>
  course(p, "Objektorientert programmering").s.push({ n: "Java", q: "kan anvende arv og interfaces gjennom kode med polymorfisk oppbygning" }),
);
add("«GDPR» uten at emnet nevner GDPR", false, (p) =>
  course(p, "Informasjonssikkerhet").s.push({
    n: "GDPR",
    q: "kan beskrive og følge lover og etiske normer som gjelder med hensyn til opphavsrett og informasjonssikkerhet i Norge",
  }),
);
add("ferdighet fra kunnskapsdelen («kan gjøre rede for»)", false, (p) =>
  course(p, "Undersøkelsesmetoder").s.push({
    n: "Intervjuer",
    q: "kan gjøre rede for grunnprinsippene i metoder som intervjuer, spørreundersøkelser og observasjon",
  }),
);
add("oppdiktet sitat", false, (p) => course(p, "Databaser").s.push({ n: "Python", q: "kan programmere i Python" }));
add("ferdigheter uten emnebeskrivelse", false, (p) => delete course(p, "Databaser").u);
add("emnebeskrivelse for et annet emne", false, (p) => (course(p, "Databaser").u = course(p, "Bedriftsøkonomi").u));

// Emnet må si at det inngår i linjen: Enterprise Systems inngår i E-business, ikke i Programmering.
const eps = real.cohorts["2024-høst"].semesters.flat().find((c) => c.n === "Enterprise Systems");
const membership = [
  ["emne som inngår i linjen", true, NAME],
  ["emne som ikke inngår i linjen", false, "Bachelor i informasjonsteknologi - Programmering"],
];

// Data fra Kristianias API (npm run import:kristiania): kontrollen henter API-et på nytt og sammenligner emnekodene.
const fromApi = JSON.parse(fs.readFileSync("scripts/fixtures/ebiz-api.json", "utf8"));
const apiCases = [];
const addApi = (name, shouldPass, edit) => {
  const plan = JSON.parse(JSON.stringify(fromApi));
  edit(plan);
  apiCases.push({ name: `API: ${name}`, shouldPass, plan, programme: NAME });
};
const firstCohort = (p) => Object.values(p.cohorts)[0];
addApi("riktige data", true, () => {});
addApi("emne flyttet til feil semester", false, (p) => {
  const c = firstCohort(p);
  c.semesters[1].push(c.semesters[0].shift());
});
addApi("fagplan merket med feil kull", false, (p) => {
  const [key] = Object.keys(p.cohorts);
  p.cohorts["2019-høst"] = p.cohorts[key];
  delete p.cohorts[key];
});
addApi("valgemne som ikke er i fagplanen", false, (p) => p.offerings[0].options.push({ n: "Data Science Specialization", c: "BDS999-1", sp: 30, s: [] }));
addApi("valgemner merket med feil semester", false, (p) => (p.offerings[0].term = "2027-vår"));
addApi("programside for en annen linje", false, (p) => {
  for (const c of Object.values(p.cohorts)) c.source = { ...c.source, page: c.source.page.replace("/2110/", "/21101/").replace("bachelor-i-informasjonsteknologi---e-business", "industribachelor-i-e-business") };
});
addApi("ukjent kildetype", false, (p) => (firstCohort(p).source = { ...firstCohort(p).source, type: "noe-annet" }));
cases.push(...apiCases);

let wrong = 0;
for (const [name, shouldPass, programme] of membership) {
  const problems = await checkSkills("8253", programme, eps, { mustBePartOf: true });
  const ok = shouldPass === !problems.length;
  if (!ok) wrong++;
  console.log(`${ok ? "OK  " : "FEIL"} ${name}: ${problems.length ? `stoppet (${problems[0]})` : "godkjent"}`);
}
for (const { name, shouldPass, plan, programme } of cases) {
  const problems = (await checkPlan("8253", programme, plan)).flatMap((r) => r.problems);
  const ok = shouldPass === !problems.length;
  if (!ok) wrong++;
  console.log(`${ok ? "OK  " : "FEIL"} ${name}: ${problems.length ? `stoppet (${problems[0]})` : "godkjent"}`);
}
const total = cases.length + membership.length;
console.log(wrong ? `\n${wrong} av ${total} tester feilet.` : `\nAlle ${total} tester besto.`);
if (wrong) process.exitCode = 1;
