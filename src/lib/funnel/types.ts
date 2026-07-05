/**
 * Powerhouse 360 — Funnel-Typen.
 *
 * Zwei geführte Anfrage-Strecken: Software-Demo (demo_request) und
 * Projekt besprechen (project_request). Persönliche Daten werden erst im
 * letzten Schritt erhoben; alle Schritte davor sind sachliche Angaben zu
 * Objekt, Bedarf und Projekt.
 */

export type LeadType = "demo_request" | "project_request";

export type ModuleId =
  | "powermieter"
  | "heatmieter"
  | "chargemieter"
  | "smokemieter";

/** WE-Größenklassen (Auswahlkarten statt freier Zahleneingabe). */
export type UnitsBand = "1-10" | "11-30" | "31-70" | "71-150" | "150+";

export interface ContactData {
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  message: string;
}

export const EMPTY_CONTACT: ContactData = {
  firstName: "",
  lastName: "",
  company: "",
  role: "",
  email: "",
  phone: "",
  address: "",
  message: "",
};

/* ────────────────────────────── Demo-Funnel ────────────────────────────── */

export interface DemoFunnelState {
  role: string | null;
  /** Modul-IDs plus "unsicher" | "plattform" */
  modules: string[];
  unitsBand: UnitsBand | null;
  /** Zahlenfelder als Roh-Eingabe (Strings), Parsing im Scoring */
  buildings: string;
  portfolioObjects: string;
  situation: string | null;
  focus: string[];
  timeframe: string | null;
  contact: ContactData;
  consentPrivacy: boolean;
  consentContact: boolean;
}

export const INITIAL_DEMO_STATE: DemoFunnelState = {
  role: null,
  modules: [],
  unitsBand: null,
  buildings: "",
  portfolioObjects: "",
  situation: null,
  focus: [],
  timeframe: null,
  contact: EMPTY_CONTACT,
  consentPrivacy: false,
  consentContact: false,
};

/* ───────────────────────────── Projekt-Funnel ──────────────────────────── */

export interface ProjectFunnelState {
  projectType: string | null;
  themes: string[];
  unitsBand: UnitsBand | null;
  buildings: string;
  parkingSpaces: string;
  commercialUnits: string;
  infrastructure: string[];
  stage: string | null;
  priorities: string[];
  contact: ContactData;
  consentPrivacy: boolean;
  consentContact: boolean;
}

export const INITIAL_PROJECT_STATE: ProjectFunnelState = {
  projectType: null,
  themes: [],
  unitsBand: null,
  buildings: "",
  parkingSpaces: "",
  commercialUnits: "",
  infrastructure: [],
  stage: null,
  priorities: [],
  contact: EMPTY_CONTACT,
  consentPrivacy: false,
  consentContact: false,
};

/* ───────────────────────────── Live-Insights ───────────────────────────── */

/** Farb-Ton eines Insight-Chips (Modul-Akzente + Gold). */
export type ChipTone = "gold" | "power" | "heat" | "charge" | "smoke";

export interface InsightChip {
  label: string;
  tone: ChipTone;
}

export interface InsightBlock {
  title: string;
  /** Zeilen; nummerierte Agenden werden als Liste gerendert */
  lines: string[];
  ordered?: boolean;
}

export interface Insights {
  chips: InsightChip[];
  blocks: InsightBlock[];
  disclaimer: string;
}

/* ─────────────────────────────── Lead-Payload ──────────────────────────── */

export interface LeadPayloadBase {
  leadType: LeadType;
  selectedModules: string[];
  roleOrOrganizationType: string | null;
  dwellingUnits: UnitsBand | null;
  buildings: number | null;
  portfolioSize: number | null;
  currentSituation: string | null;
  priorities: string[];
  /** flache Liste der zuletzt angezeigten Insight-Zeilen */
  generatedInsights: string[];
  recommendedNextStep: string;
  contactData: ContactData;
  consent: { privacy: boolean; contact: boolean };
  createdAt: string;
  /** Honeypot — bleibt leer, dient dem Spam-Schutz */
  website?: string;
}

export interface DemoLeadPayload extends LeadPayloadBase {
  leadType: "demo_request";
  demoFocus: string[];
  demoAgenda: string[];
  recommendedDemoDuration: number;
  timeframe: string | null;
}

export interface ProjectLeadPayload extends LeadPayloadBase {
  leadType: "project_request";
  projectType: string | null;
  infrastructureStatus: string[];
  projectStage: string | null;
  parkingSpaces: number | null;
  commercialUnits: number | null;
  projectReadiness: string;
  quickWins: string[];
  openChecks: string[];
}

export type LeadPayload = DemoLeadPayload | ProjectLeadPayload;
