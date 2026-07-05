"use client";

import { useEffect, useMemo, useState } from "react";
import {
  INITIAL_PROJECT_STATE,
  type ProjectFunnelState,
  type UnitsBand,
} from "@/lib/funnel/types";
import {
  complexityLevel,
  mapThemesToModules,
  MODULE_LABEL,
  nextStepForStage,
  openChecks,
  projectInsights,
  projectReadiness,
  quickWins,
} from "@/lib/funnel/scoring";
import { buildProjectLead, submitLead } from "@/lib/funnel/submit";
import {
  FunnelShell,
  FunnelSummary,
  LiveInsightPanel,
  NavButtons,
  NumberInput,
  OptionCard,
  OptionGrid,
  SuccessState,
  type OptionDef,
} from "./ui";
import ContactStep, {
  validateContact,
  type ContactErrors,
} from "./ContactStep";

/* ─────────────────────────── Optionen (Schritte) ───────────────────────── */

const TYPE_OPTIONS: OptionDef[] = [
  { id: "bestand", label: "Bestandsgebäude", desc: "Vorhandenes Objekt digital nachrüsten", icon: "building" },
  { id: "neubau", label: "Neubau", desc: "Digitale Betriebsebene von Anfang an", icon: "hammer" },
  { id: "weg", label: "WEG", desc: "Eigentümergemeinschaft mit Beschlusslogik", icon: "users" },
  { id: "mietshaus", label: "Mietshaus", desc: "Vermietetes Objekt mit Bewohnerprozessen", icon: "home" },
  { id: "portfolio", label: "Portfolio / mehrere Objekte", desc: "Standardisierung über den Bestand", icon: "layers" },
  { id: "sanierung", label: "Sanierung / Modernisierung", desc: "Module entlang der Maßnahme planen", icon: "wrench" },
  { id: "unsicher", label: "Ich bin unsicher", desc: "Einordnung gemeinsam klären", icon: "question" },
];

const THEME_OPTIONS: OptionDef[] = [
  { id: "energie", label: "Mieterstrom / Energie", icon: "bolt", accent: "power" },
  { id: "waerme", label: "Heizkosten / Wärme", icon: "flame", accent: "heat" },
  { id: "lade", label: "Wallboxen / Ladeinfrastruktur", icon: "plug", accent: "charge" },
  { id: "rwm", label: "Rauchwarnmelder / Sicherheit", icon: "shield", accent: "smoke" },
  { id: "onboarding", label: "Bewohner-Onboarding", icon: "userPlus" },
  { id: "abrechnung", label: "Abrechnung / Betrieb", icon: "receipt" },
  { id: "gesamt", label: "Ich möchte eine Gesamtprüfung", icon: "eye" },
];

const BAND_OPTIONS: (OptionDef & { id: UnitsBand })[] = [
  { id: "1-10", label: "1–10 WE", desc: "Kompaktes Einzelobjekt", icon: "home" },
  { id: "11-30", label: "11–30 WE", desc: "Klassisches Mehrfamilienhaus", icon: "building" },
  { id: "31-70", label: "31–70 WE", desc: "Größeres Objekt", icon: "building" },
  { id: "71-150", label: "71–150 WE", desc: "Großes Objekt, mehrere Eingänge", icon: "city" },
  { id: "150+", label: "150+ WE", desc: "Sehr groß / Quartier", icon: "layers" },
];

const INFRA_OPTIONS: OptionDef[] = [
  { id: "pv", label: "PV-Anlage vorhanden", icon: "sun", accent: "power" },
  { id: "pv-geplant", label: "PV geplant", icon: "sun" },
  { id: "wp", label: "Wärmepumpe / zentrale Heizung", desc: "vorhanden", icon: "flame", accent: "heat" },
  { id: "wallbox", label: "Wallboxen vorhanden", icon: "plug", accent: "charge" },
  { id: "wallbox-geplant", label: "Wallboxen geplant", icon: "plug" },
  { id: "zaehler", label: "Digitale Zähler / Sensorik", desc: "vorhanden", icon: "chart" },
  { id: "rwm-digital", label: "Rauchwarnmelder digital", desc: "vorhanden", icon: "shield", accent: "smoke" },
  { id: "unklar", label: "Noch unklar", desc: "Bestandsaufnahme sinnvoll", icon: "question" },
];

const STAGE_OPTIONS: OptionDef[] = [
  { id: "idee", label: "Erste Idee", icon: "bulb" },
  { id: "pruefung", label: "Eigentümer / WEG prüft", icon: "search" },
  { id: "beschluss", label: "Beschluss / Entscheidung in Vorbereitung", icon: "doc" },
  { id: "planung", label: "Technische Planung läuft", icon: "workflow" },
  { id: "umsetzung", label: "Umsetzung geplant", icon: "hammer" },
  { id: "betrieb", label: "In Betrieb, aber Prozesse fehlen", icon: "gear" },
  { id: "problem", label: "Problemfall / bestehendes Chaos", icon: "alert" },
];

const PRIORITY_OPTIONS: OptionDef[] = [
  { id: "aufwand", label: "Weniger Verwaltungsaufwand", icon: "clock" },
  { id: "abrechnung", label: "Klare Abrechnung", icon: "receipt" },
  { id: "transparenz", label: "Bessere Transparenz", icon: "eye" },
  { id: "vor-ort", label: "Weniger Vor-Ort-Termine", icon: "pin" },
  { id: "bewohner", label: "Bewohner sauber einbinden", icon: "userPlus" },
  { id: "zukunft", label: "Zukunftssicherheit", icon: "sparkle" },
  { id: "foerderung", label: "Fördermöglichkeiten prüfen", icon: "chart" },
  { id: "schnell", label: "Schnelle Umsetzung", icon: "bolt" },
  { id: "standard", label: "Portfolio standardisieren", icon: "layers" },
];

const QUESTIONS = [
  "Um welche Art von Projekt geht es?",
  "Welche Themen sind für das Projekt relevant?",
  "Wie groß ist das Objekt?",
  "Was ist bereits vorhanden?",
  "Wo steht das Projekt gerade?",
  "Was ist dir bei diesem Projekt besonders wichtig?",
  "Deine Projekt-Einschätzung",
  "Fast geschafft — wohin dürfen wir die Einschätzung senden?",
];

const TOTAL_STEPS = QUESTIONS.length;
const STORAGE_KEY = "ph360:funnel:project";

const label = (opts: OptionDef[], id: string | null) =>
  opts.find((o) => o.id === id)?.label ?? "";

/* ────────────────────────────── Komponente ─────────────────────────────── */

export default function ProjectRequestFunnel() {
  const [state, setState] = useState<ProjectFunnelState>(
    INITIAL_PROJECT_STATE
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<ContactErrors | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          state: ProjectFunnelState;
          step: number;
        };
        if (saved?.state)
          setState({ ...INITIAL_PROJECT_STATE, ...saved.state });
        if (typeof saved?.step === "number")
          setStep(Math.min(saved.step, TOTAL_STEPS - 1));
      }
    } catch {
      /* beschädigter Speicher: frisch starten */
    }
  }, []);
  useEffect(() => {
    if (done) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step }));
    } catch {
      /* unkritisch */
    }
  }, [state, step, done]);

  const insights = useMemo(() => projectInsights(state), [state]);

  const patch = (p: Partial<ProjectFunnelState>) => {
    setState((s) => ({ ...s, ...p }));
    setError(null);
  };

  const toggleIn = (key: "themes" | "infrastructure" | "priorities", id: string) => {
    setState((s) => {
      let arr = s[key].includes(id)
        ? s[key].filter((x) => x !== id)
        : [...s[key], id];
      if (key === "infrastructure") {
        if (id === "unklar" && arr.includes("unklar")) arr = ["unklar"];
        else if (id !== "unklar") arr = arr.filter((x) => x !== "unklar");
      }
      return { ...s, [key]: arr };
    });
    setError(null);
  };

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        return state.projectType ? null : "Bitte wähle eine Projektart — „Ich bin unsicher“ ist okay.";
      case 1:
        return state.themes.length > 0
          ? null
          : "Bitte wähle mindestens ein Thema — „Gesamtprüfung“ ist immer möglich.";
      case 2:
        return state.unitsBand ? null : "Bitte wähle eine Objektgröße.";
      case 3:
        return state.infrastructure.length > 0
          ? null
          : "Bitte wähle aus, was vorhanden ist — „Noch unklar“ ist okay.";
      case 4:
        return state.stage ? null : "Bitte wähle den aktuellen Projektstand.";
      case 5:
        return state.priorities.length > 0
          ? null
          : "Bitte wähle mindestens eine Priorität.";
      default:
        return null;
    }
  };

  const next = async () => {
    if (step < TOTAL_STEPS - 1) {
      const v = validateStep();
      if (v) {
        setError(v);
        return;
      }
      setError(null);
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const ce = validateContact(
      state.contact,
      state.consentPrivacy,
      state.consentContact
    );
    setContactErrors(ce);
    if (ce) {
      setError(
        "Bitte prüfe die markierten Felder und bestätige beide Zustimmungen."
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = { ...buildProjectLead(state), website: honeypot };
    const res = await submitLead(payload);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Senden fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* unkritisch */
    }
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0 });
  };

  const mods = mapThemesToModules(state.themes);
  const level =
    state.projectType === "portfolio"
      ? "Portfolio"
      : complexityLevel(state.unitsBand, state.buildings, "");
  const wins = quickWins(state);
  const checks = openChecks(state);

  const assessmentRows = [
    { label: "Projektart", value: label(TYPE_OPTIONS, state.projectType) },
    {
      label: "Module",
      value:
        mods.map((m) => MODULE_LABEL[m]).join(", ") ||
        (state.themes.includes("gesamt") ? "Gesamtprüfung Powerhouse 360" : ""),
    },
    {
      label: "Projektgröße",
      value: [
        state.unitsBand ? `${state.unitsBand} WE` : "",
        state.buildings ? `${state.buildings} Gebäude` : "",
        state.parkingSpaces ? `${state.parkingSpaces} Stellplätze` : "",
        state.commercialUnits ? `${state.commercialUnits} Gewerbeeinheiten` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Komplexität", value: level ?? "" },
    {
      label: "Vorhandene Infrastruktur",
      value: state.infrastructure
        .map((i) => label(INFRA_OPTIONS, i))
        .join(", "),
    },
    { label: "Empfohlener nächster Schritt", value: nextStepForStage(state.stage) },
    { label: "Mögliche Quick Wins", value: wins.join(" · ") },
    { label: "Offene Prüfpunkte", value: checks.join(" · ") },
  ];

  const contactSummaryRows = assessmentRows.concat([
    { label: "Projekt-Reifegrad", value: projectReadiness(state) },
  ]);

  if (done)
    return (
      <FunnelShell
        title="Projekt besprechen"
        subline="Prüfe, welche Powerhouse-360-Module für dein Objekt sinnvoll sind und welcher nächste Schritt passt."
        step={TOTAL_STEPS - 1}
        total={TOTAL_STEPS}
        panel={<LiveInsightPanel insights={insights} />}
        showProgress={false}
      >
        <SuccessState message="Danke. Wir prüfen deine Angaben und melden uns mit einer passenden Einschätzung zum nächsten Schritt." />
      </FunnelShell>
    );

  return (
    <FunnelShell
      title="Projekt besprechen"
      subline="Prüfe, welche Powerhouse-360-Module für dein Objekt sinnvoll sind und welcher nächste Schritt passt."
      step={step}
      total={TOTAL_STEPS}
      panel={<LiveInsightPanel insights={insights} />}
    >
      <div key={step} className="funnel-step-in">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {QUESTIONS[step]}
        </h2>

        <div className="mt-8">
          {step === 0 && (
            <OptionGrid>
              {TYPE_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.projectType === o.id}
                  onToggle={() => patch({ projectType: o.id })}
                />
              ))}
            </OptionGrid>
          )}

          {step === 1 && (
            <OptionGrid>
              {THEME_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.themes.includes(o.id)}
                  onToggle={() => toggleIn("themes", o.id)}
                />
              ))}
            </OptionGrid>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <OptionGrid>
                {BAND_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.id}
                    option={o}
                    selected={state.unitsBand === o.id}
                    onToggle={() => patch({ unitsBand: o.id })}
                  />
                ))}
              </OptionGrid>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  id="p-buildings"
                  label="Anzahl Gebäude / Hauseingänge"
                  value={state.buildings}
                  onChange={(v) => patch({ buildings: v })}
                  placeholder="z. B. 2"
                  optional
                />
                <NumberInput
                  id="p-parking"
                  label="Anzahl Stellplätze"
                  value={state.parkingSpaces}
                  onChange={(v) => patch({ parkingSpaces: v })}
                  placeholder="z. B. 24"
                  optional
                />
                <NumberInput
                  id="p-commercial"
                  label="Anzahl Gewerbeeinheiten"
                  value={state.commercialUnits}
                  onChange={(v) => patch({ commercialUnits: v })}
                  placeholder="z. B. 1"
                  optional
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <OptionGrid>
              {INFRA_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.infrastructure.includes(o.id)}
                  onToggle={() => toggleIn("infrastructure", o.id)}
                />
              ))}
            </OptionGrid>
          )}

          {step === 4 && (
            <OptionGrid>
              {STAGE_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.stage === o.id}
                  onToggle={() => patch({ stage: o.id })}
                />
              ))}
            </OptionGrid>
          )}

          {step === 5 && (
            <OptionGrid>
              {PRIORITY_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.priorities.includes(o.id)}
                  onToggle={() => toggleIn("priorities", o.id)}
                />
              ))}
            </OptionGrid>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Projekt-Reifegrad
                </p>
                <p className="mt-2 text-2xl font-bold text-ink">
                  {projectReadiness(state)}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                  Der Reifegrad ist eine Orientierung auf Basis von
                  Projektstand, Objektgröße, vorhandener Infrastruktur und
                  gewählten Modulen — keine harte Bewertung.
                </p>
              </div>
              <FunnelSummary rows={assessmentRows} />
            </div>
          )}

          {step === 7 && (
            <ContactStep
              summaryRows={contactSummaryRows}
              contact={state.contact}
              onContact={(c) => patch({ contact: c })}
              consentPrivacy={state.consentPrivacy}
              consentContact={state.consentContact}
              onConsentPrivacy={(v) => patch({ consentPrivacy: v })}
              onConsentContact={(v) => patch({ consentContact: v })}
              honeypot={honeypot}
              onHoneypot={setHoneypot}
              errors={contactErrors}
              showRole
              showAddress
            />
          )}
        </div>

        <NavButtons
          onBack={step > 0 ? back : undefined}
          onNext={next}
          nextLabel={
            step === TOTAL_STEPS - 1
              ? "Projektanfrage senden"
              : step === 5
              ? "Angaben prüfen"
              : step === 6
              ? "Weiter zu den Kontaktdaten"
              : "Weiter"
          }
          submitting={submitting}
          error={error}
        />
      </div>
    </FunnelShell>
  );
}
