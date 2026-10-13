// Sjekker alle lagrede studieplaner mot kildene, uten AI og uten API-nøkkel.
//
//   npm run plans:check            alle skoler
//   npm run plans:check -- 8253    én skole
//
// For hvert kull og hver valgemneliste: kilden lastes ned på nytt og må ligge hos skolen, nevne kullet eller
// semesteret, og inneholde hvert fag, hvert valgemne og hver regel for hvem som kan velge det.
// I tillegg sjekkes det at emnekodene finnes i skolens fagkatalog fra DBH (bare en advarsel, siden
// valgemnepakker og nye emner ofte ikke står der).
// Avslutter med feilkode hvis noe ikke stemmer, så det kan stoppe en publisering.

import fs from "node:fs";
import { checkPlan } from "./lib/verify_plans.mjs";

const DIR = "public/data/studieplaner";
const only = process.argv[2];
const readJson = (path, fallback) => (fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback);
const studies = readJson("public/data/studier.json", { programmes: [] });
const names = Object.fromEntries(studies.programmes.map((p) => [p.id, p.name]));

let failed = 0;
let passed = 0;
let warnings = 0;
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const inst = file.replace(".json", "");
  if (only && inst !== only) continue;
  const catalog = new Set(readJson(`public/data/emner/${inst}.json`, []).map((c) => c.c.replace(/-\d+$/, "").toUpperCase()));
  for (const [id, plan] of Object.entries(readJson(`${DIR}/${file}`, {}))) {
    console.log(`\n${id} ${names[id] ?? ""}`);
    for (const { kind, key, problems } of await checkPlan(inst, names[id] ?? id, plan)) {
      if (problems.length) failed++;
      else passed++;
      console.log(`  ${problems.length ? "FEIL" : "OK  "} ${kind} ${key}`);
      for (const problem of problems) console.log(`         ${problem}`);
    }
    const codes = [
      ...Object.values(plan.cohorts ?? {}).flatMap((c) => c.semesters.flat()),
      ...(plan.offerings ?? []).flatMap((o) => o.options),
    ]
      .map((c) => c.c)
      .filter(Boolean);
    const unknown = [...new Set(codes)].filter((c) => !catalog.has(c.toUpperCase()));
    if (unknown.length) {
      warnings++;
      console.log(`  NB   ${unknown.length} emnekoder står ikke i DBH-katalogen (pakker eller nye emner?): ${unknown.join(", ")}`);
    }
  }
}
console.log(`\n${passed} godkjent, ${failed} med feil${warnings ? `, ${warnings} linjer med advarsler` : ""}.`);
if (failed) process.exitCode = 1;
