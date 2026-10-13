// Kontroll av studieplaner uten AI: kildene lastes ned på nytt, og alt som vises studenten må stå i dem.
//
// Brukes av scripts/check_study_plans.mjs (alle lagrede planer) og scripts/build_study_plans.mjs
// (før noe lagres). Regler:
//   1. Kilden ligger på skolens eget domene (scripts/school_domains.json), eller er en arkivert kopi av en slik side.
//   2. Kilden nevner kullet (fagplan) eller semesteret (valgemneliste) den gjelder for.
//   3. Hvert fag og hvert valgemne står i kilden, med navn eller emnekode.
//   4. Regelen for hvem som kan velge et valgemne («Kan kun velges av …»), står ordrett i kilden.
// Feiler én ting, gjelder planen eller listen ikke, og registreringen bruker den ikke.

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CACHE = ".cache/kilder";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const DOMAINS = JSON.parse(fs.readFileSync(new URL("../school_domains.json", import.meta.url), "utf8"));

// Kilden må ligge hos skolen selv. En kopi i Internet Archive godtas når originaladressen ligger hos skolen.
export function officialUrl(inst, url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.hostname === "web.archive.org") {
    const original = u.pathname.match(/^\/web\/\d+[a-z_]*\/(https?:\/\/.+)$/);
    return original ? officialUrl(inst, original[1] + u.search) : false;
  }
  return (DOMAINS[inst] ?? []).some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const htmlToText = (html) =>
  html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    // Lenkeadresser tas med, siden emnekoder ofte bare står i lenken til emnet.
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>/gi, " $1 ")
    // Tekstformatering holder seg på samme linje; avsnitt, lister og tabellceller gir ny linje.
    .replace(/<\/?(a|span|strong|b|em|i|u|small|sup|sub|font|abbr)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
      e[0] === "#"
        ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
        : (ENTITIES[e.toLowerCase()] ?? m),
    );

// Henter en adresse som rå tekst (HTML/JSON), lagret i en dag.
export async function fetchRaw(url) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, crypto.createHash("sha1").update(`raw ${url}`).digest("hex") + ".txt");
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < MAX_AGE_MS) return fs.readFileSync(file, "utf8");
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Erfa studieplan-kontroll)" }, redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  fs.writeFileSync(file, text);
  return text;
}

// Henter teksten i en kilde (HTML eller PDF), og lagrer den i en dag så kontrollen kan kjøres ofte.
export async function sourceText(url) {
  fs.mkdirSync(CACHE, { recursive: true });
  // Versjonen i nøkkelen gjør at gammel tekst hentes på nytt når tekstuttrekket endres.
  const file = path.join(CACHE, crypto.createHash("sha1").update(`v2 ${url}`).digest("hex") + ".txt");
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < MAX_AGE_MS) return fs.readFileSync(file, "utf8");
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Erfa studieplan-kontroll)" }, redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  let text;
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    const strings = [];
    const walk = (value) => {
      if (typeof value === "string") strings.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(JSON.parse(body.toString("utf8")));
    text = htmlToText(strings.join("\n<p>"));
  } else if (type.includes("pdf") || body.subarray(0, 5).toString() === "%PDF-") {
    const pdf = path.join(os.tmpdir(), `erfa-${process.pid}-${Date.now()}.pdf`);
    fs.writeFileSync(pdf, body);
    try {
      text = execFileSync("pdftotext", ["-raw", pdf, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    } catch (error) {
      if (error.code === "ENOENT") throw new Error("pdftotext mangler (brew install poppler)");
      throw error;
    } finally {
      fs.rmSync(pdf, { force: true });
    }
  } else {
    text = htmlToText(body.toString("utf8"));
  }
  fs.writeFileSync(file, text);
  return text;
}

// Små forskjeller i skrivemåte teller ikke: store/små bokstaver, bindestreker, & og «og», orddeling i PDF.
export const normalize = (text) =>
  ` ${text}`
    .normalize("NFKC")
    .toLowerCase()
    .replace(/­/g, "")
    .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[«»“”"']/g, "")
    .replace(/\s+(&|\+|og|and)\s+/g, " & ")
    .replace(/[^\p{L}\p{N}&+.,;:()\/-]+/gu, " ")
    .replace(/\s+/g, " ");

// Står navnet i kilden? Ordrett først. I PDF-tabeller kan kolonner blande seg, så for fagnavn holder det
// at alle ordene står i riktig rekkefølge med høyst noen få ord imellom. Regler må alltid stå ordrett.
export function mentions(text, name, { exact = false } = {}) {
  const haystack = normalize(text);
  const needle = normalize(name).trim();
  if (!needle) return false;
  // Ordrett: teksten må begynne der et ord begynner (etter mellomrom, parentes eller lignende).
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + 1))
    if (!/[\p{L}\p{N}]/u.test(haystack[at - 1] ?? " ")) return true;
  if (exact) return false;
  const clean = (t) => t.replace(/^[.,;:()\/]+|[.,;:()\/]+$/g, "");
  const words = needle.split(" ").map(clean).filter((w) => w.length > 1 || /\d/.test(w));
  const tokens = haystack.split(" ").map(clean);
  for (let start = 0; start < tokens.length; start++) {
    if (tokens[start] !== words[0]) continue;
    let at = start;
    let ok = true;
    for (const word of words.slice(1)) {
      const next = tokens.slice(at + 1, at + 13).indexOf(word);
      if (next < 0) {
        ok = false;
        break;
      }
      at += next + 1;
    }
    if (ok) return true;
  }
  return false;
}

// Skolene forkorter linjenavn («BA i IT»). Forkortelsene skrives ut før navn sammenlignes.
const ABBREVIATIONS = { ba: "bachelor", bsc: "bachelor", bachelorgrad: "bachelor", ma: "master", msc: "master", it: "informasjonsteknologi" };
const STOP = new Set(["bachelor", "master", "i", "og", "&", "-", "in", "of", "and", "studenter", "ved", "på", "årsstudium", "studium"]);
export const expand = (text) =>
  normalize(text)
    .trim()
    .split(" ")
    .map((w) => ABBREVIATIONS[w.replace(/[(),.]/g, "")] ?? w)
    .join(" ");
const distinctive = (name) => expand(name).split(" ").filter((w) => !STOP.has(w) && w.length >= 4);

// «Kan kun velges av: BA i IT (Programmering, E-business), BA i cybersikkerhet» → linjene regelen nevner.
// Kommaer og «og» inne i parenteser hører til samme linje.
export function ruleEntries(rule) {
  const list = rule.replace(/^[^:]*:/, "").trim();
  const entries = [];
  let depth = 0;
  let current = "";
  for (const ch of list) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      entries.push(current);
      current = "";
    } else current += ch;
  }
  entries.push(current);
  return entries
    .flatMap((e) => e.split(/\s+og\s+(?=(ba|bachelor|ma|master|studenter|årsstudium)\b)/i).filter((x, i) => i % 2 === 0))
    .map((e) => e.trim().replace(/^\((.*)\)$/, "$1").trim())
    .filter(Boolean)
    .map((e) => {
      const sub = e.match(/\(([^)]*)\)/);
      return { head: e.replace(/\([^)]*\)/, "").trim(), sub: sub ? sub[1].split(/,|\s+og\s+/).map((x) => x.trim()).filter(Boolean) : [] };
    });
}

// Gjelder regelen for linjen? «Kun»-regler må nevne linjen; «ikke»-regler må ikke gjøre det.
// Er det uklart (regelen nevner noe som ligner på linjen uten å treffe), regnes det som feil.
export function ruleAllows(rule, programmeName) {
  const name = expand(programmeName);
  const own = new Set(distinctive(programmeName));
  const matches = (entry) =>
    name.includes(expand(entry.head)) && (!entry.sub.length || entry.sub.some((s) => name.includes(expand(s))));
  const resembles = (entry) => distinctive(`${entry.head} ${entry.sub.join(" ")}`).some((w) => own.has(w));
  const entries = ruleEntries(rule);
  if (/\b(kun|only)\b/i.test(rule)) return entries.some(matches) ? "ja" : "nei";
  if (/\b(ikke|not|cannot)\b/i.test(rule)) {
    if (entries.some(matches)) return "nei";
    return entries.some(resembles) ? "uklart" : "ja";
  }
  return "uklart";
}

// Teksten som hører til et valgemne i kilden: linjen med navnet og merknadslinjene rett under
// («(Kan kun velges av …)», «OBS! Egne opptakskrav …»). Navnet kan stå flere steder (norsk og engelsk
// liste, arkiv), så alle forekomstene returneres.
function entryWindows(text, name) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const needle = ` ${normalize(name).trim()}`;
  const windows = [];
  lines.forEach((line, at) => {
    if (!normalize(line).includes(needle)) return;
    const window = [line];
    for (let j = at + 1; j < lines.length && j <= at + 4; j++) {
      if (/^(\(|obs\b|nb\b|egne opptakskrav)/i.test(lines[j])) window.push(lines[j]);
      else break;
    }
    windows.push(window.join(" "));
  });
  return windows;
}
const RULE = /velges av|kun for|only (be )?(chosen|selected|taken)|not available for/i;

// Hvilket semester handler kilden om? Det som nevnes oftest («vår 2026», «spring 2026», «year=2026&period=spring»).
export function termsIn(text) {
  const counts = {};
  const add = (y, s) => {
    const key = `${y}-${/^(vår|spring)/i.test(s) ? "vår" : "høst"}`;
    counts[key] = (counts[key] ?? 0) + 1;
  };
  for (const m of text.matchAll(/\b(våren|vår|spring|høsten|høst|autumn|fall)\s+(20\d\d)\b/gi)) add(m[2], m[1]);
  for (const m of text.matchAll(/\b(20\d\d)\s+(vår|høst)\b/gi)) add(m[1], m[2]);
  for (const m of text.matchAll(/year=(20\d\d)&(?:amp;)?period=(spring|autumn|fall)/gi)) add(m[1], m[2]);
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

// Emnekoder skrives på flere måter (TEK999-11 / tek999-11, ØKON999-1 / oekon999-1).
const codeForms = (code) => {
  const c = code.toLowerCase();
  return [c, c.replace(/ø/g, "oe").replace(/æ/g, "ae").replace(/å/g, "aa")];
};
export const mentionsCode = (text, code) => {
  if (!code) return false;
  const haystack = normalize(text);
  return codeForms(code).some((c) => new RegExp(`(^|[^\\p{L}\\p{N}])${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u").test(haystack));
};

// ---------- Ferdigheter ----------
// Hver ferdighet har et sitat (q) fra læringsutbyttet i emnebeskrivelsen (u), og ev. et sitat (t) fra samme
// emnebeskrivelse som navngir verktøyet («Arbeidsverktøy: Ren JavaScript …»).

const OUTCOMES = /^(forventet\s+)?(læringsutbytte|learning outcomes?)\b/i;
const LEVEL = /^(kunnskap|knowledge|ferdigheter|skills|generell kompetanse|kompetanse|general competence|competence)\b/i;
const NEXT_SECTION =
  /^(emnet inngår i|læringsaktiviteter|arbeidsverktøy|anbefalt tidsbruk|obligatorisk|eksamen|vurdering|undervisning|kontinuasjon|læremidler|merknader|pensum|innhold|learning activities|teaching|assessment|examination|required|literature|tools)\b/i;
// Kjente verktøy og teknologier. Står de i navnet på en ferdighet, må de stå i kilden.
const TOOLS = new Set(
  "excel word powerpoint figma photoshop illustrator indesign premiere canva python java javascript typescript kotlin swift react angular vue node html css sql nosql mongodb git github docker kubernetes linux windows azure aws tableau wordpress shopify hubspot salesforce sap jira scrum kanban wireshark nmap matlab spss stata r unity blender autocad revit"
    .split(" "),
);
const toolTokens = (label) =>
  label
    .split(/[\s/()\-–,]+/)
    .filter((w) => /^[A-ZÆØÅ]{2,}\d*$/.test(w) || /[a-zæøå][A-Z]/.test(w) || TOOLS.has(w.toLowerCase()));

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

// Linjene i læringsutbyttet, hver merket med nivå: kunnskap, ferdigheter eller kompetanse.
function outcomeLines(text) {
  const all = lines(text);
  const out = [];
  let inside = false;
  let level = "";
  for (const line of all) {
    if (OUTCOMES.test(line)) {
      inside = true;
      continue;
    }
    if (!inside) continue;
    if (NEXT_SECTION.test(line)) break;
    const head = line.match(LEVEL);
    if (head && line.length < 40) {
      level = /kunnskap|knowledge/i.test(head[1]) ? "kunnskap" : /ferdigheter|skills/i.test(head[1]) ? "ferdigheter" : "kompetanse";
      continue;
    }
    out.push({ line, level });
  }
  return out;
}

// «Emnet inngår i»: linjene emnet er en del av. Tom liste hvis kilden ikke har en slik del.
function partOf(text) {
  const all = lines(text);
  const at = all.findIndex((l) => /^emnet inngår i\b/i.test(l));
  if (at < 0) return [];
  const out = [];
  for (const line of all.slice(at + 1)) {
    if (OUTCOMES.test(line) || NEXT_SECTION.test(line)) break;
    out.push(line);
  }
  return out;
}
// «Bachelor i informasjonsteknologi (alle spesialiseringer)» gjelder alle linjene under bachelor i IT.
const partOfMatches = (line, programmeName) => {
  const name = expand(programmeName);
  const sub = line.match(/\(([^)]*)\)/)?.[1] ?? "";
  if (!name.includes(expand(line.replace(/\([^)]*\)/g, "")))) return false;
  return !sub || /alle|all\b/i.test(sub) || sub.split(/,|\s+og\s+/).some((x) => name.includes(expand(x)));
};

export async function checkSkills(inst, programmeName, course, { mustBePartOf = false } = {}) {
  if (!course.s?.length) return [];
  const label = course.n;
  if (!course.u) return [`${label}: ferdigheter uten emnebeskrivelse`];
  if (!officialUrl(inst, course.u)) return [`${label}: emnebeskrivelsen ligger ikke hos skolen: ${course.u}`];
  let text;
  try {
    text = await sourceText(course.u);
  } catch (error) {
    return [`${label}: kunne ikke hente emnebeskrivelsen (${error.message})`];
  }
  const problems = [];
  if (!mentions(text, course.n) && !mentionsCode(text, course.c)) problems.push(`${label}: emnebeskrivelsen gjelder et annet emne`);
  const outcomes = outcomeLines(text);
  if (!outcomes.length) return [...problems, `${label}: fant ikke læringsutbytte i emnebeskrivelsen`];
  if (mustBePartOf) {
    const part = partOf(text);
    if (part.length && !part.some((l) => partOfMatches(l, programmeName)))
      problems.push(`${label}: emnebeskrivelsen sier ikke at emnet inngår i linjen`);
  }
  for (const skill of course.s) {
    const hits = outcomes.filter((o) => mentions(o.line, skill.q, { exact: true }));
    if (!hits.length) {
      problems.push(`${label} → ${skill.n}: sitatet står ikke i læringsutbyttet: «${skill.q}»`);
      continue;
    }
    if (hits.every((o) => o.level === "kunnskap"))
      problems.push(`${label} → ${skill.n}: sitatet er kunnskap («kan forklare»), ikke en ferdighet`);
    if (skill.t && !mentions(text, skill.t, { exact: true })) problems.push(`${label} → ${skill.n}: verktøysitatet står ikke i emnebeskrivelsen`);
    const support = `${skill.q} ${skill.t ?? ""}`;
    for (const tool of toolTokens(skill.n))
      if (!mentionsCode(support, tool) && !mentions(support, tool, { exact: true }))
        problems.push(`${label} → ${skill.n}: «${tool}» står ikke i sitatet`);
  }
  return problems;
}

// ---------- Data fra skolens eget API ----------
// Her er kilden strukturert, så kontrollen henter API-et på nytt og sammenligner emnekodene direkte.

const season = (period) => (/^fall|autumn|høst/i.test(period) ? "høst" : "vår");
const API_CHECKS = {
  // Kristianias studieportal: /api/syllabus-descriptions/programs/<id>?year=&period= gir fagplanen for ett kull.
  async kristiania(inst, programmeName, unit, kind) {
    const { url, page, program } = unit.source;
    if (!officialUrl(inst, url) || !officialUrl(inst, page ?? "")) return [`kilden ligger ikke hos skolen: ${url}`];
    const problems = [];
    let html;
    let data;
    try {
      html = await fetchRaw(page);
      data = JSON.parse(await fetchRaw(url));
    } catch (error) {
      return [`kunne ikke hente kilden (${error.message}): ${url}`];
    }
    // Riktig linje: programsiden peker på akkurat dette API-et, har linjekoden i adressen og linjenavnet i teksten.
    if (!html.includes(`"getProgramUrl":"${new URL(url).pathname}"`)) problems.push("programsiden peker ikke på dette API-et");
    // Linjekoden står som et eget ledd i adressen (skrivemåten kan variere: «BIN» → «/bin_/»).
    const bare = (x) => x.toLowerCase().replace(/[^a-z0-9æøå]/g, "");
    if (!new URL(page).pathname.split("/").some((part) => part && bare(part) === bare(String(program))))
      problems.push(`programsiden er ikke for linje ${program}`);
    if (!normalize(htmlToText(html)).includes(normalize(programmeName).trim())) problems.push(`programsiden nevner ikke «${programmeName}»`);
    const start = data.programSemesterStart;
    const startKey = start ? `${start.year}-${season(start.period)}` : "";
    // Semesteret for hver periode: oppstartsåret + studieår − 1, og høst/vår fra perioden.
    const periods = (data.programDescription?.subjectCombination ?? [])
      .flatMap((y) =>
        y.programSubjects.map((p) => ({
          order: y.yearOrder * 2 + (season(p.period) === "høst" ? 1 : 0),
          term: start ? `${start.year + y.yearOrder - 1}-${season(p.period)}` : "",
          subjects: p.subjects,
        })),
      )
      .sort((a, b) => a.order - b.order);
    const codes = (i) => new Set((periods[i]?.subjects ?? []).map((s) => s.code.toUpperCase()));
    const has = (i, c) => codes(i).has(String(c).toUpperCase());
    if (kind === "kull") {
      if (startKey !== unit.key) problems.push(`API-et gjelder kull ${startKey || "ukjent"}, ikke ${unit.key}`);
      unit.semesters.forEach((courses, i) => {
        for (const c of courses) if (!has(i, c.c)) problems.push(`${i + 1}. semester: ${c.n} (${c.c}) står ikke i fagplanen for kullet`);
      });
      for (const slot of unit.slots) if (!periods[slot.semester - 1]) problems.push(`fagplanen har ikke ${slot.semester}. semester`);
    } else {
      const i = unit.semester - 1;
      if (!periods[i]) return [...problems, `fagplanen har ikke ${unit.semester}. semester`];
      // Semesteret valget gjelder for: regnet ut fra fagplanen, og stemmer med lenkene til emnene når de har det.
      const linked = new Set(periods[i].subjects.map((s) => s.url.match(/year=(\d{4})&period=(\w+)/)).filter(Boolean).map((m) => `${m[1]}-${season(m[2])}`));
      if (periods[i].term !== unit.term) problems.push(`valgemnene gjelder ${periods[i].term || "ukjent semester"}, ikke ${unit.term}`);
      if ([...linked].some((t) => t !== periods[i].term)) problems.push(`lenkene i fagplanen peker på et annet semester (${[...linked].join(", ")})`);
      if (!unit.options.length) problems.push("listen er tom");
      for (const o of unit.options) {
        if (!has(i, o.c)) problems.push(`${o.n} (${o.c}) står ikke blant valgemnene for kullet`);
        for (const part of o.p ?? []) if (!has(i, part.c)) problems.push(`${o.n}: delemnet ${part.c} står ikke i fagplanen`);
      }
    }
    return problems;
  },
};

// Sjekker én fagplan (et kull) eller én valgemneliste (et semester) for én linje.
// Returnerer en liste med feil; tom liste = godkjent.
export async function checkUnit(inst, programmeName, unit, kind) {
  const problems = [];
  const url = unit.source?.url;
  if (!url) return ["mangler kilde"];
  // Fra skolens eget API: sammenlign emnekodene, og sjekk ferdighetene mot emnebeskrivelsene.
  // At emnet inngår i linjen, er vist av fagplanen selv.
  const api = API_CHECKS[unit.source.type];
  if (unit.source.type && !api) return [`ukjent kildetype: ${unit.source.type}`];
  if (api) {
    problems.push(...(await api(inst, programmeName, unit, kind)));
    const courses = kind === "kull" ? unit.semesters.flat() : unit.options.flatMap((o) => [o, ...(o.p ?? [])]);
    for (const course of courses) problems.push(...(await checkSkills(inst, programmeName, course)));
    return problems;
  }
  if (!officialUrl(inst, url)) problems.push(`kilden ligger ikke hos skolen: ${url}`);
  let text;
  try {
    text = await sourceText(url);
  } catch (error) {
    return [...problems, `kunne ikke hente kilden (${error.message}): ${url}`];
  }
  const missing = distinctive(programmeName).filter((w) => !normalize(text).includes(w));
  if (kind === "kull") {
    const y = unit.key.split("-")[0];
    if (!url.includes(y) && !text.slice(0, 4000).includes(y)) problems.push(`kilden sier ikke at den gjelder kull ${y}`);
    // Fagplanen må ha linjens navn i tittelen (første del av dokumentet), ikke bare nevne ord fra det.
    const title = expand(text.slice(0, 6000));
    const full = expand(programmeName);
    if (![full, full.replace(/^(bachelor|master|årsstudium)( i| in)? /, "")].some((n) => title.includes(n)))
      problems.push(`kilden har ikke linjenavnet i tittelen («${programmeName}»)`);
    for (const course of unit.semesters.flat()) {
      if (!mentions(text, course.n) && !mentionsCode(text, course.c)) problems.push(`fag står ikke i kilden: ${course.n}`);
      problems.push(...(await checkSkills(inst, programmeName, course, { mustBePartOf: true })));
    }
  } else {
    const terms = termsIn(`${text}\n${url}`);
    if (terms[0]?.[0] !== unit.term || terms[1]?.[1] === terms[0][1])
      problems.push(`kilden gjelder ${terms[0]?.[0] ?? "ukjent semester"}, ikke ${unit.term}`);
    if (missing.length === distinctive(programmeName).length) problems.push("kilden nevner ikke linjen");
    if (!unit.options.length) problems.push("listen er tom");
    for (const option of unit.options) {
      if (!mentions(text, option.n) && !mentionsCode(text, option.c)) {
        problems.push(`valgemne står ikke i kilden: ${option.n}`);
        continue;
      }
      const windows = entryWindows(text, option.n);
      if (option.r) {
        if (!windows.some((w) => mentions(w, option.r, { exact: true })))
          problems.push(`regelen står ikke ordrett ved ${option.n}: «${option.r}»`);
        const allowed = ruleAllows(option.r, programmeName);
        if (allowed !== "ja") problems.push(`regelen for ${option.n} ${allowed === "nei" ? "stenger linjen ute" : "er uklar for linjen"}`);
      } else if (windows.some((w) => RULE.test(w))) {
        problems.push(`kilden har en regel for ${option.n} som mangler`);
      }
      problems.push(...(await checkSkills(inst, programmeName, option)));
    }
  }
  return problems;
}

// Hele planen for én linje: hvert kull og hver valgemneliste for seg.
export async function checkPlan(inst, programmeName, plan) {
  const results = [];
  for (const [key, cohort] of Object.entries(plan.cohorts ?? {}))
    results.push({ kind: "kull", key, problems: await checkUnit(inst, programmeName, { ...cohort, key }, "kull") });
  for (const offering of plan.offerings ?? [])
    results.push({
      kind: "valgemner",
      key: `${offering.term} · ${offering.semester}. semester`,
      problems: await checkUnit(inst, programmeName, offering, "valgemner"),
    });
  return results;
}
