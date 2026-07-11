/**
 * Lead-Übermittlung — bewusst als austauschbarer Adapter gehalten.
 *
 * Aktuell: POST an die interne API-Route /api/leads (dort liegt der
 * serverseitige Integrationspunkt für das interne Powerhouse-360-CRM
 * bzw. den E-Mail-Versand). Der Client kennt nur diese eine Funktion —
 * ein späterer Wechsel des Backends ändert hier nichts.
 */

import type {
  DemoFunnelState,
  ProjectFunnelState,
  DemoLeadPayload,
  ProjectLeadPayload,
} from "./types";
import {
  demoAgenda,
  demoDuration,
  demoInsights,
  flattenInsights,
  effectiveModules,
  mapThemesToModules,
  nextStepForStage,
  parseCount,
  projectInsights,
  projectReadiness,
  quickWins,
  openChecks,
  timeframeHint,
} from "./scoring";

export function buildDemoLead(state: DemoFunnelState): DemoLeadPayload {
  const insights = demoInsights(state);
  return {
    leadType: "demo_request",
    selectedModules: effectiveModules(state.modules),
    roleOrOrganizationType: state.role,
    dwellingUnits: state.unitsBand,
    buildings: parseCount(state.buildings),
    portfolioSize: parseCount(state.portfolioObjects),
    currentSituation: state.situation,
    priorities: [],
    generatedInsights: flattenInsights(insights),
    recommendedNextStep:
      timeframeHint(state.timeframe) ??
      "Demo-Termin mit passender Agenda abstimmen",
    contactData: state.contact,
    consent: { privacy: state.consentPrivacy, contact: state.consentContact },
    createdAt: new Date().toISOString(),
    demoFocus: state.focus,
    demoAgenda: demoAgenda(state),
    recommendedDemoDuration: demoDuration(state),
    timeframe: state.timeframe,
  };
}

export function buildProjectLead(
  state: ProjectFunnelState
): ProjectLeadPayload {
  const insights = projectInsights(state);
  return {
    leadType: "project_request",
    selectedModules: mapThemesToModules(state.themes),
    roleOrOrganizationType: state.contact.role || state.projectType,
    dwellingUnits: state.unitsBand,
    buildings: parseCount(state.buildings),
    portfolioSize: null,
    currentSituation: state.stage,
    priorities: state.priorities,
    generatedInsights: flattenInsights(insights),
    recommendedNextStep: nextStepForStage(state.stage),
    contactData: state.contact,
    consent: { privacy: state.consentPrivacy, contact: state.consentContact },
    createdAt: new Date().toISOString(),
    projectType: state.projectType,
    infrastructureStatus: state.infrastructure,
    projectStage: state.stage,
    parkingSpaces: parseCount(state.parkingSpaces),
    commercialUnits: parseCount(state.commercialUnits),
    projectReadiness: projectReadiness(state),
    quickWins: quickWins(state),
    openChecks: openChecks(state),
  };
}

export async function submitLead(
  payload: DemoLeadPayload | ProjectLeadPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error:
          data?.error ??
          "Die Anfrage konnte gerade nicht übermittelt werden. Bitte versuche es erneut.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Keine Verbindung möglich. Bitte versuche es erneut oder schreibe an info@powerhouse360.de.",
    };
  }
}
