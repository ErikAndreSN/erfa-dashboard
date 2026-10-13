// Henter fagplaner og valgemner for alle linjer på Høyskolen Kristiania fra skolens åpne API (studieportalen).
// Ingen AI og ingen API-nøkkel: dette er skolens egne data, rett fra studentsystemet.
//
//   npm run import:kristiania                    alle linjene
//   npm run import:kristiania -- --id 8253-2110  én linje
//   npm run import:kristiania -- --limit 10      de ti første (prøv først)
//
// For hver linje: fagplanen for hvert kull som studerer nå, med emnene per semester. Et semester med mer enn
// 30 studiepoeng i planen er et valgsemester, og emnene der blir linjens valgemner det semesteret. Pakker
// («IT-utvikling: BU5300, PG2202, …») blir ett valg, med delemnene under. Hvert emne får adressen til
// emnebeskrivelsen for semesteret kullet har det (der læringsutbyttet står), så ferdigheter kan hentes derfra.
// Ferdigheter som allerede er lagt inn for samme emne og semester, beholdes.
//
// Alt kontrolleres med scripts/lib/verify_plans.mjs før det lagres: API-et hentes på nytt og hver emnekode
// sammenlignes. Det som ikke består, lagres ikke (se .cache/kristiania-rapport.json).
// Svarene mellomlagres i .cache/kilder i én dag, og det hentes rolig (fire forespørsler om gangen).

import fs from "node:fs";
import { checkPlan, checkSkills, fetchRaw } from "./lib/verify_plans.mjs";

const INST = "8253";
const BASE = "https://www.kristiania.no";
const OUT = `public/data/studieplaner/${INST}.json`;
const REPORT = ".cache/kristiania-rapport.json";
const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const onlyId = flag("--id", "");
const limit = Number(flag("--limit", Infinity));

// Semestre som tall (år * 2, + 1 for høst), som i registreringen.
const now = new Date();
const NOW = now.getFullYear() * 2 + (now.getMonth() >= 6 ? 1 : 0);
const season = (period) => (/^fall|autumn|høst/i.test(period) ? "høst" : "vår");
const termKey = (i) => `${Math.floor(i / 2)}-${i % 2 ? "høst" : "vår"}`;
// Plassholdere i fagplanen («Valgemner», «Utveksling») er ikke emner: listen er ikke lagt inn ennå.
const PLACEHOLDER = /^(valgemner?|valgfag|valgfrie emner|utveksling|praksis|elective courses?|exchange)$/i;

const readJson = (path, fallback) => (fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback);
const json = async (url) => JSON.parse(await fetchRaw(url));

// Alle emner og programmer i studieportalen (navn slutter med koden, f.eks. «Databaser DB1102»).
async function catalog() {
  const items = [];
  for (let skip = 0; ; skip += 3000) {
    const page = await json(`${BASE}/api/search/syllabus?skip=${skip}&take=3000`);
    items.push(...page.items);
    if (items.length >= page.totalCount || !page.items.length) break;
  }
  return items;
}

async function main() {
  const studies = readJson("public/data/studier.json", null);
  const programmes = studies.programmes.filter((p) => p.inst === INST && (!onlyId || p.id === onlyId)).slice(0, limit);
  const items = await catalog();
  const byCode = new Map();
  for (const item of items) {
    const code = item.name.split(" ").at(-1).toUpperCase();
    if (!byCode.has(code) || item.status?.value === "Active") byCode.set(code, item);
  }
  const credits = (code) => byCode.get(String(code).toUpperCase())?.studyPoints ?? null;

  // Ferdigheter som allerede finnes, per emne og semesterversjon (samme emne kan inngå i flere linjer).
  const old = readJson(OUT, {});
  const knownSkills = new Map();
  const skillsByCode = new Map(); // alle ferdigheter for et emne, fra hvilken som helst versjon
  const collect = (c) => {
    if (!c?.u || !c.s?.length) return;
    knownSkills.set(`${c.c}|${c.u}`, c.s);
    const list = skillsByCode.get(c.c) ?? [];
    for (const skill of c.s) if (!list.some((x) => x.n === skill.n && x.q === skill.q)) list.push(skill);
    skillsByCode.set(c.c, list);
  };
  for (const plan of Object.values(old)) {
    Object.values(plan.cohorts ?? {}).forEach((co) => co.semesters.flat().forEach(collect));
    (plan.offerings ?? []).forEach((o) => o.options.forEach((x) => (collect(x), (x.p ?? []).forEach(collect))));
  }

  // Emnebeskrivelsen for et emne i et gitt semester, bare hvis den har læringsutbytte.
  const descriptionIds = new Map();
  // term: semesteret kullet har emnet («2026-vår»), regnet ut fra fagplanen.
  async function descriptionUrl(subject, term) {
    const path = subject.url.split("?")[0];
    if (!term) return undefined;
    if (!descriptionIds.has(path)) {
      const html = await fetchRaw(`${BASE}${path}/`).catch(() => "");
      descriptionIds.set(path, html.match(/"getDescriptionUrl":"([^"]+)"/)?.[1]);
    }
    const id = descriptionIds.get(path);
    if (!id) return undefined;
    const [year, half] = term.split("-");
    const url = `${BASE}${id}?year=${year}&period=${half === "høst" ? "fall" : "spring"}`;
    const d = await json(url).catch(() => null);
    const outcome = d?.description?.find((x) => /læringsutbytte|learning outcome/i.test(x.heading));
    return outcome?.body?.value?.trim() ? url : undefined;
  }
  async function course(subject, term, programmeName) {
    const c = subject.code;
    const out = { n: subject.name.replace(/:\s.*$/, "").trim(), c, sp: credits(c) ?? 0 };
    const u = await descriptionUrl(subject, term);
    if (u) out.u = u;
    out.s = (u && knownSkills.get(`${c}|${u}`)) || [];
    // Ferdigheter fra en annen versjon av emnet brukes bare hvis sitatet står ordrett i denne versjonen også.
    if (u && !out.s.length)
      for (const skill of skillsByCode.get(c) ?? [])
        if (!(await checkSkills(INST, programmeName, { ...out, s: [skill] })).length) out.s.push(skill);
    return out;
  }

  async function importProgramme(p) {
    const code = p.id.slice(INST.length + 1);
    const entry = items.find((i) => i.name.toUpperCase().endsWith(` ${code.toUpperCase()}`) && (i.studyPoints ?? 30) >= 30);
    if (!entry) return { error: "ikke i studieportalen" };
    const page = `${BASE}${entry.url}/`;
    const programUrl = (await fetchRaw(page)).match(/"getProgramUrl":"([^"]+)"/)?.[1];
    if (!programUrl) return { error: "ingen fagplan i studieportalen" };
    const length = Math.max(2, Math.round(p.credits / 30));
    const plan = { cohorts: {}, offerings: [], checked: now.toISOString().slice(0, 10) };
    // Kullene som studerer nå: oppstart innenfor lengden på studiet (deltid kan være lengre, derfor + 4).
    for (let start = NOW - length - 4; start <= NOW; start++) {
      const year = Math.floor(start / 2);
      const period = start % 2 ? "fall" : "spring";
      const url = `${BASE}${programUrl}?year=${year}&period=${period}`;
      const data = await json(url).catch(() => null);
      const s = data?.programSemesterStart;
      if (!s || s.year !== year || season(s.period) !== season(period)) continue;
      const periods = (data.programDescription?.subjectCombination ?? [])
        .flatMap((y) =>
          y.programSubjects.map((x) => ({
            order: y.yearOrder * 2 + (season(x.period) === "høst" ? 1 : 0),
            term: `${s.year + y.yearOrder - 1}-${season(x.period)}`,
            subjects: x.subjects,
          })),
        )
        .sort((a, b) => a.order - b.order);
      if (!periods.length || NOW - start + 1 > periods.length) continue; // ferdig med studiet, eller tom plan
      const key = termKey(start);
      const source = { type: "kristiania", title: `Studieportalen, kull ${key.replace("-", " ")}`, url, page, program: code };
      const semesters = [];
      const slots = [];
      // Emner som går over flere semestre (f.eks. bacheloroppgaven) står i hvert av dem; studiepoengene deles.
      const spread = new Map();
      for (const period of periods) for (const x of period.subjects) spread.set(x.code.toUpperCase(), (spread.get(x.code.toUpperCase()) ?? 0) + 1);
      const share = (x) => (credits(x.code) ?? 0) / spread.get(x.code.toUpperCase());
      for (const [i, period] of periods.entries()) {
        // Pakker: «Navn: KODE1, KODE2 + KODE3», der delemnene står i samme semester.
        const codes = new Set(period.subjects.map((x) => x.code.toUpperCase()));
        const partsOf = (x) => {
          const list = x.name.match(/:\s*(.+)$/)?.[1];
          const parts = list ? list.split(/,|\+|\sog\s/).map((y) => y.trim().toUpperCase()).filter((y) => codes.has(y)) : [];
          return parts.length >= 2 ? parts : [];
        };
        const partCodes = new Set(period.subjects.flatMap(partsOf));
        const name = (x) => x.name.replace(/:\s.*$/, "").trim();
        // Plassholder: et sted å velge, ikke et emne. Koden har «999» uten å være en pakke, eller navnet sier det.
        const placeholders = period.subjects.filter(
          (x) => !partCodes.has(x.code.toUpperCase()) && ((/999/.test(x.code) && !partsOf(x).length) || PLACEHOLDER.test(name(x))),
        );
        const exchange = placeholders.some((x) => /utveksling|exchange/i.test(name(x)));
        const standalone = period.subjects.filter((x) => !partCodes.has(x.code.toUpperCase()) && !placeholders.includes(x));
        const sum = standalone.reduce((n, x) => n + share(x), 0);
        const unknown = standalone.some((x) => credits(x.code) == null);
        const elective = partCodes.size > 0 || sum > 30.5 || (unknown && standalone.length > 4);
        // Mer enn 30 studiepoeng og emner som går over flere semestre: vi vet ikke sikkert hva som er obligatorisk
        // og hva som er valg. Da påstår vi ingenting om semesteret; studenten søker selv.
        if (elective && !partCodes.size && standalone.some((x) => spread.get(x.code.toUpperCase()) > 1)) {
          semesters.push([]);
          slots.push({ semester: i + 1, credits: 30, title: "Emner dette semesteret", exchange: true, open: false });
          continue;
        }
        if (!elective) {
          semesters.push(await Promise.all(standalone.map((x) => course(x, period.term, p.name))));
          // Plassholder ved siden av obligatoriske emner: et valg uten kontrollert liste (studenten søker selv).
          if (placeholders.length)
            slots.push({ semester: i + 1, credits: Math.max(0, 30 - sum), title: name(placeholders.find((x) => !/utveksling|exchange/i.test(name(x))) ?? placeholders[0]), exchange, open: false });
          continue;
        }
        semesters.push([]);
        slots.push({ semester: i + 1, credits: 30, title: "Valgemner", exchange: true, open: false });
        const options = [];
        for (const x of standalone) {
          const option = await course(x, period.term, p.name);
          const parts = partsOf(x);
          if (parts.length) {
            option.p = await Promise.all(parts.map((pc) => course(period.subjects.find((y) => y.code.toUpperCase() === pc), period.term, p.name)));
            option.s = [];
            delete option.u;
          }
          options.push(option);
        }
        // Bare plassholdere: ingen kontrollert liste ennå.
        if (options.length) plan.offerings.push({ term: period.term, semester: i + 1, source, options });
      }
      plan.cohorts[key] = { semesters, slots, source };
    }
    if (!Object.keys(plan.cohorts).length) return { error: "ingen kull som studerer nå" };
    // Behold tekst som er skrevet for linjen tidligere (sammendrag og oppdragskategorier).
    if (old[p.id]?.summary) plan.summary = old[p.id].summary;
    if (old[p.id]?.categories) plan.categories = old[p.id].categories;
    // Kontrollen: bare kull og valgemnelister som består, lagres.
    const results = await checkPlan(INST, p.name, plan);
    const failed = results.filter((r) => r.problems.length);
    for (const r of failed) {
      if (r.kind === "kull") delete plan.cohorts[r.key];
      else plan.offerings = plan.offerings.filter((o) => `${o.term} · ${o.semester}. semester` !== r.key);
    }
    return { plan: Object.keys(plan.cohorts).length ? plan : null, failed };
  }

  const out = onlyId ? { ...old } : {};
  if (onlyId) delete out[onlyId];
  const report = {};
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < programmes.length) {
      const p = programmes[next++];
      try {
        const { plan, failed = [], error } = await importProgramme(p);
        done++;
        if (plan) out[p.id] = plan;
        if (error || failed.length) report[p.id] = { name: p.name, error, failed };
        const cohorts = plan ? Object.keys(plan.cohorts).join(", ") : "";
        console.log(`[${done}/${programmes.length}] ${p.name}: ${error ?? `kull ${cohorts}${failed.length ? `, ${failed.length} forkastet` : ""}`}`);
      } catch (error) {
        done++;
        report[p.id] = { name: p.name, error: error.message };
        console.log(`[${done}/${programmes.length}] ${p.name}: feil: ${error.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  fs.writeFileSync(OUT, JSON.stringify(out));

  // Søkekatalogen i registreringen: skolens egne aktive emner (DBH ligger et semester bak og mangler nye emner),
  // pluss emnene fra DBH som ikke står i studieportalen lenger (studenter kan ha tatt dem tidligere).
  const CATALOG = `public/data/emner/${INST}.json`;
  const dbh = readJson(CATALOG, []);
  const merged = new Map();
  for (const item of items) {
    if (!/^(Active|Upcoming)$/.test(item.status?.value ?? "") || !(item.studyPoints > 0 && item.studyPoints <= 30)) continue;
    const code = item.name.split(" ").at(-1);
    const name = item.name.slice(0, -code.length).trim().replace(/:\s.*$/, "");
    if (!merged.has(code.toUpperCase())) merged.set(code.toUpperCase(), { c: code, n: name, sp: item.studyPoints });
  }
  for (const c of dbh) {
    const code = c.c.replace(/-1$/, "").toUpperCase();
    if (!merged.has(code)) merged.set(code, c);
  }
  const list = [...merged.values()].sort((a, b) => a.n.localeCompare(b.n, "nb"));
  fs.writeFileSync(CATALOG, JSON.stringify(list));
  console.log(`Søkekatalog: ${list.length} emner (${list.length - dbh.length >= 0 ? "+" : ""}${list.length - dbh.length} mot DBH).`);
  fs.mkdirSync(".cache", { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
  const plans = Object.values(out);
  const count = (f) => plans.reduce((n, p) => n + f(p), 0);
  console.log(
    `\nLagret ${plans.length} linjer: ${count((p) => Object.keys(p.cohorts).length)} kull, ` +
      `${count((p) => p.offerings.length)} valgemnelister, ${count((p) => Object.values(p.cohorts).flatMap((c) => c.semesters.flat()).filter((c) => c.u).length)} emner med læringsutbytte. ` +
      `Rapport: ${REPORT}`,
  );
}

await main();
