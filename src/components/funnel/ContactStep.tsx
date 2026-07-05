"use client";

import Link from "next/link";
import type { ContactData } from "@/lib/funnel/types";
import { ConsentCheckbox, FunnelSummary, TextField } from "./ui";

export interface ContactErrors {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  consentPrivacy?: boolean;
  consentContact?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(
  contact: ContactData,
  consentPrivacy: boolean,
  consentContact: boolean
): ContactErrors | null {
  const e: ContactErrors = {};
  if (!contact.firstName.trim()) e.firstName = "Bitte Vornamen angeben.";
  if (!contact.lastName.trim()) e.lastName = "Bitte Nachnamen angeben.";
  if (!contact.company.trim())
    e.company = "Bitte Firma oder Organisation angeben.";
  if (!EMAIL_RE.test(contact.email))
    e.email = "Bitte eine gültige E-Mail-Adresse angeben.";
  if (!consentPrivacy) e.consentPrivacy = true;
  if (!consentContact) e.consentContact = true;
  return Object.keys(e).length > 0 ? e : null;
}

/**
 * Letzter Schritt beider Funnels: Zusammenfassung der sachlichen Angaben,
 * dann erst die persönlichen Daten. Telefon/Nachricht optional, E-Mail wird
 * erst hier validiert, Datenschutz- und Kontakt-Zustimmung sind Pflicht.
 */
export default function ContactStep({
  summaryRows,
  contact,
  onContact,
  consentPrivacy,
  consentContact,
  onConsentPrivacy,
  onConsentContact,
  honeypot,
  onHoneypot,
  errors,
  showRole,
  showAddress,
}: {
  summaryRows: { label: string; value: string }[];
  contact: ContactData;
  onContact: (c: ContactData) => void;
  consentPrivacy: boolean;
  consentContact: boolean;
  onConsentPrivacy: (v: boolean) => void;
  onConsentContact: (v: boolean) => void;
  honeypot: string;
  onHoneypot: (v: string) => void;
  errors: ContactErrors | null;
  showRole?: boolean;
  showAddress?: boolean;
}) {
  const set = (patch: Partial<ContactData>) =>
    onContact({ ...contact, ...patch });

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Deine Angaben im Überblick
        </p>
        <FunnelSummary rows={summaryRows} />
      </div>

      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Wie erreichen wir dich?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="c-firstname"
            label="Vorname"
            value={contact.firstName}
            onChange={(v) => set({ firstName: v })}
            autoComplete="given-name"
            error={errors?.firstName}
          />
          <TextField
            id="c-lastname"
            label="Nachname"
            value={contact.lastName}
            onChange={(v) => set({ lastName: v })}
            autoComplete="family-name"
            error={errors?.lastName}
          />
          <TextField
            id="c-company"
            label="Firma / Organisation"
            value={contact.company}
            onChange={(v) => set({ company: v })}
            autoComplete="organization"
            error={errors?.company}
          />
          {showRole && (
            <TextField
              id="c-role"
              label="Rolle"
              value={contact.role}
              onChange={(v) => set({ role: v })}
              optional
              autoComplete="organization-title"
            />
          )}
          <TextField
            id="c-email"
            label="E-Mail"
            type="email"
            value={contact.email}
            onChange={(v) => set({ email: v })}
            autoComplete="email"
            error={errors?.email}
          />
          <TextField
            id="c-phone"
            label="Telefon"
            type="tel"
            value={contact.phone}
            onChange={(v) => set({ phone: v })}
            optional
            autoComplete="tel"
          />
          {showAddress && (
            <div className="sm:col-span-2">
              <TextField
                id="c-address"
                label="Objektadresse"
                value={contact.address}
                onChange={(v) => set({ address: v })}
                optional
                autoComplete="street-address"
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <TextField
              id="c-message"
              label="Nachricht"
              value={contact.message}
              onChange={(v) => set({ message: v })}
              optional
              textarea
            />
          </div>
        </div>

        {/* Honeypot — für Menschen unsichtbar, von Bots gern ausgefüllt */}
        <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="c-website">
            Website
            <input
              id="c-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => onHoneypot(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <ConsentCheckbox
          id="consent-privacy"
          checked={consentPrivacy}
          onChange={onConsentPrivacy}
          error={errors?.consentPrivacy}
        >
          Ich habe die{" "}
          <Link href="/datenschutz" className="text-gold hover:underline">
            Datenschutzerklärung
          </Link>{" "}
          zur Kenntnis genommen und bin mit der Verarbeitung meiner Angaben
          zur Bearbeitung dieser Anfrage einverstanden.
        </ConsentCheckbox>
        <ConsentCheckbox
          id="consent-contact"
          checked={consentContact}
          onChange={onConsentContact}
          error={errors?.consentContact}
        >
          Ich bin einverstanden, dass Powerhouse 360 mich zu dieser Anfrage
          per E-Mail oder Telefon kontaktiert.
        </ConsentCheckbox>
      </div>
    </div>
  );
}
