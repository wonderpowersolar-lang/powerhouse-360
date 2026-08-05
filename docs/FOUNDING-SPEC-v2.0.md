# POWERHOUSE 360 — FOUNDING SPECIFICATION

**Das AI Operating System für Immobilien**

*Produktverfassung · Zielarchitektur · Commercial-to-Operations Blueprint · Agenten- und Betriebsmodell*

| Feld | Wert |
|---|---|
| Version | 2.0 — konsolidierte Vollfassung |
| Stand | 2. August 2026 |
| Unternehmen | AKL Powerhouse 360 GmbH |
| Status | Verbindliche strategische und technische Ausgangsbasis |
| Primärer Zweck | Leitdokument für Produkt, Architektur und AI-native Entwicklung |
| Geltungsbereich | CRM, Angebotskonfiguration, Customer Success, Projekte und Powerhouse Operations |

> **Leitsatz:** Ein Verkauf wird nicht übergeben. Er wird kontrolliert in ein betriebsfähiges Gebäude transformiert.

---

> **Hinweis zur Repo-Fassung.** Dies ist die unveränderte inhaltliche Übernahme von
> `Powerhouse_360_Gruendungsdokument_v2.0.docx` (Stand 2. August 2026) in das Repository,
> wie es §30 Woche 1 der Spec selbst verlangt. Nur die Formatierung wurde an Markdown angepasst.
> **Abweichungen und Konflikte zum [Masterplan](POWERHOUSE_360_MASTER_PLAN.md) und zu den
> [ADRs](DECISIONS/) sind nicht hier, sondern in [FOUNDING-SPEC-ABGLEICH.md](FOUNDING-SPEC-ABGLEICH.md)
> dokumentiert.** Dieses Dokument wird nicht inhaltlich editiert; Änderungen erfolgen versioniert
> über eine neue Fassung (§32).

---

## 1. Dokumentauftrag und Gebrauch

Dieses Dokument ist die verbindliche Produktverfassung und Zielarchitektur von Powerhouse 360. Es ist weder eine lose Ideensammlung noch ein einmaliger Coding-Prompt. Es definiert, welches Unternehmen und welches System gebaut werden, welche fachlichen Grenzen gelten, wie Entscheidungen dokumentiert werden und wie Menschen, Software und KI-Agenten zusammenarbeiten.

Jeder spätere Masterprompt, jede Implementierung und jede wesentliche Produktentscheidung muss mit diesem Dokument vereinbar sein oder eine ausdrücklich versionierte Änderung daran auslösen.

### Adressaten

- Geschäftsführung und Gründer
- Produktleitung und Domain Owner
- Software- und Plattformarchitekten
- Entwicklungsagenten wie Claude, Codex und weitere AI-Coding-Systeme
- Customer Success, Vertrieb, Projektsteuerung und Operations
- Externe Partner, Implementierer und spätere White-Label-Betreiber

### Verbindliche Arbeitsregeln

- Zuerst den fachlichen Ablauf, das Datenmodell, die Risiken und die Definition of Done verstehen; erst danach implementieren.
- Bestehende Architektur prüfen und verbessern, statt neue Parallelstrukturen oder Schatten-Datenbanken zu erzeugen.
- Keine Scheindemos, keine Mock-Logik in produktiven Pfaden und keine Fertigmeldung ohne realistischen E2E-Nachweis.
- Fachliche Regeln gehören in Domänenservices, Policies und versionierte Konfigurationen, nicht verteilt in UI-Komponenten.
- Automatisierung muss erklärbar, begrenzbar, auditierbar, reversibel und bei hohem Risiko freigabepflichtig sein.
- Jede Funktion wird für reale Rollen, reale Objekte, reale Fehlerfälle und einen vollständigen Arbeitsablauf entwickelt.
- Der Plan, die Architekturentscheidungen und der aktuelle Stand werden im Repository versioniert und fortlaufend verbessert.

### Dokumentstruktur

| **Teil** | **Inhalt** |
|---|---|
| A | Vision, Strategie, Produktprinzipien und Zielgruppen |
| B | End-to-End-Lebenszyklus vom Lead bis zum Betrieb |
| C | Domänen-, Daten-, Event- und Agentenarchitektur |
| D | Workspaces: Commercial, Delivery und Operations |
| E | Technische Architektur, Sicherheit, Integrationen und Engineering |
| F | Roadmap, Governance, Metriken, Risiken und Masterprompt-Charta |

## 2. Executive Summary

Powerhouse 360 wird das AI Operating System für Mehrfamilienhäuser und technische Immobilienportfolios. Die Plattform verbindet heute getrennte Welten: Leadgewinnung, Vertrieb, Angebotskalkulation, Fördermittel, Verträge, Customer Success, Projektsteuerung, Installation, Geräte- und Sensordaten, Bewohner-Onboarding, Energie- und Betriebskostenabrechnung, Zahlungen, Störungen, Dokumentation und Compliance.

Der kommerzielle Einstieg ist ein AI-natives Revenue- und CRM-System. Es führt Leads aller Powerhouse- und Wonderpower-Marken zusammen, priorisiert Chancen, steuert Kommunikation, erstellt konfigurierbare Angebote, erzeugt belastbare Forecasts und transformiert gewonnene Aufträge ohne Medienbruch in Customer-Success- und Umsetzungsprojekte. Das CRM ist kein getrenntes Vorsystem, sondern arbeitet auf demselben kanonischen Objekt- und Identitätsmodell wie die spätere Powerhouse-Betriebssoftware.

Das Herzstück ist der Commercial-to-Operations Lifecycle. Eine angenommene Angebotskonfiguration wird nicht als PDF archiviert und anschließend manuell neu erfasst. Sie wird zur versionierten Quelle für Vertrag, Leistungsumfang, Projektstruktur, Material- und Gerätebedarf, Onboarding, Modulaktivierung und produktive Provisionierung. Ein klarer Activation Handoff entscheidet, wann und mit welchen Daten Organisation, Gebäude, Einheiten, Rollen, Module, Tarife und Geräte in Powerhouse Operations aktiviert werden.

Die zentrale Nutzererfahrung ist nicht die eines traditionellen ERP. Menschen sollen nicht Daten für Software pflegen, sondern Ergebnisse steuern. Die Plattform zeigt Missionen, Entscheidungen, Ausnahmen, Risiken und von Agenten vorbereitete Arbeit. Spezialisierte Agenten übernehmen klar begrenzte Tätigkeiten. Paula ist die zentrale Assistentin und Orchestratorin, aber keine unkontrollierte Super-KI.

Technisch startet Powerhouse 360 als modularer Monolith mit klaren Bounded Contexts, gemeinsamer Identität, Postgres als System of Record, Outbox-Pattern, asynchronen Workflows und versionierten APIs. Hochlast- oder Spezialbereiche können später extrahiert werden. Datenschutz, Mandantentrennung, Auditierbarkeit, Messdatenintegrität und Agentensicherheit sind Produkteigenschaften und keine spätere Nachrüstung.

## 3. Vision, Mission und strategischer Anspruch

### Vision

Jede Immobilie besitzt eine verlässliche digitale Identität, einen aktuellen technischen Zwilling und ein eigenes Team aus Menschen und KI-Agenten, das Betrieb, Energie, Abrechnung und Kommunikation kontinuierlich verbessert.

### Mission

Powerhouse 360 reduziert die organisatorische Reibung zwischen Eigentümern, Hausverwaltungen, Bewohnern, Energieversorgern, Installateuren und technischen Anlagen. Die Plattform macht komplexe Prozesse ausführbar, messbar und verständlich – von der ersten Anfrage bis zum jahrzehntelangen Betrieb.

### Strategische These

Der nachhaltige Wettbewerbsvorteil entsteht nicht durch ein einzelnes KI-Modell. Er entsteht durch den strukturierten, historisierten und vertrauenswürdigen Kontext der Immobilie; durch tief integrierte Arbeitsabläufe; durch operative Daten aus realen Anlagen; und durch Agenten, die innerhalb klarer Rechte, Budgets und Policies auf diesem Kontext handeln können.

### Was ausdrücklich nicht gebaut wird

- Kein generisches CRM für beliebige Branchen.
- Kein loses Bündel von Einzellösungen mit getrennten Benutzerkonten und Datenbanken.
- Kein Chatbot ohne belastbaren Systemkontext und ohne kontrollierte Werkzeuge.
- Kein Dashboard-Friedhof ohne ausführbare Arbeit.
- Kein vollautonomes System für rechtliche, finanzielle oder sicherheitskritische Entscheidungen.
- Kein Hardware-Lock-in; der PowerHub ist bevorzugte Edge-Plattform, Integrationen bleiben offen.
- Kein Big-Bang-Microservice-Projekt, bevor reale Skalierungsgrenzen dies rechtfertigen.

## 4. Produktprinzipien

| **Prinzip** | **Verbindliche Bedeutung** |
|---|---|
| Outcome before software | Jede Oberfläche beginnt mit dem gewünschten Ergebnis, nicht mit internen Tabellen oder Modulgrenzen. |
| One building truth | Für jede reale Entität gibt es eine kanonische Identität und einen nachvollziehbaren Lebenszyklus. |
| Configure once, reuse everywhere | Verkaufs-, Vertrags- und Projektdaten werden einmal strukturiert erfasst und anschließend weiterverwendet. |
| Agents work on the same system | Agenten lesen und schreiben kontrolliert dieselben Domänenobjekte wie Menschen und hinterlassen dieselbe Audit-Spur. |
| Automation by confidence and risk | Autonomie richtet sich nach Konfidenz, finanzieller Tragweite, Reversibilität und regulatorischem Risiko. |
| Explain every consequential action | Jede wichtige Empfehlung und Aktion legt Datenbasis, Regel, Unsicherheit und erwartete Wirkung offen. |
| Events over hidden side effects | Geschäftsrelevante Veränderungen werden als versionierte Ereignisse modelliert. |
| Progressive disclosure | Standardfälle bleiben einfach; Experten können in Details, Regeln, Historie und Rohdaten wechseln. |
| Human accountability | Verantwortlichkeit, Freigabe und Eskalation bleiben bei benannten Rollen. |
| Platform from day one, services when earned | Klare Domänengrenzen im modularen Monolithen; Extraktion erst bei messbarem Bedarf. |
| Operational truth beats presentation | Die Quelle der Wahrheit ist der fachliche Zustand, nicht ein PDF, eine E-Mail oder ein Dashboard. |
| No silent handoffs | Jede Übergabe besitzt Abnahmekriterien, Verantwortliche, Fristen und einen nachvollziehbaren Zustand. |

## 5. Benchmark-Learnings und eigenständige Ableitung

### Centify

- Komplexe Backoffice-Prozesse werden als klare Wertgeschichte verkauft: weniger Fehler, weniger manuelle Arbeit, mehr Transparenz.
- Berechnungen benötigen Erklärbarkeit, Datenherkunft und nachvollziehbare Abweichungen.
- Freigaben, Streitfälle und Forecast sind Kernprozesse, keine Nebenfunktionen.
- Agenten werden nach konkreten Aufgaben benannt und in den Workflow eingebettet.
- Enterprise-Sicherheit, Datenstandort und Governance werden als Produktmerkmale behandelt.

### Attio, Linear, Stripe, Vercel und moderne Workbenches

- Flexible Datenmodelle und starke Relationen, ohne die fachlichen Kernobjekte aufzugeben.
- Schnelle, ruhige und tastaturfreundliche Workflows mit klaren Next Best Actions.
- APIs und Erweiterbarkeit sind Bestandteil des Produkts, nicht nur Integrationsprojekt.
- AI ergänzt einen strukturierten Workspace; sie ersetzt nicht die Domänenlogik.
- Gute Systeme zeigen zuerst Entscheidungen, Ausnahmen und Fortschritt, nicht die gesamte Datenmenge.

### Eigenständige Powerhouse-Ableitung

Powerhouse kombiniert Revenue Operations, Projektabwicklung und den realen technischen Betrieb einer Immobilie auf einem gemeinsamen Property Graph. Diese Verbindung ist der Kern des Produkts.

## 6. Zielgruppen, Rollen und Jobs-to-be-done

| **Rolle** | **Primärer Job-to-be-done** |
|---|---|
| Geschäftsführung | Portfolio, Wachstum, Risiken, Cashflow und operative Engpässe verstehen und steuern. |
| Vertrieb | Leads qualifizieren, Angebote konfigurieren, Entscheidungen beschleunigen und Forecast verbessern. |
| Sales Operations | Datenqualität, Pipeline, Provisionen, Regeln und Prozesse kontrollieren. |
| Customer Success | Kunden sauber übernehmen, Voraussetzungen herstellen und Time-to-Value verkürzen. |
| Projektleitung | Leistungsumfang in umsetzbare Arbeitspakete, Abhängigkeiten, Termine und Abnahmen überführen. |
| Technische Planung | Messkonzepte, Hardware, Zähler, Sensoren und Installationsanforderungen planen. |
| Monteur/Installateur | Vor Ort klare Aufgaben, Gerätezuordnung, Fotos, Messwerte und Abnahme erfassen. |
| Hausverwaltung | Objekte, Teilnehmer, Dokumente, Störungen und Kommunikation mit wenig Aufwand steuern. |
| Eigentümer/WEG | Transparenz über Wirtschaftlichkeit, Projektstand, Betrieb und Entscheidungen erhalten. |
| Bewohner/Mieter | Einfach onboarden, Verträge verstehen, Verbräuche sehen und Anliegen klären. |
| Abrechnung/Finance | Messdaten, Tarife, Rechnungen, Zahlungen und Korrekturen revisionsfähig verarbeiten. |
| Service/Operations | Störungen priorisieren, Geräte überwachen und nachhaltige Problemlösungen koordinieren. |
| Partner/White Label | Eigene Kunden und Portfolios auf derselben Plattform mit kontrollierter Marken- und Rechtekonfiguration betreiben. |

## 7. Das Zielerlebnis

### Arbeitslage statt Dashboard

Beim Öffnen sieht ein Nutzer keine Sammlung beliebiger Diagramme. Er sieht eine priorisierte Lage: Was braucht heute Aufmerksamkeit? Welche Entscheidungen blockieren Umsatz, Projekt oder Betrieb? Was haben Agenten vorbereitet? Welche Risiken entwickeln sich? Was kann freigegeben werden?

- Meine Missionen
- Entscheidungen und Freigaben
- Agenten-Arbeit zur Prüfung
- Risiken und Ausnahmen
- Termine und Fristen
- Portfolio-Signale
- Zuletzt veränderte Kunden- und Gebäudekontexte

### Universeller Kontext

Jede relevante Oberfläche besitzt einen Kontextkopf: Organisation, Kunde, Portfolio, Objekt, Projekt oder Opportunity. Aktivitäten, Dokumente, Kommunikation, Aufgaben, Entscheidungen und Agentenläufe sind in einer gemeinsamen Timeline sichtbar.

### Command Center

Eine globale Suche und Command Palette ermöglicht Navigation und Aktionen über natürliche Sprache und strukturierte Befehle. Aktionen werden nie nur als Textantwort ausgegeben, sondern als prüfbare Vorschläge, Commands oder Workflow-Schritte.

### Mobile und Vor-Ort

Installateur- und Vor-Ort-Workflows sind offline-fähig, scan-orientiert und auf wenige große Schritte reduziert. Geräte, Sensoren und Einheiten werden über QR-/Barcode, Seriennummer und visuelle Zuordnung erfasst. Jede Vor-Ort-Aktion kann Fotos, Messwerte, Signatur und Geoplausibilität enthalten.

## 8. Commercial-to-Operations Lifecycle

Lead → Qualifizierung → Lösungskonfiguration → Kalkulation → Angebot → Vertrag → Customer Success → Projektsteuerung → Technical Readiness → Provisionierung → Inbetriebnahme → Operations

### Grundsatz

Ein Verkauf wird nicht an eine andere Abteilung übergeben. Er wird über kontrollierte Zustandsübergänge in ein betriebsfähiges Gebäude transformiert. Jeder Übergang besitzt einen fachlichen Eigentümer, Eingangskriterien, Ergebnisartefakte, Qualitätsprüfungen und Eskalationsregeln.

### Lebenszyklus-Gates

| **Gate** | **Eingangskriterien / Ergebnis** | **Leitereignis** |
|---|---|---|
| G0 Intake Ready | Lead-Quelle, Kontakt, Einwilligung und Mindestkontext sind vorhanden. | LeadAccepted |
| G1 Qualified | Problem, Objekt, Entscheider, Timing, Budgetrahmen und nächster Schritt sind plausibel. | OpportunityQualified |
| G2 Solution Ready | Module, Leistungen, Hardware, Annahmen und technische Unbekannte sind strukturiert. | SolutionConfigured |
| G3 Commercial Ready | Preis, Marge, Zahlungsplan, Laufzeit und Freigaben sind vollständig. | QuoteApproved |
| G4 Contracted | Angebot/Vertrag wurde gültig angenommen; relevante Mandate und Dokumente liegen vor. | ContractActivated |
| G5 Handoff Accepted | Customer Success und Projektleitung haben Umfang, Risiken und Voraussetzungen angenommen. | DeliveryHandoffAccepted |
| G6 Technical Ready | Objektstruktur, Messkonzept, Hardware, Stakeholder und Terminplan sind ausreichend geklärt. | TechnicalReadinessConfirmed |
| G7 Provisioned | Organisation, Gebäude, Einheiten, Rollen, Module und Grundkonfiguration sind in Operations angelegt. | PowerhouseTenantProvisioned |
| G8 Live | Geräte und Prozesse sind aktiviert, Datenqualität ist geprüft, Abnahme erfolgt. | OperationalHandoverCompleted |

### Handoff Packet

Jeder Übergang erzeugt kein Freitextprotokoll, sondern ein versioniertes Handoff Packet. Es enthält den bestätigten Leistungsumfang, Annahmen, Ausschlüsse, Verantwortliche, Risiken, offene Punkte, Termine, Dokumente, kommerzielle Parameter und technische Konfiguration. Empfänger können annehmen, mit Auflagen annehmen oder zurückweisen.

### Keine doppelte Datenerfassung

- Kontakte, Organisationen, Immobilien und Einheiten werden referenziert statt kopiert.
- Angebotspositionen werden zu Deliverables und Arbeitspaketen transformiert.
- Vertragliche Zusagen werden als überprüfbare Commitments gespeichert.
- Hardwarepositionen werden zu geplanten Assets und später zu installierten Geräten.
- Projektabschluss aktiviert Operations-Konfigurationen; er erzeugt keine unabhängige Schattenstruktur.

## 9. Commercial Workspace: AI-native CRM

### Zweck

Der Commercial Workspace verbindet Lead Intake, Relationship Intelligence, Opportunity Management, Lösungskonfiguration, Angebot, Forecast, Provisionen und Abschluss. Er dient nicht der passiven Datensammlung, sondern der aktiven Steuerung der nächsten besten Handlung.

### Kernobjekte

| **Objekt** | **Bedeutung** |
|---|---|
| Lead | Ungeprüfter oder neu eingegangener potenzieller Bedarf. |
| Account | Organisation oder Kundengruppe mit Beziehungen, Portfolios und kommerzieller Historie. |
| Contact | Natürliche Person mit Rollen, Einwilligungen und Beziehungen. |
| Opportunity | Konkrete Verkaufschance mit Problem, Scope, Wert, Wahrscheinlichkeit und Prozess. |
| Buying Committee | Entscheider, Nutzer, Blocker, Befürworter und deren Einfluss. |
| Activity | E-Mail, Anruf, Meeting, Notiz, Formular, Kampagnensignal oder Systemereignis. |
| Next Best Action | Begründete Empfehlung mit Frist, Verantwortlichem und erwarteter Wirkung. |
| Forecast Item | Versionierte Einschätzung von Betrag, Wahrscheinlichkeit, Zeitraum und Konfidenz. |
| Quote | Versioniertes, kundenfähiges Angebot auf Basis einer Solution Configuration. |
| Commission Case | Regelbasierter Provisionsanspruch mit Berechnung, Freigabe und Streitfall. |

### Lead Routing und Qualifizierung

- Alle Marken und Kanäle nutzen eine gemeinsame Intake API mit Source Attribution.
- Dubletten werden über Organisation, Adresse, Domain, Telefon und Objektbezug erkannt.
- Routing berücksichtigt Region, Produkt, Objektart, Kapazität, Priorität und Bestandsbeziehung.
- Qualifizierung verwendet explizite Kriterien und dokumentiert Annahmen statt verdeckter Scores.
- Agenten dürfen Informationen anreichern und vorbereiten; endgültige Qualifizierung kann rollenabhängig freigabepflichtig sein.

### Pipeline und Forecast

Pipeline-Stufen sind pro Verkaufsbewegung konfigurierbar, aber nicht beliebig. Jede Stufe besitzt Eintritts- und Austrittskriterien. Forecasts unterscheiden gewichteten Wert, Commit, Best Case, Risiko und Konfidenz. Änderungen werden historisiert und mit Gründen versehen.

### Won Deal Handoff

Ein Abschluss ist erst vollständig, wenn der Delivery Handoff vorbereitet und angenommen wurde. Fehlende Voraussetzungen, nicht strukturierte Sonderzusagen oder unklare technische Annahmen verhindern ein stilles Won-Label und erzeugen eine sichtbare Ausnahme.

## 10. Angebotskonfigurator und Commercial Engine

### Produktauftrag

Der Angebotskonfigurator ist kein Preisrechner. Er ist die regelbasierte Übersetzung eines Kunden- und Objektbedarfs in eine technisch, kommerziell und operativ ausführbare Lösung.

### Eingangsdaten

- Kunde, Organisation, Portfolio, Objektart, Gebäude und Wohneinheiten.
- Gewünschte Module: PowerMieter, HeatMieter, ChargeMieter, SmokeMieter, PowerWRX und zukünftige Module.
- Bestandsanlagen, Hausanschlüsse, Zählerstruktur, Messkonzept, Kommunikationsinfrastruktur und technische Einschränkungen.
- Leistungsumfang, einmalige und wiederkehrende Services, Laufzeiten, SLA und Onboarding.
- Hardware, PowerHub, Gateways, Router, Sensoren, Zähler, Relais, Zubehör und Installationsaufwand.
- Förderprogramme, Finanzierung, Steuern, Rabatte, Partnerkonditionen und regionale Besonderheiten.
- Annahmen, Ausschlüsse, Risiken und noch zu klärende technische Fragen.

### Kanonische Konfigurationsobjekte

| **Objekt** | **Funktion** |
|---|---|
| Product Catalog | Versionierte Produkte, Module, Services, Hardware und Bündel. |
| Feature/Capability | Fachliche Fähigkeit, die durch ein Produkt oder Modul bereitgestellt wird. |
| Product Rule | Kompatibilität, Voraussetzung, Ausschluss, Mindestmenge oder Abhängigkeit. |
| Price Book | Zeitlich gültige Preislisten je Markt, Kanal, Segment oder Partner. |
| Pricing Rule | Staffel, Mindestpreis, Rabattgrenze, Wiederkehrung, Indexierung und Einmalpreis. |
| Cost Model | Interne Kosten, Beschaffung, Stunden, Gemeinkosten und Risikopuffer. |
| Solution Configuration | Versionierte Zusammenstellung für einen konkreten Kunden und Objektkontext. |
| Configuration Item | Produkt, Menge, Zeitraum, Standort, Abhängigkeit, Preis und Kosten. |
| Assumption | Explizite Annahme mit Eigentümer, Quelle und Validierungsstatus. |
| Exclusion | Nicht geschuldete Leistung oder klarer Scope-Ausschluss. |
| Approval Request | Freigabe für Rabatt, Marge, Sonderklausel, Risiko oder Abweichung. |
| Quote Version | Unveränderliche Angebotsversion mit Snapshot der Regeln und Preise. |
| Deliverable Template | Übersetzung einer Position in Projekt- und Abnahmeartefakte. |

### Konfigurationslogik

- Regeln sind deklarativ, versioniert, testbar und zeitlich gültig.
- Jede automatische Ergänzung oder Ablehnung erklärt die auslösende Regel.
- Mengen können aus Wohneinheiten, Gebäuden, Zählpunkten, Geräten oder Leistungsparametern abgeleitet werden.
- Pakete können Pflichtbestandteile, Optionen und alternative Varianten enthalten.
- Konfigurationen unterstützen Szenarien wie Good/Better/Best, Kauf/Miete oder Pilot/Rollout.
- Nicht validierte Annahmen beeinflussen Risikopuffer, Gültigkeit oder Freigabepflicht.
- Die finale Angebotsversion friert Regeln, Preisbuch, Steuern, Texte, Anlagen und Kalkulation als Snapshot ein.

### Preis-, Kosten- und Margenmodell

Das System trennt Listenpreis, kundenspezifischen Preis, interne Kosten, Partneranteil, Förderung, Zahlungsplan, Deckungsbeitrag und Cashflow. Margenregeln werden nicht nur auf Gesamtangebotsebene, sondern nach Produktgruppe und Risiko geprüft. Rabatte benötigen Grund, Verantwortlichen und gegebenenfalls Freigabe.

### Ausgaben des Konfigurators

- Interne Kalkulation und Freigabeansicht.
- Kundenfähiges Angebot mit Varianten und verständlicher Wertargumentation.
- Leistungsbeschreibung, Annahmen, Ausschlüsse und technische Anlagen.
- Vertrag bzw. Documenso-Vorlage mit strukturiertem Feldmapping.
- Zahlungs- und SEPA-Plan für GoCardless oder weitere Provider.
- Vorläufige Stückliste und geplante Assets.
- Projektvorlage mit Deliverables, Arbeitspaketen, Meilensteinen und Abnahmekriterien.
- Activation Manifest für die spätere Powerhouse-Provisionierung.

### Freigabematrix

| **Auslöser** | **Beispiel** | **Erforderliche Freigabe** |
|---|---|---|
| Rabatt | Rabatt über rollenbezogener Grenze | Sales Lead / Geschäftsführung |
| Marge | Deckungsbeitrag unter Zielkorridor | Geschäftsführung / Finance |
| Technische Unsicherheit | Messkonzept oder Netzanschluss ungeklärt | Technische Planung |
| Rechtliche Abweichung | Sonderklausel oder Haftungsänderung | Berechtigte Vertragsrolle |
| Zahlungsrisiko | Ungewöhnlicher Zahlungsplan oder Vorleistung | Finance |
| Safety/Compliance | Steuerung sicherheitskritischer Anlagen | Technische Verantwortung / Compliance |

## 11. Vertrags-, Dokumenten- und Zahlungsfluss

### Contract Lifecycle

Ein Vertrag ist ein versioniertes fachliches Objekt mit Parteien, Rollen, Leistungsumfang, Preis, Laufzeit, Kündigung, Verpflichtungen, Dokumenten und Statusmaschine. Das signierte PDF ist ein Beweisartefakt, aber nicht die einzige Datenquelle.

### Documenso

- Vorlagen und Feldmapping werden versioniert.
- Signaturstatus und Parteien werden über Webhooks synchronisiert.
- Vertragsinhalte werden aus der freigegebenen Quote generiert.
- Änderungen nach Signatur erfolgen über Amendment oder neue Vertragsversion, nicht durch Überschreiben.
- Signaturartefakte, Hash, Zeitstempel und Provider-ID werden revisionsfähig gespeichert.

### GoCardless und Zahlungen

- Mandate, Einzüge, Rücklastschriften und Auszahlungen werden als Provider Events verarbeitet.
- Interne Zahlungszustände sind vom Provider getrennt und werden abgeglichen.
- Jeder Zahlungsplan referenziert Vertrag und kommerzielle Positionen.
- Fehler und Rücklastschriften erzeugen Aufgaben, Kommunikationsvorlagen und Eskalationen.

## 12. Delivery Workspace: Customer Success

### Zweck

Customer Success ist die kontrollierte Brücke zwischen Verkauf und Umsetzung. Ziel ist nicht nur Kundenzufriedenheit, sondern die schnelle Herstellung aller organisatorischen, vertraglichen und datenbezogenen Voraussetzungen für einen erfolgreichen Projektstart und späteren Betrieb.

### Customer Success Record

- Kundenziele und zugesagte Outcomes.
- Verkaufte Module, Services und Vertragsparameter.
- Ansprechpartner, Entscheider, Betreiberrollen und Kommunikationspräferenzen.
- Offene Voraussetzungen, Dokumente, Freigaben und Risiken.
- Onboarding-Plan, Termine, Health Score und Time-to-Value.
- Erwartungsmanagement: Annahmen, Ausschlüsse, Sonderzusagen und Eskalationswege.

### Onboarding Journeys

Journeys sind wiederverwendbare, versionierte Vorlagen für Hausverwaltung, Eigentümer/WEG, Betreiber, Bewohner, Installationspartner und interne Rollen. Sie kombinieren Aufgaben, Formulare, Dokumente, Kommunikation, Freigaben und Bedingungen.

### Handoff Acceptance

Customer Success muss die Übergabe aktiv annehmen. Das System prüft, ob Scope, Ansprechpartner, Vertragsstatus, Zahlungsgrundlage, technische Annahmen und nächste Schritte vollständig genug sind. Abweichungen werden als Blocker oder Auflagen festgehalten.

### Customer Success Agent

- Erstellt aus dem gewonnenen Deal eine Handoff-Zusammenfassung.
- Erkennt fehlende Ansprechpartner, Unterlagen und Voraussetzungen.
- Bereitet Einführungs- und Kickoff-Termine vor.
- Erstellt Kommunikationsentwürfe und Erinnerungen.
- Überwacht Health, Blocker und Time-to-Value.
- Eskaliert Zusagen, die im Projekt oder Betrieb gefährdet sind.

## 13. Delivery Workspace: Projektsteuerung

### Projektentstehung

Das Projekt wird aus der angenommenen Solution Configuration und den Deliverable Templates erzeugt. Die Projektleitung startet nicht mit einem leeren Board. Sie erhält einen strukturierten Scope, geplante Assets, Abnahmen, Annahmen, Risiken und kommerzielle Referenzen.

### Projektobjekte

| **Objekt** | **Funktion** |
|---|---|
| Implementation Project | Operative Umsetzung eines oder mehrerer Verträge/Objekte. |
| Workstream | Fachlicher Strang wie Planung, Hardware, Installation, Onboarding oder Billing. |
| Deliverable | Geschuldetes Ergebnis mit Akzeptanzkriterien. |
| Work Package | Ausführbarer Aufgabenblock mit Abhängigkeiten, Aufwand und Verantwortlichen. |
| Milestone | Entscheidender Termin oder Gate. |
| Dependency | Fachliche, terminliche oder externe Abhängigkeit. |
| Risk/Issue | Unsicherheit oder eingetretenes Problem mit Bewertung und Maßnahme. |
| Planned Asset | Noch nicht installiertes Gerät oder Material aus dem Angebot. |
| Site Visit | Vor-Ort-Termin mit Checkliste, Fotos, Messungen und Ergebnis. |
| Acceptance | Formelle oder technische Abnahme eines Deliverables. |
| Change Request | Kontrollierte Scope-, Preis- oder Terminänderung. |
| Project Handoff | Übergabe von Projekt zu Operations mit Readiness-Nachweisen. |

### Standard-Workstreams

- Objektaufnahme und Bestandsdaten
- Technische Planung und Messkonzept
- Netzbetreiber-/Förder-/Genehmigungsprozesse
- Beschaffung und Logistik
- PowerHub-, Gateway-, Zähler- und Sensorinstallation
- Vertrags- und Teilnehmer-Onboarding
- Bewohner- und Hausverwaltungskommunikation
- Systemkonfiguration und Datenmigration
- Inbetriebnahme, Datenqualität und Abrechnungstest
- Dokumentation, Abnahme und Operations-Handoff

### Change Control

Abweichungen vom angebotenen Scope werden nicht informell in Aufgaben versteckt. Change Requests zeigen Ursache, Auswirkungen auf Preis, Marge, Termin, Risiko und Vertrag. Nach Freigabe aktualisieren sie Projekt, Quote/Amendment und gegebenenfalls Activation Manifest.

### Definition of Ready und Done

Jedes Work Package besitzt Eingangsvoraussetzungen und Abnahmekriterien. Ein Arbeitspaket kann nicht nur „erledigt“ sein, sondern wird mit Artefakten, Prüfer, Datum und gegebenenfalls Messwerten oder Fotos abgeschlossen.

## 14. Activation Handoff in Powerhouse Operations

### Zweck

Die produktive Powerhouse-Software wird nicht mit unvollständigen Vertriebsdaten gefüllt. Der Activation Handoff ist ein kontrollierter Provisionierungsprozess. Er erzeugt oder aktiviert operative Strukturen erst, wenn definierte Mindestanforderungen erfüllt sind.

### Activation Manifest

Das Manifest ist ein versioniertes, maschinenlesbares Paket, das den freigegebenen Zielzustand beschreibt: Mandant, Organisation, Portfolio, Gebäude, Einheiten, Rollen, gebuchte Module, Tarife, Verträge, geplante Assets, Integrationen, Onboarding-Journeys und Betriebsverantwortung.

### Readiness Checks

- Vertrag und Zahlungsgrundlage aktiv.
- Organisation und vertretungsberechtigte Rollen verifiziert.
- Gebäude- und Einheitenstruktur ausreichend geprüft.
- Gebuchte Module und Leistungsumfang bestätigt.
- Technische Grunddaten, Messkonzept und relevante Zählpunkte geklärt.
- Hardware und Gerätezuordnungen geplant oder installiert.
- Datenschutz, Einwilligungen und Auftragsverarbeitung geklärt.
- Betriebs-, Support- und Eskalationsverantwortung festgelegt.
- Datenmigration oder Import validiert.
- Kritische Blocker geschlossen oder ausdrücklich akzeptiert.

### Provisionierungsablauf

- Activation Manifest erzeugen und gegen Schema validieren.
- Dry Run durchführen: Dubletten, Rechte, Konflikte und fehlende Referenzen prüfen.
- Menschliche Freigabe entsprechend Risikoklasse einholen.
- Idempotenten Provisionierungs-Command ausführen.
- Organisation, Gebäude, Einheiten, Rollen und Module anlegen oder aktivieren.
- Integrationen, Tarife, Journeys und geplante Assets verbinden.
- Provisioning Report und Audit Events erzeugen.
- Operations Owner und Customer Success informieren.
- Go-Live-Checks und erste Datenqualitätsprüfung durchführen.

### Leitereignisse

| **Event** | **Bedeutung** |
|---|---|
| DeliveryHandoffAccepted | Der gewonnene Auftrag wurde fachlich von Delivery angenommen. |
| ImplementationProjectCreated | Das Umsetzungsprojekt wurde aus der Konfiguration erzeugt. |
| TechnicalReadinessConfirmed | Technische Mindestvoraussetzungen sind erfüllt. |
| ActivationManifestApproved | Das Zielbild für Operations wurde freigegeben. |
| PowerhouseTenantProvisioned | Operative Mandanten- und Objektstrukturen wurden angelegt. |
| ModulesActivated | Gebuchte Module wurden konfiguriert und aktiviert. |
| OperationalHandoverCompleted | Projekt, Customer Success und Operations haben den Go-Live bestätigt. |

## 15. Powerhouse Operations und Module

### Gemeinsamer Operations-Kern

Powerhouse Operations verwaltet produktive Immobilien, Beteiligte, technische Assets, Messdaten, Verträge, Abrechnung, Service und Compliance. Module nutzen denselben Property Graph und dürfen Kernentitäten nicht duplizieren.

### PowerMieter

- Mieterstromprojekte, Teilnehmer, Tarife und Vertragsbeziehungen
- Messkonzepte, Zählpunkte, 15-Minuten-/Tages-/Monatsaggregation
- Erzeugung, Bezug, Speicher, Eigenverbrauch und Verteilung
- Rechnung, SEPA, Korrektur, Dispute und verständliche Abrechnungserklärung

### HeatMieter

- Fernauslesbare Wärme- und Wasserzähler
- Heizkostenverteilung, Nutzerwechsel und Abrechnungsperioden
- Geräte- und Datenqualitätsüberwachung
- Bewohnerinformationen und rechts-/regelkonforme Nachweise

### ChargeMieter

- Wallboxen, Ladepunkte, Nutzer und Berechtigungen
- Messung, Tarife, Verteilung, Abrechnung und Lastmanagement
- Planung und Ausbau von Ladeinfrastruktur im Mehrfamilienhaus
- Förder- und Projektbezug

### SmokeMieter

- Rauchwarnmelderbestand, Status, Batterie und Ferninspektion
- Prüfzyklen, Ereignisse, Nachweise und Eskalationen
- Bewohnerkommunikation und Terminvermeidung
- Sicherheitskritische Aktionen mit strengen Policies

### PowerWRX

- Serviceanfragen, Medien, Triage und Freigabelogik
- Terminabstimmung mit Mietern und Handwerkern
- Leistung, Abnahme, Dokumentation und Rechnung
- WhatsApp-/E-Mail-Kommunikation als kontrollierte Kanäle

### PowerHub

- Edge Gateway für LoRaWAN, Modbus, lokale Geräte und sichere Cloud-Verbindung
- Lokale Pufferung, Store-and-Forward und Degradationsmodus
- Geräteidentität, Provisionierung, Zertifikate und OTA-Updates
- Monteurkonsole und vereinfachte Kundeninformationen

## 16. Fachliche Zielarchitektur und Bounded Contexts

| **Bounded Context** | **Verantwortung** |
|---|---|
| Identity & Access | Mandanten, Nutzer, Rollen, Scopes, Delegationen und Agentenidentitäten. |
| Organizations & Relationships | Accounts, Kontakte, Rollen, Beteiligungen und Beziehungen. |
| Property Graph | Portfolios, Liegenschaften, Gebäude, Eingänge, Einheiten, Räume und technische Orte. |
| Revenue | Leads, Opportunities, Aktivitäten, Forecast, Provisionen und Pipeline. |
| Product Configuration | Katalog, Regeln, Preise, Kosten, Konfiguration, Quote und Freigaben. |
| Contracts | Verträge, Amendments, Verpflichtungen, Signaturen und Laufzeiten. |
| Customer Success | Handoffs, Journeys, Health, Ziele, Blocker und Adoption. |
| Projects & Delivery | Projekte, Workstreams, Deliverables, Aufgaben, Risiken, Assets und Abnahmen. |
| Provisioning | Activation Manifest, Readiness, Dry Run und Operations-Aktivierung. |
| Assets & Devices | Hardware, Geräte, Sensoren, Firmware, Zuordnung und Lifecycle. |
| Telemetry & Metering | Messpunkte, Rohdaten, Quality Flags, Aggregation und Korrekturen. |
| Billing & Ledger | Tarife, Perioden, Rechnungen, Gutschriften, Zahlungen und Disputes. |
| Communications | E-Mail, SMS, WhatsApp, Vorlagen, Einwilligungen und Conversation Timeline. |
| Service | Tickets, Triage, Termine, SLA, Maßnahmen und Abnahme. |
| Compliance & Documents | Pflichten, Nachweise, Aufbewahrung, Freigaben und Audit. |
| Agents & Automation | Agenten, Tools, Runs, Policies, Evaluations und Budgets. |
| Analytics | Metriken, semantische Definitionen, Forecasts und Portfolio-Signale. |

## 17. Kanonisches Objekt- und Beziehungsmodell

### Modellierungsregeln

- Jede Entität besitzt eine unveränderliche interne ID; externe IDs werden namespaced gespeichert.
- Zeitliche Beziehungen verwenden valid_from und valid_to; historische Wahrheit wird nicht überschrieben.
- Kritische Zustände verwenden explizite State Machines statt Freitextstatus.
- Geld-, Vertrags-, Mess- und Compliance-Werte tragen Quelle, Version und Zeitbezug.
- Flexible Custom Fields sind erlaubt, ersetzen aber keine kanonischen Kernobjekte.
- Dokumente werden mit fachlichen Objekten verbunden; ihr Inhalt wird nicht zur alleinigen Wahrheit.
- Personen, Rollen und Verantwortlichkeiten werden als zeitlich gültige Beziehungen modelliert.

### Kernhierarchie

Tenant → Organization → Portfolio → Site/Property → Building → Entrance → Unit → Space/Technical Location. Assets, Metering Points, Contracts, Projects und Stakeholders werden über typisierte Beziehungen angebunden.

### Cross-Domain-Identität

Commercial, Delivery und Operations verwenden dieselben IDs für Organisation, Kontakt und Immobilie. Ein Opportunity Property Context kann zunächst unbestätigt sein und wird nach Validierung mit dem kanonischen Property-Objekt verknüpft. Merge- und Split-Vorgänge sind auditierbar.

### Versionierung und Snapshots

Transaktionale Wahrheit wird normalisiert gespeichert. Für Angebote, Verträge, Abrechnung und Handoffs werden unveränderliche Snapshots erzeugt, damit historische Entscheidungen reproduzierbar bleiben.

## 18. Event-, Workflow- und Zustandsarchitektur

### Domain Events

Ein Domain Event beschreibt eine fachlich relevante, bereits eingetretene Tatsache. Es besitzt Event-ID, Schema-Version, Tenant, Aggregate, Actor, Zeit, Correlation, Causation und Payload. Events werden über eine transaktionale Outbox veröffentlicht.

### Commands

Commands sind beabsichtigte Zustandsänderungen mit Autorisierung, Idempotency Key und Validierung. Agenten führen keine direkten Datenbankänderungen aus, sondern nutzen dieselben Commands wie Menschen und Integrationen.

### Workflows

Langlebige Prozesse wie Vertrag, Onboarding, Projekt, Provisionierung, Abrechnungsperioden oder Geräteaustausch werden als explizite Workflows mit Zustand, Timeout, Retry, Compensation und manuellen Tasks modelliert.

### Beispielkette

QuoteAccepted → ContractDraftRequested → SignatureCompleted → ContractActivated → DeliveryHandoffPrepared → DeliveryHandoffAccepted → ImplementationProjectCreated → TechnicalReadinessConfirmed → ActivationManifestApproved → PowerhouseTenantProvisioned → OperationalHandoverCompleted.

### Fehler- und Wiederholungsmodell

- Idempotente Handler
- Retry mit Backoff und Dead-Letter Queue
- Manuelle Wiederaufnahme
- Kompensierende Aktionen statt unkontrolliertem Rollback
- Korrelation über den gesamten Lebenszyklus
- Sichtbare Ausnahmen mit Eigentümer und SLA

## 19. AI-Agentensystem

### Grundmodell

Agenten sind benannte digitale Mitarbeiter mit Zweck, Tools, Datenzugriff, Budget, Autonomiegrad, Evaluationssätzen und Eskalationsregeln. Sie sind keine Personas ohne Verantwortungsgrenze.

### Agentenverzeichnis

| **Agent** | **Kernauftrag** |
|---|---|
| Paula | Zentrale Assistenz, Kontextnavigation, Aufgabenkoordination und sichere Orchestrierung. |
| Lead Agent | Intake, Dublettenprüfung, Anreicherung und Routing. |
| Sales Agent | Next Best Actions, Vorbereitung, Follow-up und Deal-Risiken. |
| Forecast Agent | Pipeline-Prognose, Konfidenz und Abweichungsanalyse. |
| Proposal Agent | Lösungskonfiguration, Varianten, Kalkulation und Angebotsentwurf. |
| Approval Agent | Prüft Rabatt, Marge, Risiko und Freigabepfade. |
| Contract Agent | Vertragsdaten, Vorlagen, Signaturprozess und Verpflichtungen. |
| Commission Agent | Provisionsberechnung, Erklärung, Freigabe und Auszahlungsvorbereitung. |
| Dispute Agent | Klärt Streitfälle zu Provisionen, Rechnungen oder Messwerten. |
| Customer Success Agent | Handoff, Onboarding, Health und Time-to-Value. |
| Project Agent | Projektgenerierung, Abhängigkeiten, Risiken und Status. |
| Planning Agent | Technische Voraussetzungen, Messkonzept und Asset-Planung. |
| Installer Agent | Vor-Ort-Anweisungen, Gerätezuordnung und Qualitätsprüfung. |
| Provisioning Agent | Activation Manifest, Dry Run und kontrollierte Aktivierung. |
| Meter Agent | Messdatenqualität, Ausfälle und Plausibilität. |
| Billing Agent | Periodenschluss, Rechnungserklärung und Ausnahmen. |
| Energy Agent | Erzeugung, Verbrauch, Speicher und Optimierung. |
| Service Agent | Ticket-Triage, Terminierung, Kommunikation und Abschluss. |
| Compliance Agent | Pflichten, Fristen, Nachweise und Eskalationen. |
| Funding Agent | Förderprogramme, Eignung, Unterlagen und Fristen. |
| Portfolio Agent | Priorisiert Chancen, Risiken und Maßnahmen über viele Immobilien. |

### Autonomiestufen

| **Stufe** | **Erlaubnis** | **Beispiel** |
|---|---|---|
| A0 – Observe | Lesen und analysieren | Risiko erkennen |
| A1 – Draft | Entwurf erzeugen | E-Mail oder Angebot vorbereiten |
| A2 – Recommend | Aktion mit Begründung empfehlen | Next Best Action |
| A3 – Execute reversible | Niedrigrisikoaktion ausführen | Interne Aufgabe anlegen |
| A4 – Execute with approval | Nach menschlicher Freigabe ausführen | Vertrag senden, Mandant provisionieren |
| A5 – Restricted autonomy | Eng definierte automatische Policy | Erinnerung nach bestätigter Frist |

### Agenten-Sicherheitsregeln

- Jeder Tool-Aufruf ist authentifiziert, autorisiert und auditierbar.
- Schreibrechte werden feiner als Leserechte vergeben.
- Prompt-Inhalte sind niemals Autoritätsquelle für Berechtigungen.
- Strukturierte Outputs werden gegen Schemas validiert.
- Agenten müssen Unsicherheit anzeigen und dürfen fehlende Fakten nicht erfinden.
- Finanzielle, rechtliche, personenbezogene und sicherheitskritische Aktionen haben erhöhte Policies.
- Kosten-, Laufzeit- und Tool-Budgets begrenzen Agentenläufe.
- Jeder Agent besitzt Offline-Evaluationen und produktive Qualitätsmetriken.

## 20. Berechtigungs-, Mandanten- und Governance-Modell

### Mandantentrennung

Jeder Zugriff ist tenant- und scope-gebunden. Organisationen können Portfolios oder Objekte delegieren, ohne globale Datenzugriffe zu gewähren. White-Label-Partner können eigene Untermandanten verwalten, ohne Powerhouse-Kernrechte zu erhalten.

### Rollen und Policies

RBAC bildet Grundrollen; ABAC/Policy-Regeln berücksichtigen Objektbezug, Region, Vertrag, Risikoklasse, Betrag, Aktion und Agentenidentität. Sensible Aktionen können Vier-Augen- oder Zweckbindungsfreigaben verlangen.

### Audit

Audit Events enthalten Actor, Agent/Tool, Aktion, Objekt, Vorher/Nachher, Grund, Quelle, Correlation, Zeit und Freigabekette. Audit-Daten sind unveränderlich, exportierbar und von normalen Aktivitätsfeeds getrennt.

## 21. Billing-, Messdaten- und Revisionsprinzipien

- Rohmesswerte sind unveränderlich; Korrekturen erfolgen als gekennzeichnete Adjustments.
- Jeder Wert besitzt Zeit, Einheit, Quality Flag, Quelle, Import-ID und gegebenenfalls Signatur/Hash.
- Tarife und Verteilregeln sind versioniert und zeitlich gültig.
- Periodenschluss ist ein expliziter Workflow mit Datenqualitätsprüfung, Ausnahmen, Freigabe und Freeze.
- Neuberechnung muss deterministisch und reproduzierbar sein.
- Rechnungen, Korrekturen, Gutschriften und Zahlungen werden ledger-nah modelliert.
- Billing- und Dispute-Agent erklären jede Position über Tarif, Menge, Zeitraum, Quelle und Rechenweg.
- Provider Events werden mit internen Zuständen abgeglichen und nie blind übernommen.

### Quality Flags

| **Flag** | **Bedeutung** |
|---|---|
| MEASURED | Direkt gemessener Wert. |
| ESTIMATED | Nach dokumentierter Methode geschätzt. |
| SUBSTITUTED | Durch qualifizierten Ersatzwert ersetzt. |
| MISSING | Erwarteter Wert fehlt. |
| INVALID | Plausibilitäts- oder Formatfehler. |
| MANUAL_CORRECTION | Freigegebene manuelle Korrektur mit Grund. |
| LATE_ARRIVAL | Nach Periodenverarbeitung verspätet eingegangen. |

## 22. Kommunikation und Collaboration

### Conversation Timeline

E-Mail, SMS, WhatsApp, Formulare, Calls, Meetings, Notizen und Systemnachrichten werden als typisierte Aktivitäten an den relevanten Kontext gebunden. Ein Kanal ist Transport, nicht Quelle der Wahrheit.

### Vorlagen

- Versionierte Vorlagen je Marke, Sprache, Rolle und Prozess
- Variablen aus geprüften Domänenobjekten
- Freigabe bei rechtlich oder finanziell relevanten Inhalten
- Consent- und Unsubscribe-Logik
- Versandstatus, Bounce, Antwort und Thread-Zuordnung

### Externe Portale

Kunden, Hausverwaltungen, Eigentümer, Bewohner und Partner erhalten rollenbezogene Portale mit klaren Aufgaben, Dokumenten, Status und Kommunikation. Portale greifen auf dieselben Workflows zu und erzeugen keine parallelen Datenspeicher.

## 23. Technische Zielarchitektur

### Architekturstil

Start als modularer Monolith in TypeScript/Node.js mit Next.js für Web-Oberflächen, Postgres als transaktionales System of Record und klaren Domain Packages. Asynchrone Verarbeitung nutzt Outbox, Queue und Worker. Einzelne Bereiche werden erst extrahiert, wenn Skalierung, Isolation oder Teamautonomie dies messbar erfordern.

### Referenz-Stack

| **Schicht** | **Zielbild** |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, servernahe Datenzugriffe, Design System. |
| API | Versionierte REST/JSON APIs; optional GraphQL nur für klaren Mehrwert. |
| Domain | Frameworkarme TypeScript-Domänenmodelle, Commands, Policies und Events. |
| Database | Postgres 16+, Row-Level/Scope Policies, Migrationen, JSONB nur gezielt. |
| Async | Transaktionale Outbox, Queue/Workflow Engine, idempotente Worker. |
| Telemetry | Zeitreihenpartitionen oder spezialisierte Erweiterung nach Lastprofil. |
| Files | Objektspeicher mit Metadaten, Virenprüfung, Hash und Zugriffskontrolle. |
| Search | Postgres FTS zuerst; spezialisierte Suche bei nachgewiesenem Bedarf. |
| AI | Model Gateway, Tool Registry, RAG auf freigegebenen Quellen, Evaluationspipeline. |
| Observability | Strukturierte Logs, Metrics, Traces, Audit und Business Events. |
| Deployment | EU-/Deutschland-taugliche, reproduzierbare Container-Deployments und IaC. |

### Repository-Struktur

| **Bereich** | **Pakete / Anwendungen** |
|---|---|
| apps | web-commercial; web-delivery; web-operations; portal-customer; installer-pwa; api; worker; hub-console |
| packages | domain-*; application-*; integrations-*; agents-*; workflows-*; ui; auth; events; observability; testkit |
| infrastructure | migrations; deployment; monitoring |
| docs | founding-document; architecture-decisions; domain-models; runbooks; api |

### API-Regeln

- Versionierung und Deprecation Policy
- Idempotency Keys für wiederholbare Writes
- Signierte Webhooks mit Event-ID und Schema-Version
- Pagination, Filter, Sorting und stabile Fehlerformate
- Dry Run für komplexe Importe und Provisionierung
- Integration Health, letzte Synchronisation, Fehlerqueue und Runbook

## 24. Edge-, Geräte- und PowerHub-Architektur

### PowerHub-Rolle

Der PowerHub ist die lokale Ausführungs- und Integrationsschicht für Gebäude. Er verbindet LoRaWAN, Modbus und weitere Protokolle, puffert Daten, unterstützt lokale Diagnose und ermöglicht kontrollierte Befehle. Cloud und Edge teilen sich klare Verantwortlichkeiten.

### Device Lifecycle

- Planned Asset
- Procured
- Registered
- Provisioned
- Installed
- Commissioned
- Active
- Degraded
- Maintenance
- Retired

### Sicherheit

- Eindeutige Geräteidentität und Zertifikate
- Sichere Provisionierung und Rotation
- Signierte OTA-Updates mit Rollback
- Lokale Failsafes und Befehlsgrenzen
- Store-and-Forward bei Verbindungsunterbrechung
- Inventar, Firmware, Konfiguration und Gesundheitsstatus im zentralen Asset-Modell

## 25. Integrationsstrategie

| **Integration** | **Zweck** | **Vertrag** |
|---|---|---|
| Documenso | Verträge und Signaturen | Vorlagen, Feldmapping, Signatur-Webhooks, Artefakte |
| GoCardless | SEPA und wiederkehrende Zahlungen | Mandate, Einzüge, Rücklastschriften, Statusabgleich |
| Lexoffice | Finanzbuchhaltung/Rechnungsübergabe | Kontakte, Belege, Zahlstatus; internes Billing bleibt fachliche Quelle |
| ChirpStack | LoRaWAN Network Server | Gateways, Devices, Uplinks, Downlinks, Join und Status |
| E-Mail/Hostinger | Transaktionale und operative Kommunikation | Versand, Empfang, Threading, Bounce und Vorlagen |
| WhatsApp Provider | Service- und Termin-Kommunikation | Consent, Vorlagen, Conversation Mapping |
| Kalender | Termine und Verfügbarkeit | Meeting, Site Visit, Einladungen und Änderungen |
| Netz-/Messdatenquellen | Messwerte und Marktprozesse | Import, Mapping, Qualitätskennzeichnung |
| Förder-/Dokumentenquellen | Programme und Nachweise | Versionierte Informationen und Fristen |

### Adapter-Prinzip

Externe Datenmodelle werden in interne Commands und Events übersetzt. Kein Provider darf das interne Kernmodell dominieren. Jede Integration besitzt Mapping, Health, Replay, Rate Limit, Fehlerqueue und Austauschbarkeit.

## 26. Sicherheit, Datenschutz und Vertrauensarchitektur

- Datenschutz durch Datenminimierung, Zweckbindung, Aufbewahrung, Löschung, Export und Betroffenenrechte.
- Verschlüsselung in Transit und at Rest; Secret Management und Rotation.
- Trennung von Public, Internal, Confidential, Personal, Financial, Operational-Sensitive und Safety-Critical Daten.
- Backups, Restore-Tests, Disaster Recovery und definierte Degradationsmodi.
- Prompt-Injection-Schutz, Tool-Allowlisting, Output-Validierung und Retrieval-Quellenkontrolle.
- Keine sensiblen Daten an Modelle ohne freigegebene Datenklasse und vertragliche Grundlage.
- Sicherheitsrelevante Gerätesteuerung benötigt harte Policies, lokale Failsafes und erhöhte Freigaben.
- Regelmäßige Mandantentrennungs-, Berechtigungs- und E2E-Sicherheitstests.

### Threat Model Mindestumfang

| **Bereich** | **Beispiele** |
|---|---|
| Identity | Account Takeover, Session Theft, Privilege Escalation |
| Tenant Isolation | IDOR, fehlerhafte Scopes, Datenexport über Grenzen |
| Agents | Prompt Injection, Tool Abuse, Data Exfiltration, Halluzination |
| Integrations | Webhook Forgery, Replay, Provider Compromise |
| Devices | Gefälschte Geräte, unsichere Updates, Befehlsmissbrauch |
| Billing | Manipulierte Messwerte, doppelte Verarbeitung, unautorisierte Korrektur |
| Documents | Schadsoftware, falsche Signaturzuordnung, Datenleck |
| Operations | Insider, Fehlkonfiguration, ungetesteter Restore |

## 27. Analytics, Metriken und Steuerungssystem

### North Star

Time-to-Operational-Value: Zeit vom qualifizierten Kundenbedarf bis zu einem verifiziert produktiven Gebäudeprozess.

### Commercial KPIs

- Lead Response Time
- Qualification Rate
- Sales Cycle
- Quote-to-Win
- Forecast Accuracy
- Discount/Margin Leakage
- Handoff Rejection Rate

### Delivery KPIs

- Time-to-Handoff-Acceptance
- Time-to-Technical-Ready
- Project Lead Time
- Blocker Age
- Change Request Rate
- First-Time-Right
- Time-to-Go-Live

### Operations KPIs

- Device Availability
- Data Completeness
- Billing Accuracy
- Dispute Rate
- Mean Time to Resolve
- Onboarding Completion
- Portfolio Risk Reduction

### Agent KPIs

- Acceptance Rate
- Correction Rate
- Action Success
- Escalation Precision
- Cost per Completed Outcome
- Latency
- Policy Violations
- Human Time Saved

## 28. Engineering- und Produktbetrieb

### Definition of Done

- Fachliche Akzeptanzkriterien sind erfüllt und mit realistischen Daten geprüft.
- Happy Path sowie relevante Fehler-, Abbruch- und Wiederholungsfälle sind E2E getestet.
- Berechtigungen, Mandantentrennung und sensible Aktionen sind getestet.
- Audit Events, Logs, Metrics und Traces sind vorhanden.
- Migration, Backfill und Rollback sind beschrieben und getestet.
- UI besitzt leere, ladende, fehlerhafte und eingeschränkte Zustände.
- API-Verträge, Dokumentation und Runbooks sind aktualisiert.
- Agenten besitzen strukturierte Outputs, Evaluationsfälle, Quellen/Begründung und Kostenlimit.
- Funktion wurde in einer realistischen Pilot- oder Demo-Umgebung verifiziert.
- Keine kritischen Security- oder Datenschutzbefunde sind offen.

### Testpyramide

- Domänen- und Policy-Tests
- Contract Tests zwischen Contexts und Integrationen
- Workflow- und Event-Replay-Tests
- Berechtigungs- und Tenant-Isolation-Tests
- E2E-Tests der wichtigsten Journeys
- Messdaten- und Billing-Reproduzierbarkeit
- Agenten-Evaluationen mit festen Goldens und adversarial cases
- Restore- und Disaster-Recovery-Übungen

### Architecture Decision Records

Wesentliche Entscheidungen werden als ADR gespeichert: Kontext, Entscheidung, Alternativen, Konsequenzen, Status und Revisit Trigger. Entwicklungsagenten müssen vor Änderungen relevante ADRs lesen und Widersprüche offenlegen.

## 29. Roadmap und Bauabfolge

### Phase 0 – Fundament

- Repository und Engineering Standards
- Identity, Tenant, Organization und Audit
- Kanonische IDs, Events und Outbox
- Design System und Workspace Shell
- Observability, CI/CD und Security Baseline

### Phase 1 – Commercial Core

- Lead Intake API und zentrale Inbox
- Accounts, Kontakte, Opportunities und Activities
- Pipeline, Next Best Action und Forecast
- Kommunikations- und Meeting-Kontext
- Import bestehender Leads und Dublettenlogik

### Phase 2 – Angebotskonfigurator

- Produktkatalog, Preisbücher und Kostenmodelle
- Regel- und Konfigurationsengine
- Varianten, Freigaben, Quote Versioning
- PDF/Dokumentgenerierung und Documenso
- Delivery Templates und Activation Manifest Draft

### Phase 3 – Contract-to-Delivery

- Vertragsstatus und GoCardless
- Won Deal Handoff
- Customer Success Record und Journeys
- Projektgenerierung und Workstreams
- Change Requests und Handoff Acceptance

### Phase 4 – Provisionierung

- Property Graph und operative Mandantenstruktur
- Readiness Checks und Dry Run
- Activation Manifest Approval
- Idempotente Provisionierung
- Operations Handoff und Go-Live

### Phase 5 – Module und Betrieb

- PowerMieter Kernprozesse
- HeatMieter, ChargeMieter, SmokeMieter
- PowerWRX Serviceprozesse
- PowerHub und Geräteverwaltung
- Billing, Messdaten und Portfolio Operations

### Phase 6 – Agentische Skalierung

- Paula und Tool Registry
- Spezialisierte Agenten mit A0-A4
- Evaluation, Budgets und Governance
- Portfolio Intelligence und proaktive Automation
- Partner-/White-Label-Plattform

## 30. 12-Wochen-Startplan

| **Woche** | **Ergebnis** |
|---|---|
| 1 | Repo-Audit, Founding Spec im Repository, ADR-Prozess, Architektur- und Dateninventar. |
| 2 | Identity/Tenant/Organization-Grundmodell, Audit, Event Envelope und Outbox. |
| 3 | Lead Intake, Source Attribution, Account/Contact und Dublettenprüfung. |
| 4 | Opportunity, Pipeline, Activity Timeline, Rollen und grundlegende CRM UI. |
| 5 | Produktkatalog, Preisbuch, Kostenmodell und erste Konfigurationsregeln. |
| 6 | Solution Configuration, Varianten, Kalkulation und Approval Requests. |
| 7 | Quote Versioning, PDF-Ausgabe, Documenso Mapping und Vertragsstatus. |
| 8 | Won Deal Handoff, Customer Success Record, Readiness-Checklisten. |
| 9 | Projektgenerierung, Workstreams, Deliverables und Change Request. |
| 10 | Property Graph Minimum, Activation Manifest und Dry Run. |
| 11 | Idempotente Provisionierung in eine Pilot-Operations-Umgebung. |
| 12 | Kompletter E2E-Pilot: Lead → Angebot → Vertrag → Projekt → Provisionierung → Operations. |

## 31. Hauptrisiken und Gegenmaßnahmen

| **Risiko** | **Gegenmaßnahme** |
|---|---|
| Zu großer Scope | Phasenweise vertikale Journeys liefern; keine gleichzeitige Vollimplementierung aller Module. |
| Datenmodell wird generisch | Kanonische Immobilien- und Vertragsobjekte verbindlich halten; Custom Objects nur ergänzend. |
| CRM und Operations driften auseinander | Gemeinsame IDs, Contracts und Events; keine unabhängigen Stammdatensysteme. |
| Konfigurator wird Excel-Nachbau | Deklarative Regeln, Versionierung, Projektübersetzung und Erklärbarkeit als Kern. |
| Agenten handeln unkontrolliert | Autonomiestufen, Tool Policies, Approval, Audit und Evaluation. |
| Zu frühe Microservices | Modularer Monolith und messbare Extraktionskriterien. |
| Mess-/Billing-Fehler | Immutable Raw Data, Quality Flags, deterministische Rechenwege und Periodenfreeze. |
| Handoffs bleiben informell | Handoff Packets, Akzeptanz, Gates und Blocker verpflichtend. |
| Partner-/White-Label-Komplexität | Zunächst klares Tenant-/Brand-Modell; keine kundenspezifischen Forks. |
| Technische Schulden durch AI Coding | Strenge DoD, Tests, ADRs, Code Review und Repo-konforme Masterprompts. |

## 32. Governance und Entscheidungsmodell

### Produktverantwortung

Jeder Bounded Context erhält einen fachlichen Owner. Der Owner verantwortet Begriffe, Zustände, Policies, Metriken und Akzeptanz. Architektur und Produkt dürfen fachliche Verantwortung nicht gegenseitig ersetzen.

### Entscheidungsklassen

| **Klasse** | **Beispiel** | **Entscheidung** |
|---|---|---|
| Strategisch | Neues Modul, Markt, White Label | Geschäftsführung/Product Council |
| Domäne | Statusmodell, Preisregel, Abrechnungslogik | Domain Owner + Architektur |
| Technisch | Queue, Datenbankmuster, Library | Architektur/Engineering mit ADR |
| Operativ | Workflow-Grenze, SLA, Freigabe | Prozessowner |
| Safety/Compliance | Gerätesteuerung, Datenschutz, Rechnungskorrektur | Benannte verantwortliche Rolle |

### Änderung dieses Dokuments

Änderungen erfolgen versioniert. Jede wesentliche Änderung nennt Anlass, betroffene Prinzipien, Konsequenzen, Migration und Entscheidungsträger. Implementierung vor formaler Anpassung ist nur als zeitlich begrenztes Experiment erlaubt.

## 33. Charta für zukünftige Masterprompts

- Jeder Masterprompt, der aus diesem Dokument abgeleitet wird, muss mindestens folgende Bestandteile enthalten:
- Mission und messbares Outcome.
- Produkt-, Nutzer- und Unternehmenskontext.
- Relevante Bounded Contexts, bestehende Architektur und ADRs.
- In Scope, Out of Scope und Nicht-Ziele.
- Kanonische Objekte, Zustände, Commands und Events.
- Rollen, Berechtigungen, sensible Aktionen und Freigaben.
- Agentenauftrag, Tools, Autonomiestufe, Budgets und Guardrails.
- UX-Journey einschließlich leerer, ladender, fehlerhafter und Ausnahmezustände.
- API-, Daten-, Integrations-, Migrations- und Backfill-Anforderungen.
- Observability, Audit, Datenschutz und Security.
- Teststrategie, E2E-Szenarien und Definition of Done.
- Verpflichtung, den vorhandenen Plan kritisch zu prüfen, zu verbessern und im Repository zu versionieren.
- Verbot, Fertigkeit zu behaupten, bevor die reale Journey nachweislich funktioniert.

### Standardauftrag an Entwicklungsagenten

Verhalte dich gleichzeitig wie Produktverantwortlicher, Domänenarchitekt, Staff Engineer, UX Lead und Security Reviewer. Suche nicht die schnellste Demo, sondern die kleinste vollständige, belastbare und erweiterbare Lösung. Nutze bestehende Strukturen, dokumentiere Entscheidungen, teste reale Journeys und verbessere den Plan fortlaufend.

## 34. Zielbild 2035 und Rückwärtsplanung

Im Zielbild verwaltet Powerhouse 360 hunderttausende bis Millionen Einheiten. Jede Immobilie besitzt einen aktuellen Property Graph und technischen Zwilling. Betreiber sehen nicht nur den Zustand, sondern priorisierte operative Entscheidungen.

Ein neuer Gebäudekomplex wird aus Dokumenten, Plänen, Zählerlisten, Verträgen und Vor-Ort-Erfassung in einen strukturierten Bestand überführt. Geräte werden sicher provisioniert, Telemetrie normalisiert, Teilnehmer und Verträge über geführte Journeys aktiviert.

Agenten übernehmen den Großteil repetitiver Koordination: Anreicherung, Angebotsvorbereitung, Handoffs, Erinnerungen, Terminabstimmung, Datenprüfung, Abrechnungsprüfung, Störungstriage und Portfolioanalyse. Menschen konzentrieren sich auf Verhandlung, technische Verantwortung, Ausnahmen und Beziehungen.

Partner entwickeln Adapter, Workflows und Agenten. Die zentrale Vertrauensschicht – Identität, Rechte, Ereignisse, Audit, Gebäude- und Messkontext – bleibt konsistent. Das System kann als Powerhouse, Submarke oder White Label betrieben werden.

Der Weg zu hoher Autonomie beginnt mit sauberer Datenmodellierung, vollständigen Arbeitsabläufen und nachvollziehbaren Agenten – nicht mit einem allgemeinen Chatfenster.

## 35. Offene Entscheidungen und nächste Spezifikationen

- Finale produktive EU-/Deutschland-Hostingtopologie und Abgrenzung zum bestehenden Hostinger-Setup.
- Konkrete Workflow Engine und Queue-Technologie.
- Zeitreihenstrategie und Aufbewahrung je Messdatenklasse.
- Identity Provider: Eigenbetrieb versus spezialisierter EU-fähiger Anbieter.
- Abgrenzung Lexoffice/Accounting gegenüber internem Billing Ledger.
- Device Identity, PKI und OTA-Strategie für Hub OS.
- Formale Product Configuration Language und Regel-Authoring UX.
- Semantische Metrikschicht und Analytics-Architektur.
- Model Gateway und lokale/Cloud-Modellstrategie nach Datenschutzklasse.
- White-Label-Isolationsmodell und Partnerkonfiguration.
- Datenmigration aus bestehenden PowerMieter-/CRM-Prototypen.
- Verbindliche Namenskonventionen für Marken, Module und Gesellschaften.

### Unmittelbar abzuleitende Detaildokumente

- CRM Domain Specification v1
- Product Configuration and Pricing Specification v1
- Commercial-to-Operations Workflow Specification v1
- Property Graph and Identity Model v1
- Agent Security and Tooling Standard v1
- Powerhouse Provisioning API Specification v1
- Billing and Metering Integrity Standard v1
- PowerHub Device Lifecycle and PKI Specification v1

## 36. Glossar

| **Begriff** | **Definition** |
|---|---|
| Activation Manifest | Maschinenlesbarer, versionierter Zielzustand für die Provisionierung in Operations. |
| Bounded Context | Fachlich abgegrenzter Verantwortungsbereich mit eigener Sprache und Regeln. |
| Command | Autorisierter Auftrag zur Zustandsänderung. |
| Commercial Workspace | Arbeitsbereich für Lead, CRM, Konfiguration, Angebot, Vertrag und Forecast. |
| Delivery Workspace | Arbeitsbereich für Customer Success, Projekt, Planung und Handoff. |
| Domain Event | Versionierte fachliche Tatsache, die bereits eingetreten ist. |
| Handoff Packet | Strukturierte Übergabe mit Scope, Risiken, Voraussetzungen und Akzeptanz. |
| Operational Handoff | Formale Übergabe eines aktivierten Projekts in den laufenden Betrieb. |
| Property Graph | Kanonisches Beziehungsmodell für Immobilien, Einheiten, Beteiligte, Verträge und Assets. |
| Solution Configuration | Versionierte, regelgeprüfte Zusammenstellung der angebotenen Lösung. |
| Technical Readiness | Bestätigter Mindestzustand für Provisionierung oder Umsetzung. |
| Tenant | Technische und rechtliche Mandantengrenze. |
| Time-to-Operational-Value | Zeit vom qualifizierten Bedarf bis zu verifiziertem produktivem Nutzen. |

## 37. Schlussformel

Powerhouse 360 ist das System, das aus einem Interessenten, einem Angebot und einem Projekt einen dauerhaft betreibbaren, messbaren und intelligent unterstützten Gebäudekontext macht.

Diese Version 2.0 ist die verbindliche Ausgangsbasis für die nächste Produkt- und Architekturphase. Sie ersetzt die getrennte Version 1.0 und die Ergänzung 1.1. Detailentscheidungen werden in nachgelagerten Spezifikationen und ADRs konkretisiert, ohne die hier definierten Prinzipien zu umgehen.
