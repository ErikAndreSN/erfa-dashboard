import React, { useEffect, useState, useRef } from "react";
import {
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  MessageCircle,
  FileCheck2,
  FileText,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Search,
  Clock,
  CalendarDays,
  Check,
  GraduationCap,
  Menu,
  X,
  Download,
  CheckCheck,
  ClipboardList,
  GripVertical,
  BarChart3,
  Heart,
  Eye,
  Bookmark,
} from "lucide-react";
import { Button } from "./components/arc/button/button";
import { BottomSheet } from "./components/arc/bottom-sheet/bottom-sheet";
import { Avatar } from "./components/arc/avatar/avatar";
import { BRAND_NAME, BrandMark } from "./brand";
import "./business.css";
import { Select } from "./components/arc/select/select";
import {
  BUSINESS_STORE,
  SchoolIdentity,
  SchoolLogo,
  VerifiedSkills,
} from "./VerifiedSkills";

type Stage = "Publisert" | "Avtale" | "Pågår" | "Fullført";
type ApplicationStage = "Søkt" | "Vurderes" | "Tilbudt jobb" | "Fått jobben";
type Job = {
  id: number;
  title: string;
  category: string;
  amount: number;
  hours: string;
  deadline: string;
  description: string;
  skills: string[];
  stage: Stage;
  selected?: number;
  studentApproved: boolean;
  companyApproved: boolean;
  attest?: string;
  attestSkills?: string[];
  attestCompany?: string;
  tools?: { name: string; level: number }[];
  expectations?: string;
  day?: string;
  start?: string;
  workplace?: string;
  location?: string;
  engagement?: string;
  payType?: string;
  views?: number;
  saves?: number;
};
type Candidate = {
  id: number;
  name: string;
  initials: string;
  photo: string;
  study: string;
  school: string;
  semester: string;
  skills: string[];
  attests: number;
  match: number;
  bio: string;
  quote: string;
};
type Application = {
  id: number;
  jobId: number;
  candidateId: number;
  stage: ApplicationStage;
};
const initialJobs: Job[] = [
  {
    id: 1,
    title: "Innhold til sosiale medier",
    category: "Markedsføring",
    amount: 4500,
    hours: "10–15 timer",
    deadline: "2026-10-23",
    description:
      "Lag en innholdsplan og seks innlegg om grønn teknologi. Vi leverer bilder, profilmanual og en tydelig brief.",
    skills: ["Sosiale medier", "Tekst", "Canva"],
    tools: [
      { name: "Canva", level: 3 },
      { name: "Meta Business Suite", level: 2 },
    ],
    expectations:
      "Du skriver godt norsk og kan tilpasse budskap til Instagram og LinkedIn. Vi gir deg en brief og en innføring i merkevaren.",
    day: "Et digitalt oppstartsmøte med Maria. Deretter jobber du fleksibelt rundt studiene, med en kort gjennomgang av første utkast.",
    start: "2026-10-19",
    workplace: "Eksternt",
    engagement: "Selvstendig oppdrag",
    payType: "Totalpris",
    stage: "Publisert",
    studentApproved: false,
    companyApproved: false,
  },
  {
    id: 2,
    title: "Klipp tre korte produktvideoer",
    category: "Video",
    amount: 6000,
    hours: "15–20 timer",
    deadline: "2026-10-26",
    description:
      "Klipp tre videoer på 30 sekunder fra opptakene våre. Legg på tekst og tilpass til sosiale medier.",
    skills: ["Videoklipping", "Premiere Pro"],
    tools: [{ name: "Premiere Pro", level: 3 }],
    expectations:
      "Du kan klippe korte videoer, justere lyd og legge på undertekster. Vi leverer råmaterialet og en enkel profilmanual.",
    day: "Du jobber eksternt og avklarer retning med oss før klippingen. Første utkast får én samlet tilbakemeldingsrunde.",
    start: "2026-10-19",
    workplace: "Eksternt",
    engagement: "Selvstendig oppdrag",
    payType: "Totalpris",
    stage: "Publisert",
    studentApproved: false,
    companyApproved: false,
  },
  {
    id: 3,
    title: "Brukertest av den nye nettsiden",
    category: "Design",
    amount: 3000,
    hours: "6–8 timer",
    deadline: "2026-10-28",
    description:
      "Planlegg fem brukertester og oppsummer konkrete forbedringer i en kort rapport.",
    skills: ["Brukertesting", "Figma"],
    stage: "Avtale",
    selected: 3,
    studentApproved: false,
    companyApproved: false,
  },
  {
    id: 4,
    title: "Analyser kundeundersøkelsen vår",
    category: "Analyse",
    amount: 5000,
    hours: "12–16 timer",
    deadline: "2026-10-19",
    description:
      "Rydd i svarene fra kundeundersøkelsen, visualiser funnene og gi oss tre konkrete anbefalinger.",
    skills: ["Excel", "Dataanalyse"],
    stage: "Pågår",
    selected: 2,
    studentApproved: true,
    companyApproved: false,
  },
  {
    id: 5,
    title: "Produkttekster til nettbutikken",
    category: "Tekst",
    amount: 3500,
    hours: "8–10 timer",
    deadline: "2026-10-08",
    description:
      "Skriv tydelige produkttekster for ti av våre mest populære produkter.",
    skills: ["Tekst", "SEO"],
    stage: "Fullført",
    selected: 1,
    studentApproved: true,
    companyApproved: true,
  },
];
const candidates: Candidate[] = [
  {
    id: 1,
    name: "Sara Johansen",
    initials: "SJ",
    photo: "/people/sara.png",
    study: "Markedsføring og ledelse",
    school: "Høyskolen Kristiania",
    semester: "5. semester",
    skills: ["Sosiale medier", "Tekst", "Canva", "SEO"],
    attests: 4,
    match: 94,
    bio: "Jeg liker å gjøre gode ideer enkle å forstå. Har laget innhold for små bedrifter og vil bruke det jeg lærer i praksis.",
    quote:
      "Sara leverte gjennomarbeidet innhold til avtalt tid. Enkel å samarbeide med.",
  },
  {
    id: 2,
    name: "Jonas Berg",
    initials: "JB",
    photo: "/people/jonas.png",
    study: "Økonomi og administrasjon",
    school: "BI",
    semester: "3. semester",
    skills: ["Excel", "Dataanalyse", "Power BI"],
    attests: 3,
    match: 91,
    bio: "Jeg trives med tall og gjør store datasett om til innsikt som kan brukes. Har erfaring med Excel og Power BI.",
    quote:
      "Jonas gjorde analysen lett å forstå og ga oss nyttige anbefalinger.",
  },
  {
    id: 3,
    name: "Lina Holm",
    initials: "LH",
    photo: "/people/lina.png",
    study: "Interaksjonsdesign",
    school: "NTNU",
    semester: "5. semester",
    skills: ["Figma", "Brukertesting", "Design"],
    attests: 2,
    match: 89,
    bio: "Jeg lager løsninger som er enkle å bruke. Har gjennomført brukertester i studiene og i to betalte oppdrag.",
    quote:
      "Lina stilte gode spørsmål og fant forbedringer vi ikke hadde sett selv.",
  },
  {
    id: 4,
    name: "Emil Andersen",
    initials: "EA",
    photo: "/people/emil.png",
    study: "Film og medieproduksjon",
    school: "Høyskolen Kristiania",
    semester: "3. semester",
    skills: ["Videoklipping", "Premiere Pro", "SoMe"],
    attests: 2,
    match: 92,
    bio: "Jeg klipper korte videoer med tydelig historiefortelling. Liker å finne de små detaljene som gjør innholdet bedre.",
    quote: "Emil var selvstendig, kreativ og fulgte briefen godt.",
  },
];
function CandidatePhoto({
  candidate,
  small = false,
}: {
  candidate?: Candidate;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={"biz-avatar" + (small ? " small" : "")}>
      {candidate && !failed ? (
        <img
          src={candidate.photo}
          alt={`Profilbilde av ${candidate.name}`}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        candidate?.initials || "?"
      )}
    </span>
  );
}

const initialApplications: Application[] = [
  { id: 1, jobId: 1, candidateId: 1, stage: "Søkt" },
  { id: 2, jobId: 1, candidateId: 3, stage: "Søkt" },
  { id: 3, jobId: 2, candidateId: 4, stage: "Søkt" },
  { id: 4, jobId: 2, candidateId: 1, stage: "Vurderes" },
  { id: 5, jobId: 3, candidateId: 3, stage: "Fått jobben" },
  { id: 6, jobId: 4, candidateId: 2, stage: "Fått jobben" },
  { id: 7, jobId: 5, candidateId: 1, stage: "Fått jobben" },
];
const stages: Stage[] = ["Publisert", "Avtale", "Pågår", "Fullført"];
const matchFor = (a: Application) =>
  ({ 1: 94, 2: 72, 3: 92, 4: 64, 5: 89, 6: 91, 7: 94 })[a.id] ?? 0;
const feeRate = 0.125;
const money = (value: number) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(value) +
  " kr";
const date = (value: string) =>
  new Date(value + "T12:00:00").toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
const freshDraft = () => ({
  title: "",
  category: "Markedsføring",
  amount: "4500",
  hours: "10–15 timer",
  deadline: "2026-10-30",
  description: "",
  skills: "",
  tools: [{ name: "", level: 3 }],
  expectations: "",
  day: "",
  start: "2026-10-19",
  workplace: "Eksternt",
  location: "",
  engagement: "Selvstendig oppdrag",
  payType: "Totalpris",
});
const storeKey = BUSINESS_STORE;
const qaMode = new URLSearchParams(window.location.search).get("demo") === "qa";
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(storeKey) || "null");
    if (
      v &&
      Array.isArray(v.jobs) &&
      v.jobs.every((j: Job) => stages.includes(j.stage)) &&
      Array.isArray(v.applications)
    )
      return {
        ...v,
        applications: v.applications.map((a: Application) => ({
          ...a,
          stage: (a.stage as string) === "Valgt" ? "Fått jobben" : a.stage,
        })),
      };
  } catch {}
  return { jobs: initialJobs, applications: initialApplications };
}

export function BusinessDashboard() {
  const [seed] = useState(() =>
      qaMode
        ? { jobs: initialJobs, applications: initialApplications }
        : load(),
    ),
    [jobs, setJobs] = useState<Job[]>(seed.jobs),
    [applications, setApplications] = useState<Application[]>(
      seed.applications,
    );
  const [page, setPage] = useState("Oversikt"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Alle"),
    [appFilter, setAppFilter] = useState("Alle"),
    [sheet, setSheet] = useState(""),
    [activeJobId, setActiveJobId] = useState<number>(1),
    [activeApplicationId, setActiveApplicationId] = useState<number>(1),
    [draft, setDraft] = useState(freshDraft),
    [attest, setAttest] = useState(""),
    [attestSkills, setAttestSkills] = useState<string[]>([]),
    [newSkill, setNewSkill] = useState(""),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [message, setMessage] = useState(""),
    [messages, setMessages] = useState<Record<number, string[]>>({}),
    [conversationId, setConversationId] = useState(4);
  const [talent, setTalent] = useState<number[]>(seed.talent || []),
    [pipelineJob, setPipelineJob] = useState(1),
    [workTab, setWorkTab] = useState("Pågående"),
    [applicationDrag, setApplicationDrag] = useState<number | null>(null),
    [applicationTarget, setApplicationTarget] =
      useState<ApplicationStage | null>(null),
    [applicationKeyboard, setApplicationKeyboard] = useState(false);
  const [talentDrafts, setTalentDrafts] = useState<
    {
      id: number;
      candidateId: number;
      kind: string;
      title: string;
      message: string;
    }[]
  >(seed.talentDrafts || []);
  const [talentCandidate, setTalentCandidate] = useState(1),
    [talentKind, setTalentKind] = useState("Nytt samarbeid"),
    [talentTitle, setTalentTitle] = useState(""),
    [talentMessage, setTalentMessage] = useState("");
  const beginTalentRequest = (id: number, kind: string) => {
    setTalentCandidate(id);
    setTalentKind(kind);
    setTalentTitle("");
    setTalentMessage("");
    setSheet("talent-request");
  };
  const appDragRef = useRef<number | null>(null),
    appClickUntil = useRef(0);
  const [company, setCompany] = useState({
    name: "GreenTech AS",
    industry: "Bærekraftig teknologi",
    about: "Vi utvikler løsninger som gjør det enklere å velge grønt.",
    contact: "Maria Hansen",
  });
  useEffect(() => {
    if (!qaMode) {
      localStorage.setItem(
        storeKey,
        JSON.stringify({ jobs, applications, talent, talentDrafts }),
      );
      window.dispatchEvent(new Event("erfa-attests-updated"));
    }
  }, [jobs, applications, talent, talentDrafts]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const selectedJob = jobs.find((j) => j.id === activeJobId)!,
    activeApplication = applications.find((a) => a.id === activeApplicationId),
    student = candidates.find((c) => c.id === activeApplication?.candidateId);
  const conversationJob = jobs.find((j) => j.id === conversationId)!,
    conversationStudent = candidates.find(
      (c) => c.id === conversationJob.selected,
    )!;
  const openJobs = jobs.filter((j) => j.stage === "Publisert"),
    newApplications = applications.filter((a) => a.stage === "Søkt"),
    pendingAttests = jobs.filter((j) => j.stage === "Fullført" && !j.attest);
  const shownJobs = jobs.filter(
    (j) =>
      (filter === "Alle" || j.category === filter) &&
      [j.title, j.category]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const navigate = (p: string) => {
    setPage(p);
    setMenu(false);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const openJob = (id: number) => {
    setActiveJobId(id);
    setSheet("job");
  };
  const openApplicant = (id: number) => {
    const application = applications.find((a) => a.id === id)!;
    setActiveApplicationId(id);
    setActiveJobId(application.jobId);
    setSheet("candidate");
  };
  const updateJob = (id: number, changes: Partial<Job>) =>
    setJobs((list) =>
      list.map((j) => (j.id === id ? { ...j, ...changes } : j)),
    );
  const review = () => moveApplication(activeApplicationId, "Vurderes");
  const toggleTalent = (id: number) => {
    setTalent((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
    setToast(
      talent.includes(id)
        ? "Studenten er fjernet fra talentbasen"
        : "Studenten er lagret i talentbasen",
    );
  };
  const choose = () => {
    if (activeApplication)
      moveApplication(activeApplication.id, "Tilbudt jobb");
  };
  const complete = () => {
    if (!selectedJob.studentApproved) return;
    updateJob(selectedJob.id, { companyApproved: true, stage: "Fullført" });
    setToast("Begge parter har bekreftet fullføring. Attesten er neste steg.");
  };
  const downloadFee = (j: Job) => {
    if (j.payType === "Timepris") {
      setToast("Bekreftet timetall mangler. Gebyret kan ikke beregnes ennå.");
      return;
    }
    const content =
      "\ufeffEksempeloversikt – ikke en faktura\nOppdrag;Formidlingsgebyr;Sats\n" +
      j.title +
      ";" +
      j.amount * feeRate +
      ";12,5 %\nStudentens honorar betales direkte og inngår ikke i denne oversikten.";
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "eksempel-formidlingsgebyr-" + j.id + ".csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Eksempeloversikten er lastet ned");
  };
  const applicationStages: ApplicationStage[] = [
    "Søkt",
    "Vurderes",
    "Tilbudt jobb",
    "Fått jobben",
  ];
  const clearApplicationDrag = () => {
    appDragRef.current = null;
    setApplicationDrag(null);
    setApplicationTarget(null);
    setApplicationKeyboard(false);
    appClickUntil.current = Date.now() + 250;
  };
  const moveApplication = (id: number, target: ApplicationStage) => {
    const application = applications.find((a) => a.id === id);
    if (!application) return;
    const job = jobs.find((j) => j.id === application.jobId)!;
    clearApplicationDrag();
    if (application.stage === target) return;
    if (application.stage === "Fått jobben") {
      setToast("Studenten har fått jobben. Følg opp videre under Oppdrag.");
      return;
    }
    if (job.selected && job.selected !== application.candidateId) {
      setToast("Dette oppdraget har allerede en valgt student.");
      return;
    }
    if (
      Math.abs(
        applicationStages.indexOf(target) -
          applicationStages.indexOf(application.stage),
      ) > 1
    ) {
      setToast("Flytt studenten ett steg om gangen.");
      return;
    }
    setApplications((list) =>
      list.map((a) => (a.id === id ? { ...a, stage: target } : a)),
    );
    if (target === "Fått jobben")
      updateJob(job.id, { selected: application.candidateId, stage: "Avtale" });
    setToast(
      target === "Fått jobben"
        ? "Aksept er registrert i demoen. Avklar avtalen under Oppdrag."
        : target === "Tilbudt jobb"
          ? "Tilbud er registrert lokalt. Ingen tilbud er sendt."
          : "Søkeren er flyttet til " + target,
    );
  };
  const jobCard = (j: Job) => {
    const person = candidates.find((c) => c.id === j.selected);
    return (
      <button className="biz-job" key={j.id} onClick={() => openJob(j.id)}>
        <span className="biz-job-top">
          <span className="biz-tag">{j.category}</span>
          <span className="biz-badge">
            {j.stage === "Avtale" ? "Avtale gjenstår" : j.stage}
          </span>
        </span>
        <h3>{j.title}</h3>
        <span className="biz-job-meta">
          <Clock size={14} />
          {j.hours}
          <span>·</span>
          {money(j.amount)}
          {j.payType === "Timepris" ? " / time" : ""}
        </span>
        <span className="biz-job-deadline">
          <CalendarDays size={14} />
          Frist {date(j.deadline)}
        </span>
        <span className="biz-job-foot">
          <span className="biz-assignee">
            <CandidatePhoto candidate={person} small />
            {person?.name || "Student ikke valgt"}
          </span>
          <ChevronRight size={16} />
        </span>
      </button>
    );
  };
  const pipeline = () => {
    const current = jobs.find((j) => j.id === pipelineJob) || jobs[0],
      list = applications.filter((a) => a.jobId === current.id);
    return (
      <section className="biz-board-section">
        <div className="biz-section-head">
          <div>
            <h2>Søknadsprosessen</h2>
            <p>Se menneskene bak søknadene. Ta ett steg av gangen.</p>
          </div>
          <label className="biz-pipeline-select">
            Oppdrag
            <Select
              label="Velg oppdrag for søknader"
              value={String(current.id)}
              onValueChange={(value) => setPipelineJob(Number(value))}
              options={jobs.map((j) => ({
                value: String(j.id),
                label: j.title,
              }))}
            />
          </label>
        </div>
        <div className="biz-pipeline-summary">
          <span>
            <Users size={16} />
            <b>{list.length}</b> søkere
          </span>
          <span>{current.category}</span>
          <span>
            {money(current.amount)}
            {current.payType === "Timepris" ? " / time" : " totalt"}
          </span>
          <button onClick={() => openJob(current.id)}>
            Se oppdragsbeskrivelse <ArrowUpRight size={14} />
          </button>
        </div>
        <p className="biz-drag-help" id="application-drag-help">
          Dra studentkort til neste steg. Tastatur: mellomrom, piltaster og
          Enter. På mobil kan du bruke statusvalget i kortet.
        </p>
        <div
          className="biz-board biz-application-board"
          aria-label="Søknadspipeline"
        >
          {applicationStages.map((stage, i) => (
            <section
              key={stage}
              aria-label={stage}
              className={
                "biz-lane " + (applicationTarget === stage ? "drop-active" : "")
              }
              onDragOver={(e) => {
                if (appDragRef.current !== null) {
                  e.preventDefault();
                  setApplicationTarget(stage);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (appDragRef.current !== null)
                  moveApplication(appDragRef.current, stage);
              }}
            >
              <div className="biz-lane-head">
                <span>
                  <i className={"biz-stage-dot stage-" + i} />
                  {stage}
                </span>
                <span className="biz-count">
                  {list.filter((a) => a.stage === stage).length}
                </span>
              </div>
              <div className="biz-lane-cards">
                {list
                  .filter((a) => a.stage === stage)
                  .map((a) => {
                    const c = candidates.find((c) => c.id === a.candidateId)!;
                    return (
                      <article
                        key={a.id}
                        data-application-id={a.id}
                        tabIndex={0}
                        role="group"
                        aria-label={c.name + " · " + stage}
                        aria-describedby="application-drag-help"
                        draggable={
                          !applicationKeyboard && stage !== "Fått jobben"
                        }
                        className={
                          "biz-student-card " +
                          (applicationDrag === a.id ? "is-dragging" : "")
                        }
                        onDragStart={(e) => {
                          appDragRef.current = a.id;
                          setApplicationDrag(a.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(a.id));
                        }}
                        onDragEnd={clearApplicationDrag}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === " " && !applicationKeyboard) {
                            e.preventDefault();
                            appDragRef.current = a.id;
                            setApplicationDrag(a.id);
                            setApplicationTarget(stage);
                            setApplicationKeyboard(true);
                            return;
                          }
                          if (!applicationKeyboard || applicationDrag !== a.id)
                            return;
                          if (
                            [
                              "ArrowLeft",
                              "ArrowRight",
                              "Enter",
                              "Escape",
                              " ",
                            ].includes(e.key)
                          )
                            e.preventDefault();
                          if (e.key === "Escape") clearApplicationDrag();
                          else if (
                            e.key === "ArrowLeft" ||
                            e.key === "ArrowRight"
                          )
                            setApplicationTarget(
                              applicationStages[
                                Math.max(
                                  0,
                                  Math.min(
                                    3,
                                    applicationStages.indexOf(
                                      applicationTarget || stage,
                                    ) + (e.key === "ArrowRight" ? 1 : -1),
                                  ),
                                )
                              ],
                            );
                          else if (e.key === "Enter" || e.key === " ")
                            moveApplication(a.id, applicationTarget || stage);
                        }}
                      >
                        <div className="biz-student-card-top">
                          <CandidatePhoto candidate={c} />
                          <button
                            aria-label={
                              (talent.includes(c.id) ? "Fjern " : "Lagre ") +
                              c.name +
                              " i talentbase"
                            }
                            aria-pressed={talent.includes(c.id)}
                            onClick={() => toggleTalent(c.id)}
                          >
                            <Heart
                              size={17}
                              fill={
                                talent.includes(c.id) ? "currentColor" : "none"
                              }
                            />
                          </button>
                          <GripVertical size={15} />
                        </div>
                        <button
                          className="biz-student-open"
                          onClick={() => {
                            if (Date.now() > appClickUntil.current)
                              openApplicant(a.id);
                          }}
                        >
                          <h3>{c.name}</h3>
                          <p>{c.study}</p>
                          <small>
                            {c.school} · {c.semester}
                          </small>
                        </button>
                        <div className="biz-skills">
                          {c.skills.slice(0, 2).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                        <div className="biz-student-trust">
                          <span>
                            <FileCheck2 size={14} />
                            {c.attests} attester
                          </span>
                          <b>{matchFor(a)} % samsvar</b>
                        </div>
                        <label className="biz-status-control">
                          <span className="sr-only">Status for {c.name}</span>
                          <select
                            aria-label={"Status for " + c.name}
                            value={stage}
                            disabled={stage === "Fått jobben"}
                            onChange={(e) =>
                              moveApplication(
                                a.id,
                                e.target.value as ApplicationStage,
                              )
                            }
                          >
                            {applicationStages.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </label>
                      </article>
                    );
                  })}
                {!list.some((a) => a.stage === stage) && (
                  <div className="biz-lane-empty">
                    {stage === "Søkt"
                      ? "Ingen nye søkere"
                      : "Flytt en student hit"}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
        <p className="biz-drag-help biz-pipeline-note">
          Tilbud og aksept er demosteg. Ingen tilbud sendes eller avtaler inngås
          her.
        </p>
      </section>
    );
  };
  const workOverview = () => {
    const list = shownJobs.filter((j) =>
      workTab === "Fullførte"
        ? j.stage === "Fullført"
        : ["Avtale", "Pågår"].includes(j.stage),
    );
    return (
      <section className="biz-board-section">
        <div className="biz-section-head">
          <div>
            <h2>Arbeid og leveranser</h2>
            <p>Følg opp avtalene, leveransene og attestene.</p>
          </div>
          <label className="biz-search">
            <Search size={16} />
            <input
              aria-label="Søk i oppdrag"
              placeholder="Søk i oppdrag"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="biz-segmented">
          {["Pågående", "Fullførte"].map((t) => (
            <button
              key={t}
              aria-pressed={workTab === t}
              onClick={() => setWorkTab(t)}
            >
              {t}
              <span>
                {
                  jobs.filter((j) =>
                    t === "Fullførte"
                      ? j.stage === "Fullført"
                      : ["Avtale", "Pågår"].includes(j.stage),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="biz-work-grid">{list.map(jobCard)}</div>
        {!list.length && (
          <div className="biz-empty">
            <BriefcaseBusiness size={26} />
            <h3>Ingen oppdrag her ennå</h3>
            <p>
              {workTab === "Fullførte"
                ? "Fullførte oppdrag samles her."
                : "Velg en student i søknadspipelinen for å komme i gang."}
            </p>
          </div>
        )}
      </section>
    );
  };
  const metrics = jobs.map((j) => {
    const list = applications.filter((a) => a.jobId === j.id);
    return {
      job: j,
      views: j.views ?? ({ 1: 248, 2: 186, 3: 154, 4: 212, 5: 167 }[j.id] || 0),
      saves: j.saves ?? ({ 1: 23, 2: 18, 3: 12, 4: 20, 5: 14 }[j.id] || 0),
      count: list.length,
      qualified: list.filter((a) => matchFor(a) >= 85).length,
    };
  });
  const statistics = () => (
    <section>
      <div className="biz-statistics-note">
        <BarChart3 size={18} />
        <span>
          Eksempelstatistikk · Annonseklikk og lagringer er fiktive. Søkertall
          følger demoen. Kvalifisert betyr minst 85 % samsvar i eksempeldataene.
        </span>
      </div>
      <div className="biz-metric-grid">
        {[
          {
            label: "Annonseklikk",
            value: metrics.reduce((n, m) => n + m.views, 0),
            icon: Eye,
          },
          {
            label: "Lagret som favoritt",
            value: metrics.reduce((n, m) => n + m.saves, 0),
            icon: Bookmark,
          },
          { label: "Søknader", value: applications.length, icon: Users },
          {
            label: "Kvalifiserte søknader",
            value: metrics.reduce((n, m) => n + m.qualified, 0),
            icon: GraduationCap,
          },
        ].map((m) => (
          <article key={m.label}>
            <m.icon size={20} />
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </article>
        ))}
      </div>
      <section className="biz-page-panel">
        <div className="biz-section-head">
          <div>
            <h2>Hvordan går annonsene?</h2>
            <p>Samlet oversikt per annonse · eksempeldata.</p>
          </div>
        </div>
        <div className="biz-table-scroll">
          <table className="biz-metrics-table">
            <thead>
              <tr>
                <th>Oppdrag</th>
                <th>Klikk</th>
                <th>Lagringer</th>
                <th>Søkere</th>
                <th>Kvalifiserte</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.job.id}>
                  <td>
                    <button onClick={() => openJob(m.job.id)}>
                      {m.job.title}
                      <small>{m.job.category}</small>
                    </button>
                    <div className="biz-metric-bar">
                      <span
                        style={{
                          width:
                            (m.views /
                              Math.max(1, ...metrics.map((x) => x.views))) *
                              100 +
                            "%",
                        }}
                      />
                    </div>
                  </td>
                  <td>{m.views}</td>
                  <td>{m.saves}</td>
                  <td>{m.count}</td>
                  <td>{m.qualified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
  const talentPool = () => (
    <section className="biz-board-section">
      <div className="biz-section-head">
        <div>
          <h2>Kandidater for neste samarbeid</h2>
          <p>
            {talent.length} lagrede kandidater. Se profilene, start et nytt
            samarbeid eller lag et tilbud om fast stilling.
          </p>
        </div>
      </div>
      <div className="biz-talent-grid">
        {candidates
          .filter((c) => talent.includes(c.id))
          .map((c) => (
            <article className="biz-talent-card" key={c.id}>
              <div className="biz-student-card-top">
                <CandidatePhoto candidate={c} />
                <button
                  aria-label={"Fjern " + c.name + " fra talentbase"}
                  onClick={() => toggleTalent(c.id)}
                >
                  <Heart size={19} fill="currentColor" />
                </button>
              </div>
              <h3>{c.name}</h3>
              <p>
                {c.study} · {c.school}
              </p>
              <div className="biz-skills">
                {c.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p>
                <FileCheck2 size={15} /> {c.attests} tidligere attester
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  openApplicant(
                    applications.find((a) => a.candidateId === c.id)!.id,
                  )
                }
              >
                Se studentprofil <ArrowUpRight size={16} />
              </Button>
              <div className="biz-talent-actions">
                <Button
                  className="primary-cta"
                  onClick={() => beginTalentRequest(c.id, "Nytt samarbeid")}
                >
                  Nytt samarbeid <ArrowUpRight size={15} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => beginTalentRequest(c.id, "Fast stilling")}
                >
                  Tilby fast stilling <BriefcaseBusiness size={15} />
                </Button>
              </div>
              {talentDrafts
                .filter((d) => d.candidateId === c.id)
                .map((d) => (
                  <div className="biz-talent-draft" key={d.id}>
                    <FileText size={15} />
                    <span>
                      <strong>{d.title}</strong>
                      <small>{d.kind} · Utkast, ikke sendt</small>
                    </span>
                    <button
                      onClick={() => {
                        setTalentCandidate(c.id);
                        setTalentKind(d.kind);
                        setTalentTitle(d.title);
                        setTalentMessage(d.message);
                        setSheet("talent-request");
                      }}
                    >
                      Se utkast <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
            </article>
          ))}
      </div>
      {!talent.length && (
        <div className="biz-empty">
          <Heart size={30} />
          <h3>Ta vare på gode kandidater</h3>
          <p>
            Trykk på hjertet i studentkortet eller lagre studenten etter et
            fullført oppdrag.
          </p>
          <Button variant="secondary" onClick={() => navigate("Søknader")}>
            Se søkere <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </section>
  );
  const applicantList = (jobId?: number) => {
    const list = applications.filter(
      (a) =>
        (!jobId || a.jobId === jobId) &&
        (appFilter === "Alle" || a.stage === appFilter),
    );
    return (
      <>
        <div className="biz-segmented" aria-label="Søkerstatus">
          {["Alle", "Søkt", "Vurderes", "Tilbudt jobb", "Fått jobben"].map(
            (s) => (
              <button
                key={s}
                aria-pressed={appFilter === s}
                onClick={() => setAppFilter(s)}
              >
                {s}
                <span>
                  {
                    applications.filter(
                      (a) =>
                        (!jobId || a.jobId === jobId) &&
                        (s === "Alle" || a.stage === s),
                    ).length
                  }
                </span>
              </button>
            ),
          )}
        </div>
        <div className="biz-applicant-list">
          {list.map((a) => {
            const c = candidates.find((c) => c.id === a.candidateId)!,
              j = jobs.find((j) => j.id === a.jobId)!;
            return (
              <button
                className="biz-applicant-row"
                key={a.id}
                onClick={() => openApplicant(a.id)}
              >
                <CandidatePhoto candidate={c} />
                <span className="biz-person">
                  <strong>{c.name}</strong>
                  <span>{c.study}</span>
                  <span className="biz-school-line">
                    <SchoolLogo school={c.school} />
                    <span>
                      {c.school} · {c.semester}
                    </span>
                  </span>
                  <small>{j.title}</small>
                </span>
                <span className="biz-trust">
                  <FileCheck2 size={15} />
                  {c.attests} attester
                </span>
                <span
                  className={
                    "biz-badge " +
                    (a.stage === "Fått jobben"
                      ? "selected"
                      : a.stage === "Vurderes"
                        ? "review"
                        : "")
                  }
                >
                  {a.stage}
                </span>
                <ChevronRight size={18} />
              </button>
            );
          })}
          {!list.length && (
            <div className="biz-empty">
              <Users size={26} />
              <h3>Ingen søkere her ennå</h3>
              <p>Søkere dukker opp når de søker på et publisert oppdrag.</p>
            </div>
          )}
        </div>
      </>
    );
  };
  const nav = [
    { name: "Oversikt", icon: LayoutGrid },
    { name: "Oppdrag", icon: BriefcaseBusiness },
    { name: "Søknader", icon: Users },
    { name: "Meldinger", icon: MessageCircle },
    { name: "Statistikk", icon: BarChart3 },
    { name: "Talentbase", icon: Heart },
    { name: "Attester", icon: FileCheck2 },
    { name: "Fakturaer", icon: FileText },
    { name: "Bedriftsprofil", icon: Building2 },
  ];
  return (
    <div className="platform reference-look business-app">
      {menu && (
        <button
          className="biz-backdrop"
          aria-label="Lukk meny"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={"sidebar biz-sidebar " + (menu ? "is-open" : "")}>
        <button className="brand" onClick={() => navigate("Oversikt")}>
          <span className="brand-symbol">
            <BrandMark />
          </span>
          {BRAND_NAME}
        </button>
        <button
          className="biz-menu-close"
          aria-label="Lukk navigasjon"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="student-label">FOR BEDRIFTER</div>
        <div className="biz-company">
          <span className="biz-avatar company">G</span>
          <div>
            <strong>{company.name}</strong>
            <small>{company.industry}</small>
          </div>
        </div>
        <nav aria-label="Bedriftsnavigasjon">
          {nav.map((n) => (
            <button
              key={n.name}
              className={page === n.name ? "active" : ""}
              onClick={() => navigate(n.name)}
            >
              <n.icon size={18} />
              {n.name}
              {n.name === "Søknader" && newApplications.length > 0 && (
                <span className="nav-count">{newApplications.length}</span>
              )}
              {n.name === "Attester" && pendingAttests.length > 0 && (
                <span className="biz-nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <a className="biz-student-link" href="/">
            Se studentflaten <ArrowUpRight size={14} />
          </a>
          <button onClick={() => navigate("Bedriftsprofil")}>
            <span className="biz-avatar small">MH</span>
            <span>
              {company.contact}
              <small>{company.name}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar biz-topbar">
          <div>
            <button
              className="biz-menu-open"
              aria-label="Åpne navigasjon"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>Bedriftsportalen</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div>
            <span className="demo">Demo</span>
            <button
              className="biz-top-action"
              onClick={() => navigate("Søknader")}
              aria-label={"Se " + newApplications.length + " nye søkere"}
            >
              <Users size={17} />
              <span>{newApplications.length} nye søkere</span>
            </button>
            <span className="biz-avatar small">MH</span>
          </div>
        </header>
        <main className="biz-main">
          <div className="heading biz-heading">
            <div>
              <h1>
                {page === "Oversikt"
                  ? "Hei, GreenTech 👋"
                  : page === "Oppdrag"
                    ? "Oppdragene dine"
                    : page === "Søknader"
                      ? "Finn den rette studenten"
                      : page === "Statistikk"
                        ? "Innsikt i annonsene"
                        : page === "Talentbase"
                          ? "Din talentbase"
                          : page === "Attester"
                            ? "Gi erfaringen verdi"
                            : page === "Fakturaer"
                              ? "Fakturaer og abonnement"
                              : page === "Meldinger"
                                ? "Hold dialogen i gang"
                                : "Bedriftsprofilen din"}
              </h1>
              <p>
                {page === "Oversikt"
                  ? "Gode studenter. Konkrete oppgaver. Her har du oversikten."
                  : page === "Søknader"
                    ? "Flytt kandidatene etter hvor de er i søknadsprosessen. Dra kortet fra Søkt til Vurderes, videre til Tilbudt jobb og til slutt Fått jobben når kandidaten har takket ja."
                    : page === "Statistikk"
                      ? "Se hva som skaper interesse og gode søknader."
                      : page === "Talentbase"
                        ? "Lagre gode kandidater for et nytt samarbeid eller et tilbud om fast stilling."
                        : page === "Attester"
                          ? "En konkret attest hjelper studenten videre."
                          : page === "Fakturaer"
                            ? "Her ser du kun gebyrene fra " + BRAND_NAME + "."
                            : page === "Meldinger"
                              ? "Samle avklaringer og tilbakemeldinger på ett sted."
                              : page === "Bedriftsprofil"
                                ? "La studentene bli kjent med dere."
                                : "Pågående samarbeid og fullførte leveranser, samlet på ett sted."}
              </p>
            </div>
            {![
              "Bedriftsprofil",
              "Fakturaer",
              "Meldinger",
              "Talentbase",
              "Attester",
            ].includes(page) && (
              <Button
                className="primary-cta"
                onClick={() => {
                  setDraft(freshDraft());
                  setSheet("publish");
                }}
              >
                <Plus size={17} />
                Publiser oppdrag
              </Button>
            )}
          </div>
          {page === "Oversikt" && (
            <>
              <div className="biz-stats">
                <button onClick={() => navigate("Søknader")}>
                  <span className="biz-stat-icon">
                    <BriefcaseBusiness size={20} />
                  </span>
                  <span>
                    <strong>{openJobs.length}</strong>
                    <span>åpne oppdrag</span>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate("Søknader")}>
                  <span className="biz-stat-icon">
                    <Users size={20} />
                  </span>
                  <span>
                    <strong>{newApplications.length}</strong>
                    <span>nye søkere</span>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate("Attester")}>
                  <span className="biz-stat-icon">
                    <FileCheck2 size={20} />
                  </span>
                  <span>
                    <strong>{pendingAttests.length}</strong>
                    <span>
                      {pendingAttests.length === 1
                        ? "attest venter"
                        : "attester venter"}
                    </span>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <section className="biz-next">
                <div className="biz-next-copy">
                  <span className="biz-next-icon">
                    <ClipboardList size={23} />
                  </span>
                  <div>
                    <h2>
                      {newApplications.length
                        ? "Neste steg? Bli kjent med søkerne."
                        : "Du er oppdatert."}
                    </h2>
                    <p>
                      {newApplications.length
                        ? newApplications.length +
                          " studenter har søkt. Se studier, ferdigheter og tidligere attester."
                        : "Vi gir beskjed her når noe trenger oppfølging."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(newApplications.length ? "Søknader" : "Oppdrag")
                  }
                >
                  {newApplications.length ? "Se nye søkere" : "Se oppdrag"}
                  <ArrowRight size={16} />
                </Button>
              </section>
              {pipeline()}
              <div className="biz-bottom-grid">
                <section className="biz-followup">
                  <div className="biz-section-head">
                    <h2>Trenger oppfølging</h2>
                    <span>
                      {
                        jobs.filter(
                          (j) =>
                            j.stage === "Avtale" ||
                            (j.stage === "Pågår" && j.studentApproved) ||
                            (j.stage === "Fullført" && !j.attest),
                        ).length
                      }{" "}
                      oppgaver
                    </span>
                  </div>
                  {jobs
                    .filter(
                      (j) =>
                        j.stage === "Avtale" ||
                        (j.stage === "Pågår" && j.studentApproved) ||
                        (j.stage === "Fullført" && !j.attest),
                    )
                    .map((j) => (
                      <button key={j.id} onClick={() => openJob(j.id)}>
                        <span className="biz-follow-icon">
                          {j.stage === "Fullført" ? (
                            <FileCheck2 size={19} />
                          ) : j.stage === "Avtale" ? (
                            <FileText size={19} />
                          ) : (
                            <CheckCheck size={19} />
                          )}
                        </span>
                        <span>
                          <strong>
                            {j.stage === "Fullført"
                              ? "Skriv attest til " +
                                candidates.find((c) => c.id === j.selected)
                                  ?.name
                              : j.stage === "Avtale"
                                ? "Oppdragsavtalen gjenstår"
                                : "Se gjennom levert arbeid"}
                          </strong>
                          <small>{j.title}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                </section>
                <aside className="biz-good-to-know">
                  <FileCheck2 size={23} />
                  <h2>Trygghet starter med en tydelig avtale.</h2>
                  <p>
                    Avklar leveranse, frist og honorar med studenten før
                    oppdraget starter.
                  </p>
                  <button onClick={() => setSheet("how")}>
                    Slik fungerer det <ArrowUpRight size={16} />
                  </button>
                </aside>
              </div>
            </>
          )}
          {page === "Oppdrag" && workOverview()}
          {page === "Søknader" && pipeline()}
          {page === "Statistikk" && statistics()}
          {page === "Talentbase" && talentPool()}
          {page === "Attester" && (
            <section className="biz-page-panel">
              <div className="biz-section-head">
                <h2>Fullførte oppdrag</h2>
                <span>{pendingAttests.length} venter på attest</span>
              </div>
              {jobs
                .filter((j) => j.stage === "Fullført")
                .map((j) => (
                  <button
                    className="biz-applicant-row"
                    key={j.id}
                    onClick={() => {
                      setActiveJobId(j.id);
                      setAttest(j.attest || "");
                      setAttestSkills(j.attestSkills || []);
                      setNewSkill("");
                      setSheet("attest");
                    }}
                  >
                    <CandidatePhoto
                      candidate={candidates.find((c) => c.id === j.selected)}
                    />
                    <span className="biz-person">
                      <strong>
                        {candidates.find((c) => c.id === j.selected)?.name}
                      </strong>
                      <small>{j.title}</small>
                    </span>
                    <span
                      className={
                        "biz-badge " + (j.attest ? "selected" : "review")
                      }
                    >
                      {j.attest ? "Attest skrevet" : "Attest venter"}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
            </section>
          )}
          {page === "Fakturaer" && (
            <div className="biz-billing">
              <section className="biz-page-panel">
                <h2>Formidlingsgebyr</h2>
                <p>
                  Eksempelsats: 12,5 % per fullført oppdrag. Studentens honorar
                  betales direkte til studenten, utenfor {BRAND_NAME}.
                </p>
                <div className="biz-fee-list">
                  {jobs
                    .filter(
                      (j) =>
                        j.stage === "Fullført" &&
                        j.companyApproved &&
                        j.studentApproved,
                    )
                    .map((j) => (
                      <article key={j.id}>
                        <div>
                          <strong>{j.title}</strong>
                          <span>
                            Formidlingsgebyr ·{" "}
                            {j.payType === "Timepris"
                              ? "Beregnes av bekreftet samlet honorar"
                              : "12,5 % av " + money(j.amount)}
                          </span>
                          <small>
                            Eksempelgrunnlag · ingen faktura er sendt
                          </small>
                        </div>
                        <b>
                          {j.payType === "Timepris"
                            ? "Timetall må avklares"
                            : money(j.amount * feeRate)}
                        </b>
                        <button
                          aria-label={"Last ned gebyroversikt for " + j.title}
                          onClick={() => downloadFee(j)}
                        >
                          <Download size={19} />
                        </button>
                      </article>
                    ))}
                </div>
              </section>
              <aside className="biz-good-to-know">
                <FileText size={23} />
                <h2>Oppdrag etter behov</h2>
                <p>
                  Dere bruker i dette eksempelet gebyr per fullført oppdrag.
                </p>
                <p>
                  Faste bedriftskunder kan avtale abonnement. Ingen abonnement
                  aktiveres i demoen.
                </p>
                <button onClick={() => setSheet("how")}>
                  Se hvordan det fungerer <ArrowUpRight size={16} />
                </button>
              </aside>
            </div>
          )}
          {page === "Meldinger" && (
            <section className="biz-messages">
              <div className="biz-conversation">
                <CandidatePhoto candidate={conversationStudent} />
                <div>
                  <h2>{conversationStudent.name}</h2>
                  <p>{conversationJob.title}</p>
                </div>
                <button onClick={() => openJob(conversationId)}>
                  Se oppdrag <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="biz-chat">
                <small>I dag · eksempeldialog</small>
                <p>
                  {conversationJob.studentApproved
                    ? "Hei! Arbeidet er ferdig. Leveransen er klar for gjennomgang."
                    : "Hei! Takk for oppdraget. Skal vi avklare leveransen før vi starter?"}
                </p>
                <p className="biz-chat-own">
                  Takk, {conversationStudent.name.split(" ")[0]}! Vi følger opp
                  her.
                </p>
                {(messages[conversationId] || []).map((m, i) => (
                  <p className="biz-chat-own" key={i}>
                    {m}
                  </p>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!message.trim()) return;
                  setMessages((list) => ({
                    ...list,
                    [conversationId]: [
                      ...(list[conversationId] || []),
                      message.trim(),
                    ],
                  }));
                  setMessage("");
                  setToast("Eksempelmeldingen er lagt til lokalt");
                }}
              >
                <label className="sr-only" htmlFor="biz-message">
                  Skriv en melding
                </label>
                <input
                  id="biz-message"
                  placeholder="Skriv en melding …"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                />
                <Button
                  className="primary-cta"
                  type="submit"
                  disabled={!message.trim()}
                >
                  Legg til i demo <ArrowRight size={16} />
                </Button>
              </form>
              <small>Ingen meldinger sendes til studenten.</small>
            </section>
          )}
          {page === "Bedriftsprofil" && (
            <section className="biz-page-panel biz-profile">
              <span className="biz-avatar company">G</span>
              <h2>{company.name}</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setToast("Bedriftsprofilen er oppdatert i denne økten");
                }}
              >
                {(
                  [
                    { key: "name", label: "Bedriftsnavn" },
                    { key: "industry", label: "Bransje" },
                    { key: "contact", label: "Kontaktperson" },
                  ] as const
                ).map((f) => (
                  <label key={f.key}>
                    {f.label}
                    <input
                      required
                      value={company[f.key]}
                      onChange={(e) =>
                        setCompany({ ...company, [f.key]: e.target.value })
                      }
                      maxLength={100}
                    />
                  </label>
                ))}
                <label>
                  Om bedriften
                  <textarea
                    value={company.about}
                    onChange={(e) =>
                      setCompany({ ...company, about: e.target.value })
                    }
                    maxLength={500}
                  />
                </label>
                <Button className="primary-cta" type="submit">
                  Lagre profil <Check size={16} />
                </Button>
              </form>
            </section>
          )}
          <footer className="biz-demo-note">
            Designeksempel · Data lagres i denne nettleseren. Fiktive oppdrag og
            studenter. Ingen avtaler inngås, meldinger sendes eller fakturaer
            utstedes.
          </footer>
        </main>
      </div>
      <BottomSheet
        open={!!sheet}
        onOpenChange={(open) => {
          if (!open) setSheet("");
        }}
        title={
          sheet === "talent-request"
            ? talentKind === "Fast stilling"
              ? "Tilbud om fast stilling"
              : "Et nytt samarbeid"
            : sheet === "publish"
              ? "Hva trenger dere hjelp med?"
              : sheet === "candidate"
                ? "Bli kjent med studenten"
                : sheet === "attest"
                  ? "Skriv en attest"
                  : sheet === "how"
                    ? "Fra oppgave til erfaring"
                    : "Oppdraget ditt"
        }
        description={company.name + " · " + BRAND_NAME}
        closeLabel="Lukk"
        detents={[0.9, 0.97]}
        className="biz-sheet"
      >
        <div className="biz-sheet-content">
          {sheet === "talent-request" && (
            <form
              className="biz-publish"
              onSubmit={(e) => {
                e.preventDefault();
                if (!talentTitle.trim() || !talentMessage.trim()) return;
                setTalentDrafts((list) => {
                  const existing = list.find(
                    (d) =>
                      d.candidateId === talentCandidate &&
                      d.kind === talentKind &&
                      d.title === talentTitle.trim(),
                  );
                  return existing
                    ? list.map((d) =>
                        d.id === existing.id
                          ? { ...d, message: talentMessage.trim() }
                          : d,
                      )
                    : [
                        ...list,
                        {
                          id: Date.now(),
                          candidateId: talentCandidate,
                          kind: talentKind,
                          title: talentTitle.trim(),
                          message: talentMessage.trim(),
                        },
                      ];
                });
                setSheet("");
                setToast(
                  "Utkastet er lagret i talentbasen. Ingenting er sendt.",
                );
              }}
            >
              <div className="biz-talent-recipient">
                <CandidatePhoto
                  candidate={candidates.find((c) => c.id === talentCandidate)}
                />
                <div>
                  <h2>
                    {candidates.find((c) => c.id === talentCandidate)?.name}
                  </h2>
                  <p>
                    {candidates.find((c) => c.id === talentCandidate)?.study}
                  </p>
                </div>
              </div>
              <p>
                {talentKind === "Fast stilling"
                  ? "Beskriv stillingen og hvorfor dere ønsker kandidaten med på laget."
                  : "Fortell hva dere ønsker hjelp til, og hvorfor dere vil samarbeide igjen."}
              </p>
              <label>
                {talentKind === "Fast stilling"
                  ? "Stillingstittel"
                  : "Navn på samarbeidet"}
                <input
                  required
                  maxLength={100}
                  value={talentTitle}
                  onChange={(e) => setTalentTitle(e.target.value)}
                  placeholder={
                    talentKind === "Fast stilling"
                      ? "F.eks. markedskoordinator"
                      : "F.eks. innhold til høstkampanjen"
                  }
                />
              </label>
              <label>
                {talentKind === "Fast stilling"
                  ? "Om stillingen og neste steg"
                  : "Om samarbeidet og neste steg"}
                <textarea
                  required
                  maxLength={2000}
                  value={talentMessage}
                  onChange={(e) => setTalentMessage(e.target.value)}
                  placeholder="Beskriv oppgavene, rammene og hvordan dere ønsker å ta dialogen videre."
                />
              </label>
              <div className="biz-hint">
                Utkastet lagres bare i denne nettleseren. Kandidaten blir ikke
                kontaktet, og ingen avtale inngås.{" "}
                {talentKind === "Fast stilling"
                  ? "Bedriften følger opp ansettelsen direkte."
                  : ""}
              </div>
              <Button className="primary-cta" type="submit">
                Lagre{" "}
                {talentKind === "Fast stilling"
                  ? "tilbudsutkast"
                  : "forespørsel"}{" "}
                <Check size={16} />
              </Button>
            </form>
          )}
          {sheet === "publish" && (
            <form
              className="biz-publish"
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number(draft.amount),
                  newId = Date.now();
                if (
                  !draft.title.trim() ||
                  !draft.description.trim() ||
                  !Number.isFinite(amount) ||
                  amount < 1
                )
                  return;
                setJobs((list) => [
                  {
                    id: newId,
                    title: draft.title.trim(),
                    description: draft.description.trim(),
                    category: draft.category,
                    amount,
                    hours: draft.hours,
                    deadline: draft.deadline,
                    skills: draft.skills
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    tools: draft.tools
                      .filter((t) => t.name.trim())
                      .map((t) => ({ ...t, name: t.name.trim() })),
                    expectations: draft.expectations,
                    day: draft.day,
                    start: draft.start,
                    workplace: draft.workplace,
                    location: draft.location,
                    engagement: draft.engagement,
                    payType: draft.payType,
                    views: 0,
                    saves: 0,
                    stage: "Publisert",
                    studentApproved: false,
                    companyApproved: false,
                  },
                  ...list,
                ]);
                setSheet("");
                setPipelineJob(newId);
                navigate("Søknader");
                setFilter("Alle");
                setToast("Oppdraget er publisert i den lokale demoen");
              }}
            >
              <p>
                Beskriv en avgrenset oppgave. Gjør det lett å forstå hva som
                skal leveres.
              </p>
              <label>
                Oppdragstittel
                <input
                  required
                  maxLength={90}
                  placeholder="F.eks. lag seks innlegg til sosiale medier"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <label>
                Dette skal studenten levere
                <textarea
                  required
                  maxLength={1500}
                  placeholder="Beskriv oppgaven, leveransen og hva dere bidrar med."
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <div className="biz-form-grid">
                <label>
                  Fagområde
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  >
                    {[
                      "Markedsføring",
                      "Video",
                      "Design",
                      "Analyse",
                      "Tekst",
                      "Økonomi",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {draft.payType === "Timepris"
                    ? "Timepris (kr per time)"
                    : "Totalpris (kr)"}
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    required
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft({ ...draft, amount: e.target.value })
                    }
                  />
                </label>
                <label>
                  Forventet omfang
                  <input
                    required
                    value={draft.hours}
                    onChange={(e) =>
                      setDraft({ ...draft, hours: e.target.value })
                    }
                    maxLength={60}
                  />
                </label>
                <label>
                  Leveringsfrist
                  <input
                    required
                    type="date"
                    min="2026-10-11"
                    value={draft.deadline}
                    onChange={(e) =>
                      setDraft({ ...draft, deadline: e.target.value })
                    }
                  />
                </label>
              </div>
              <fieldset className="biz-form-section">
                <legend>Rammer for arbeidet</legend>
                <div className="biz-form-grid">
                  <label>
                    Tilknytningsform
                    <select
                      value={draft.engagement}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          engagement: e.target.value,
                          payType:
                            e.target.value === "Midlertidig ansettelse"
                              ? "Timepris"
                              : "Totalpris",
                        })
                      }
                    >
                      <option>Selvstendig oppdrag</option>
                      <option>Midlertidig ansettelse</option>
                    </select>
                  </label>
                  <label>
                    Prismodell
                    <select
                      value={draft.payType}
                      onChange={(e) =>
                        setDraft({ ...draft, payType: e.target.value })
                      }
                    >
                      <option>Totalpris</option>
                      <option>Timepris</option>
                    </select>
                  </label>
                  <label>
                    Oppstart
                    <input
                      required
                      type="date"
                      max={draft.deadline}
                      value={draft.start}
                      onChange={(e) =>
                        setDraft({ ...draft, start: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Arbeidssted
                    <select
                      value={draft.workplace}
                      onChange={(e) =>
                        setDraft({ ...draft, workplace: e.target.value })
                      }
                    >
                      <option>Eksternt</option>
                      <option>På stedet</option>
                      <option>Hybrid</option>
                    </select>
                  </label>
                </div>
                {draft.workplace !== "Eksternt" && (
                  <label>
                    Adresse eller sted
                    <input
                      required
                      value={draft.location}
                      onChange={(e) =>
                        setDraft({ ...draft, location: e.target.value })
                      }
                      placeholder="F.eks. Trondheim, Solsiden"
                    />
                  </label>
                )}
                <label>
                  Slik blir arbeidshverdagen
                  <textarea
                    value={draft.day}
                    onChange={(e) =>
                      setDraft({ ...draft, day: e.target.value })
                    }
                    placeholder="Samarbeid, oppfølging, arbeidstid og fleksibilitet."
                    maxLength={1000}
                  />
                </label>
                <p className="biz-hint">
                  Valget beskriver rammene. Bedriften må avklare riktig
                  tilknytningsform og eventuelt arbeidsgiveransvar.
                </p>
              </fieldset>
              <fieldset className="biz-form-section">
                <legend>Kompetanse og verktøy</legend>
                <label>
                  Dette forventer vi at du kan
                  <textarea
                    value={draft.expectations}
                    onChange={(e) =>
                      setDraft({ ...draft, expectations: e.target.value })
                    }
                    maxLength={1000}
                    placeholder="Beskriv hva studenten bør kunne, og hva dere gir opplæring i."
                  />
                </label>
                {draft.tools.map((tool, i) => (
                  <div className="biz-tool-row" key={i}>
                    <label>
                      Verktøy {i + 1}
                      <input
                        aria-label={"Verktøy " + (i + 1)}
                        value={tool.name}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            tools: draft.tools.map((t, n) =>
                              n === i ? { ...t, name: e.target.value } : t,
                            ),
                          })
                        }
                        placeholder="F.eks. Figma"
                        maxLength={60}
                      />
                    </label>
                    <label>
                      Ønsket kjennskap: <b>{tool.level}/5</b>
                      <input
                        aria-label={"Kjennskap til verktøy " + (i + 1)}
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={tool.level}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            tools: draft.tools.map((t, n) =>
                              n === i
                                ? { ...t, level: Number(e.target.value) }
                                : t,
                            ),
                          })
                        }
                      />
                      <small>1: Nybegynner · 5: Svært erfaren</small>
                    </label>
                    <button
                      type="button"
                      aria-label={"Fjern verktøy " + (i + 1)}
                      disabled={draft.tools.length === 1}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          tools: draft.tools.filter((_, n) => n !== i),
                        })
                      }
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      tools: [...draft.tools, { name: "", level: 3 }],
                    })
                  }
                >
                  <Plus size={15} />
                  Legg til verktøy
                </Button>
              </fieldset>
              <label>
                Ferdigheter
                <input
                  placeholder="F.eks. Excel, analyse, presentasjon"
                  value={draft.skills}
                  onChange={(e) =>
                    setDraft({ ...draft, skills: e.target.value })
                  }
                  maxLength={200}
                />
              </label>
              {/fast stilling|ansett|arbeidstid|hver uke|fast vakt/i.test(
                draft.description + " " + draft.title,
              ) && (
                <p className="biz-hint">
                  Beskrivelsen kan ligne en løpende stilling. Gjør oppgaven og
                  leveransen tydelig avgrenset før publisering.
                </p>
              )}
              <div className="biz-agreement-info">
                <FileText size={19} />
                <p>
                  Dere avtaler og betaler honoraret direkte med studenten.{" "}
                  {BRAND_NAME} fakturerer bare formidlingsgebyret.{" "}
                  {draft.payType === "Timepris"
                    ? "Gebyret beregnes av samlet honorar når timene er bekreftet."
                    : "Eksempel: " +
                      money((Number(draft.amount) || 0) * feeRate) +
                      " ved fullføring."}
                </p>
              </div>
              <Button type="submit" className="primary-cta">
                Publiser i demo <ArrowUpRight size={16} />
              </Button>
            </form>
          )}
          {sheet === "job" && selectedJob && (
            <>
              <div className="biz-detail-heading">
                <span className="biz-badge">{selectedJob.stage}</span>
                <h2>{selectedJob.title}</h2>
                <p>{selectedJob.description}</p>
                <div className="biz-detail-meta">
                  <span>
                    <Clock size={16} />
                    {selectedJob.hours}
                  </span>
                  <span>
                    <CalendarDays size={16} />
                    Frist {date(selectedJob.deadline)}
                  </span>
                  <span>
                    {selectedJob.payType === "Timepris"
                      ? "Timepris"
                      : "Avtalt honorar"}{" "}
                    <b>
                      {money(selectedJob.amount)}
                      {selectedJob.payType === "Timepris" ? " / time" : ""}
                    </b>
                  </span>
                </div>
                <div className="biz-skills">
                  {selectedJob.skills.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="biz-description-grid">
                <section>
                  <h3>Kompetanse</h3>
                  <p>
                    {selectedJob.expectations ||
                      "Du bør kunne jobbe selvstendig med en tydelig brief og formidle resultatene på en enkel måte."}
                  </p>
                  <h3>Verktøy og ønsket kjennskap</h3>
                  <small>1: Nybegynner · 5: Svært erfaren</small>
                  {(selectedJob.tools?.length
                    ? selectedJob.tools
                    : selectedJob.skills.map((name) => ({ name, level: 3 }))
                  ).map((t) => (
                    <div className="biz-tool-level" key={t.name}>
                      <span>{t.name}</span>
                      <span aria-label={t.level + " av 5"}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <i key={n} className={n <= t.level ? "filled" : ""} />
                        ))}
                        <b>{t.level}/5</b>
                      </span>
                    </div>
                  ))}
                </section>
                <section>
                  <h3>Arbeidshverdagen</h3>
                  <p>
                    {selectedJob.day ||
                      "Fleksibel gjennomføring med en kort avklaring ved oppstart og tilbakemelding fra kontaktpersonen underveis."}
                  </p>
                  <dl className="biz-job-facts">
                    <div>
                      <dt>Oppstart</dt>
                      <dd>
                        {date(
                          selectedJob.start ||
                            (selectedJob.id === 5
                              ? "2026-10-01"
                              : "2026-10-19"),
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Arbeidssted</dt>
                      <dd>
                        {selectedJob.workplace || "Eksternt"}
                        {selectedJob.location
                          ? " · " + selectedJob.location
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Tilknytningsform</dt>
                      <dd>{selectedJob.engagement || "Selvstendig oppdrag"}</dd>
                    </div>
                  </dl>
                </section>
              </div>
              <ol className="biz-steps">
                {stages.map((s, i) => (
                  <li
                    key={s}
                    className={
                      stages.indexOf(selectedJob.stage) >= i ? "reached" : ""
                    }
                  >
                    <span>
                      {stages.indexOf(selectedJob.stage) > i ? (
                        <Check size={14} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              {selectedJob.stage === "Publisert" ? (
                <>
                  <h3>Søkere til oppdraget</h3>
                  {applicantList(selectedJob.id)}
                </>
              ) : (
                <div className="biz-chosen">
                  <CandidatePhoto
                    candidate={candidates.find(
                      (c) => c.id === selectedJob.selected,
                    )}
                  />
                  <div>
                    <strong>
                      {
                        candidates.find((c) => c.id === selectedJob.selected)
                          ?.name
                      }
                    </strong>
                    <span>Valgt student</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setConversationId(selectedJob.id);
                      setSheet("");
                      navigate("Meldinger");
                    }}
                  >
                    Åpne meldinger <MessageCircle size={16} />
                  </Button>
                </div>
              )}
              {selectedJob.stage === "Avtale" && (
                <div className="biz-action-panel">
                  <h3>Avklar avtalen før dere starter</h3>
                  <p>
                    Partene må inngå oppdragsavtale og avtale leveranse, frist
                    og honorar. Bedriften har ansvar for sin rolle og eventuelt
                    arbeidsgiveransvar. {BRAND_NAME} er formidler.
                  </p>
                  <Button
                    className="primary-cta"
                    onClick={() => {
                      updateJob(selectedJob.id, { stage: "Pågår" });
                      setToast("Avtalen er markert som inngått i demoen");
                    }}
                  >
                    Marker avtale inngått <Check size={16} />
                  </Button>
                  <small>
                    Dette registrerer bare et steg i demoen. Ingen avtale
                    signeres her.
                  </small>
                </div>
              )}
              {selectedJob.stage === "Pågår" && (
                <div className="biz-action-panel">
                  <h3>
                    {selectedJob.studentApproved
                      ? "Studenten har bekreftet fullføring"
                      : "Oppdraget er i gang"}
                  </h3>
                  <p>
                    {selectedJob.studentApproved
                      ? "Se gjennom arbeidet. Begge parter må bekrefte at oppdraget er fullført."
                      : "Vent på studentens bekreftelse før dere godkjenner fullføringen."}
                  </p>
                  <span className="biz-check-line">
                    <CheckCheck size={18} />
                    {selectedJob.studentApproved
                      ? "Studentens bekreftelse er registrert i eksempeldataene."
                      : "Studentens bekreftelse gjenstår."}
                  </span>
                  <Button
                    className="primary-cta"
                    disabled={!selectedJob.studentApproved}
                    onClick={complete}
                  >
                    Godkjenn fullført arbeid <Check size={16} />
                  </Button>
                </div>
              )}
              {selectedJob.stage === "Fullført" && (
                <div className="biz-action-panel">
                  <h3>Godt levert. Nå teller erfaringen.</h3>
                  <p>
                    Begge parter har bekreftet fullføring. Studentens honorar
                    betales direkte, utenfor plattformen.
                  </p>
                  <Button
                    className="primary-cta"
                    onClick={() => {
                      setAttest(selectedJob.attest || "");
                      setAttestSkills(selectedJob.attestSkills || []);
                      setNewSkill("");
                      setSheet("attest");
                    }}
                  >
                    {selectedJob.attest ? "Se attesten" : "Skriv attest"}
                    <FileCheck2 size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      selectedJob.selected && toggleTalent(selectedJob.selected)
                    }
                  >
                    <Heart size={16} />
                    {talent.includes(selectedJob.selected!)
                      ? "Lagret i talentbase"
                      : "Lagre studenten i talentbase"}
                  </Button>
                  <button
                    className="biz-inline-link"
                    onClick={() => {
                      setSheet("");
                      navigate("Fakturaer");
                    }}
                  >
                    Se formidlingsgebyret <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
          {sheet === "candidate" && student && activeApplication && (
            <>
              <div className="biz-student-profile">
                <Avatar src={student.photo} name={student.name} size="lg" />
                <div>
                  <h2>{student.name}</h2>
                </div>
                <span className="biz-badge">
                  {matchFor(activeApplication)} % samsvar
                </span>
              </div>
              <SchoolIdentity
                school={student.school}
                study={student.study}
                semester={student.semester}
              />
              <VerifiedSkills jobs={jobs} candidateId={student.id} />
              <div className="biz-skills">
                {student.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <p className="biz-student-bio">{student.bio}</p>
              <div className="biz-testimonial">
                <span>
                  <FileCheck2 size={18} />
                  {student.attests} attester fra tidligere oppdrag
                </span>
                <blockquote>«{student.quote}»</blockquote>
                <small>Utdrag fra en fiktiv attest · eksempeldata</small>
              </div>
              <div className="biz-action-panel">
                <p>Søkt på</p>
                <h3>{selectedJob.title}</h3>
                <div className="biz-candidate-stage">
                  <span className="biz-badge">{activeApplication.stage}</span>
                  <span>Søkt → Vurderes → Tilbudt jobb → Fått jobben</span>
                </div>
                {selectedJob.stage === "Publisert" ? (
                  <div className="biz-candidate-actions">
                    <Button
                      variant="secondary"
                      onClick={review}
                      disabled={activeApplication.stage !== "Søkt"}
                    >
                      Vurder søker <Users size={16} />
                    </Button>
                    <Button
                      className="primary-cta"
                      disabled={
                        !["Vurderes", "Tilbudt jobb"].includes(
                          activeApplication.stage,
                        )
                      }
                      onClick={() =>
                        activeApplication.stage === "Tilbudt jobb"
                          ? moveApplication(activeApplication.id, "Fått jobben")
                          : choose()
                      }
                    >
                      {activeApplication.stage === "Tilbudt jobb"
                        ? "Registrer aksept i demo"
                        : "Registrer tilbud i demo"}{" "}
                      <Check size={16} />
                    </Button>
                  </div>
                ) : (
                  <p>
                    {selectedJob.selected === student.id
                      ? "Denne studenten er valgt. Se oppdraget for neste steg."
                      : "Oppdraget har allerede en valgt student."}
                  </p>
                )}
                <Button
                  variant="secondary"
                  onClick={() => toggleTalent(student.id)}
                >
                  <Heart size={16} />
                  {talent.includes(student.id)
                    ? "Fjern fra talentbase"
                    : "Lagre i talentbase"}
                </Button>
                <small>Tilbud og aksept registreres kun i demoen.</small>
              </div>
            </>
          )}
          {sheet === "attest" && selectedJob && (
            <form
              className="biz-publish"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  attest.trim().length < 20 ||
                  !selectedJob.studentApproved ||
                  !selectedJob.companyApproved
                )
                  return;
                updateJob(selectedJob.id, {
                  attest: attest.trim(),
                  attestSkills,
                  attestCompany: company.name,
                });
                setSheet("");
                setToast(
                  "Attesten og ferdighetene er lagt til på studentprofilen i demoen",
                );
              }}
            >
              <div className="biz-attest-student">
                <CandidatePhoto
                  candidate={candidates.find(
                    (c) => c.id === selectedJob.selected,
                  )}
                />
                <div>
                  <h2>
                    {
                      candidates.find((c) => c.id === selectedJob.selected)
                        ?.name
                    }
                  </h2>
                  <span>Attest for {selectedJob.title}</span>
                </div>
              </div>
              <SchoolIdentity
                school={
                  candidates.find((c) => c.id === selectedJob.selected)
                    ?.school || ""
                }
                study={
                  candidates.find((c) => c.id === selectedJob.selected)?.study
                }
                semester={
                  candidates.find((c) => c.id === selectedJob.selected)
                    ?.semester
                }
              />
              <label>
                Hva gjorde studenten bra?
                <textarea
                  required
                  minLength={20}
                  maxLength={1500}
                  value={attest}
                  onChange={(e) => setAttest(e.target.value)}
                  placeholder="Beskriv oppgaven, hva studenten leverte og hvordan samarbeidet fungerte."
                />
              </label>
              <fieldset className="biz-attest-skills">
                <legend>Hvilke ferdigheter brukte studenten?</legend>
                <p>
                  Velg ferdighetene dere så i arbeidet. De legges til på
                  studentprofilen med denne attesten som dokumentasjon.
                </p>
                <div className="biz-skill-picker">
                  {Array.from(
                    new Set([
                      ...selectedJob.skills,
                      ...(candidates.find((c) => c.id === selectedJob.selected)
                        ?.skills || []),
                      ...attestSkills,
                    ]),
                  ).map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      aria-pressed={attestSkills.includes(skill)}
                      onClick={() =>
                        setAttestSkills((current) =>
                          current.includes(skill)
                            ? current.filter((s) => s !== skill)
                            : [...current, skill],
                        )
                      }
                    >
                      {attestSkills.includes(skill) ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="biz-new-skill">
                  <label>
                    Legg til en annen ferdighet
                    <input
                      value={newSkill}
                      maxLength={40}
                      placeholder="F.eks. produkttekster"
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newSkill.trim()) {
                            setAttestSkills((current) =>
                              current.some(
                                (s) =>
                                  s.toLowerCase() ===
                                  newSkill.trim().toLowerCase(),
                              )
                                ? current
                                : [...current, newSkill.trim()],
                            );
                            setNewSkill("");
                          }
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label="Legg til ferdighet"
                    disabled={!newSkill.trim()}
                    onClick={() => {
                      setAttestSkills((current) =>
                        current.some(
                          (s) =>
                            s.toLowerCase() === newSkill.trim().toLowerCase(),
                        )
                          ? current
                          : [...current, newSkill.trim()],
                      );
                      setNewSkill("");
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <small>
                  {attestSkills.length} valgt · Bekreftes av {company.name}
                </small>
              </fieldset>
              <p>
                Studenten bestemmer selv om attesten skal vises i porteføljen
                sin.
              </p>
              <Button className="primary-cta" type="submit">
                Lagre attest i demo <Check size={16} />
              </Button>
            </form>
          )}
          {sheet === "how" && (
            <div className="biz-how">
              {[
                [
                  "Publiser en konkret oppgave",
                  "Beskriv leveransen, omfanget, fristen og honoraret.",
                ],
                [
                  "Velg en student",
                  "Se studier, ferdigheter og tidligere attester. Inngå oppdragsavtale direkte med studenten.",
                ],
                [
                  "Samarbeid og fullfør",
                  "Bruk meldinger underveis. Begge parter bekrefter fullført oppdrag.",
                ],
                [
                  "Gi attest og motta gebyrfaktura",
                  "Studenten får dokumentert erfaring. Bedriften faktureres kun formidlingsgebyret fra " +
                    BRAND_NAME +
                    ".",
                ],
              ].map(([title, body], i) => (
                <article key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
              <p className="biz-hint">
                {BRAND_NAME} er en formidlingsplattform, ikke arbeidsgiver,
                bemanningsbyrå eller betalingsløsning. Honorar betales direkte
                mellom partene.
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
