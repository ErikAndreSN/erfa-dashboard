// Lager «Dette kan du» med Claude (Message Batches API, 50 % rabatt).
//
// Forutsetter at scripts/build_study_data.py er kjørt.
// Nøkkel: ANTHROPIC_API_KEY i miljøet eller i .env.anthropic (aldri i git).
//
//   npm run enrich -- --limit 20              prøv på 20 linjer først
//   npm run enrich                            alle linjene som mangler ferdigheter
//   npm run enrich -- --courses --limit 80    prøv på 80 fag (valgfag) først
//   npm run enrich -- --courses               alle fagene som mangler ferdigheter
// Er en batch allerede sendt, hentes den i stedet for å sende en ny (så ingenting betales to ganger).
//
// Linjer: public/data/ferdigheter.json  { [programId]: { summary, skills: [{ name, semester }], categories, electiveFrom } }
// Fag:    feltet "s" (ferdigheter) i public/data/emner/<skole>.json

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";

const MODEL = "claude-opus-5-5";
const STUDIES = "public/data/studier.json";
const PROGRAMME_COURSES = ".cache/dbh/emner.json";
const PROGRAMME_OUT = "public/data/ferdigheter.json";
const CATALOG_DIR = "public/data/emner";
const COURSES_PER_REQUEST = 40;

const CATEGORIES = [
  "Markedsføring",
  "Kommunikasjon",
  "Design",
  "Video og foto",
  "Analyse",
  "Økonomi",
  "Utvikling",
  "Teknologi",
  "Helse",
  "Pedagogikk",
  "Jus",
  "Ledelse",
  "Salg og kundeservice",
  "Forskning",
  "Bærekraft",
  "Språk og oversettelse",
];

const SKILL_RULES = `Ferdigheter skal være konkrete ting en bedrift kan bruke i et oppdrag. Korte navn (1–3 ord), stor forbokstav,
norsk der det finnes et vanlig norsk ord, ellers det verktøyet eller begrepet bransjen bruker (f.eks. «Figma», «SEO», «Excel»).
Unngå generelle ferdigheter som passer alle («Samarbeid», «Kritisk tenkning», «Kommunikasjon» alene).`;

// Felles instruksjoner står først og er like for alle forespørsler, så de kan caches.
const PROGRAMME_SYSTEM = `Du hjelper Erfa, en plattform der studenter tar små, betalte oppdrag for bedrifter.
Når en student registrerer seg, velger hen studielinje og semester. Erfa viser da «Dette kan du allerede»,
slik at profilen er nesten ferdig utfylt. Studenten huker selv av det som stemmer, og legger inn valgfagene sine.

Du får navnet på én studielinje, nivået, antall studiepoeng og fagene som er registrert på linjen (listen kan være ufullstendig).
Lag:
- summary: én kort setning på norsk bokmål om hva studentene lærer, skrevet til studenten («Du lærer …»). Maks 140 tegn.
- skills: 6–8 ferdigheter fra de obligatoriske delene av linjen. For hver: semester = det semesteret en typisk student
  har lært den (1 for første semester). Grunngi dem i fagene og navnet. Ikke finn på verktøy som ikke passer linjen.
- categories: 1–3 oppdragskategorier fra listen: ${CATEGORIES.join(", ")}.
- electiveFrom: semesteret der studentene på denne typen linje vanligvis begynner å ta valgfag eller drar på utveksling.
  0 hvis linjen normalt ikke har valgfag.

${SKILL_RULES}`;

const COURSE_SYSTEM = `Du hjelper Erfa, en plattform der studenter tar små, betalte oppdrag for bedrifter.
Studenter legger inn valgfagene sine, og Erfa viser hvilke ferdigheter faget gir.

Du får en liste med fag (emnekode, navn og studiepoeng) fra én skole. For hvert fag: 0–3 ferdigheter faget gir.
Gi 0 for fag uten tydelig ferdighet for et oppdrag (f.eks. bacheloroppgave, praksis uten tema, examen philosophicum, metodefag uten verktøy).
Bruk emnekoden nøyaktig slik den står.

${SKILL_RULES}`;

const PROGRAMME_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, semester: { type: "integer" } },
        required: ["name", "semester"],
        additionalProperties: false,
      },
    },
    categories: { type: "array", items: { type: "string", enum: CATEGORIES } },
    electiveFrom: { type: "integer" },
  },
  required: ["summary", "skills", "categories", "electiveFrom"],
  additionalProperties: false,
};

const COURSE_SCHEMA = {
  type: "object",
  properties: {
    courses: {
      type: "array",
      items: {
        type: "object",
        properties: { code: { type: "string" }, skills: { type: "array", items: { type: "string" } } },
        required: ["code", "skills"],
        additionalProperties: false,
      },
    },
  },
  required: ["courses"],
  additionalProperties: false,
};

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const coursesMode = args.includes("--courses");
const STATE = coursesMode ? ".cache/enrich-courses.json" : ".cache/enrich-programmes.json";

if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error("Mangler ANTHROPIC_API_KEY. Legg den i .env.anthropic: ANTHROPIC_API_KEY=sk-ant-... (se README)");
  process.exit(1);
}

const readJson = (path, fallback) => (fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback);
const studies = readJson(STUDIES, null);
const institutions = Object.fromEntries(studies.institutions.map((i) => [i.id, i.name]));

const params = (system, schema, content, maxTokens) => ({
  model: MODEL,
  max_tokens: maxTokens,
  output_config: { effort: "medium", format: { type: "json_schema", schema } },
  system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content }],
});

// Linjer: én forespørsel per linje.
function programmeJobs() {
  const done = readJson(PROGRAMME_OUT, {});
  const courses = readJson(PROGRAMME_COURSES, {});
  return studies.programmes
    .filter((p) => !done[p.id])
    .slice(0, limit)
    .map((p) => {
      const semesters = Math.max(2, Math.round(p.credits / 30));
      const list = courses[p.id]?.length ? courses[p.id].join("; ") : "(ingen fag registrert – bruk navnet og nivået)";
      return {
        key: p.id,
        params: params(
          PROGRAMME_SYSTEM,
          PROGRAMME_SCHEMA,
          `Studielinje: ${p.name}
Nivå: ${p.level}, ${p.credits} studiepoeng (${semesters} semestre)
Skole: ${institutions[p.inst] ?? p.inst}${p.dept ? `, ${p.dept}` : ""}
Fag: ${list}`,
          4000,
        ),
      };
    });
}

// Fag: 40 fag fra samme skole per forespørsel.
function courseJobs() {
  const jobs = [];
  let left = limit;
  for (const file of fs.readdirSync(CATALOG_DIR).sort()) {
    const inst = file.replace(".json", "");
    const todo = readJson(`${CATALOG_DIR}/${file}`, []).filter((c) => !("s" in c));
    for (let i = 0; i < todo.length && left > 0; i += COURSES_PER_REQUEST) {
      const chunk = todo.slice(i, i + Math.min(COURSES_PER_REQUEST, left));
      left -= chunk.length;
      jobs.push({
        key: JSON.stringify({ inst, codes: chunk.map((c) => c.c) }),
        params: params(
          COURSE_SYSTEM,
          COURSE_SCHEMA,
          `Skole: ${institutions[inst] ?? inst}
Fag:
${chunk.map((c) => `${c.c} — ${c.n} (${c.sp} sp)`).join("\n")}`,
          8000,
        ),
      });
    }
  }
  return jobs;
}

function saveProgrammes(results) {
  const done = readJson(PROGRAMME_OUT, {});
  for (const [key, data] of results) {
    data.skills.sort((a, b) => a.semester - b.semester);
    done[key] = data;
  }
  fs.writeFileSync(PROGRAMME_OUT, JSON.stringify(done));
  console.log(`Skrev ${PROGRAMME_OUT}: ${Object.keys(done).length} linjer med ferdigheter.`);
}

function saveCourses(results) {
  const byInst = {};
  for (const [key, data] of results) {
    const { inst, codes } = JSON.parse(key);
    const skills = Object.fromEntries(data.courses.map((c) => [c.code, c.skills.slice(0, 3)]));
    byInst[inst] ??= {};
    for (const code of codes) if (skills[code]) byInst[inst][code] = skills[code];
  }
  let count = 0;
  for (const [inst, skills] of Object.entries(byInst)) {
    const path = `${CATALOG_DIR}/${inst}.json`;
    const catalog = readJson(path, []);
    for (const c of catalog) if (skills[c.c]) (c.s = skills[c.c]), count++;
    fs.writeFileSync(path, JSON.stringify(catalog));
  }
  console.log(`La inn ferdigheter for ${count} fag.`);
}

async function run(client) {
  let state = readJson(STATE, null);
  if (!state) {
    const jobs = coursesMode ? courseJobs() : programmeJobs();
    if (!jobs.length) return console.log("Alt har allerede ferdigheter.");
    // custom_id må være kort og enkel, så nøklene lagres i tilstandsfilen.
    const batch = await client.messages.batches.create({
      requests: jobs.map((job, i) => ({ custom_id: `r${i}`, params: job.params })),
    });
    state = { id: batch.id, keys: jobs.map((job) => job.key) };
    fs.mkdirSync(".cache", { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(state));
    console.log(`Sendte ${jobs.length} forespørsler i batch ${batch.id}.`);
  }
  for (;;) {
    const batch = await client.messages.batches.retrieve(state.id);
    if (batch.processing_status === "ended") break;
    const c = batch.request_counts;
    console.log(`Venter … ${c.succeeded} ferdige, ${c.processing} i arbeid, ${c.errored} feil`);
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
  const results = [];
  const failed = [];
  for await (const r of await client.messages.batches.results(state.id)) {
    const key = state.keys[Number(r.custom_id.slice(1))];
    if (r.result.type !== "succeeded") {
      failed.push(`${r.custom_id}: ${r.result.type}`);
      continue;
    }
    const message = r.result.message;
    if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens") {
      failed.push(`${r.custom_id}: ${message.stop_reason}`);
      continue;
    }
    const text = message.content.find((block) => block.type === "text");
    try {
      results.push([key, JSON.parse(text?.text ?? "")]);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      failed.push(`${r.custom_id}: ugyldig JSON`);
    }
  }
  (coursesMode ? saveCourses : saveProgrammes)(results);
  fs.rmSync(STATE, { force: true });
  if (failed.length) console.log(`${failed.length} feilet (kjør på nytt for å prøve igjen):\n  ${failed.slice(0, 20).join("\n  ")}`);
}

try {
  await run(new Anthropic());
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Ugyldig ANTHROPIC_API_KEY. Sjekk nøkkelen i .env.anthropic.");
  } else if (error instanceof Anthropic.APIError) {
    console.error(`API-feil ${error.status}: ${error.message}`);
  } else {
    throw error;
  }
  process.exitCode = 1;
}
