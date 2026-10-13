// Finner studieplanen for hver linje med Claude og nettsøk: fagene per semester for hvert kull som studerer nå,
// og valgemnene linjen kunne velge i det semesteret kullet valgte dem.
//
// Ingenting lagres uten å bestå to kontroller:
//   1. Kontrollen uten AI (scripts/lib/verify_plans.mjs): kilden hentes på nytt og må ligge hos skolen,
//      gjelde riktig kull/semester og inneholde hvert fag, valgemne og hver regel ordrett.
//   2. En egen Claude-kontroll som leser kilden og sjekker hvert punkt for akkurat denne linjen.
// Feiler ett punkt, forkastes hele fagplanen eller valgemnelisten. Registreringen sier da ærlig at
// den mangler, i stedet for å gjette.
//
// Forutsetter at scripts/build_study_data.py er kjørt. Nøkkel: ANTHROPIC_API_KEY i .env.anthropic (aldri i git).
//
//   npm run plans -- --id 8253-2110                 én linje
//   npm run plans -- --inst 8253 --limit 5          fem linjer på Kristiania (prøv først)
//   npm run plans -- --inst 8253 --budget 100       hele Kristiania
//   npm run plans -- --budget 2000                  alle linjene
//   --parallel 6    antall linjer samtidig (standard 4)
//   --retry         prøv igjen linjer der ingenting ble godkjent sist
//
// Ut: public/data/studieplaner/<skole>.json, og en rapport over alt som ble forkastet i .cache/studieplaner-rapport.json.

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import { DOMAINS, checkSkills, checkUnit, sourceText } from "./lib/verify_plans.mjs";

const MODEL = "claude-opus-5-5";
// Opus 5.5: 4 / 20 dollar per million tokens inn/ut, 0,20 for cache-lesing, 10 dollar per 1000 nettsøk.
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, search: 0.01 };
const STUDIES = "public/data/studier.json";
const PROGRAMME_COURSES = ".cache/dbh/emner.json";
const OUT_DIR = "public/data/studieplaner";
const REPORT = ".cache/studieplaner-rapport.json";

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

// Semestre som tall (år * 2, + 1 for høst), så «tre semestre før nå» blir enkel regning.
const termIndex = (date) => date.getFullYear() * 2 + (date.getMonth() >= 6 ? 1 : 0);
const termKey = (i) => `${Math.floor(i / 2)}-${i % 2 ? "høst" : "vår"}`;
const termText = (i) => `${i % 2 ? "høsten" : "våren"} ${Math.floor(i / 2)}`;
const NOW = termIndex(new Date());

const SYSTEM = `Du hjelper Erfa, en plattform der studenter tar små, betalte oppdrag for bedrifter.
Når en student registrerer seg, velger hen skole, linje og semester. Erfa fyller da inn fagene studenten har hatt,
og viser bare de valgemnene linjen faktisk kunne velge. Dette må stemme 100 %: heller ingenting enn noe som er feil.

Du får én linje og en tabell over kullene som studerer nå. Finn, med web_search og web_fetch:
1. For hvert kull: programbeskrivelsen / studieplanen som gjelder for akkurat det kullet, på skolens egne sider.
   Mange skoler har én fil per kull («kull 2024», «gyldig fra høst 2024»). Bruk aldri en annen årgang i stedet.
2. For hvert valg kullet allerede har hatt eller har nå: listen over valgemner for det semesteret valget ble tatt
   (se tabellen). Viser skolens side nå et nyere semester, bruk en arkivert kopi av den samme siden på
   web.archive.org fra rett før valget. Ta bare med emner som er åpne for denne linjen.

Regler for det du lagrer med lagre_studieplan (én gang):
- Bare kilder på skolens eget domene (eller web.archive.org-kopier av sider der). Oppgi den nøyaktige adressen du leste.
- Kopier fag- og emnenavn ordrett slik kilden skriver dem, og emnekoden når kilden har den (ellers tom streng).
- rule: har kilden en regel for hvem som kan velge emnet («Kan kun velges av: …», «Kan ikke velges av: …»),
  kopier den ordrett uten parentesene rundt. Ellers tom streng. Ta ikke med emner der regelen stenger linjen ute.
- semesters: de obligatoriske fagene i hvert semester. Semestre med bare valg/utveksling får tom liste.
- slots: hvert sted i studieløpet der studenten velger selv: semester, studiepoeng, kort tittel
  («Valgemne, utveksling eller praksis»), exchange = utveksling er vanlig der, open = fritt valg blant alle skolens emner.
  Har linjen studieretninger, legg fagene som er felles i semesters og hver retning som en egen slot med tittel «Studieretning: <navn>».
- exclusive = true for valgemner som bare er åpne for denne linjen eller noen få linjer.
- course_url: adressen til emnebeskrivelsen for faget, i versjonen for semesteret kullet hadde faget
  (mange skoler har én versjon per semester). Den må ha læringsutbytte.
- skills: 0–4 ferdigheter per fag som en bedrift kan bruke i et oppdrag, hentet fra læringsutbyttet i emnebeskrivelsen:
  - quote: hele setningen ordrett fra delen «Ferdigheter» eller «Generell kompetanse». Aldri fra «Kunnskap»
    («kan forklare», «kjenner til» er ikke ferdigheter).
  - name: kort navn (1–3 ord) som setningen faktisk støtter; norsk der det finnes et vanlig norsk ord.
  - tool_quote: skal navnet ha et verktøy eller en teknologi («JavaScript», «Wireshark», «ERP»), må det stå i quote
    eller i en setning du kopierer ordrett fra samme emnebeskrivelse (f.eks. «Arbeidsverktøy»). Ellers tom streng.
    Ikke finn på verktøy: står det ikke «Java», skriv ikke Java.
  - 0 ferdigheter for bacheloroppgave, praksis uten tema og fag der læringsutbyttet bare er refleksjon og diskusjon.
- summary: én setning til studenten om hva linjen lærer bort («Du lærer …»), maks 140 tegn.
- categories: 1–3 oppdragskategorier fra listen: ${CATEGORIES.join(", ")}.
Finner du ikke en kilde for et kull eller et semester, utelat det. Finner du ingenting, lagre med found = false.`;

const REVIEW_SYSTEM = `Du kontrollerer data for Erfa før studenter og bedrifter får se dem. Du får teksten fra én offisiell kilde og en
liste som er hentet ut av den. Vær streng: ok = true bare når kilden klart støtter punktet for akkurat denne linjen og
dette kullet eller semesteret. Ta hensyn til regler andre steder i kilden (studiested, nivå, fakultet, forkunnskaper,
emner som utgår). Er du i tvil, ok = false. Svar med verktøyet vurdering.

For ferdigheter får du navnet og setningen fra læringsutbyttet. ok = true bare hvis en bedrift som leser navnet, ville
forvente akkurat det setningen sier studenten kan, ikke mer: «Lønnsomhetsanalyse» for «kan beregne lønnsomhet ved hjelp av
nåverdi» er ok; «GDPR» for «kan følge lover om opphavsrett» er ikke ok; «Java» når setningen ikke nevner Java er ikke ok.`;

const course = {
  type: "object",
  properties: {
    name: { type: "string" },
    code: { type: "string" },
    credits: { type: "number" },
    course_url: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, quote: { type: "string" }, tool_quote: { type: "string" } },
        required: ["name", "quote", "tool_quote"],
        additionalProperties: false,
      },
    },
  },
  required: ["name", "code", "credits", "course_url", "skills"],
  additionalProperties: false,
};
const season = { type: "string", enum: ["høst", "vår"] };

const SAVE_TOOL = {
  name: "lagre_studieplan",
  description: "Lagrer fagplanene per kull og valgemnelistene per semester for linjen. Kalles én gang.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      found: { type: "boolean" },
      summary: { type: "string" },
      categories: { type: "array", items: { type: "string", enum: CATEGORIES } },
      cohorts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            start_year: { type: "integer" },
            start_season: season,
            source_title: { type: "string" },
            source_url: { type: "string" },
            semesters: {
              type: "array",
              items: {
                type: "object",
                properties: { semester: { type: "integer" }, courses: { type: "array", items: course } },
                required: ["semester", "courses"],
                additionalProperties: false,
              },
            },
            slots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  semester: { type: "integer" },
                  credits: { type: "number" },
                  title: { type: "string" },
                  exchange: { type: "boolean" },
                  open: { type: "boolean" },
                },
                required: ["semester", "credits", "title", "exchange", "open"],
                additionalProperties: false,
              },
            },
          },
          required: ["start_year", "start_season", "source_title", "source_url", "semesters", "slots"],
          additionalProperties: false,
        },
      },
      offerings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term_year: { type: "integer" },
            term_season: season,
            semester: { type: "integer" },
            source_title: { type: "string" },
            source_url: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ...course.properties,
                  exclusive: { type: "boolean" },
                  rule: { type: "string" },
                },
                required: [...course.required, "exclusive", "rule"],
                additionalProperties: false,
              },
            },
          },
          required: ["term_year", "term_season", "semester", "source_title", "source_url", "options"],
          additionalProperties: false,
        },
      },
    },
    required: ["found", "summary", "categories", "cohorts", "offerings"],
    additionalProperties: false,
  },
};

const REVIEW_TOOL = {
  name: "vurdering",
  description: "Resultatet av kontrollen.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      gjelder_linjen: { type: "boolean" },
      gjelder_perioden: { type: "boolean" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, ok: { type: "boolean" }, reason: { type: "string" } },
          required: ["name", "ok", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: ["gjelder_linjen", "gjelder_perioden", "items"],
    additionalProperties: false,
  },
};

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const onlyId = flag("--id", "");
const onlyInst = flag("--inst", onlyId.split("-")[0] || "");
const limit = Number(flag("--limit", Infinity));
const budget = Number(flag("--budget", 25));
const parallel = Number(flag("--parallel", 4));
const retry = args.includes("--retry");

if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error("Mangler ANTHROPIC_API_KEY. Legg den i .env.anthropic: ANTHROPIC_API_KEY=sk-ant-... (se README)");
  process.exit(1);
}

const readJson = (path, fallback) => (fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback);
const writeJson = (path, data) => {
  fs.writeFileSync(`${path}.tmp`, JSON.stringify(data));
  fs.renameSync(`${path}.tmp`, path);
};
const studies = readJson(STUDIES, null);
const institutions = Object.fromEntries(studies.institutions.map((i) => [i.id, i]));
const dbhCourses = readJson(PROGRAMME_COURSES, {});
const report = readJson(REPORT, {});
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(".cache", { recursive: true });

const plansFor = (inst) => readJson(`${OUT_DIR}/${inst}.json`, {});
const todo = studies.programmes
  .filter((p) => (!onlyInst || p.inst === onlyInst) && (!onlyId || p.id === onlyId))
  .filter((p) => onlyId || (!plansFor(p.inst)[p.id] && (retry || !report[p.id])))
  .slice(0, limit);

const spent = { value: 0 };
const cost = (u) =>
  ((u.input_tokens ?? 0) * PRICE.input +
    (u.output_tokens ?? 0) * PRICE.output +
    (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
    (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) /
    1e6 +
  (u.server_tool_use?.web_search_requests ?? 0) * PRICE.search;

// Tabellen Claude får: hvilket semester hvert kull er i nå, og når hvert semester var.
function cohortTable(p) {
  const length = Math.max(2, Math.round(p.credits / 30));
  const rows = [];
  for (let now = 1; now <= length; now++) {
    const start = NOW - (now - 1);
    if (start % 2 === 0) continue; // vanlig oppstart er om høsten; vårkull nevnes i instruksen
    const semesters = Array.from({ length }, (_, i) => `${i + 1}. sem = ${termText(start + i)}${i + 1 === now ? " (nå)" : ""}`);
    rows.push(`Kull ${termText(start).replace("høsten ", "høst ")} (i ${now}. semester nå): ${semesters.join(", ")}`);
  }
  return rows.join("\n");
}

async function ask(client, request) {
  const response = await client.messages.create(request);
  spent.value += cost(response.usage);
  return response;
}

async function findPlan(client, p) {
  const inst = institutions[p.inst];
  const known = dbhCourses[p.id]?.length ? dbhCourses[p.id].join("; ") : "(ingen registrert)";
  const messages = [
    {
      role: "user",
      content: `Linje: ${p.name}
Skole: ${inst?.name ?? p.inst}${p.dept && p.dept !== inst?.name ? `, ${p.dept}` : ""} (offisielle domener: ${(DOMAINS[p.inst] ?? []).join(", ")})
Studiested: ${inst?.campuses.join(", ") || "ukjent"}${p.online ? " (nettstudium)" : ""}
Nivå: ${p.level}, ${p.credits} studiepoeng
I dag: ${termText(NOW)}

Kull som studerer nå (har linjen også oppstart om våren, ta med de kullene på samme måte):
${cohortTable(p)}

Fag registrert på linjen i DBH (kan være ufullstendig og ha med valgemner): ${known}`,
    },
  ];
  for (let turn = 0; turn < 10; turn++) {
    const response = await ask(client, {
      model: MODEL,
      max_tokens: 20000,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 10 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 14 },
        SAVE_TOOL,
      ],
      messages,
    });
    const save = response.content.find((b) => b.type === "tool_use" && b.name === SAVE_TOOL.name);
    if (save) return save.input;
    if (response.stop_reason === "refusal") throw new Error("avvist");
    messages.push({ role: "assistant", content: response.content });
    // pause_turn: nettsøket tok lang tid, send samme samtale igjen så Claude fortsetter.
    if (response.stop_reason !== "pause_turn")
      messages.push({ role: "user", content: "Lagre det du fant med lagre_studieplan nå." });
  }
  throw new Error("ble ikke ferdig");
}

// Den uavhengige Claude-kontrollen: leser kilden selv og vurderer hvert punkt.
async function review(client, p, kind, unit, label) {
  const text = (await sourceText(unit.source.url)).slice(0, 150_000);
  const list =
    kind === "kull"
      ? unit.semesters.flatMap((courses, i) => courses.map((c) => `${i + 1}. semester: ${c.n} (${c.sp} sp)`)).join("\n")
      : unit.options.map((o) => `${o.n}${o.c ? ` (${o.c})` : ""}, ${o.sp} sp${o.r ? ` – regel: ${o.r}` : ""}`).join("\n");
  const response = await ask(client, {
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "high" },
    system: [{ type: "text", text: REVIEW_SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [REVIEW_TOOL],
    messages: [
      {
        role: "user",
        content: `Linje: ${p.name} (${institutions[p.inst]?.name}, ${institutions[p.inst]?.campuses.join("/")})
Gjelder: ${label}
${kind === "kull" ? "Obligatoriske fag per semester" : "Valgemner linjen kunne velge"} (sjekk hvert punkt):
${list}

Kilde: ${unit.source.url}
<kilde>
${text}
</kilde>`,
      },
    ],
  });
  const verdict = response.content.find((b) => b.type === "tool_use" && b.name === REVIEW_TOOL.name)?.input;
  if (!verdict) return ["kontrollen svarte ikke"];
  const problems = [];
  if (!verdict.gjelder_linjen) problems.push("kontroll: kilden gjelder ikke linjen");
  if (!verdict.gjelder_perioden) problems.push(`kontroll: kilden gjelder ikke ${label}`);
  const count = kind === "kull" ? unit.semesters.flat().length : unit.options.length;
  if (verdict.items.length < count) problems.push("kontroll: ikke alle punkter ble vurdert");
  for (const item of verdict.items) if (!item.ok) problems.push(`kontroll: ${item.name}: ${item.reason}`);
  return problems;
}

const pack = (c) => {
  const skills = c.skills.slice(0, 4).map((k) => ({ n: k.name.trim(), q: k.quote.trim(), ...(k.tool_quote.trim() ? { t: k.tool_quote.trim() } : {}) }));
  const out = { n: c.name.trim(), sp: c.credits, s: skills };
  if (c.course_url.trim()) out.u = c.course_url.trim();
  if (c.code.trim()) out.c = c.code.trim();
  if (c.exclusive) out.x = true;
  if (c.rule?.trim()) out.r = c.rule.trim().replace(/^\((.*)\)$/, "$1");
  return out;
};

// Gjør Claudes svar om til lagringsformatet, og beholder bare kull og lister som består begge kontrollene.
async function verify(client, p, raw) {
  const plan = { summary: raw.summary, categories: raw.categories, cohorts: {}, offerings: [], checked: new Date().toISOString().slice(0, 10) };
  const rejected = [];
  // Ferdighetene kontrolleres for seg: hvert fag mot sin emnebeskrivelse, først uten AI og så med.
  // Feiler en ferdighet, fjernes den; resten av faget og planen beholdes.
  const reviewSkills = async (course) => {
    const kept = [];
    for (const skill of course.s) {
      const problems = await checkSkills(p.inst, p.name, { ...course, s: [skill] });
      if (problems.length) rejected.push({ unit: `ferdighet ${course.n} → ${skill.n}`, url: course.u, problems });
      else kept.push(skill);
    }
    course.s = kept;
    if (!course.s.length || !course.u) return;
    const text = (await sourceText(course.u).catch(() => "")).slice(0, 60_000);
    if (!text) return void (course.s = []);
    const response = await ask(client, {
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "high" },
      system: [{ type: "text", text: REVIEW_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [REVIEW_TOOL],
      messages: [
        {
          role: "user",
          content: `Linje: ${p.name}\nFag: ${course.n}\nFerdigheter (sjekk hvert punkt):\n${course.s
            .map((k) => `${k.n} – «${k.q}»${k.t ? ` (verktøy: «${k.t}»)` : ""}`)
            .join("\n")}\n\nEmnebeskrivelse: ${course.u}\n<kilde>\n${text}\n</kilde>`,
        },
      ],
    });
    const verdict = response.content.find((b) => b.type === "tool_use" && b.name === REVIEW_TOOL.name)?.input;
    const ok = new Set((verdict?.items ?? []).filter((i) => i.ok).map((i) => i.name));
    const dropped = course.s.filter((k) => !ok.has(k.n));
    if (dropped.length) rejected.push({ unit: `ferdigheter ${course.n}`, url: course.u, problems: dropped.map((k) => `kontroll: ${k.n}`) });
    course.s = course.s.filter((k) => ok.has(k.n));
  };
  for (const c of raw.cohorts) {
    const key = `${c.start_year}-${c.start_season}`;
    const length = Math.max(0, ...c.semesters.map((s) => s.semester), ...c.slots.map((s) => s.semester));
    const semesters = Array.from({ length }, () => []);
    for (const s of c.semesters) if (s.semester >= 1) semesters[s.semester - 1].push(...s.courses.map(pack));
    const unit = { semesters, slots: c.slots.filter((s) => s.semester >= 1), source: { title: c.source_title, url: c.source_url } };
    for (const course of semesters.flat()) await reviewSkills(course);
    let problems = await checkUnit(p.inst, p.name, { ...unit, key }, "kull");
    if (!problems.length) problems = await review(client, p, "kull", unit, `kullet som startet ${key.replace("-", " ")}`);
    if (problems.length) rejected.push({ unit: `kull ${key}`, url: c.source_url, problems });
    else plan.cohorts[key] = unit;
  }
  for (const o of raw.offerings) {
    const term = `${o.term_year}-${o.term_season}`;
    const unit = { term, semester: o.semester, source: { title: o.source_title, url: o.source_url }, options: o.options.map(pack) };
    for (const option of unit.options) await reviewSkills(option);
    let problems = await checkUnit(p.inst, p.name, unit, "valgemner");
    if (!problems.length) problems = await review(client, p, "valgemner", unit, `valgemner ${term.replace("-", " ")}, ${o.semester}. semester`);
    if (problems.length) rejected.push({ unit: `valgemner ${term}`, url: o.source_url, problems });
    else plan.offerings.push(unit);
  }
  return { plan, rejected };
}

async function run() {
  console.log(`${todo.length} linjer. Budsjett: ${budget} dollar. I dag: ${termText(NOW)}.`);
  const client = new Anthropic({ maxRetries: 4, timeout: 10 * 60 * 1000 });
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < todo.length && spent.value < budget) {
      const p = todo[next++];
      const before = spent.value;
      try {
        const raw = await findPlan(client, p);
        const { plan, rejected } = raw.found ? await verify(client, p, raw) : { plan: null, rejected: [{ unit: "alt", problems: ["fant ingen studieplan"] }] };
        done++;
        const price = spent.value - before;
        const kept = plan ? Object.keys(plan.cohorts).length + plan.offerings.length : 0;
        console.log(
          `[${done}/${todo.length}] ${p.id} ${p.name} ($${price.toFixed(2)}, totalt $${spent.value.toFixed(2)}): ` +
            `${kept} godkjent, ${rejected.length} forkastet`,
        );
        if (kept) {
          // Les filen på nytt rett før lagring, så parallelle linjer på samme skole ikke overskriver hverandre.
          const plans = plansFor(p.inst);
          plans[p.id] = plan;
          writeJson(`${OUT_DIR}/${p.inst}.json`, plans);
        }
        if (rejected.length) report[p.id] = { date: new Date().toISOString().slice(0, 10), rejected };
        else delete report[p.id];
        writeJson(REPORT, report);
      } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) throw error;
        console.log(`${p.id}: ${error instanceof Anthropic.APIError ? `API-feil ${error.status}` : "feil"}: ${error.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, todo.length) }, worker));
  if (spent.value >= budget) console.log(`Stoppet ved budsjettet (${budget} dollar). Kjør igjen med høyere --budget for å fortsette.`);
  if (done) console.log(`Ferdig: ${done} linjer for $${spent.value.toFixed(2)}, i snitt $${(spent.value / done).toFixed(2)} per linje. Rapport: ${REPORT}`);
}

try {
  await run();
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
