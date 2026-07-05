import { NextResponse } from "next/server";
import type { LeadPayload } from "@/lib/funnel/types";

/**
 * Lead-Eingang beider Funnels (demo_request / project_request).
 *
 * INTEGRATIONSPUNKT (bewusst austauschbarer Adapter): `deliverLead()` ist
 * die einzige Stelle, an der Leads das System verlassen. Hier wird später
 * das interne Powerhouse-360-CRM (HTTP-Endpunkt) und/oder der E-Mail-
 * Versand über Hostinger angebunden. Bis dahin werden Leads serverseitig
 * protokolliert und die Annahme bestätigt, damit der Funnel vollständig
 * funktioniert und die Datenstruktur produktionsreif bleibt.
 */
async function deliverLead(lead: LeadPayload): Promise<void> {
  console.log(`[lead:${lead.leadType}]`, JSON.stringify(lead));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültige Anfrage." },
      { status: 400 }
    );
  }

  // Honeypot: Bots füllen das unsichtbare Feld — dann still verwerfen.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (
    (body.leadType !== "demo_request" && body.leadType !== "project_request") ||
    !body.contactData ||
    typeof body.contactData.email !== "string" ||
    !EMAIL_RE.test(body.contactData.email) ||
    !body.contactData.firstName?.trim() ||
    !body.contactData.lastName?.trim() ||
    body.consent?.privacy !== true ||
    body.consent?.contact !== true
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Bitte prüfe Name, E-Mail-Adresse und die beiden Zustimmungen.",
      },
      { status: 422 }
    );
  }

  await deliverLead(body);
  return NextResponse.json({ ok: true });
}
