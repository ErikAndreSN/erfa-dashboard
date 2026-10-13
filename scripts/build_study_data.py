"""Bygger skole- og studiedata for registreringen fra DBH (HK-dir).

Kilde: DBH-API, åpne data under Norsk lisens for offentlige data (NLOD).
  211 Institusjon · 662 Campus-steder · 347 Studieprogram · 208 Emner

Kjør fra repoets rot (tar et par minutter første gang, emnetabellen er ~700 MB):
    python3 scripts/build_study_data.py

Lager:
    public/data/studier.json      – skoler, institutter/fakulteter og studieprogram (brukes av appen)
    public/data/emner/<skole>.json – alle aktive fag på skolen, til søk etter valgfag (lastes ved behov)
    .cache/dbh/emner.json         – fagnavn per program (brukes av scripts/enrich_skills.mjs)

Ferdigheter per fag (feltet "s") som scripts/enrich_skills.mjs har laget, beholdes når filene bygges på nytt.
"""

import csv
import json
import sys
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "dbh"
OUT = ROOT / "public" / "data" / "studier.json"
BULK = "https://dbh.hkdir.no/api/Tabeller/bulk-csv?rptNr={}"

# Gradsnivåer som passer for studenter på Erfa (ikke videreutdanning, enkeltkurs eller doktorgrad).
LEVELS = {
    "B3": "Bachelor",
    "B4": "Bachelor",
    "M2": "Master",
    "M5": "Master",
    "MX": "Master",
    "AR": "Årsstudium",
    "PR": "Profesjonsstudium",
    "HK": "Høyskolekandidat",
    "YU": "Yrkesutdanning",
}

csv.field_size_limit(sys.maxsize)


def table(number):
    """Laster ned en hel DBH-tabell som CSV (én gang) og returnerer stien."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"t{number}.csv"
    if not path.exists():
        print(f"Henter tabell {number} fra DBH …", flush=True)
        urllib.request.urlretrieve(BULK.format(number), path)
    return path


def rows(number):
    with open(table(number), encoding="utf-8", newline="") as f:
        yield from csv.DictReader(f)


def tidy(text):
    return " ".join((text or "").split())


def main():
    periods = {(r["Årstall"], r["Semester"]) for r in rows(347)}
    latest = max(periods)
    recent = sorted(periods)[-4:]  # de fire siste semestrene, for fagene
    print("Nyeste periode:", latest)

    # Studieprogram: ett per skole + navn + nivå.
    programmes, by_code = {}, {}
    for r in rows(347):
        level = r["Nivåkode"].strip()
        if (r["Årstall"], r["Semester"]) != latest or level not in LEVELS or r["Videreutd."] != "0":
            continue
        inst, name = r["Institusjonskode"].strip(), tidy(r["Studieprogramnavn"])
        if not name:
            continue
        key = (inst, name.lower(), LEVELS[level])
        p = programmes.setdefault(
            key,
            {
                "id": f"{inst}-{r['Studieprogramkode'].strip()}",
                "inst": inst,
                "dept": tidy(r["Avdelingsnavn"]),
                "name": name,
                "level": LEVELS[level],
                "credits": int(float(r["Studiepoeng"] or 0)),
                "online": False,
                "codes": set(),
            },
        )
        p["codes"].add(r["Studieprogramkode"].strip())
        p["online"] = p["online"] or "nett" in r["Organisering"].lower()
        by_code[(inst, r["Studieprogramkode"].strip())] = p
    print("Studieprogram:", len(programmes))

    # Fag per program, og hele fagkatalogen per skole (til valgfag), fra de siste semestrene.
    used_insts = {p["inst"] for p in programmes.values()}
    courses = defaultdict(list)
    catalog = defaultdict(dict)
    for r in rows(208):
        if (r["Årstall"], r["Semester"]) not in recent:
            continue
        inst, name = r["Institusjonskode"].strip(), tidy(r["Emnenavn"])
        p = by_code.get((inst, r["Studieprogramkode"].strip()))
        if p and name and name not in courses[p["id"]] and len(courses[p["id"]]) < 40:
            courses[p["id"]].append(name)
        code = r["Emnekode"].strip()
        if inst in used_insts and code and name and r["Status"] in ("1", "2", "4"):
            catalog[inst][code] = {"c": code, "n": name, "sp": float(r["Studiepoeng"] or 0)}
    print("Program med fag:", len(courses), "· fag i katalogene:", sum(len(c) for c in catalog.values()))

    # Skoler med minst ett program, med campus og institutter/fakulteter.
    used = {p["inst"] for p in programmes.values()}
    campus_period = max((r["Årstall"], r["Semester"]) for r in rows(662))
    campuses = defaultdict(set)
    for r in rows(662):
        if (r["Årstall"], r["Semester"]) == campus_period and r["Institusjonskode"].strip() in used:
            campuses[r["Institusjonskode"].strip()].add(tidy(r["Stednavn campus"]))
    institutions = {}
    for r in rows(211):
        code = r["Institusjonskode"].strip()
        if code in used and r["Gyldig til"].strip() in ("", "99999"):  # 99999 = fortsatt gyldig
            institutions[code] = {
                "id": code,
                "name": tidy(r["Institusjonsnavn"]),
                "short": tidy(r["Kortnavn"]),
                "campuses": sorted(campuses[code]),
            }
    for code in used - institutions.keys():  # skoler som mangler i 211, bruk navnet fra programtabellen
        institutions[code] = {"id": code, "name": code, "short": "", "campuses": sorted(campuses[code])}
    depts = defaultdict(set)
    for p in programmes.values():
        if p["dept"]:
            depts[p["inst"]].add(p["dept"])
    for code, inst in institutions.items():
        inst["departments"] = sorted(depts[code])

    data = {
        "updated": date.today().isoformat(),
        "period": f"{latest[0]}-{'vår' if latest[1] == '1' else 'høst'}",
        "source": "DBH, Direktoratet for høyere utdanning og kompetanse (NLOD)",
        "institutions": sorted(institutions.values(), key=lambda i: i["name"]),
        "programmes": sorted(
            ({k: v for k, v in p.items() if k != "codes"} for p in programmes.values()),
            key=lambda p: (p["inst"], p["name"]),
        ),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (CACHE / "emner.json").write_text(json.dumps(courses, ensure_ascii=False), encoding="utf-8")
    course_dir = OUT.parent / "emner"
    course_dir.mkdir(exist_ok=True)
    for inst, items in catalog.items():
        path = course_dir / f"{inst}.json"
        old = {c["c"]: c["s"] for c in json.loads(path.read_text(encoding="utf-8")) if "s" in c} if path.exists() else {}
        out = []
        for c in sorted(items.values(), key=lambda c: c["n"]):
            if c["sp"] == int(c["sp"]):
                c["sp"] = int(c["sp"])
            if c["c"] in old:  # også tomme lister, så de ikke sendes til Claude på nytt
                c["s"] = old[c["c"]]
            out.append(c)
        path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Skrev {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} kB):",
          len(data["institutions"]), "skoler,", len(data["programmes"]), "program")


if __name__ == "__main__":
    main()
