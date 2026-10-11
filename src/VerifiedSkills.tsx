import React, { useEffect, useState } from "react";
import { Check, GraduationCap } from "lucide-react";
import "./verified-skills.css";

export const BUSINESS_STORE = "erfa-business-demo-v1";
export type SkillAttest = {
  id: number;
  selected?: number;
  title: string;
  attest?: string;
  attestSkills?: string[];
  attestCompany?: string;
};

export function SchoolLogo({ school }: { school: string }) {
  const name = school.toLowerCase();
  const src = name.includes("kristiania")
    ? "/logos/kristiania.webp"
    : name.includes("ntnu")
      ? "/logos/ntnu.svg"
      : name === "bi" || name.includes("handelshøyskolen bi")
        ? "/logos/bi.png"
        : undefined;
  return src ? (
    <img
      className={"school-logo" + (name === "bi" ? " square" : "")}
      src={src}
      alt={`${school} logo`}
    />
  ) : (
    <GraduationCap size={18} aria-hidden="true" />
  );
}

export function SchoolIdentity({
  school,
  study,
  semester,
}: {
  school: string;
  study?: string;
  semester?: string;
}) {
  const number = Number.parseInt(semester || "");
  return (
    <div className="school-identity">
      <SchoolLogo school={school} />
      <div>
        <span>Fra {school}</span>
        {study && <strong>{study}</strong>}
        {semester && (
          <small>
            {Number.isFinite(number)
              ? `${Math.ceil(number / 2)}. studieår · `
              : ""}
            {semester}
          </small>
        )}
      </div>
    </div>
  );
}

export function VerifiedSkills({
  jobs,
  candidateId,
}: {
  jobs: SkillAttest[];
  candidateId: number;
}) {
  const attests = jobs.filter(
    (j) => j.selected === candidateId && j.attest && j.attestSkills?.length,
  );
  if (!attests.length) return null;
  return (
    <section
      className="verified-skills"
      aria-label="Ferdigheter bekreftet av bedrift"
    >
      <h3>Ferdigheter brukt i oppdrag</h3>
      {attests.map((j) => (
        <article key={j.id}>
          <div className="verified-skill-tags">
            {j.attestSkills!.map((s) => (
              <span key={s}>
                <Check size={13} aria-hidden="true" />
                {s}
              </span>
            ))}
          </div>
          <p>Bekreftet av {j.attestCompany || "GreenTech AS"}</p>
          <small>{j.title}</small>
          <details>
            <summary>Les attesten</summary>
            <blockquote>{j.attest}</blockquote>
          </details>
        </article>
      ))}
    </section>
  );
}

export function useDemoAttests(disabled = false): SkillAttest[] {
  const read = (): SkillAttest[] => {
    if (disabled) return [];
    try {
      return (
        JSON.parse(localStorage.getItem(BUSINESS_STORE) || "{}").jobs || []
      );
    } catch {
      return [];
    }
  };
  const [jobs, setJobs] = useState(read);
  useEffect(() => {
    const sync = () => setJobs(read());
    window.addEventListener("storage", sync);
    window.addEventListener("erfa-attests-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("erfa-attests-updated", sync);
    };
  }, [disabled]);
  return jobs;
}
