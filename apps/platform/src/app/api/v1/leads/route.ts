import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { leadInputSchema, createLead } from "@/lib/leads";

export const runtime = "nodejs";

/**
 * Platform lead intake (WP-1.1). Trusted server-to-server endpoint: the public
 * website posts here from its own server after honeypot/validation. Persists the
 * lead + audit + outbox event. See docs/API_ARCHITECTURE.md.
 */
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();

  // Optional shared-secret gate (set PLATFORM_INGEST_TOKEN to enforce).
  const expectedToken = process.env.PLATFORM_INGEST_TOKEN;
  if (expectedToken && req.headers.get("x-ingest-token") !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültige Anfrage." },
      { status: 400 }
    );
  }

  const parsed = leadInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Bitte prüfe Name, E-Mail-Adresse und die beiden Zustimmungen.",
      },
      { status: 422 }
    );
  }
  const data = parsed.data;

  // Honeypot: silently accept + drop bot submissions.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (data.consent.privacy !== true || data.consent.contact !== true) {
    return NextResponse.json(
      { ok: false, error: "Bitte bestätige die beiden Zustimmungen." },
      { status: 422 }
    );
  }

  try {
    const lead = await createLead(data, requestId);
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[lead] persist failed", err);
    return NextResponse.json(
      { ok: false, error: "Die Anfrage konnte gerade nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
