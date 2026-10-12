import React, { useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  FileText,
  GraduationCap,
  Hand,
} from "lucide-react";
import { SchoolLogo } from "./VerifiedSkills";
import "./candidate-explorer.css";

export type CourseStatus = "Fullført" | "Pågår" | "Kommer";
export type CandidateProfile = {
  degree?: string;
  courses?: {
    name: string;
    term: string;
    status: CourseStatus;
    tags: string[];
    about?: string;
  }[];
  projects?: { title: string; context: string; text: string; tags: string[] }[];
  jobs?: { role: string; place: string; period: string; text: string }[];
  cvUrl?: string;
  person?: {
    pitch?: string;
    intro: string;
    week?: { when: string; what: string }[];
    workStyle?: string[];
    interests?: string[];
    fact?: string;
  };
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
    hits = (tags: string[]) => tags.filter((t) => terms.includes(t.toLowerCase())),
    courses = profile.courses || [],
    relevant = courses.filter((c) => hits(c.tags).length),
    projects = profile.projects || [],
    jobs = profile.jobs || [],
    person = profile.person;
  const topics: {
    key: Topic;
    label: string;
    teaser: string;
    Icon: typeof Hand;
  }[] = [
    {
      key: "person",
      label: "Personen bak søknaden",
      teaser: person ? "Hverdag og interesser" : "Kort om " + first,
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
        jobs.length || projects.length
          ? [
              jobs.length && jobs.length + " jobber",
              projects.length && projects.length + " prosjekter",
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
  const groups: [string, CourseStatus][] = [
    ["Fullført", "Fullført"],
    ["Pågår nå", "Pågår"],
    ["Kommer", "Kommer"],
  ];

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
        <div className="cx-side">
          <section
            className="cx-panel"
            role="tabpanel"
            id={id + "panel"}
            aria-labelledby={id + topic + "-tab"}
            key={topic}
          >
            {topic === "school" && (
              <>
                <p className="cx-kicker">Faglig grunnlag</p>
                <h3>Utdanning og emner</h3>
                <p className="cx-lead">
                  Se hva {first} lærer, og hvordan det treffer oppdraget.
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
                {relevant.length > 0 && (
                  <section className="cx-section">
                    <h4>Treffer oppdraget</h4>
                    <ul className="cx-hits">
                      {relevant.map((c) => (
                        <li key={c.name}>
                          <div>
                            <strong>{c.name}</strong>
                            <span className={"cx-status " + statusClass[c.status]}>
                              {c.status === "Pågår" ? "Pågår nå" : c.status} ·{" "}
                              {c.term}
                            </span>
                          </div>
                          {c.about && <p>{c.about}</p>}
                          <span className="cx-covers">
                            <Check size={13} aria-hidden="true" />
                            {hits(c.tags).join(", ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {courses.length > 0 ? (
                  <section className="cx-section">
                    <h4>Alle emner</h4>
                    {groups.map(([label, status]) => {
                      const list = courses.filter((c) => c.status === status);
                      return (
                        list.length > 0 && (
                          <div className="cx-course-group" key={status}>
                            <span>
                              {label} · {list.length}
                            </span>
                            <div className="cx-chips">
                              {list.map((c) => (
                                <span
                                  key={c.name}
                                  className={"cx-chip " + statusClass[c.status]}
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })}
                  </section>
                ) : (
                  <p className="cx-empty">
                    {first} har ikke lagt inn emner ennå.
                  </p>
                )}
                <section className="cx-section">
                  <h4>Ferdigheter</h4>
                  <div className="cx-chips">
                    {candidate.skills.map((s) => (
                      <span
                        key={s}
                        className={
                          "cx-chip" +
                          (terms.includes(s.toLowerCase()) ? " is-hit" : "")
                        }
                      >
                        {terms.includes(s.toLowerCase()) && (
                          <Check size={12} aria-hidden="true" />
                        )}
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            )}
            {topic === "cv" && (
              <>
                <p className="cx-kicker">Erfaring</p>
                <h3>CV og portefølje</h3>
                <p className="cx-lead">
                  Prosjekter og jobber {first} har gjort, og hva tidligere
                  oppdragsgivere sier.
                </p>
                {projects.length > 0 && (
                  <section className="cx-section">
                    <h4>Utvalgte prosjekter</h4>
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
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {jobs.length > 0 && (
                  <section className="cx-section">
                    <h4>Tidligere jobber</h4>
                    <ol className="cx-timeline">
                      {jobs.map((j) => (
                        <li key={j.role + j.place}>
                          <strong>{j.role}</strong>
                          <span>
                            {j.place} · {j.period}
                          </span>
                          <p>{j.text}</p>
                        </li>
                      ))}
                    </ol>
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
                {!projects.length && !jobs.length && !candidate.attests && (
                  <p className="cx-empty">
                    {first} har ikke lagt inn CV eller prosjekter ennå.
                  </p>
                )}
              </>
            )}
            {topic === "person" && (
              <>
                <p className="cx-kicker">Personen bak søknaden</p>
                <h3>Hvem er {first}?</h3>
                <p className="cx-lead">
                  Med {first} sine egne ord: hverdagen, arbeidsmåten og det
                  utenfor studiene.
                </p>
                {person?.pitch && (
                  <blockquote className="cx-pitch">
                    <span>Hvorfor jeg søker</span>«{person.pitch}»
                  </blockquote>
                )}
                <p className="cx-intro">{person?.intro || candidate.bio}</p>
                {person?.week && (
                  <section className="cx-section">
                    <h4>En vanlig uke</h4>
                    <dl className="cx-week">
                      {person.week.map((w) => (
                        <div key={w.when}>
                          <dt>{w.when}</dt>
                          <dd>{w.what}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
                {person?.workStyle && (
                  <section className="cx-section">
                    <h4>Slik jobber jeg</h4>
                    <ul className="cx-list">
                      {person.workStyle.map((w) => (
                        <li key={w}>
                          <Check size={14} aria-hidden="true" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {person?.interests && (
                  <section className="cx-section">
                    <h4>Utenfor studiene</h4>
                    <div className="cx-chips">
                      {person.interests.map((i) => (
                        <span key={i} className="cx-chip">
                          {i}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {person?.fact && (
                  <p className="cx-fact">
                    <strong>Noe du kanskje ikke vet</strong>
                    {person.fact}
                  </p>
                )}
                {person && (
                  <small className="cx-note">
                    Eksempeltekst skrevet for demoen.
                  </small>
                )}
              </>
            )}
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
