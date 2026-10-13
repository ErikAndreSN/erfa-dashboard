// Måler hvor riktige ferdighetene er, med mennesker som fasit.
//
//   npm run skills:review            lager/oppdaterer vurdering/ferdigheter.csv (svarene som er fylt inn, beholdes)
//   npm run skills:review -- --score regner ut resultatet fra svarene
//
// Åpne CSV-filen i Excel eller Numbers. For hver ferdighet: les sitatet og skriv i kolonnen «riktig»
//   ja       navnet beskriver det sitatet sier studenten kan
//   nei      navnet sier mer eller noe annet enn sitatet (skriv gjerne hvorfor i «kommentar»)
// Mangler en ferdighet et fag burde gitt, legg til en rad med fag, ferdighet og «mangler» i «riktig».
//
// Resultat: andel riktige av det som vises (målet er minst 95 %) og andel av de riktige som er funnet (rundt 80 %).

import fs from "node:fs";

const FILE = "vurdering/ferdigheter.csv";
const COLUMNS = ["linje", "fag", "ferdighet", "sitat", "riktig", "kommentar"];
const studies = JSON.parse(fs.readFileSync("public/data/studier.json", "utf8"));
const names = Object.fromEntries(studies.programmes.map((p) => [p.id, p.name]));

// Semikolon, siden norsk Excel bruker det. Felt med semikolon, anførselstegn eller linjeskift settes i anførselstegn.
const cell = (v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
function parse(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ";") row.push(field), (field = "");
    else if (ch === "\n") row.push(field), rows.push(row), (row = []), (field = "");
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some(Boolean));
  return body.map((r) => Object.fromEntries((head ?? COLUMNS).map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}
const key = (r) => `${r.linje}|${r.fag}|${r.ferdighet}`.toLowerCase();

const old = fs.existsSync(FILE) ? parse(fs.readFileSync(FILE, "utf8")) : [];

if (process.argv.includes("--score")) {
  const answered = old.filter((r) => /^(ja|nei)$/i.test(r.riktig));
  const yes = answered.filter((r) => /^ja$/i.test(r.riktig)).length;
  const missing = old.filter((r) => /^mangler$/i.test(r.riktig)).length;
  const shown = old.filter((r) => !/^mangler$/i.test(r.riktig)).length;
  if (!answered.length) {
    console.log(`Ingen svar ennå. Fyll inn «riktig» i ${FILE} (ja/nei/mangler).`);
    process.exit(0);
  }
  const pct = (a, b) => `${Math.round((100 * a) / b)} %`;
  console.log(`Vurdert: ${answered.length} av ${shown} ferdigheter.`);
  console.log(`Riktige av det som vises: ${pct(yes, answered.length)} (${yes} av ${answered.length}). Mål: minst 95 %.`);
  if (missing) console.log(`Funnet av de riktige: ${pct(yes, yes + missing)} (${missing} mangler). Mål: rundt 80 %.`);
  for (const r of answered.filter((r) => /^nei$/i.test(r.riktig)))
    console.log(`  Feil: ${r.fag} → ${r.ferdighet}${r.kommentar ? ` (${r.kommentar})` : ""}`);
  process.exit(0);
}

// Lag listen fra dataene, med svarene som allerede er fylt inn.
const answers = Object.fromEntries(old.map((r) => [key(r), r]));
const rows = [];
for (const file of fs.readdirSync("public/data/studieplaner").filter((f) => f.endsWith(".json")).sort()) {
  const plans = JSON.parse(fs.readFileSync(`public/data/studieplaner/${file}`, "utf8"));
  for (const [id, plan] of Object.entries(plans)) {
    const courses = [
      ...Object.values(plan.cohorts ?? {}).flatMap((c) => c.semesters.flat()),
      ...(plan.offerings ?? []).flatMap((o) => o.options),
    ];
    const seen = new Set();
    for (const course of courses)
      for (const skill of course.s ?? []) {
        const row = { linje: names[id] ?? id, fag: course.n, ferdighet: skill.n, sitat: skill.q, riktig: "", kommentar: "" };
        if (seen.has(key(row))) continue;
        seen.add(key(row));
        const before = answers[key(row)];
        rows.push(before ? { ...row, riktig: before.riktig, kommentar: before.kommentar } : row);
      }
  }
}
// Rader som vurdererne har lagt til («mangler»), beholdes.
rows.push(...old.filter((r) => /^mangler$/i.test(r.riktig) && !rows.some((x) => key(x) === key(r))));
fs.mkdirSync("vurdering", { recursive: true });
fs.writeFileSync(FILE, "﻿" + [COLUMNS, ...rows.map((r) => COLUMNS.map((c) => r[c] ?? ""))].map((r) => r.map(cell).join(";")).join("\n") + "\n");
console.log(`Skrev ${FILE}: ${rows.length} ferdigheter, ${rows.filter((r) => r.riktig).length} allerede vurdert.`);
