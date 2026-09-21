import { z } from "zod";

/**
 * Event-Katalog (Masterplan §3, Mindestbestand + WP-1.3/1.4-Ergänzungen).
 * Jeder publizierbare eventType ist hier registriert — `publishEvent` lehnt
 * unbekannte Typen ab (Tippfehler-Events können nicht entstehen). Bekannte
 * Payloads sind konkret typisiert; noch nicht gebaute Typen tragen ein
 * passthrough-Objekt und werden geschärft, sobald ihr Kontext entsteht.
 * Payloads referenzieren IDs, nie Objektkopien; keine sensiblen Daten (§3).
 */

const loose = z.object({}).passthrough();

export const EVENT_SCHEMAS = {
  // crm
  "lead.created": z
    .object({
      leadId: z.string().uuid().optional(),
      name: z.string().optional(),
      email: z.string(),
      leadType: z.string(),
      modules: z.array(z.string()).optional(),
      source: z.string().nullable().optional(),
    })
    .passthrough(),
  "lead.qualified": z
    .object({
      leadId: z.string().uuid(),
      customerId: z.string().uuid(),
      propertyId: z.string().uuid().nullable(),
    })
    .passthrough(),
  // auth (E-Mail-Versandaufträge; Payload enthält Zustelldaten, keine Secrets
  // außer dem einmaligen Link/Token, der der Zweck der Mail ist)
  "auth.email_verification": loose,
  "auth.password_reset": loose,
  "auth.member_invited": loose,
  // platform
  "event.requeued": z.object({ requeuedEventId: z.string().uuid() }).passthrough(),
  // §3-Mindestbestand (noch ohne Producer — Schärfung folgt mit dem Kontext)
  "offer.created": loose,
  "offer.sent": loose,
  "offer.accepted": loose,
  "contract.created": loose,
  "contract.sent_to_documenso": loose,
  "contract.signature_started": loose,
  "contract.partially_signed": loose,
  "contract.signed": loose,
  "contract.failed": loose,
  "project.created": loose,
  "project.phase_changed": loose,
  "onboarding.started": loose,
  "onboarding.step_completed": loose,
  "onboarding.blocked": loose,
  "onboarding.ready_for_activation": loose,
  "work_order.created": loose,
  "work_order.assigned": loose,
  "work_order.completed": loose,
  "hub.registered": loose,
  "hub.online": loose,
  "hub.offline": loose,
  "device.registered": loose,
  "device.assigned": loose,
  "device.installed": loose,
  "device.activated": loose,
  "device.replaced": loose,
  "device.telemetry_received": loose,
  "device.alert_created": loose,
  "device.alert_resolved": loose,
  "module.activated": loose,
  "module.suspended": loose,
  "invoice.requested": loose,
  "invoice.created": loose,
  "invoice.paid": loose,
  "invoice.overdue": loose,
  "opportunity.created": loose,
  "opportunity.stage_changed": loose,
  "opportunity.won": loose,
  "handoff.prepared": loose,
  "handoff.accepted": loose,
  "activation.manifest_approved": loose,
  "activation.provisioned": loose,
} as const;

export type EventType = keyof typeof EVENT_SCHEMAS;

export function isKnownEventType(t: string): t is EventType {
  return t in EVENT_SCHEMAS;
}
