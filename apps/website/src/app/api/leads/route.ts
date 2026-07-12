import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { LeadPayload } from "@/lib/funnel/types";

export const runtime = "nodejs";

/**
 * Public lead intake for both funnels (demo_request / project_request).
 *
 * The website is the public face; it validates cheaply (honeypot + required
 * fields) and forwards server-to-server to the platform, which persists the
 * lead (DB + audit + outbox notification). If the platform is unreachable the
 * lead is logged as a last-resort safety net so it is never silently lost.
 * See docs/POWERHOUSE_360_MASTER_PLAN.md §9 (WP-1.1).
 */
const PLATFORM_URL = process.env.PLATFORM_API_URL ?? "http://localhost:3100";
const INGEST_TOKEN = process.env.PLATFORM_INGEST_TOKEN ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function forwardToPlatform(
  lead: LeadPayload,
  requestId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${PLATFORM_URL}/api/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(INGEST_TOKEN ? { "x-ingest-token": INGEST_TOKEN } : {}),
      },
      body: JSON.stringify(lead),
      // Don't let a slow platform hang the user's request forever.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(
        `[lead:${lead.leadType}] platform responded ${res.status}`,
        JSON.stringify(lead)
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      `[lead:${lead.leadType}] platform unreachable — FALLBACK LOG`,
      err,
      JSON.stringify(lead)
    );
    return false;
  }
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();

  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültige Anfrage." },
      { status: 400 }
    );
  }

  // Honeypot: bots fill the hidden field — accept silently, forward nothing.
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

  // Persist via platform; fallback log guarantees the lead is never lost.
  await forwardToPlatform(body, requestId);

  // The user always gets a positive confirmation once validation passed — the
  // fallback log covers the rare platform-outage case for manual recovery.
  return NextResponse.json({ ok: true });
}
