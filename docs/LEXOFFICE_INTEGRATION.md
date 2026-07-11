# POWERHOUSE 360 — Lexoffice-Integration

> Status: 🔵 Entwurf v1 (2026-07-11). Umsetzung Phase 10 (Adapter-Grundlagen ab Phase 1 im Datenmodell berücksichtigt).

## 1. Rollenverteilung

| System | führend für |
|---|---|
| Powerhouse 360 | abrechenbare Leistungen, Rechnungsanforderungen, Projekt-/Objektbezug, operative Zahlungssicht |
| Lexoffice | finale Rechnungsnummer, rechtsverbindlicher Beleg, buchhalterischer Belegstatus, buchhalterischer Zahlungsstatus |

Powerhouse erzeugt **nie selbst Rechnungsnummern**; im System existiert die Rechnung als `InvoiceRequest` → `InvoiceReference`.

## 2. Adapter (`packages/lexoffice-adapter`)

Einzige Stelle mit Lexoffice-API-Wissen. Funktionen:
- `upsertContact(customer)` → `AccountingContactReference` (ID-Mapping Customer ↔ Lexoffice-Kontakt; niemals Duplikate anlegen: erst Mapping prüfen, dann suchen, dann anlegen)
- `createInvoice(invoiceRequest)` → Lexoffice-Rechnungs-ID + Nummer (Positionen, Leistungszeitraum, Projekt-/Objektbezug im Positionstext)
- `getInvoiceStatus(id)` → Belegstatus, Zahlungsstatus, offener Betrag
- `createCreditNote(correctionRequest)` für Korrekturen
- Fehlerklassen: `RateLimited` (Backoff), `ValidationRejected` (kein Retry — Fehlerzustand sichtbar), `Unavailable` (Retry)

Konfiguration: `LEXOFFICE_API_KEY` je Umgebung (staging nutzt Testorganisation), Secrets nur im Deployment-Secret-Store.

## 3. Datenfluss

```
Modulbetrieb/Service erzeugt Charge / RecurringCharge
→ Abrechnungslogik bündelt je BillingPeriod/BillingAccount → InvoiceRequest (Status: pending)
→ Event invoice.requested → Worker-Job
→ Adapter: Kontakt sicherstellen → Rechnung anlegen
→ InvoiceReference (ID, Rechnungsnummer) speichern → invoice.created
→ zyklischer Sync (Worker, z. B. stündlich): Belegstatus + Zahlungsstatus → PaymentStatus
→ invoice.paid / invoice.overdue Events (Portal-Anzeige, Mahnwesen-Aufgaben)
```

## 4. Verlässlichkeitsregeln

1. **Idempotenz:** `InvoiceRequest.idempotencyKey` (unique) wird an Lexoffice-Aufrufe gebunden; Wiederholung eines Jobs erzeugt nie eine zweite Rechnung. Vor jedem Anlegen: Existenzprüfung über gespeicherte `InvoiceReference`.
2. **Retry:** transienter Fehler → Backoff-Retry (max N); danach `AccountingSyncError` mit sichtbarem Fehlerzustand im Admin und manueller Wiederholung (auditiert).
3. **Keine stillen Korrekturen:** Abweichungen (z. B. Rechnung in Lexoffice storniert) erzeugen Aufgaben, keine automatischen Datenänderungen.
4. **ID-Mapping nachvollziehbar:** `AccountingContactReference`/`InvoiceReference` speichern beide IDs + Umgebung + Sync-Zeitpunkte; Admin-Ansicht zeigt das Mapping.
5. **Audit:** jeder Sync-Lauf als `AccountingSync` (Start, Ende, Ergebnis, Fehlerzahl).

## 5. Übertragene Daten

Powerhouse → Lexoffice: Kundendaten (Name, Adresse, USt-Kontext), Rechnungspositionen (Bezeichnung, Menge, Einzelpreis, Steuersatz), Leistungszeiträume, Projekt-/Objektbezug (Textfeld), einmalige & wiederkehrende Leistungen, Korrekturanforderungen.
Lexoffice → Powerhouse: Kontakt-ID, Rechnungs-ID, Rechnungsnummer, Belegstatus, Rechnungs-PDF-Referenz, Zahlungsstatus, offener Betrag, Sync-Fehler.

## 6. Definition of Done (Phase 10)

Staging-E2E: abrechenbare Leistung → `InvoiceRequest` → Rechnung in Lexoffice-Testorganisation mit korrekten Positionen/Zeitraum → Rechnungsnummer zurück im System → Zahlungsstatus-Sync (manuell als bezahlt markiert → `invoice.paid`) → Doppelauslösung des Jobs erzeugt **keine** zweite Rechnung → Fehlerpfad (ungültige Daten) erzeugt sichtbaren `AccountingSyncError` mit funktionierendem manuellen Retry.
