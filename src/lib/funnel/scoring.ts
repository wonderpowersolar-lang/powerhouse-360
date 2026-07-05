/**
 * Powerhouse 360 — zentrale Scoring- und Empfehlungslogik beider Funnels.
 *
 * ALLE Einschätzungen sind bewusst qualitativ und indikativ formuliert —
 * keine Garantien, keine harten Wirtschaftlichkeitsversprechen. Die
 * Annahmen liegen gesammelt in SCORING_ASSUMPTIONS, damit sie an einer
 * Stelle gepflegt (und juristisch geprüft) werden können.
 */

import type {
  DemoFunnelState,
  ProjectFunnelState,
  Insights,
  InsightBlock,
  InsightChip,
  UnitsBand,
} from "./types";

export const DISCLAIMER =
  "Grobe Ersteinschätzung auf Basis deiner Angaben. Keine verbindliche Wirtschaftlichkeits- oder Rechtsberatung.";

/** Zentrale Annahmen der Einschätzungslogik. */
export const SCORING_ASSUMPTIONS = {
  /** WE-Band → Komplexitätsstufe (0..3); Portfolio überschreibt auf 4. */
  unitsComplexity: {
    "1-10": 0,
    "11-30": 1,
    "31-70": 2,
    "71-150": 3,
    "150+": 3,
  } as Record<UnitsBand, number>,
  /** Ab dieser Gebäudezahl steigt die Komplexität um eine Stufe. */
  multiBuildingThreshold: 2,
  /** Ab dieser Objektzahl gilt ein Vorhaben als Portfolio. */
  portfolioThreshold: 2,
  /** Demo-Dauer: Orientierung 20 min, 1–2 Module 30 min, mehr 45 min. */
  demoDurations: { orientation: 20, focused: 30, extended: 45 },
};

const COMPLEXITY_LABELS = [
  "Basis",
  "Mittel",
  "Erweitert",
  "Komplex",
  "Portfolio",
] as const;

export type ComplexityLevel = (typeof COMPLEXITY_LABELS)[number];

export const MODULE_LABEL: Record<string, string> = {
  powermieter: "Powermieter",
  heatmieter: "Heatmieter",
  chargemieter: "Chargemieter",
  smokemieter: "Smokemieter",
};

const MODULE_ORDER = [
  "powermieter",
  "heatmieter",
  "chargemieter",
  "smokemieter",
];

const MODULE_TONE: Record<string, InsightChip["tone"]> = {
  powermieter: "power",
  heatmieter: "heat",
  chargemieter: "charge",
  smokemieter: "smoke",
};

const MODULE_SHORT: Record<string, string> = {
  powermieter: "Mieterstrom, Energieflüsse und Stromabrechnung",
  heatmieter: "Wärme, Heizkosten und Verbrauchstransparenz",
  chargemieter: "Wallboxen, Lastmanagement und Ladeabrechnung",
  smokemieter: "Rauchwarnmelder, Ferninspektion und Ereignisse",
};

function parseCount(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export { parseCount };

/** Komplexität aus WE-Band, Gebäudezahl und Portfolio-Angabe. */
export function complexityLevel(
  unitsBand: UnitsBand | null,
  buildingsRaw: string,
  portfolioRaw: string
): ComplexityLevel | null {
  if (!unitsBand) return null;
  const a = SCORING_ASSUMPTIONS;
  const portfolio = parseCount(portfolioRaw);
  if (portfolio && portfolio >= a.portfolioThreshold) return "Portfolio";
  let idx = a.unitsComplexity[unitsBand];
  const buildings = parseCount(buildingsRaw);
  if (buildings && buildings >= a.multiBuildingThreshold)
    idx = Math.min(3, idx + 1);
  return COMPLEXITY_LABELS[idx];
}

/** Indikative Verwaltungsentlastung — bewusst qualitativ. */
export function reliefPotential(
  situation: string | null,
  unitsBand: UnitsBand | null
): "niedrig" | "mittel" | "hoch" | null {
  if (!situation && !unitsBand) return null;
  let score = 0;
  if (situation === "excel" || situation === "analog") score += 2;
  if (situation === "insel" || situation === "messdienst") score += 1;
  if (unitsBand === "31-70") score += 1;
  if (unitsBand === "71-150" || unitsBand === "150+") score += 2;
  return score >= 3 ? "hoch" : score >= 1 ? "mittel" : "niedrig";
}

/** Erkannte Prozessthemen je Ausgangslage. */
export function painPoint(situation: string | null): string | null {
  switch (situation) {
    case "excel":
      return "Hoher manueller Aufwand erkannt — klare Onboarding- und Abrechnungsstrecken bringen hier meist den größten Hebel.";
    case "insel":
      return "Insellösungs-Risiko erkannt — mehrere Einzeltools sprechen für eine zentrale Plattformlogik.";
    case "messdienst":
      return "Schnittstellen- und Transparenzthema möglich — Datenflüsse vom Dienstleister sollten geprüft werden.";
    case "analog":
      return "Guter Zeitpunkt für eine strukturierte digitale Einführung.";
    case "hv-software":
      return "Bestehende Verwaltungssoftware kann als führendes System bleiben — Powerhouse 360 ergänzt die Gebäude- und Energieprozesse.";
    default:
      return null;
  }
}

/** Rollen-Fokus für das Live-Panel (Demo, Schritt 1). */
export function roleFocus(role: string | null): string | null {
  switch (role) {
    case "hausverwaltung":
      return "Fokus: weniger Verwaltungsaufwand, klare Prozesse, zentrale Übersicht.";
    case "weg":
      return "Fokus: Transparenz, Beschlussfähigkeit, verständliche Modul-Einführung.";
    case "bestandshalter":
      return "Fokus: Skalierbarkeit, Portfolio-Überblick, digitale Betriebsdaten.";
    case "wohnungsunternehmen":
      return "Fokus: standardisierte Prozesse und berichtsfähige Daten über viele Einheiten.";
    case "stadtwerk":
      return "Fokus: Betreiberfähigkeit, Energieprozesse, modulare Erweiterung.";
    case "eigentuemer":
      return "Fokus: klarer Objektstatus und planbare Betriebskosten ohne Insellösungen.";
    default:
      return null;
  }
}

/** Zeitrahmen-Hinweis (Demo, Schritt 6). */
export function timeframeHint(timeframe: string | null): string | null {
  switch (timeframe) {
    case "sofort":
      return "Demo mit Projektfokus empfohlen — konkrete nächste Schritte direkt mitplanen.";
    case "1-3":
      return "Guter Zeitpunkt: Demo plus Objektprüfung passen in deinen Zeitrahmen.";
    case "3-6":
      return "Empfehlung: Demo jetzt, Modulpriorisierung danach in Ruhe.";
    case "spaeter":
      return "Strategische Plattform-Demo empfohlen — Überblick statt Detailtiefe.";
    case "unverbindlich":
      return "Eine kurze 20-Minuten-Übersicht reicht wahrscheinlich aus.";
    default:
      return null;
  }
}

/** Normalisierte Modul-Auswahl (Demo): löst "plattform"/"unsicher" auf. */
export function effectiveModules(selection: string[]): string[] {
  if (selection.includes("plattform"))
    return [...MODULE_ORDER];
  return MODULE_ORDER.filter((m) => selection.includes(m));
}

/** Empfohlene Demo-Dauer in Minuten. */
export function demoDuration(state: DemoFunnelState): number {
  const d = SCORING_ASSUMPTIONS.demoDurations;
  const mods = effectiveModules(state.modules);
  const portfolio = parseCount(state.portfolioObjects);
  if (state.timeframe === "unverbindlich" && mods.length <= 1)
    return d.orientation;
  if (
    mods.length >= 3 ||
    (portfolio ?? 0) >= SCORING_ASSUMPTIONS.portfolioThreshold ||
    state.unitsBand === "150+"
  )
    return d.extended;
  if (mods.length >= 1) return d.focused;
  return d.orientation;
}

/** Personalisierte Demo-Agenda. */
export function demoAgenda(state: DemoFunnelState): string[] {
  const agenda: string[] = ["Überblick über das digitale Gebäude"];
  const mods = effectiveModules(state.modules);
  for (const m of mods)
    agenda.push(`${MODULE_LABEL[m]} — ${MODULE_SHORT[m]}`);
  if (mods.length === 0)
    agenda.push("Die vier Module im Schnellüberblick");

  const f = state.focus;
  if (f.includes("onboarding")) agenda.push("Bewohner- und Nutzer-Onboarding");
  if (f.includes("abrechnung")) agenda.push("Abrechnungsvorbereitung");
  if (f.includes("monitoring")) agenda.push("Betriebsstatus und Monitoring");
  if (f.includes("prozesse")) agenda.push("Vertrags- und Prozessstrecken");
  if (f.includes("api")) agenda.push("API- und CRM-Anbindung");
  agenda.push("Nächste Schritte für dein Objekt");
  return agenda;
}

/* ───────────────────────── Projekt-spezifische Logik ───────────────────── */

/** Projektart-Einordnung (Projekt, Schritt 1). */
export function projectTypeFocus(t: string | null): string | null {
  switch (t) {
    case "bestand":
      return "Fokus: nachrüstbare Module und schrittweise Einführung.";
    case "neubau":
      return "Fokus: Powerhouse 360 direkt als digitale Betriebsebene mitdenken.";
    case "weg":
      return "Fokus: verständliche Entscheidungsgrundlage und modulare Umsetzung.";
    case "mietshaus":
      return "Fokus: saubere Mieter-Einbindung und klare Abrechnungswege.";
    case "portfolio":
      return "Fokus: skalierbare Standardisierung über mehrere Objekte.";
    case "sanierung":
      return "Fokus: Module entlang der Modernisierung sinnvoll mitplanen.";
    default:
      return null;
  }
}

/** Themen → Module (Projekt, Schritt 2). */
export function mapThemesToModules(themes: string[]): string[] {
  const set = new Set<string>();
  if (themes.includes("energie")) set.add("powermieter");
  if (themes.includes("waerme")) set.add("heatmieter");
  if (themes.includes("lade")) set.add("chargemieter");
  if (themes.includes("rwm")) set.add("smokemieter");
  if (themes.includes("gesamt")) MODULE_ORDER.forEach((m) => set.add(m));
  return MODULE_ORDER.filter((m) => set.has(m));
}

/** Nächster Schritt je Projektstand (Projekt, Schritt 5). */
export function nextStepForStage(stage: string | null): string {
  switch (stage) {
    case "idee":
      return "Orientierungsgespräch und Modulprüfung";
    case "pruefung":
      return "Entscheidungsvorlage und klare Projektstruktur";
    case "beschluss":
      return "Beschlussreife Modul- und Kostenübersicht vorbereiten";
    case "planung":
      return "Technische Schnittstellen und Datenmodell prüfen";
    case "umsetzung":
      return "Onboarding- und Abrechnungsstrecken parallel zur Umsetzung aufsetzen";
    case "betrieb":
      return "Betriebsprozesse und Abrechnung digitalisieren";
    case "problem":
      return "Schnelle Bestandsaufnahme des Objekts";
    default:
      return "Objektprüfung und Modulpriorisierung";
  }
}

/** Projekt-Reifegrad aus Stand, Größe, Infrastruktur und Modulen. */
export function projectReadiness(state: ProjectFunnelState): string {
  switch (state.stage) {
    case "betrieb":
    case "problem":
      return "Betrieb optimieren";
    case "umsetzung":
      return "Umsetzungsnah";
    case "planung":
      return "Planung";
    case "beschluss":
      return "Planung";
    case "pruefung":
      return "Prüfung";
    case "idee":
      return "Orientierung";
  }
  // Ohne Angabe zum Stand: aus Kontext ableiten.
  const infra = state.infrastructure.filter((i) => i !== "unklar");
  if (infra.length >= 3 && mapThemesToModules(state.themes).length >= 2)
    return "Prüfung";
  return "Orientierung";
}

/** Quick Wins aus Infrastruktur + Themen (Projekt). */
export function quickWins(state: ProjectFunnelState): string[] {
  const wins: string[] = [];
  const mods = mapThemesToModules(state.themes);
  const infra = state.infrastructure;
  const parking = parseCount(state.parkingSpaces);

  if (infra.includes("pv") && mods.includes("powermieter"))
    wins.push("PV vorhanden: Mieterstrom- und Energieprozess sollte geprüft werden.");
  if (infra.includes("pv-geplant") && mods.includes("powermieter"))
    wins.push("PV geplant: Powermieter früh mitdenken, bevor Zähler- und Vertragsstruktur festgelegt wird.");
  if (
    (infra.includes("wallbox") || infra.includes("wallbox-geplant")) &&
    mods.includes("chargemieter")
  )
    wins.push("Ladeinfrastruktur: Lastmanagement und Nutzerabrechnung früh einplanen.");
  if ((parking ?? 0) > 0 && mods.includes("chargemieter"))
    wins.push("Stellplätze vorhanden: Ladeinfrastruktur-Potenzial erkannt.");
  if (infra.includes("rwm-digital") && mods.includes("smokemieter"))
    wins.push("Digitale Rauchwarnmelder vorhanden: Ferninspektion und Status-Übersicht schnell aktivierbar.");
  if (infra.includes("zaehler"))
    wins.push("Digitale Zähler vorhanden: gute Datenbasis für Verbrauchstransparenz.");
  return wins;
}

/** Offene Prüfpunkte (Projekt). */
export function openChecks(state: ProjectFunnelState): string[] {
  const checks: string[] = [];
  const mods = mapThemesToModules(state.themes);
  const infra = state.infrastructure;

  if (infra.includes("unklar") || infra.length === 0)
    checks.push("Bestandsaufnahme der vorhandenen Technik (Zähler, Anlagen, Geräte).");
  if (mods.includes("powermieter") && !infra.includes("pv") && !infra.includes("pv-geplant"))
    checks.push("Energiequelle klären: Ist PV vorhanden, geplant oder Netzstrom-Basis?");
  if (mods.includes("heatmieter") && !infra.includes("wp"))
    checks.push("Wärmeerzeuger und Messstruktur für Heizkosten erfassen.");
  if (mods.includes("chargemieter") && !infra.includes("wallbox") && !infra.includes("wallbox-geplant"))
    checks.push("Netzanschluss- und Stellplatzsituation für Ladeinfrastruktur prüfen.");
  if (mods.includes("smokemieter") && !infra.includes("rwm-digital"))
    checks.push("Rauchwarnmelder-Bestand: analog, digital oder gemischt?");
  if (state.projectType === "weg")
    checks.push("Beschlusslage und Zuständigkeiten in der WEG klären.");
  return checks;
}

/* ─────────────────────────── Insight-Komposition ───────────────────────── */

function moduleChips(mods: string[]): InsightChip[] {
  return mods.map((m) => ({ label: MODULE_LABEL[m], tone: MODULE_TONE[m] }));
}

/** Live-Insights für den Demo-Funnel. */
export function demoInsights(state: DemoFunnelState): Insights {
  const chips: InsightChip[] = [];
  const blocks: InsightBlock[] = [];

  const mods = effectiveModules(state.modules);
  chips.push(...moduleChips(mods));

  const complexity = complexityLevel(
    state.unitsBand,
    state.buildings,
    state.portfolioObjects
  );
  if (complexity) chips.push({ label: `Komplexität: ${complexity}`, tone: "gold" });

  const duration = demoDuration(state);
  chips.push({ label: `Empfohlene Demo: ${duration} Min.`, tone: "gold" });

  const focus = roleFocus(state.role);
  if (focus) blocks.push({ title: "Erste Einschätzung", lines: [focus] });

  if (state.modules.includes("unsicher") && mods.length === 0)
    blocks.push({
      title: "Passende Module",
      lines: [
        "Noch unsicher? In der Demo starten wir mit der Gebäudeübersicht und leiten die passenden Module aus deinem Objekt ab.",
      ],
    });
  if (mods.length >= 2)
    blocks.push({
      title: "Plattform-Ansatz",
      lines: [
        "Du prüfst bereits einen Plattform-Ansatz statt einer Einzellösung — genau dafür ist Powerhouse 360 gebaut.",
      ],
    });
  else if (mods.length === 1)
    blocks.push({
      title: "Passendes Modul",
      lines: [`${MODULE_LABEL[mods[0]]}: ${MODULE_SHORT[mods[0]]}.`],
    });

  if (complexity)
    blocks.push({
      title: "Komplexitätsklasse",
      lines: [
        "Je mehr Wohneinheiten, Module und Beteiligte zusammenkommen, desto wichtiger wird eine zentrale Betriebslogik.",
      ],
    });

  const relief = reliefPotential(state.situation, state.unitsBand);
  if (relief)
    blocks.push({
      title: "Indikatives Potenzial",
      lines: [`Mögliche Verwaltungsentlastung: ${relief}.`],
    });

  const pain = painPoint(state.situation);
  if (pain) blocks.push({ title: "Aufwandstreiber erkannt", lines: [pain] });

  if (state.modules.length > 0 || state.focus.length > 0)
    blocks.push({
      title: "Empfohlene Demo-Agenda",
      lines: demoAgenda(state),
      ordered: true,
    });

  const tf = timeframeHint(state.timeframe);
  if (tf) blocks.push({ title: "Möglicher nächster Schritt", lines: [tf] });

  if (blocks.length === 0)
    blocks.push({
      title: "Deine Einschätzung entsteht hier",
      lines: [
        "Mit jeder Angabe wird diese Einschätzung konkreter: passende Module, Demo-Agenda und sinnvoller nächster Schritt.",
      ],
    });

  return { chips, blocks, disclaimer: DISCLAIMER };
}

/** Live-Insights für den Projekt-Funnel. */
export function projectInsights(state: ProjectFunnelState): Insights {
  const chips: InsightChip[] = [];
  const blocks: InsightBlock[] = [];

  const mods = mapThemesToModules(state.themes);
  chips.push(...moduleChips(mods));

  const complexity = complexityLevel(state.unitsBand, state.buildings, "");
  const isPortfolio = state.projectType === "portfolio";
  const level: ComplexityLevel | null = isPortfolio
    ? "Portfolio"
    : complexity;
  if (level) chips.push({ label: `Komplexität: ${level}`, tone: "gold" });

  if (state.stage || state.themes.length > 0)
    chips.push({ label: `Reifegrad: ${projectReadiness(state)}`, tone: "gold" });

  const typeFocus = projectTypeFocus(state.projectType);
  if (typeFocus) blocks.push({ title: "Erste Einschätzung", lines: [typeFocus] });

  if (mods.length > 0)
    blocks.push({
      title: "Passende Module",
      lines: mods.map((m) => `${MODULE_LABEL[m]} — ${MODULE_SHORT[m]}`),
    });
  if (state.themes.includes("gesamt"))
    blocks.push({
      title: "Empfohlene Projektlogik",
      lines: [
        "Zuerst Basisdaten und Infrastruktur prüfen, dann Module priorisieren.",
      ],
    });

  if (level && state.unitsBand) {
    const buildings = parseCount(state.buildings);
    blocks.push({
      title: "Projekt-Komplexität",
      lines: [
        buildings && buildings > 1
          ? `Bei ${state.unitsBand} WE über ${buildings} Gebäude ist eine strukturierte Modul- und Onboardingplanung sinnvoll.`
          : `Bei ${state.unitsBand} WE ist eine strukturierte Modul- und Onboardingplanung sinnvoll.`,
      ],
    });
  }

  const wins = quickWins(state);
  if (wins.length > 0)
    blocks.push({ title: "Mögliche Quick Wins", lines: wins });

  const checks = openChecks(state);
  if (checks.length > 0)
    blocks.push({ title: "Offene Prüfpunkte", lines: checks });

  if (state.priorities.length > 0) {
    const labels = state.priorities
      .slice(0, 3)
      .map((p) => PRIORITY_LABEL[p] ?? p);
    const fit =
      mods.length > 0
        ? `Dazu passen besonders: ${mods
            .map((m) => MODULE_LABEL[m])
            .join(", ")} und ein strukturiertes Onboarding.`
        : "Dazu passt eine Gesamtprüfung der Module mit strukturiertem Onboarding.";
    blocks.push({
      title: "Deine wichtigsten Projektziele",
      lines: [...labels, fit],
      ordered: true,
    });
  }

  if (state.stage)
    blocks.push({
      title: "Möglicher nächster Schritt",
      lines: [nextStepForStage(state.stage)],
    });

  if (blocks.length === 0)
    blocks.push({
      title: "Deine Projekt-Einschätzung entsteht hier",
      lines: [
        "Mit jeder Angabe wird die Einschätzung konkreter: Module, Reifegrad, Quick Wins und der sinnvolle nächste Schritt.",
      ],
    });

  return { chips, blocks, disclaimer: DISCLAIMER };
}

export const PRIORITY_LABEL: Record<string, string> = {
  aufwand: "weniger Verwaltungsaufwand",
  abrechnung: "klare Abrechnung",
  transparenz: "bessere Transparenz",
  "vor-ort": "weniger Vor-Ort-Termine",
  bewohner: "Bewohner sauber einbinden",
  zukunft: "Zukunftssicherheit",
  foerderung: "Fördermöglichkeiten prüfen",
  schnell: "schnelle Umsetzung",
  standard: "Portfolio standardisieren",
};

/** Flache Insight-Zeilen für den Lead-Payload. */
export function flattenInsights(ins: Insights): string[] {
  const out: string[] = [];
  for (const c of ins.chips) out.push(c.label);
  for (const b of ins.blocks) out.push(`${b.title}: ${b.lines.join(" · ")}`);
  return out;
}
