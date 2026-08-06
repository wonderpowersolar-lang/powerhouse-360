/**
 * Zentrale Log-Redaction (Masterplan §8 Log-Hygiene): Verträge, SEPA/IBAN,
 * Verbrauchsprofile, Tokens und personenbezogene Daten erscheinen NIE in
 * Logs. Redaction ist zweistufig: (1) Schlüssel-basiert für bekannte
 * sensible Feldnamen, (2) Muster-basiert in Strings (IBAN, Bearer/JWT,
 * E-Mail-Adressen).
 */

const SENSITIVE_KEY = /(password|passwort|secret|token|authorization|apikey|api_key|iban|bic|mandate|sepa|creditcard|kreditkarte)/i;
const PARTIAL_KEY = /^(email|e_mail|mail|name|firstname|lastname|vorname|nachname|phone|telefon|recipient)$/i;

const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const EMAIL_RE = /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

export const REDACTED = "[REDACTED]";

/** E-Mail teilredigieren: v***@domain bleibt korrelierbar, aber nicht identifizierend. */
function maskEmail(value: string): string {
  return value.replace(EMAIL_RE, (_m, first: string, domain: string) => `${first}***@${domain}`);
}

export function redactString(value: string): string {
  return maskEmail(
    value.replace(IBAN_RE, REDACTED).replace(BEARER_RE, REDACTED).replace(JWT_RE, REDACTED),
  );
}

/** Teilmaskierung für PII-Felder (E-Mail/Name/Telefon): Anfang bleibt stehen. */
function maskPartial(value: string): string {
  if (value.includes("@")) return maskEmail(value);
  if (value.length <= 2) return "***";
  return `${value.slice(0, 2)}***`;
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[MAX_DEPTH]";
  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(k)) out[k] = REDACTED;
    else if (PARTIAL_KEY.test(k) && typeof v === "string") out[k] = maskPartial(v);
    else out[k] = redact(v, depth + 1);
  }
  return out;
}
