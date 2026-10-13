import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Plane,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { BRAND_NAME, BrandMark } from "./brand";
import { SchoolLogo } from "./VerifiedSkills";
import "./signup.css";

type Institution = {
  id: string;
  name: string;
  short: string;
  campuses: string[];
  departments: string[];
};
type Programme = {
  id: string;
  inst: string;
  dept: string;
  name: string;
  level: string;
  credits: number;
  online: boolean;
};
type Studies = {
  period: string;
  source: string;
  institutions: Institution[];
  programmes: Programme[];
};
type SkillSet = {
  summary: string;
  skills: { name: string; semester: number }[];
  categories: string[];
  electiveFrom?: number;
};
// Et fag i skolens katalog: emnekode, navn, studiepoeng og ev. ferdigheter fra Claude.
type Course = { c: string; n: string; sp: number; s?: string[] };
// Studieplanen til én linje (scripts/build_study_plans.mjs), med samme korte feltnavn.
// Alt her er kontrollert mot skolens egne sider (npm run plans:check).
// x = valgemnet er bare åpent for denne linjen eller noen få linjer, r = regelen for hvem som kan velge det.
// En ferdighet med sitat (q) fra læringsutbyttet i emnebeskrivelsen (u), og ev. sitat (t) som navngir verktøyet.
type Skill = { n: string; q: string; t?: string };
type PlanCourse = {
  n: string;
  c?: string;
  sp: number;
  s: Skill[];
  u?: string;
  x?: boolean;
  r?: string;
  p?: PlanCourse[]; // delemnene i en valgemnepakke
};
// url = kilden som kontrolleres (ofte skolens API); page = siden mennesker leser, når den finnes.
type Source = { title: string; url: string; page?: string };
type Slot = {
  semester: number;
  credits: number;
  title: string;
  exchange: boolean;
  open: boolean; // fritt valg blant alle fagene på skolen
};
type StudyPlan = {
  summary?: string;
  categories?: string[];
  // Fagplan per kull, med oppstart som nøkkel («2024-høst»).
  cohorts: Record<
    string,
    { semesters: PlanCourse[][]; slots: Slot[]; source: Source }
  >;
  // Valgemnene linjen kunne velge, per semester valget ble tatt («2026-vår»).
  offerings: {
    term: string;
    semester: number;
    source: Source;
    options: PlanCourse[];
  }[];
};
// Et valg i studieløpet, med listen for semesteret studenten tok det. verified = listen er kontrollert;
// ellers søker studenten blant alle fagene på skolen.
type ElectiveSlot = Slot & {
  term: number;
  options: PlanCourse[];
  source?: Source;
  verified: boolean;
};
// Et valgfag studenten har lagt inn. slot = hvilket valg i studieplanen det fyller.
type Elective = {
  n: string;
  c?: string;
  sp: number;
  s?: Skill[];
  x?: boolean;
  p?: PlanCourse[];
  mine?: boolean; // står i fagplanen for linjen (grønn prikk)
  slot: number;
  key: string;
};
type Hit =
  | { kind: "school"; inst: Institution; dept?: string }
  | { kind: "programme"; programme: Programme };

const PROFILE_KEY = "sq-profile-demo-v1";
// Bedriftene ser bare de beste ferdighetene, så studenten velger dem selv.
const TOP = 5;
// Så mange ferdigheter vises før «Vis alle» (de nyeste fagene kommer først).
const FIRST_SKILLS = 12;
const POPULAR = ["1110", "1150", "8241", "8253", "1175", "1120"];

// Søk som tåler «hoyskolen» for «Høyskolen» og ord i vilkårlig rekkefølge.
const fold = (text: string) =>
  text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
const words = (query: string) => fold(query).split(/\s+/).filter(Boolean);
const hasAll = (text: string, query: string[]) =>
  query.every((word) => text.includes(word));
const shortName = (name: string) => {
  const rest = name.replace(
    /^(bachelor|master|årsstudium|årsenhet|master'?s)( (i|in|of))? /i,
    "",
  );
  return rest.charAt(0).toUpperCase() + rest.slice(1);
};
const semesterCount = (p: Programme) => Math.max(2, Math.round(p.credits / 30));
// Semestre som tall (år * 2, + 1 for høst), så «tre semestre før nå» blir enkel regning.
const NOW_TERM = (() => {
  const d = new Date();
  return d.getFullYear() * 2 + (d.getMonth() >= 6 ? 1 : 0);
})();
const termKey = (i: number) => `${Math.floor(i / 2)}-${i % 2 ? "høst" : "vår"}`;
const termText = (i: number) =>
  `${i % 2 ? "høsten" : "våren"} ${Math.floor(i / 2)}`;
// Når studenten var i semester s, gitt at hen er i semester `now` i dag.
const termOf = (now: number, s: number) => NOW_TERM - (now - s);
// Semesteret der valgfag vanligvis begynner. Claude anslår det per linje; ellers et anslag ut fra nivå.
const electivesFrom = (p: Programme, data?: SkillSet) => {
  if (typeof data?.electiveFrom === "number") return data.electiveFrom;
  if (p.level === "Bachelor") return 4;
  if (p.level === "Master") return p.credits >= 300 ? 7 : 2;
  return 0;
};

function SchoolTile({ inst }: { inst: Institution }) {
  const logo = /kristiania/i.test(inst.name)
    ? inst.name
    : ["NTNU", "BI"].includes(inst.short)
      ? inst.short
      : "";
  const label = inst.short || inst.name.slice(0, 2);
  return (
    <span className="su-tile">
      {logo ? (
        <SchoolLogo school={logo} />
      ) : (
        <b className={label.length > 4 ? "is-long" : undefined}>{label}</b>
      )}
    </span>
  );
}
const credits = (sp: number) => String(sp).replace(".", ",");
const places = (campuses: string[]) =>
  campuses.length > 3
    ? `${campuses.slice(0, 3).join(" · ")} +${campuses.length - 3}`
    : campuses.join(" · ");

export function Signup() {
  const [studies, setStudies] = useState<Studies | null>(null),
    [skillData, setSkillData] = useState<Record<string, SkillSet>>({}),
    [failed, setFailed] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0),
    [inst, setInst] = useState<Institution | null>(null),
    [dept, setDept] = useState(""),
    [programme, setProgramme] = useState<Programme | null>(null),
    [level, setLevel] = useState("Alle"),
    [lineQuery, setLineQuery] = useState(""),
    [semester, setSemester] = useState(0),
    // De beste ferdighetene i rekkefølgen studenten valgte dem, og egne ferdigheter utenfor fagene.
    [top, setTop] = useState<string[]>([]),
    [custom, setCustom] = useState<string[]>([]),
    [draft, setDraft] = useState<string | null>(null),
    [allSkills, setAllSkills] = useState(false),
    [lastSkill, setLastSkill] = useState(""),
    [name, setName] = useState(""),
    [catalog, setCatalog] = useState<Course[]>([]),
    [plans, setPlans] = useState<Record<string, StudyPlan>>({}),
    [electives, setElectives] = useState<Elective[]>([]),
    [queries, setQueries] = useState<Record<number, string>>({}),
    [expanded, setExpanded] = useState<number[]>([]),
    [electivesDone, setElectivesDone] = useState(false),
    [exchange, setExchange] = useState(false),
    [exchangeWhere, setExchangeWhere] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/data/studier.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setStudies)
      .catch(() => setFailed(true));
    fetch("/data/ferdigheter.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setSkillData)
      .catch(() => setSkillData({}));
  }, []);

  // Studieplanene og fagkatalogen for skolen. Lastes først når skolen er valgt.
  useEffect(() => {
    setCatalog([]);
    setPlans({});
    if (!inst) return;
    let current = true;
    fetch(`/data/emner/${inst.id}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Course[]) => current && setCatalog(list))
      .catch(() => current && setCatalog([]));
    fetch(`/data/studieplaner/${inst.id}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((list: Record<string, StudyPlan>) => current && setPlans(list))
      .catch(() => current && setPlans({}));
    return () => {
      current = false;
    };
  }, [inst?.id]);

  const index = useMemo(() => {
    if (!studies) return null;
    const byId = Object.fromEntries(studies.institutions.map((i) => [i.id, i]));
    return {
      byId,
      schools: studies.institutions.map((i) => ({
        inst: i,
        text: fold(`${i.name} ${i.short} ${i.campuses.join(" ")}`),
      })),
      programmes: studies.programmes.map((p) => ({
        programme: p,
        text: fold(
          `${p.name} ${p.level} ${p.dept} ${byId[p.inst]?.name} ${byId[p.inst]?.short}`,
        ),
      })),
    };
  }, [studies]);

  // Steg 1: ett søk som finner både skoler, deres institutter og linjer.
  const hits: Hit[] = useMemo(() => {
    if (!index || !studies) return [];
    const q = words(query);
    if (!q.length)
      return POPULAR.map((id) => index.byId[id])
        .filter(Boolean)
        .map((i) => ({ kind: "school" as const, inst: i }));
    const schools = index.schools
      .filter((s) => hasAll(s.text, q))
      .sort(
        (a, b) =>
          Number(!fold(a.inst.short).startsWith(q[0])) -
            Number(!fold(b.inst.short).startsWith(q[0])) ||
          a.inst.name.length - b.inst.name.length,
      )
      .slice(0, 4);
    const result: Hit[] = [];
    schools.forEach((s, i) => {
      result.push({ kind: "school", inst: s.inst });
      if (i === 0 && schools.length <= 2)
        s.inst.departments
          .filter((d) => d !== s.inst.name)
          .forEach((d) =>
            result.push({ kind: "school", inst: s.inst, dept: d }),
          );
    });
    index.programmes
      .filter((p) => hasAll(p.text, q))
      .sort(
        (a, b) =>
          Number(a.programme.level !== "Bachelor") -
            Number(b.programme.level !== "Bachelor") ||
          a.programme.name.length - b.programme.name.length,
      )
      .slice(0, 8)
      .forEach((p) =>
        result.push({ kind: "programme", programme: p.programme }),
      );
    return result;
  }, [index, studies, query]);

  const count = (instId: string, department = "") =>
    studies?.programmes.filter(
      (p) => p.inst === instId && (!department || p.dept === department),
    ).length ?? 0;
  const lines = useMemo(() => {
    if (!studies || !inst) return [];
    const q = words(lineQuery);
    return studies.programmes.filter(
      (p) =>
        p.inst === inst.id &&
        (!dept || p.dept === dept) &&
        (level === "Alle" || p.level === level) &&
        hasAll(fold(`${p.name} ${p.dept}`), q),
    );
  }, [studies, inst, dept, level, lineQuery]);
  const levels = useMemo(
    () =>
      studies && inst
        ? [
            "Alle",
            ...new Set(
              studies.programmes
                .filter((p) => p.inst === inst.id && (!dept || p.dept === dept))
                .map((p) => p.level),
            ),
          ]
        : [],
    [studies, inst, dept],
  );

  const pickSchool = (school: Institution, department = "") => {
    setInst(school);
    setDept(department);
    setProgramme(null);
    setLevel("Alle");
    setLineQuery("");
    setSemester(0);
  };
  const pickProgramme = (p: Programme) => {
    if (index) setInst(index.byId[p.inst]);
    setProgramme(p);
    setSemester(0);
    setElectives([]);
    setExchange(false);
  };
  const pickSemester = (n: number) => {
    setSemester(n);
    setElectivesDone(false);
    setTop([]);
    setLastSkill("");
    setAllSkills(false);
    setQueries({});
    setExpanded([]);
    // Nytt semester betyr et annet kull og andre valgemnelister.
    setElectives([]);
    setExchange(false);
  };
  const choose = (hit: Hit) =>
    hit.kind === "programme"
      ? pickProgramme(hit.programme)
      : pickSchool(hit.inst, hit.dept);
  const restart = () => {
    setInst(null);
    setDept("");
    setProgramme(null);
    setSemester(0);
    setQuery("");
    setTimeout(() => searchRef.current?.focus());
  };

  const data = programme ? skillData[programme.id] : undefined;
  const plan = programme ? plans[programme.id] : undefined;
  const info = plan ?? data;
  // Kullet studenten går i, regnet ut fra semesteret i dag, og fagplanen for akkurat det kullet.
  const start = semester ? termOf(semester, 1) : 0;
  const cohort = plan && semester ? plan.cohorts[termKey(start)] : undefined;
  // Valgene i studieløpet. Med fagplan: listen for semesteret valget ble tatt, hvis den er kontrollert.
  // Ellers (og uten fagplan) søker studenten blant alle fagene på skolen – aldri en liste vi ikke har sjekket.
  const from = programme && !cohort ? electivesFrom(programme, data) : 0;
  const allSlots: ElectiveSlot[] = cohort
    ? cohort.slots.map((slot) => {
        const term = termOf(semester, slot.semester);
        const offering = plan?.offerings.find(
          (o) => o.semester === slot.semester && o.term === termKey(term),
        );
        return offering
          ? {
              ...slot,
              term,
              options: offering.options,
              source: offering.source,
              verified: true,
            }
          : { ...slot, term, open: true, options: [], verified: slot.open };
      })
    : from > 0
      ? [
          {
            semester: from,
            credits: 0,
            title: "Valgfag",
            exchange: true,
            open: true,
            term: termOf(semester, from),
            options: [],
            verified: false,
          },
        ]
      : [];
  const slots = allSlots
    .map((slot, id) => ({ slot, id }))
    .filter(({ slot }) => slot.semester <= semester);
  const needsElectives = slots.length > 0;
  const exchangeSlot = slots.find(({ slot }) => slot.exchange);
  const isPicked = (e: Elective) =>
    electives.some((x) => x.slot === e.slot && x.key === e.key);
  const toggleElective = (e: Elective) => {
    setElectives((list) =>
      isPicked(e)
        ? list.filter((x) => !(x.slot === e.slot && x.key === e.key))
        : [...list, e],
    );
    setQueries((q) => ({ ...q, [e.slot]: "" }));
  };
  // Det som vises i ett valg: valgte først, så linjens egne valgemner (grønn prikk, alfabetisk),
  // og ved søk også andre emner på skolen, under linjens egne.
  const optionsFor = (slot: ElectiveSlot, id: number) => {
    const q = words(queries[id] ?? "");
    const picked = electives.filter((e) => e.slot === id);
    const matches = (o: { n: string; c?: string }) =>
      hasAll(fold(`${o.n} ${o.c ?? ""}`), q);
    const order = (a: Elective, b: Elective) =>
      (q.length
        ? Number(!fold(a.n).startsWith(q[0])) -
          Number(!fold(b.n).startsWith(q[0]))
        : 0) || a.n.localeCompare(b.n, "nb");
    const own: Elective[] = slot.options.map((o) => ({
      ...o,
      slot: id,
      key: o.c || o.n,
      mine: true,
    }));
    const rest = own.filter((o) => !isPicked(o) && matches(o)).sort(order);
    const others: Elective[] = q.length
      ? catalog
          .filter((c) => !own.some((o) => o.key === c.c) && matches(c))
          .map((c) => ({ n: c.n, c: c.c, sp: c.sp, slot: id, key: c.c }))
          .filter((o) => !isPicked(o))
          .sort(order)
          .slice(0, 6)
      : [];
    const sum = picked.reduce((n, e) => n + e.sp, 0);
    const away = exchange && exchangeSlot?.id === id;
    const full = away || (slot.credits > 0 && sum >= slot.credits);
    // Når studiepoengene er fylt, vises bare det som er valgt.
    const limit = q.length
      ? 8
      : expanded.includes(id)
        ? rest.length
        : full
          ? 0
          : 6;
    return {
      picked,
      others,
      shown: rest.slice(0, limit),
      hidden: Math.max(0, rest.length - limit),
      sum,
      away,
      full,
    };
  };
  const finishElectives = (none = false) => {
    if (none) {
      setElectives([]);
      setExchange(false);
    }
    setElectivesDone(true);
  };

  // Fagene studenten har hatt, semester for semester, med valgfagene på riktig plass.
  const history = cohort
    ? Array.from({ length: semester }, (_, i) => {
        const n = i + 1;
        const own = slots.filter(({ slot }) => slot.semester === n);
        const names = [
          ...(cohort.semesters[i] ?? []).map((c) => c.n),
          ...electives
            .filter((e) => own.some(({ id }) => id === e.slot))
            .map((e) => e.n),
          ...(exchange && exchangeSlot?.slot.semester === n
            ? [
                `Utveksling${exchangeWhere.trim() ? `: ${exchangeWhere.trim()}` : ""}`,
              ]
            : []),
        ];
        return { semester: n, names, elective: own.length > 0 };
      }).filter((h) => h.names.length || h.elective)
    : [];
  const courseCount = history.reduce((n, h) => n + h.names.length, 0);

  // Ferdighetene studenten velger blant: bare de som har sitat fra læringsutbyttet i fagene hen har hatt
  // (nyeste semester først), og det hen legger til selv. Anslag uten kilde vises ikke.
  const pool: string[] = [];
  const evidence: Record<string, { course: string; q: string }> = {};
  const addSkill = (skill: Skill, course: string) => {
    if (pool.includes(skill.n)) return;
    pool.push(skill.n);
    evidence[skill.n] = { course, q: skill.q };
  };
  for (let n = semester; n >= 1; n--) {
    electives
      .filter((e) => allSlots[e.slot]?.semester === n)
      .forEach((e) => {
        e.s?.forEach((skill) => addSkill(skill, e.n));
        e.p?.forEach((part) =>
          part.s.forEach((skill) => addSkill(skill, part.n)),
        );
      });
    cohort?.semesters[n - 1]?.forEach((c) =>
      c.s.forEach((skill) => addSkill(skill, c.n)),
    );
  }
  custom.forEach((name) => pool.includes(name) || pool.push(name));
  const picked = top.filter((name) => pool.includes(name));
  const topFull = picked.length >= TOP;
  const shownSkills = allSkills
    ? pool
    : pool.filter(
        (name, i) =>
          i < FIRST_SKILLS || picked.includes(name) || custom.includes(name),
      );
  const pickSkill = (name: string) => {
    const adding = !picked.includes(name) && !topFull;
    setLastSkill(adding ? name : "");
    setTop(
      picked.includes(name)
        ? picked.filter((n) => n !== name)
        : adding
          ? [...picked, name]
          : picked,
    );
  };
  // Kilden til ferdigheten studenten nettopp valgte, så hen ser at den kommer fra et fag hen har hatt.
  const proof = picked.includes(lastSkill) ? evidence[lastSkill] : undefined;
  const addCustom = () => {
    const text = draft?.trim() ?? "";
    setDraft(null);
    if (!text) return;
    const name = text.charAt(0).toUpperCase() + text.slice(1);
    setCustom((list) => (list.includes(name) ? list : [...list, name]));
    if (!picked.includes(name) && !topFull) setTop([...picked, name]);
  };
  const labels = [
    "Skole",
    "Linje",
    "Semester",
    ...(needsElectives ? ["Valgfag"] : []),
    "Profil",
  ];
  const stage =
    !inst && !programme
      ? "Skole"
      : !programme
        ? "Linje"
        : !semester
          ? "Semester"
          : needsElectives && !electivesDone
            ? "Valgfag"
            : "Profil";
  const step = labels.indexOf(stage) + 1;

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programme || !inst || !semester || !name.trim()) return;
    try {
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          name: name.trim(),
          study: `${shortName(programme.name)} · ${semester}. semester`,
          school: inst.name,
          location: (() => {
            const physical = inst.campuses.filter((c) => !/nett/i.test(c));
            return physical.length === 1 ? physical[0] : "";
          })(),
          bio: [
            info?.summary,
            electives.length
              ? `Valgfag: ${electives.map((c) => c.n).join(", ")}.`
              : "",
            exchange
              ? `Utveksling${exchangeWhere.trim() ? `: ${exchangeWhere.trim()}` : ""}.`
              : "",
          ]
            .filter(Boolean)
            .join(" "),
          skills: picked.join(", "),
          // Hvor hver ferdighet kommer fra, så bedriften kan se at den er hentet fra emnebeskrivelsen.
          skillSources: picked.map((n) =>
            evidence[n]
              ? { name: n, course: evidence[n].course, quote: evidence[n].q }
              : { name: n, course: "", quote: "" },
          ),
          courses: history.flatMap((h) =>
            h.names.map((n) => ({ name: n, semester: h.semester })),
          ),
          electives: electives.map((c) => ({ code: c.c ?? "", name: c.n })),
          exchange: exchange ? exchangeWhere.trim() || true : false,
        }),
      );
    } catch {
      // Uten lagring i nettleseren går vi likevel videre til demoen.
    }
    window.location.href = "/student";
  };

  // Én rad i valgfag-listen. Grønn prikk = står i fagplanen for linjen.
  const optionRow = (e: Elective) => {
    const on = isPicked(e);
    return (
      <button
        key={e.key}
        className={"su-row su-option" + (on ? " is-on" : "")}
        aria-pressed={on}
        onClick={() => toggleElective(e)}
      >
        <span className="su-tile su-credits">
          {e.sp ? (
            <>
              <b>{credits(e.sp)}</b>
              <small>sp</small>
            </>
          ) : (
            <BookOpen size={18} />
          )}
        </span>
        <span>
          <strong>
            {e.mine && (
              <i className="su-dot" aria-label="I fagplanen for linjen din" />
            )}
            {e.n}
          </strong>
          <small>
            {[
              e.c,
              e.s?.length ? `gir ${e.s.map((x) => x.n).join(", ")}` : "",
              e.sp ? "" : "Lagt til selv",
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </span>
        <span className="su-end">
          <span className="su-check">
            {on ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="su">
      <header className="su-head">
        <a className="su-brand" href="/student" aria-label={BRAND_NAME}>
          <span>
            <BrandMark />
          </span>
          {BRAND_NAME}
        </a>
        <h1>Lag profilen din</h1>
        <p>
          Velg skole og linje, så fyller vi ut resten. Det tar under ett minutt.
        </p>
      </header>

      <ol className="su-steps" aria-label="Fremdrift">
        {labels.map((label, i) => (
          <li
            key={label}
            className={
              i + 1 < step
                ? "is-done"
                : i + 1 === step
                  ? "is-current"
                  : undefined
            }
            aria-current={i + 1 === step ? "step" : undefined}
          >
            <span>{i + 1 < step && <Check size={12} strokeWidth={3} />}</span>
            {label}
          </li>
        ))}
      </ol>

      {failed && (
        <p className="su-note">
          Fant ikke studiedataene. Kjør <code>npm run study-data</code> og last
          siden på nytt.
        </p>
      )}

      {(inst || programme) && (
        <div className="su-picked">
          {inst && (
            <div className="su-picked-row">
              <SchoolTile inst={inst} />
              <span>
                <strong>{inst.name}</strong>
                <small>{dept || places(inst.campuses)}</small>
              </span>
              <button onClick={restart}>Endre</button>
            </div>
          )}
          {programme && (
            <div className="su-picked-row">
              <span className="su-tile">
                <GraduationCap size={18} />
              </span>
              <span>
                <strong>{programme.name}</strong>
                <small>
                  {programme.level} · {programme.credits} studiepoeng
                  {programme.online ? " · nettstudium" : ""}
                </small>
              </span>
              <button onClick={() => (setProgramme(null), setSemester(0))}>
                Endre
              </button>
            </div>
          )}
          {semester > 0 && (
            <div className="su-picked-row">
              <span className="su-tile">
                <b>{semester}</b>
              </span>
              <span>
                <strong>{semester}. semester</strong>
                <small>{Math.ceil(semester / 2)}. studieår</small>
              </span>
              <button onClick={() => setSemester(0)}>Endre</button>
            </div>
          )}
          {needsElectives && electivesDone && !cohort && (
            <div className="su-picked-row">
              <span className="su-tile">
                <BookOpen size={18} />
              </span>
              <span>
                <strong>
                  {electives.length
                    ? `${electives.length} valgfag`
                    : exchange
                      ? "Utveksling"
                      : "Ingen valgfag ennå"}
                  {electives.length > 0 && exchange ? " · utveksling" : ""}
                </strong>
                <small>
                  {electives.map((c) => c.n).join(" · ") ||
                    exchangeWhere ||
                    "Du kan legge dem til senere"}
                </small>
              </span>
              <button onClick={() => setElectivesDone(false)}>Endre</button>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <section className="su-card">
          <h2>Hvor studerer du?</h2>
          <label className="su-search">
            <Search size={20} />
            <input
              ref={searchRef}
              autoFocus
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="su-hits"
              aria-activedescendant={
                hits.length ? `su-hit-${active}` : undefined
              }
              placeholder="Skriv skole eller linje, f.eks. kristiania"
              value={query}
              disabled={!studies}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((n) => Math.min(n + 1, hits.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((n) => Math.max(n - 1, 0));
                } else if (e.key === "Enter" && hits[active]) {
                  e.preventDefault();
                  choose(hits[active]);
                }
              }}
            />
          </label>
          <div
            className="su-hits"
            id="su-hits"
            role="listbox"
            aria-label="Forslag"
          >
            {!query && studies && (
              <small className="su-hint">Populære skoler</small>
            )}
            {hits.map((hit, i) => (
              <button
                key={
                  hit.kind === "programme"
                    ? hit.programme.id
                    : hit.inst.id + (hit.dept ?? "")
                }
                id={`su-hit-${i}`}
                role="option"
                aria-selected={i === active}
                className={
                  "su-row" +
                  (i === active ? " is-active" : "") +
                  (hit.kind === "school" && hit.dept ? " is-dept" : "")
                }
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(hit)}
              >
                {hit.kind === "school" ? (
                  <>
                    {hit.dept ? (
                      <span className="su-branch" />
                    ) : (
                      <SchoolTile inst={hit.inst} />
                    )}
                    <span>
                      <strong>{hit.dept || hit.inst.name}</strong>
                      <small>
                        {hit.dept
                          ? `${count(hit.inst.id, hit.dept)} linjer`
                          : `${count(hit.inst.id)} linjer · ${places(hit.inst.campuses)}`}
                      </small>
                    </span>
                    <span className="su-kind">
                      {hit.dept ? "Institutt" : "Skole"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="su-tile">
                      <GraduationCap size={18} />
                    </span>
                    <span>
                      <strong>{hit.programme.name}</strong>
                      <small>
                        {index?.byId[hit.programme.inst]?.name} ·{" "}
                        {hit.programme.level}
                      </small>
                    </span>
                    <span className="su-kind">Linje</span>
                  </>
                )}
              </button>
            ))}
            {query && studies && !hits.length && (
              <p className="su-empty">
                Ingen treff. Prøv skolens kortnavn, f.eks. «UiO» eller «BI».
              </p>
            )}
          </div>
        </section>
      )}

      {step === 2 && inst && (
        <section className="su-card">
          <h2>Hvilken linje går du på?</h2>
          <label className="su-search">
            <Search size={20} />
            <input
              autoFocus
              placeholder="Søk etter linje"
              value={lineQuery}
              onChange={(e) => setLineQuery(e.target.value)}
            />
          </label>
          {levels.length > 2 && (
            <div className="su-filters" role="group" aria-label="Nivå">
              {levels.map((l) => (
                <button
                  key={l}
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <div className="su-hits">
            {lines.slice(0, 60).map((p) => (
              <button
                key={p.id}
                className="su-row"
                onClick={() => pickProgramme(p)}
              >
                <span className="su-tile">
                  <GraduationCap size={18} />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.level} · {p.credits} studiepoeng
                    {p.online ? " · nettstudium" : ""}
                    {!dept && p.dept && p.dept !== inst.name
                      ? ` · ${p.dept}`
                      : ""}
                  </small>
                </span>
                <ArrowRight size={16} className="su-arrow" />
              </button>
            ))}
            {lines.length > 60 && (
              <p className="su-empty">
                Viser 60 av {lines.length}. Søk for å finne din.
              </p>
            )}
            {!lines.length && (
              <p className="su-empty">Ingen linjer passer søket.</p>
            )}
          </div>
        </section>
      )}

      {step === 3 && programme && (
        <section className="su-card">
          <h2>Hvilket semester går du i?</h2>
          <div className="su-semesters">
            {Array.from(
              {
                length: Math.max(
                  semesterCount(programme),
                  ...Object.values(plan?.cohorts ?? {}).map((c) =>
                    Math.max(
                      c.semesters.length,
                      ...c.slots.map((s) => s.semester),
                    ),
                  ),
                ),
              },
              (_, i) => i + 1,
            ).map((n) => (
              <button key={n} onClick={() => pickSemester(n)}>
                <b>{n}.</b>
                <small>{Math.ceil(n / 2)}. år</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === "Valgfag" && programme && (
        <section className="su-card">
          <h2>Hvilke valgfag har du valgt?</h2>
          <p className="su-lead">
            {(() => {
              const missing = slots.find(({ slot }) => !slot.verified);
              return missing
                ? `Vi har ingen kontrollert liste over valgemner for ${shortName(programme.name)} ${termText(missing.slot.term)}. Søk blant alle fagene på ${inst?.name ?? "skolen"}.`
                : `Emnene med grønn prikk sto i fagplanen for ${shortName(programme.name)} det semesteret. Søk for å finne andre emner på skolen.`;
            })()}
          </p>
          {slots.map(({ slot, id }) => {
            const { picked, shown, others, hidden, sum, away, full } =
              optionsFor(slot, id);
            const query = queries[id] ?? "";
            const total = slot.options.length;
            return (
              <div key={id} className="su-slot">
                {(cohort || slots.length > 1) && (
                  <div className="su-slot-head">
                    <span>
                      <strong>
                        {slot.semester}. semester, {termText(slot.term)} ·{" "}
                        {slot.title}
                      </strong>
                      <small>
                        {slot.credits
                          ? `${credits(slot.credits)} studiepoeng · `
                          : ""}
                        {total > 0 && (
                          <>
                            <i className="su-dot" aria-hidden />
                            {total} valgemner i fagplanen for linjen din
                          </>
                        )}
                        {!slot.verified
                          ? "ingen kontrollert liste, søk blant skolens fag"
                          : slot.open && !total
                            ? "fritt valg blant skolens fag"
                            : ""}
                      </small>
                    </span>
                    {slot.credits > 0 && (
                      <span
                        className={"su-progress" + (full ? " is-full" : "")}
                      >
                        {full && <Check size={12} strokeWidth={3} />}
                        {away
                          ? "Utveksling"
                          : `${credits(sum)} av ${credits(slot.credits)} sp`}
                      </span>
                    )}
                  </div>
                )}
                <label className="su-search">
                  <Search size={20} />
                  <input
                    autoFocus={id === slots[0].id}
                    placeholder={
                      total
                        ? `Søk blant ${total} valgemner`
                        : "Søk på fagnavn eller emnekode"
                    }
                    value={query}
                    onChange={(e) =>
                      setQueries((q) => ({ ...q, [id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const first = shown[0] ?? others[0];
                        if (first) toggleElective(first);
                      }
                    }}
                  />
                </label>
                <div className="su-hits">
                  {[...picked, ...shown].map((e) => optionRow(e))}
                  {others.length > 0 && (
                    <>
                      <p className="su-divider">
                        Andre emner på {inst?.name ?? "skolen"}
                      </p>
                      {others.map((e) => optionRow(e))}
                    </>
                  )}
                  {query.trim() && (
                    <button
                      className="su-row"
                      onClick={() =>
                        toggleElective({
                          n: query.trim(),
                          sp: 0,
                          slot: id,
                          key: `egen:${query.trim()}`,
                        })
                      }
                    >
                      <span className="su-tile">
                        <Plus size={18} />
                      </span>
                      <span>
                        <strong>Legg til «{query.trim()}»</strong>
                        <small>
                          {shown.length || others.length
                            ? "Finner du ikke faget ditt? Legg det til slik du skrev det"
                            : slot.open && !catalog.length
                              ? "Laster fagkatalogen …"
                              : "Ikke i listen, f.eks. et fag fra en annen skole"}
                        </small>
                      </span>
                    </button>
                  )}
                  {!query && hidden > 0 && (
                    <button
                      className="su-more"
                      onClick={() => setExpanded((list) => [...list, id])}
                    >
                      {full ? "Vis de andre valgemnene" : `Vis ${hidden} til`}
                    </button>
                  )}
                </div>
                {exchangeSlot?.id === id && (
                  <>
                    <button
                      className={"su-exchange" + (exchange ? " is-on" : "")}
                      aria-pressed={exchange}
                      onClick={() => setExchange(!exchange)}
                    >
                      <Plane size={16} />
                      Jeg {slot.semester < semester ? "var" : "er"} på
                      utveksling
                      {exchange && <Check size={14} strokeWidth={3} />}
                    </button>
                    {exchange && (
                      <label className="su-field">
                        Hvor?
                        <input
                          placeholder="Skole og land, f.eks. Universidad de Granada, Spania"
                          value={exchangeWhere}
                          onChange={(e) => setExchangeWhere(e.target.value)}
                        />
                      </label>
                    )}
                  </>
                )}
                {slot.source && (
                  <p className="su-sources">
                    Kilde:{" "}
                    <a
                      href={slot.source.page ?? slot.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {slot.source.title}
                    </a>
                  </p>
                )}
              </div>
            );
          })}
          <div className="su-actions">
            <button
              className="su-cta"
              disabled={!electives.length && !exchange}
              onClick={() => finishElectives()}
            >
              Ferdig med valgfag <ArrowRight size={18} />
            </button>
            <button className="su-skip" onClick={() => finishElectives(true)}>
              Har ikke valgt ennå
            </button>
          </div>
        </section>
      )}

      {stage === "Profil" && programme && (
        <form className="su-card" onSubmit={finish}>
          <h2>{history.length ? "Dette kan du allerede" : "Nesten ferdig"}</h2>
          {info?.summary && (
            <p className="su-summary">
              <Sparkles size={16} />
              {info.summary}
            </p>
          )}
          {!cohort && (
            <p className="su-lead">
              {plan
                ? `Vi har ikke fagplanen for kullet ditt (oppstart ${termText(start)}) ennå, så fagene dine er ikke fylt inn.`
                : "Vi har ikke fagplanen for linjen din ennå, så fagene dine er ikke fylt inn."}
            </p>
          )}
          {history.length > 0 && (
            <>
              <p className="su-label">Fagene dine · {courseCount} fag</p>
              <div className="su-courses">
                {history.map((h) => {
                  const now = h.semester === semester;
                  return (
                    <div key={h.semester} className="su-course-row">
                      <span
                        className={"su-tile su-sem" + (now ? " is-now" : "")}
                      >
                        <b>{h.semester}.</b>
                      </span>
                      <span>
                        <strong>{h.semester}. semester</strong>
                        <small>
                          {h.names.join(" · ") || "Valgfag ikke lagt inn"}
                          {h.elective && (
                            <>
                              {" · "}
                              <button
                                type="button"
                                onClick={() => setElectivesDone(false)}
                              >
                                Endre valgfag
                              </button>
                            </>
                          )}
                        </small>
                      </span>
                      <span className={"su-state" + (now ? " is-now" : "")}>
                        {now ? (
                          <i aria-hidden />
                        ) : (
                          <Check size={12} strokeWidth={3} />
                        )}
                        {now ? "Pågår" : "Fullført"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {cohort && (
                <p className="su-sources">
                  Kilde:{" "}
                  <a
                    href={cohort.source.page ?? cohort.source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cohort.source.title}
                  </a>
                </p>
              )}
            </>
          )}
          <div className="su-pick-head">
            <span>
              <strong>
                {pool.length
                  ? `Velg dine ${TOP} beste ferdigheter`
                  : "Hva er du best på?"}
              </strong>
              <small>Det er disse bedriftene ser på profilen din.</small>
            </span>
            <span
              className={"su-meter" + (topFull ? " is-full" : "")}
              aria-live="polite"
            >
              <span aria-hidden>
                {Array.from({ length: TOP }, (_, i) => (
                  <i
                    key={i}
                    className={i < picked.length ? "is-on" : undefined}
                  />
                ))}
              </span>
              {picked.length} av {TOP}
            </span>
          </div>
          <div
            className="su-skills su-pick"
            role="group"
            aria-label="Ferdigheter"
          >
            {shownSkills.map((skill) => {
              const rank = picked.indexOf(skill) + 1;
              return (
                <button
                  type="button"
                  key={skill}
                  aria-pressed={rank > 0}
                  disabled={!rank && topFull}
                  className={rank ? "is-on" : undefined}
                  title={
                    evidence[skill]
                      ? `Fra ${evidence[skill].course}: «${evidence[skill].q}»`
                      : "Lagt til selv"
                  }
                  onClick={() => pickSkill(skill)}
                >
                  {rank > 0 ? (
                    <span className="su-rank">{rank}</span>
                  ) : (
                    <span className="su-rank is-empty" aria-hidden>
                      <Plus size={14} />
                    </span>
                  )}
                  {skill}
                </button>
              );
            })}
            {draft === null ? (
              <button
                type="button"
                className="su-add"
                disabled={topFull}
                onClick={() => setDraft("")}
              >
                <Plus size={14} />
                Egen ferdighet
              </button>
            ) : (
              <input
                className="su-add-input"
                autoFocus
                aria-label="Egen ferdighet"
                placeholder="F.eks. Canva"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={addCustom}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  } else if (e.key === "Escape") setDraft(null);
                }}
              />
            )}
          </div>
          {shownSkills.length < pool.length && (
            <button
              type="button"
              className="su-more"
              onClick={() => setAllSkills(true)}
            >
              Vis alle {pool.length} ferdighetene
            </button>
          )}
          {proof && (
            <p className="su-proof">
              <b>{lastSkill}</b> fra {proof.course}: «{proof.q}»
            </p>
          )}
          <p className="su-hint">
            {topFull
              ? "Trykk på en valgt ferdighet for å bytte den ut."
              : pool.length
                ? "Trykk på dem du er best på, den beste først."
                : "Legg til det du kan, f.eks. Excel, Canva eller tekstforfatting."}
          </p>
          {info?.categories?.length ? (
            <p className="su-fits">
              Oppdrag som passer deg:{" "}
              {info.categories.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </p>
          ) : null}
          <label className="su-field">
            Hva heter du?
            <input
              required
              autoComplete="name"
              placeholder="Fornavn og etternavn"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="su-cta"
            type="submit"
            disabled={!name.trim() || !picked.length}
          >
            Lag profilen min <ArrowRight size={18} />
          </button>
          <p className="su-hint">
            Demo: profilen lagres bare i denne nettleseren.
          </p>
        </form>
      )}

      {studies && (
        <p className="su-source">
          Skoler og linjer fra {studies.source}, {studies.period}.
        </p>
      )}
    </div>
  );
}
