/**
 * Versionierte E-Mail-/Portal-Vorlagen (WP-1.4-Grundgerüst). Variablen kommen
 * aus geprüften Domänenobjekten (Spec §22); die Vorlage rendert Betreff +
 * Text deterministisch aus dem Payload. Marken-/Sprachvarianten folgen mit
 * dem Kommunikations-Kontext — der `templateKey` ist dafür der stabile Anker.
 */

export type RenderedMail = { subject: string; text: string };

type Template = (payload: Record<string, unknown>) => RenderedMail;

const str = (v: unknown, fallback = "—") => (v == null || v === "" ? fallback : String(v));

export const TEMPLATES: Record<string, Template> = {
  "lead.created.notify": (p) => ({
    subject: `Neuer Lead: ${str(p.name, "Unbekannt")} (${str(p.leadType)})`,
    text: [
      `Neuer Lead über den Funnel.`,
      ``,
      `Name:    ${str(p.name, "Unbekannt")}`,
      `E-Mail:  ${str(p.email)}`,
      `Typ:     ${str(p.leadType)}`,
      `Module:  ${Array.isArray(p.modules) && p.modules.length ? (p.modules as string[]).join(", ") : "—"}`,
      `Quelle:  ${str(p.source)}`,
      ``,
      `Details im Admin: /admin/leads`,
    ].join("\n"),
  }),
  "auth.email_verification": (p) => ({
    subject: "Powerhouse 360 — E-Mail bestätigen",
    text: `Bitte bestätige deine E-Mail-Adresse:\n\n${str(p.url, "")}\n\nDer Link ist 1 Stunde gültig.`,
  }),
  "auth.password_reset": (p) => ({
    subject: "Powerhouse 360 — Passwort zurücksetzen",
    text: `Passwort zurücksetzen:\n\n${str(p.url, "")}\n\nWenn du das nicht warst, ignoriere diese E-Mail.`,
  }),
  "auth.member_invited": (p) => ({
    subject: `Einladung zu ${str(p.organizationName, "Powerhouse 360")} (Powerhouse 360)`,
    text: `Du wurdest zu ${str(p.organizationName, "Powerhouse 360")} eingeladen. Zugang einrichten:\n\n${str(p.url, "")}\n\nDer Link ist 7 Tage gültig.`,
  }),
};

export function renderTemplate(templateKey: string, payload: Record<string, unknown>): RenderedMail {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) throw new Error(`Unbekannter templateKey "${templateKey}"`);
  return tpl(payload);
}
