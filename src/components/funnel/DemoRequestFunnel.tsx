"use client";

import { useEffect, useMemo, useState } from "react";
import {
  INITIAL_DEMO_STATE,
  type DemoFunnelState,
  type UnitsBand,
} from "@/lib/funnel/types";
import {
  demoAgenda,
  demoDuration,
  demoInsights,
  MODULE_LABEL,
} from "@/lib/funnel/scoring";
import { buildDemoLead, submitLead } from "@/lib/funnel/submit";
import {
  FunnelShell,
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

const ROLE_OPTIONS: OptionDef[] = [
  { id: "hausverwaltung", label: "Hausverwaltung", desc: "Verwaltung mehrerer Objekte und Eigentümer", icon: "building" },
  { id: "weg", label: "WEG / Beirat", desc: "Entscheidung in der Eigentümergemeinschaft", icon: "users" },
  { id: "bestandshalter", label: "Bestandshalter", desc: "Eigener Bestand, langfristige Perspektive", icon: "layers" },
  { id: "wohnungsunternehmen", label: "Wohnungsunternehmen", desc: "Viele Einheiten, standardisierte Prozesse", icon: "city" },
  { id: "stadtwerk", label: "Stadtwerk / Energiepartner", desc: "Energieprodukte im Mehrfamilienhaus", icon: "bolt" },
  { id: "eigentuemer", label: "Eigentümer / Betreiber", desc: "Einzelobjekt oder kleines Portfolio", icon: "key" },
  { id: "sonstiges", label: "Sonstiges", desc: "Andere Rolle oder Konstellation", icon: "question" },
];

const MODULE_OPTIONS: OptionDef[] = [
  { id: "powermieter", label: "Powermieter", desc: "Mieterstrom, Energieflüsse, Stromabrechnung", icon: "bolt", accent: "power" },
  { id: "heatmieter", label: "Heatmieter", desc: "Wärme, Heizkosten, CO₂-Kosten", icon: "flame", accent: "heat" },
  { id: "chargemieter", label: "Chargemieter", desc: "Wallboxen, Lastmanagement, Ladeabrechnung", icon: "plug", accent: "charge" },
  { id: "smokemieter", label: "Smokemieter", desc: "Rauchwarnmelder, Ferninspektion, Live-Status", icon: "shield", accent: "smoke" },
  { id: "unsicher", label: "Ich bin unsicher", desc: "Passende Module gemeinsam eingrenzen", icon: "question" },
  { id: "plattform", label: "Gesamtsystem Powerhouse 360", desc: "Alle Module als eine Plattform prüfen", icon: "grid" },
];

const BAND_OPTIONS: (OptionDef & { id: UnitsBand })[] = [
  { id: "1-10", label: "1–10 WE", desc: "Kompaktes Einzelobjekt", icon: "home" },
  { id: "11-30", label: "11–30 WE", desc: "Klassisches Mehrfamilienhaus", icon: "building" },
  { id: "31-70", label: "31–70 WE", desc: "Größeres Objekt", icon: "building" },
  { id: "71-150", label: "71–150 WE", desc: "Großes Objekt, mehrere Eingänge", icon: "city" },
  { id: "150+", label: "150+ WE", desc: "Sehr groß / Quartier", icon: "layers" },
];

const SITUATION_OPTIONS: OptionDef[] = [
  { id: "excel", label: "Excel / manuell", desc: "Listen, Tabellen, viel Handarbeit", icon: "doc" },
  { id: "hv-software", label: "Hausverwaltungssoftware", desc: "Verwaltung digital, Gebäudeprozesse getrennt", icon: "grid" },
  { id: "messdienst", label: "Messdienstleister / extern", desc: "Ablesung und Abrechnung ausgelagert", icon: "chart" },
  { id: "insel", label: "Mehrere Einzellösungen", desc: "Verschiedene Tools ohne Verbindung", icon: "puzzle" },
  { id: "analog", label: "Noch nicht digital organisiert", desc: "Prozesse laufen weitgehend analog", icon: "bulb" },
  { id: "unbekannt", label: "Unbekannt", desc: "Ist mir aktuell nicht genau bekannt", icon: "question" },
];

const FOCUS_OPTIONS: OptionDef[] = [
  { id: "dashboard", label: "Gebäudeübersicht / Dashboard", icon: "grid" },
  { id: "module", label: "Modulverwaltung", icon: "puzzle" },
  { id: "onboarding", label: "Bewohner- / Nutzer-Onboarding", icon: "userPlus" },
  { id: "abrechnung", label: "Abrechnungsvorbereitung", icon: "receipt" },
  { id: "monitoring", label: "Betriebsstatus / Monitoring", icon: "chart" },
  { id: "prozesse", label: "Vertrags- und Prozessstrecken", icon: "workflow" },
  { id: "api", label: "API / CRM-Anbindung", icon: "code" },
  { id: "gesamt", label: "Ich möchte einen Gesamtüberblick", icon: "eye" },
];

const TIMEFRAME_OPTIONS: OptionDef[] = [
  { id: "sofort", label: "Sofort / innerhalb 4 Wochen", icon: "bolt" },
  { id: "1-3", label: "In 1–3 Monaten", icon: "calendar" },
  { id: "3-6", label: "In 3–6 Monaten", icon: "clock" },
  { id: "spaeter", label: "Später", icon: "moon" },
  { id: "unverbindlich", label: "Erst einmal unverbindlich ansehen", icon: "eye" },
];

const QUESTIONS = [
  "Für wen möchtest du Powerhouse 360 prüfen?",
  "Welche Module interessieren dich aktuell?",
  "Über welche Größenordnung sprechen wir?",
  "Wie werden die Prozesse aktuell organisiert?",
  "Was soll die Demo besonders zeigen?",
  "Wann möchtest du Powerhouse 360 prüfen oder einführen?",
  "Fast geschafft — wohin dürfen wir den Terminvorschlag senden?",
];

const TOTAL_STEPS = QUESTIONS.length;
const STORAGE_KEY = "ph360:funnel:demo";

const label = (opts: OptionDef[], id: string | null) =>
  opts.find((o) => o.id === id)?.label ?? "";

/* ────────────────────────────── Komponente ─────────────────────────────── */

export default function DemoRequestFunnel() {
  const [state, setState] = useState<DemoFunnelState>(INITIAL_DEMO_STATE);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<ContactErrors | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Eingaben überleben einen Reload (sessionStorage), bis zur Absendung.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          state: DemoFunnelState;
          step: number;
        };
        if (saved?.state) setState({ ...INITIAL_DEMO_STATE, ...saved.state });
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
      /* Speicher voll o. ä. — Funnel funktioniert auch ohne */
    }
  }, [state, step, done]);

  const insights = useMemo(() => demoInsights(state), [state]);

  const patch = (p: Partial<DemoFunnelState>) => {
    setState((s) => ({ ...s, ...p }));
    setError(null);
  };

  const toggleModule = (id: string) => {
    setState((s) => {
      let next = s.modules.includes(id)
        ? s.modules.filter((m) => m !== id)
        : [...s.modules, id];
      if (id === "unsicher" && next.includes("unsicher"))
        next = ["unsicher"];
      else if (id !== "unsicher") next = next.filter((m) => m !== "unsicher");
      if (id === "plattform" && next.includes("plattform"))
        next = next.filter((m) => m === "plattform");
      else if (id !== "plattform")
        next = next.filter((m) => m !== "plattform");
      return { ...s, modules: next };
    });
    setError(null);
  };

  const toggleFocus = (id: string) =>
    patch({
      focus: state.focus.includes(id)
        ? state.focus.filter((f) => f !== id)
        : [...state.focus, id],
    });

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        return state.role ? null : "Bitte wähle aus, für wen du Powerhouse 360 prüfst.";
      case 1:
        return state.modules.length > 0
          ? null
          : "Bitte wähle mindestens eine Option — „Ich bin unsicher“ ist ausdrücklich okay.";
      case 2:
        return state.unitsBand ? null : "Bitte wähle eine Größenordnung.";
      case 3:
        return state.situation ? null : "Bitte wähle aus, wie die Prozesse heute laufen.";
      case 4:
        return state.focus.length > 0
          ? null
          : "Bitte wähle mindestens einen Schwerpunkt — „Gesamtüberblick“ ist immer möglich.";
      case 5:
        return state.timeframe ? null : "Bitte wähle einen ungefähren Zeitrahmen.";
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
    // letzter Schritt: Kontakt validieren + senden
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
    const payload = { ...buildDemoLead(state), website: honeypot };
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

  const summaryRows = [
    { label: "Rolle", value: label(ROLE_OPTIONS, state.role) },
    {
      label: "Module",
      value: state.modules
        .map((m) => MODULE_LABEL[m] ?? label(MODULE_OPTIONS, m))
        .join(", "),
    },
    {
      label: "Größenordnung",
      value: [
        state.unitsBand ? `${state.unitsBand} WE` : "",
        state.buildings ? `${state.buildings} Gebäude` : "",
        state.portfolioObjects
          ? `${state.portfolioObjects} Objekte im Portfolio`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Aktuelle Situation", value: label(SITUATION_OPTIONS, state.situation) },
    {
      label: "Demo-Fokus",
      value: state.focus.map((f) => label(FOCUS_OPTIONS, f)).join(", "),
    },
    { label: "Empfohlene Agenda", value: demoAgenda(state).join(" → ") },
    { label: "Zeitrahmen", value: label(TIMEFRAME_OPTIONS, state.timeframe) },
    { label: "Empfohlene Dauer", value: `${demoDuration(state)} Minuten` },
  ];

  if (done)
    return (
      <FunnelShell
        title="Software-Demo anfragen"
        subline="Erhalte eine Demo, die zu deinem Objekt, deinen Modulen und deinen aktuellen Prozessen passt."
        step={TOTAL_STEPS - 1}
        total={TOTAL_STEPS}
        panel={<LiveInsightPanel insights={insights} />}
        showProgress={false}
      >
        <SuccessState message="Danke. Wir bereiten deine Demo anhand deiner Angaben vor und melden uns mit einem passenden Terminvorschlag." />
      </FunnelShell>
    );

  return (
    <FunnelShell
      title="Software-Demo anfragen"
      subline="Erhalte eine Demo, die zu deinem Objekt, deinen Modulen und deinen aktuellen Prozessen passt."
      step={step}
      total={TOTAL_STEPS}
      panel={<LiveInsightPanel insights={insights} />}
    >
      <div key={step} className="funnel-step-in">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {QUESTIONS[step]}
        </h2>

        <div className="mt-6">
          {step === 0 && (
            <OptionGrid>
              {ROLE_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.role === o.id}
                  onToggle={() => patch({ role: o.id })}
                />
              ))}
            </OptionGrid>
          )}

          {step === 1 && (
            <OptionGrid>
              {MODULE_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.modules.includes(o.id)}
                  onToggle={() => toggleModule(o.id)}
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
                  id="d-buildings"
                  label="Anzahl Gebäude"
                  value={state.buildings}
                  onChange={(v) => patch({ buildings: v })}
                  placeholder="z. B. 2"
                  optional
                />
                <NumberInput
                  id="d-portfolio"
                  label="Objekte im Portfolio"
                  value={state.portfolioObjects}
                  onChange={(v) => patch({ portfolioObjects: v })}
                  placeholder="z. B. 12"
                  optional
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <OptionGrid>
              {SITUATION_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.situation === o.id}
                  onToggle={() => patch({ situation: o.id })}
                />
              ))}
            </OptionGrid>
          )}

          {step === 4 && (
            <OptionGrid>
              {FOCUS_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.focus.includes(o.id)}
                  onToggle={() => toggleFocus(o.id)}
                />
              ))}
            </OptionGrid>
          )}

          {step === 5 && (
            <OptionGrid>
              {TIMEFRAME_OPTIONS.map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  selected={state.timeframe === o.id}
                  onToggle={() => patch({ timeframe: o.id })}
                />
              ))}
            </OptionGrid>
          )}

          {step === 6 && (
            <ContactStep
              summaryRows={summaryRows}
              contact={state.contact}
              onContact={(c) => patch({ contact: c })}
              consentPrivacy={state.consentPrivacy}
              consentContact={state.consentContact}
              onConsentPrivacy={(v) => patch({ consentPrivacy: v })}
              onConsentContact={(v) => patch({ consentContact: v })}
              honeypot={honeypot}
              onHoneypot={setHoneypot}
              errors={contactErrors}
            />
          )}
        </div>

        <NavButtons
          onBack={step > 0 ? back : undefined}
          onNext={next}
          nextLabel={
            step === TOTAL_STEPS - 1
              ? "Demo-Anfrage senden"
              : step === TOTAL_STEPS - 2
              ? "Angaben prüfen"
              : "Weiter"
          }
          submitting={submitting}
          error={error}
        />
      </div>
    </FunnelShell>
  );
}
