# POWERHOUSE 360 — Zentrale Onboarding-Engine

> Status: 🔵 Entwurf v1 (2026-07-11). Umsetzung Phase 2; Documenso-Kopplung Phase 3.

## 1. Prinzip

Onboarding ist ein **eigener Kernbereich**, keine Sammlung fest codierter Formulare oder Funnels. Jede Modulaktivierung läuft als Instanz eines **versionierten Workflow-Templates**. Ein Template beschreibt Schritte, Verantwortliche, Abhängigkeiten, Bedingungen; die Engine führt Instanzen aus, verfolgt Status, erinnert, eskaliert und gibt am Ende die Aktivierung frei.

**Verbindliche Reihenfolge:** administratives Projekt-Onboarding (Organisation → Vertragspartner → Gebäude → Modulkonfiguration → Vertragsvorlagen → technische Voraussetzungen → Kommunikationsmaterial) ist abgeschlossen, **bevor** Bewohner-/Nutzer-Onboarding startet. Die Engine erzwingt das über eine Abhängigkeit zwischen den beiden Workflow-Ebenen.

## 2. Datenmodell

```
OnboardingTemplate ──< OnboardingTemplateVersion ──< OnboardingStepDefinition
                                                        │  (Reihenfolge, Abhängigkeiten via OnboardingDependency)
OnboardingWorkflow (Instanz) ─────────────────────────< OnboardingStepInstance
   │ projektbezogen (Projekt-Onboarding)                   │
   │ oder teilnehmerbezogen (je Bewohner/Nutzer)           ├─ OnboardingTask (interne Aufgabe)
   ├─< OnboardingParticipant (Rolle + Person/Contact)      ├─ OnboardingDocument (geforderte/gelieferte Doks)
   ├─< OnboardingInvitation (Token, Frist)                 ├─ OnboardingConsent (Zustimmungen)
   ├─< OnboardingDeadline / OnboardingReminder             ├─ OnboardingForm / OnboardingSubmission
   ├─< OnboardingException (dokumentierte Ausnahme)        ├─ OnboardingApproval (Freigabe durch Rolle)
   └─< OnboardingAuditEvent                                └─ Verweis: ContractId (Documenso-Schritt)
OnboardingTrigger: Event-Abos (z. B. contract.signed → Schritt abschließen)
OnboardingRequirement: maschinenprüfbare Bedingung (z. B. "alle Units importiert", "Hub online")
```

Eigenschaften eines Schritts (StepDefinition): Titel, Beschreibung, verantwortliche Rolle, Pflicht/optional, Reihenfolge, Abhängigkeiten, Eingabefelder (Formular-Schema), notwendige Dokumente, notwendige Verträge (ContractType + Template-Referenz), notwendige Zustimmung, Freigabebedingung, Frist, Erinnerungsregel, interne Aufgabe, automatischer Trigger, Erfolgsbedingung, Ausnahmebehandlung.

## 3. Statusmodell (Workflow-Ebene)

`Draft → Internal Preparation → Waiting for Customer → Waiting for Documents → Waiting for Contract → Waiting for Signature → Waiting for Approval → Ready for Invitations → Participant Onboarding → Technical Planning → Technical Implementation → Verification → Ready for Activation → Active`
Querstatus: `Blocked` (mit Grund + Verantwortlichem), `Cancelled`.

Schritt-Instanzen: `pending → in_progress → waiting (extern) → done | skipped(Exception) | failed`. Der Workflow-Status wird aus den Schritten abgeleitet (Engine-Logik, kein manuelles Setzen außer Blocked/Cancelled).

## 4. Schritt-Typen (Engine-Bausteine)

| Typ | Abschlussbedingung |
|---|---|
| `form` | valide `OnboardingSubmission` gegen Formular-Schema |
| `document_upload` | geforderte `OnboardingDocument`s vorhanden + ggf. Freigabe |
| `contract` | verknüpfter `Contract` hat Status `signed` (Documenso-bestätigt) — Regeln siehe unten |
| `consent` | `OnboardingConsent` erteilt (Zeitpunkt, Text-Version gespeichert) |
| `approval` | `OnboardingApproval` durch berechtigte Rolle |
| `internal_task` | verknüpfte `OnboardingTask`/`WorkOrder` abgeschlossen |
| `requirement` | `OnboardingRequirement`-Prüfung liefert true (automatisch, z. B. „Messkonzept hinterlegt", „Hub online", „Testladung erfolgreich") |
| `invitation` | Teilnehmer eingeladen + registriert |

## 5. Documenso-Kopplung (verbindlich)

Ein `contract`-Schritt (z. B. „Stromliefervertrag unterzeichnen") gilt **erst** als abgeschlossen, wenn:
1. der korrekte Vertrag aus der richtigen Template-Version erzeugt wurde,
2. alle erforderlichen Unterzeichner eingeladen wurden,
3. Documenso die vollständige Signatur final bestätigt hat (Webhook, verifiziert),
4. das finale Dokument gespeichert bzw. sicher referenziert ist (`Document` + Hash),
5. der Vertragsstatus im Powerhouse-System synchronisiert ist.

Die Engine abonniert `contract.signed`/`contract.failed` über `OnboardingTrigger`; fehlerhafte Webhooks können keinen Schritt abschließen, weil der Abschluss den in der DB bestätigten Vertragsstatus prüft, nicht den Webhook-Payload.

## 6. Ausführungslogik

- **Trigger-Verarbeitung** läuft im Worker über die Event-Handler-Registry (idempotent).
- **Fristen/Erinnerungen:** Scheduler prüft `OnboardingDeadline`; Erinnerungen als `Notification` (E-Mail/Portal), Eskalation als `OnboardingTask` an die verantwortliche interne Rolle.
- **Ausnahmen:** `OnboardingException` erlaubt dokumentiertes Überspringen (wer, warum, Risiko) — nur mit `onboarding.approve_exception`-Permission, immer auditiert.
- **Fortschritt** ist je Workflow als Prozent + Ampel ableitbar (für Portal-Statusanzeige und Admin-Übersicht).
- **Aktivierung:** letzter Schritt jedes Modul-Templates ist ein `requirement`-Bündel („Billing Readiness", „alle Pflichtgeräte installiert & getestet", „alle Pflichtverträge signiert"). Erfolg → `onboarding.ready_for_activation` → `ModuleActivation` (manuell bestätigt oder automatisch, je Template-Konfiguration) → `module.activated`.

## 7. Teilnehmergruppen

Powerhouse-Mitarbeiter, Hausverwaltung, Eigentümer, WEG/Beirat, technischer Ansprechpartner, Abrechnungsverantwortlicher, Installationspartner, Monteure, Bewohner, Mieter, Stellplatznutzer, externe Dienstleister — abgebildet als `OnboardingParticipant` mit Rolle; Einladungen erzeugen Portal-Zugänge mit passendem `AccessScope`.

## 8. Erste Templates (Phase 2/3-Lieferumfang)

1. **Projekt-Onboarding generisch** (Organisation bestätigen → Vertragspartner → Gebäude → Modul konfigurieren → Vertragsvorlagen bestimmen → technische Voraussetzungen → Kommunikationsmaterial → Freigabe Teilnehmer-Onboarding)
2. **Powermieter-Projekt + Teilnehmer** (siehe [MODULES/POWERMIETER.md](MODULES/POWERMIETER.md))
3. Danach je Modul ein Template gemäß Modul-Dokument.

Template-Änderungen erzeugen neue Versionen; laufende Workflows bleiben auf ihrer Version (kein stilles Umschreiben laufender Prozesse).
