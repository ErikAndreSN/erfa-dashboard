import React, { useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GraduationCap,
  Hand,
} from "lucide-react";
import { SchoolLogo } from "./VerifiedSkills";
import "./candidate-explorer.css";

export type CourseStatus = "Fullført" | "Pågår" | "Kommer";
export type Course = {
  name: string;
  term: string;
  status: CourseStatus;
  tags: string[];
  about?: string;
};
export type ExperienceKind =
  | "Deltid"
  | "Heltid"
  | "Sommerjobb"
  | "Frilans"
  | "Verneplikt"
  | "Frivillig"
  | "Verv";
export type Experience = {
  role: string;
  place: string;
  kind: ExperienceKind;
  start: string;
  end?: string;
  location?: string;
  text: string;
};
export type Project = {
  title: string;
  context: string;
  text: string;
  tags: string[];
  link?: string;
};
export type CandidateProfile = {
  degree?: string;
  about?: string;
  courses?: Course[];
  experience?: Experience[];
  projects?: Project[];
  cvUrl?: string;
};
export type ExplorerCandidate = {
  name: string;
  initials: string;
  photo: string;
  study: string;
  school: string;
  semester: string;
  skills: string[];
  bio: string;
  attests: number;
  quote: string;
  profile?: CandidateProfile;
};
type Topic = "person" | "school" | "cv";

const statusClass: Record<CourseStatus, string> = {
  Fullført: "is-done",
  Pågår: "is-now",
  Kommer: "is-next",
};
const statusOrder: Record<CourseStatus, number> = {
  Pågår: 0,
  Fullført: 1,
  Kommer: 2,
};
const termKey = (term: string) => {
  const [season, year] = term.split(" ");
  return Number(year) * 2 + (season === "Høst" ? 1 : 0);
};
const months = [
  "jan.",
  "feb.",
  "mars",
  "apr.",
  "mai",
  "juni",
  "juli",
  "aug.",
  "sep.",
  "okt.",
  "nov.",
  "des.",
];
const monthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return months[month - 1] + " " + year;
};
// Varighet regnes som på LinkedIn: begge månedene teller med.
const duration = (start: string, end?: string) => {
  const now = new Date(),
    [sy, sm] = start.split("-").map(Number),
    [ey, em] = end
      ? end.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1],
    total = (ey - sy) * 12 + (em - sm) + 1,
    years = Math.floor(total / 12),
    rest = total % 12;
  return [years && years + " år", rest && rest + " mnd"]
    .filter(Boolean)
    .join(" ");
};
const monogram = (place: string) =>
  place
    .split(/[\s,]+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
const count = (n: number, one: string, many: string) =>
  n + " " + (n === 1 ? one : many);

// Tre bobler som lar bedriften bli kjent med en søker, én side av gangen.
export function CandidateExplorer({
  candidate,
  jobTitle,
  requirements,
  match,
  verified,
  children,
}: {
  candidate: ExplorerCandidate;
  jobTitle: string;
  requirements: string[];
  match: number;
  verified?: ReactNode;
  children?: ReactNode;
}) {
  const [topic, setTopic] = useState<Topic>("school"),
    [coursesOpen, setCoursesOpen] = useState(false),
    [photoFailed, setPhotoFailed] = useState(false),
    tabs = useRef<Record<Topic, HTMLButtonElement | null>>({
      person: null,
      school: null,
      cv: null,
    }),
    id = useId();
  const profile = candidate.profile || {},
    first = candidate.name.split(" ")[0],
    terms = requirements.map((r) => r.toLowerCase()),
    hits = (tags: string[]) =>
      tags.filter((t) => terms.includes(t.toLowerCase())),
    courses = [...(profile.courses || [])].sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        termKey(b.term) - termKey(a.term),
    ),
    relevant = courses.filter((c) => hits(c.tags).length),
    highlight =
      relevant.find((c) => c.status === "Pågår") || relevant[0] || courses[0],
    experience = [...(profile.experience || [])].sort((a, b) =>
      b.start.localeCompare(a.start),
    ),
    projects = profile.projects || [],
    about = (profile.about || candidate.bio).split("\n\n");
  const volunteer = experience.filter((e) => e.kind === "Frivillig").length,
    service = experience.filter((e) => e.kind === "Verneplikt").length,
    jobs = experience.length - volunteer - service,
    summary = [
      jobs && count(jobs, "jobb", "jobber"),
      service && "verneplikt",
      volunteer && count(volunteer, "frivillig verv", "frivillige verv"),
    ]
      .filter(Boolean)
      .join(" · ");
  const topics: {
    key: Topic;
    label: string;
    teaser: string;
    Icon: typeof Hand;
  }[] = [
    {
      key: "person",
      label: "Personen bak søknaden",
      teaser: "Med egne ord",
      Icon: Hand,
    },
    {
      key: "school",
      label: "Utdanning og emner",
      teaser: relevant.length
        ? relevant.length +
          (relevant.length === 1 ? " emne treffer" : " emner treffer")
        : candidate.semester,
      Icon: GraduationCap,
    },
    {
      key: "cv",
      label: "CV og portefølje",
      teaser:
        experience.length || projects.length
          ? [
              experience.length &&
                count(experience.length, "erfaring", "erfaringer"),
              projects.length &&
                count(projects.length, "prosjekt", "prosjekter"),
            ]
              .filter(Boolean)
              .join(" · ")
          : candidate.attests
            ? candidate.attests + " attester"
            : "Erfaring",
      Icon: FileText,
    },
  ];
  const move = (step: number) => {
    const i = topics.findIndex((t) => t.key === topic),
      next = topics[(i + step + topics.length) % topics.length].key;
    setTopic(next);
    tabs.current[next]?.focus();
  };
  const statusText = (c: Course) =>
    c.status === "Pågår"
      ? "Pågår nå"
      : c.status === "Kommer"
        ? "Kommer"
        : "Fullført";

  return (
    <div className="cx">
      <header className="cx-head">
        <span>Kandidat til</span>
        <strong>{jobTitle}</strong>
      </header>
      <div className="cx-grid">
        <section className="cx-stage">
          <span className="cx-match">{match} % samsvar med oppdraget</span>
          <span className="cx-portrait">
            {candidate.photo && !photoFailed ? (
              <img
                src={candidate.photo}
                alt={`Profilbilde av ${candidate.name}`}
                draggable={false}
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span aria-hidden="true">{candidate.initials}</span>
            )}
          </span>
          <h2>{candidate.name}</h2>
          <p>
            {candidate.study} · {candidate.semester}
          </p>
          <div
            className="cx-bubbles"
            role="tablist"
            aria-label={"Bli kjent med " + first}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(1);
              if (e.key === "ArrowLeft") move(-1);
            }}
          >
            {topics.map(({ key, label, teaser, Icon }) => (
              <button
                key={key}
                ref={(node) => {
                  tabs.current[key] = node;
                }}
                type="button"
                role="tab"
                id={id + key + "-tab"}
                aria-selected={topic === key}
                aria-controls={id + "panel"}
                tabIndex={topic === key ? 0 : -1}
                className={
                  "cx-bubble is-" + key + (topic === key ? " is-active" : "")
                }
                onClick={() => setTopic(key)}
              >
                <span className="cx-bubble-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <strong>{label}</strong>
                <small>{teaser}</small>
              </button>
            ))}
          </div>
          <p className="cx-hint">Trykk på en boble for å se mer.</p>
        </section>
        <section
          className="cx-panel"
          role="tabpanel"
          id={id + "panel"}
          aria-labelledby={id + topic + "-tab"}
          key={topic}
        >
          {topic === "person" && (
            <>
              <p className="cx-kicker">Personen bak søknaden</p>
              <h3>Hvem er {first}?</h3>
              <p className="cx-lead">
                Et kort utkast {first} har skrevet om seg selv.
              </p>
              <div className="cx-about">
                {about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <span className="cx-sign">
                  <span className="cx-sign-mark" aria-hidden="true">
                    {candidate.initials}
                  </span>
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.study} · {candidate.school}
                    </small>
                  </span>
                </span>
              </div>
              {profile.about && (
                <small className="cx-disclaimer">
                  Eksempeltekst skrevet for demoen.
                </small>
              )}
            </>
          )}
          {topic === "school" && (
            <>
              <p className="cx-kicker">Faglig grunnlag</p>
              <h3>Utdanning og emner</h3>
              <p className="cx-lead">
                Hva {first} studerer, emnene så langt og hva {first} er
                sterkest på.
              </p>
              <div className="cx-school">
                <div>
                  {profile.degree && <small>{profile.degree}</small>}
                  <strong>{candidate.study}</strong>
                  <span>
                    {candidate.school} · {candidate.semester}
                  </span>
                </div>
                <SchoolLogo school={candidate.school} />
              </div>
              {highlight ? (
                <section
                  className="cx-section"
                  id={id + "courses"}
                  aria-label="Emner"
                >
                  {coursesOpen ? (
                    <>
                      <div className="cx-stack-head">
                        <span>
                          {count(courses.length, "emne", "emner")}
                          {relevant.length > 0 &&
                            " · " + relevant.length + " treffer oppdraget"}
                        </span>
                        <button
                          type="button"
                          className="cx-stack-toggle"
                          aria-expanded="true"
                          aria-controls={id + "courses"}
                          onClick={() => setCoursesOpen(false)}
                        >
                          Vis mindre <ChevronUp size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <ol className="cx-notes">
                        {courses.map((c, i) => (
                          <li
                            key={c.name}
                            className={"cx-note " + statusClass[c.status]}
                            style={{ "--i": i } as React.CSSProperties}
                          >
                            <span className="cx-note-icon" aria-hidden="true">
                              {c.status === "Fullført" ? (
                                <Check size={15} strokeWidth={2.5} />
                              ) : c.status === "Pågår" ? (
                                <BookOpen size={15} />
                              ) : (
                                <Clock size={15} />
                              )}
                            </span>
                            <span className="cx-note-body">
                              <span className="cx-note-meta">
                                <span>{statusText(c)}</span>
                                <time>{c.term}</time>
                              </span>
                              <strong>{c.name}</strong>
                              {c.about && (
                                <span className="cx-note-text">{c.about}</span>
                              )}
                              {hits(c.tags).length > 0 && (
                                <span className="cx-covers">
                                  <Check size={12} aria-hidden="true" />
                                  Treffer oppdraget: {hits(c.tags).join(", ")}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <>
                      <div
                        className="cx-stack"
                        onClick={() => setCoursesOpen(true)}
                      >
                        <div className="cx-note is-front">
                          <span className="cx-note-icon" aria-hidden="true">
                            <BookOpen size={15} />
                          </span>
                          <span className="cx-note-body">
                            <span className="cx-note-meta">
                              <span>Emner i bachelorgraden</span>
                              <time>{count(courses.length, "emne", "emner")}</time>
                            </span>
                            <strong>{highlight.name}</strong>
                            <span className="cx-note-text">
                              {statusText(highlight)} · {highlight.term}
                              {hits(highlight.tags).length > 0 &&
                                " · treffer oppdraget"}
                            </span>
                          </span>
                        </div>
                        {courses.length > 1 && (
                          <span className="cx-stack-layer is-1" />
                        )}
                        {courses.length > 2 && (
                          <span className="cx-stack-layer is-2" />
                        )}
                      </div>
                      {courses.length > 1 && (
                        <button
                          type="button"
                          className="cx-stack-toggle is-more"
                          aria-expanded="false"
                          aria-controls={id + "courses"}
                          onClick={() => setCoursesOpen(true)}
                        >
                          Vis alle {courses.length} emner
                          <ChevronDown size={15} aria-hidden="true" />
                        </button>
                      )}
                    </>
                  )}
                </section>
              ) : (
                <p className="cx-empty">{first} har ikke lagt inn emner ennå.</p>
              )}
              <section className="cx-section">
                <h4>Sterkeste ferdigheter</h4>
                <p className="cx-sub">Rangert av {first}, sterkest først.</p>
                <ol className="cx-skills">
                  {candidate.skills.map((s, i) => (
                    <li key={s}>
                      <span className="cx-rank">{i + 1}</span>
                      <strong>{s}</strong>
                      {terms.includes(s.toLowerCase()) && (
                        <em>
                          <Check size={12} aria-hidden="true" />
                          Etterspurt i oppdraget
                        </em>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
          {topic === "cv" && (
            <>
              <p className="cx-kicker">Erfaring</p>
              <h3>CV og portefølje</h3>
              <p className="cx-lead">
                Hva {first} har jobbet med, og prosjekter {first} vil vise
                frem.
              </p>
              {experience.length > 0 && (
                <section className="cx-section">
                  <div className="cx-section-head">
                    <h4>Erfaring</h4>
                    <span>{summary}</span>
                  </div>
                  <ol className="cx-exp">
                    {experience.map((e) => (
                      <li
                        key={e.role + e.place}
                        className={
                          "cx-exp-item" +
                          (e.kind === "Frivillig" ? " is-volunteer" : "")
                        }
                      >
                        <span className="cx-exp-logo" aria-hidden="true">
                          {monogram(e.place)}
                        </span>
                        <div>
                          <strong>{e.role}</strong>
                          <span className="cx-exp-place">
                            {e.place} ·{" "}
                            <span className="cx-kind">{e.kind}</span>
                          </span>
                          <span className="cx-exp-time">
                            {monthLabel(e.start)} –{" "}
                            {e.end ? monthLabel(e.end) : "nå"} ·{" "}
                            {duration(e.start, e.end)}
                          </span>
                          {e.location && (
                            <span className="cx-exp-time">{e.location}</span>
                          )}
                          <p>{e.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {projects.length > 0 && (
                <section className="cx-section">
                  <div className="cx-section-head">
                    <h4>Prosjekter</h4>
                    <span>Delt av {first} som tillegg til søknaden</span>
                  </div>
                  <div className="cx-projects">
                    {projects.map((p) => (
                      <article key={p.title}>
                        <small>{p.context}</small>
                        <strong>{p.title}</strong>
                        <p>{p.text}</p>
                        <div className="cx-chips">
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className={
                                "cx-chip" + (hits([t]).length ? " is-hit" : "")
                              }
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noreferrer">
                            Se prosjektet{" "}
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {verified}
              {candidate.attests > 0 && (
                <blockquote className="cx-quote">
                  «{candidate.quote}»
                  <small>
                    Fra en av {candidate.attests} attester · eksempeldata
                  </small>
                </blockquote>
              )}
              {profile.cvUrl && (
                <a
                  className="cx-file"
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={18} aria-hidden="true" />
                  <span>
                    <strong>Hele CV-en som PDF</strong>
                    <small>Lastet opp av {first}</small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              )}
              {!experience.length && !projects.length && !candidate.attests && (
                <p className="cx-empty">
                  {first} har ikke lagt inn erfaring eller prosjekter ennå.
                </p>
              )}
            </>
          )}
        </section>
      </div>
      {children && <div className="cx-actions">{children}</div>}
    </div>
  );
}
