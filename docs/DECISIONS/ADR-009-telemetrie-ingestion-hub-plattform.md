# ADR-009: Telemetrie-Ingestion Hub → Plattform (HTTPS-Batch-Push, idempotent)

**Status:** Entwurf — Freigabe zusammen mit dem Kunden-App-Architekturplan (`docs/superpowers/specs/2026-07-22-kunden-app-architekturplan.md`)
**Datum:** 2026-07-22
**Bezug:** Masterplan §7 (Hub-/Device-Plattform), ADR-001 (Outbox), ADR-002 (Zeitreihenspeicher), ADR-004 (Mandantenisolation)

## Kontext

Zählerdaten entstehen an Zählern/Sensoren, werden vom PowerHub (RPi5: LoRaWAN-NS/Decoder + Modbus/RS485 lokal) entgegengenommen und müssen in die Powerhouse-360-Plattform gelangen, die einzige dauerhafte Datenquelle für Abrechnung, Kundenportal und Kunden-App ist. Das Fleet-Tool (eigene, künftige Powerhouse-360-Lösung) verwaltet Geräte und deren technischen Zustand, darf aber nicht die dauerhafte Datenquelle für Abrechnung/Kundenanzeige sein (PO-Vorgabe 2026-07-22). Ein Polling der Plattform am Fleet-Tool ist als Primärmodell ausgeschlossen. Verbindliche Plattformbasis sind 15-Minuten-Werte; zulässiger Datenverzug V1: 15–30 min. Die Hub-Hardware/-Software existiert noch nicht im Repo — diese ADR definiert den Vertrag, den Hub und Hub-Simulator erfüllen müssen.

## Entscheidung

**Der Hub pusht signierte, idempotente HTTPS-Batches direkt an die Plattform.** Kein Broker, kein Polling. Ein späterer MQTT+TLS-Kanal für „nahezu live" bleibt möglich und würde als Bridge in dieselbe Ingest-Pipeline einspeisen (kein Architekturwechsel). Das Fleet-Tool liest denselben Geräte-/Telemetriezustand aus der Plattform, ist aber am Messwertpfad unbeteiligt.

### 1. Endpunkte & Authentifizierung

- `POST /api/v1/ingest/telemetry` und `POST /api/v1/ingest/credentials/rotate` auf `apps/platform`, Fachlogik in `packages/ingestion`, Contracts in `packages/api-contracts` (per ADR-007-Splitkriterium „Ingest" später als eigener Service extrahierbar).
- **Auth:** `Authorization: Bearer <hub-token>` — individuelles Token je Hub (`HubCredential`, serverseitig nur Hash). Revocation wirkt sofort und nur auf diesen Hub. **Rotation:** über den Rotate-Endpunkt holt der Hub ein neues Token ab; das alte Credential erhält `expiresAt` (Übergangsfrist, Default 7 Tage) — während der Rotation existieren zwei gültige Credentials je Hub. **Erst-Provisionierung:** Token wird bei der Hub-Registrierung im Admin ausgestellt (Testmandant: Seed) — WP-APP-1. TLS verpflichtend; unverschlüsselte Übertragung ausgeschlossen. mTLS/Zertifikate als spätere Härtungsoption (Masterplan §7 nennt Token **oder** Zertifikat).
- Rate-Limit je Hub; unbekannte/revokierte/abgelaufene Tokens → 401, Audit-Event.

### 2. Batch-Envelope (Zod-Schema in `packages/api-contracts`)

```jsonc
{
  "batchId": "018c…-uuid",        // Idempotenzschlüssel, vom Hub erzeugt
  "hubSerial": "PH360-2026-0001", // MUSS zum authentifizierten Credential gehören,
                                  // sonst gesamter Batch 403 FORBIDDEN + Audit-Event
  "sentAt": "2026-07-22T14:31:07Z", // Sendezeitpunkt in Hub-Uhrzeit (einziges Envelope-Zeitfeld;
                                    // Grundlage der Clock-Skew-Erkennung, §5.1)
  "readings": [
    {
      "channelRef": "devEUI:70B3D5…:1",   // technische Quelle (DevEUI/Modbus-Adresse+Kanal)
      "meterSerial": "1EMH0067512345",     // optional, NUR Plausibilitätsprüfung (§5.2)
      "ts": "2026-07-22T14:15:00Z",        // Intervallende, UTC, 15-min-Raster
      "kind": "register|delta",            // roher Kanalwert: Zählerstand ODER vom Zähler
                                           // geliefertes Intervall — der Hub leitet NIE ab
      "value": "004321.375",               // Dezimal-String, kWh
      "seq": 4711                          // monotone Sequenz je Kanal (Lücken-/Reihenfolge-Erkennung)
    }
  ]
}
```

### 3. Idempotenz & Antworten

- `(hubId, batchId)` unique (`IngestBatch`, inkl. `payloadHash`). Das Antwort-Ergebnis wird **persistiert** und bei jeder Wiederholung derselben `batchId` wörtlich zurückgegeben — wiederholtes Senden ist immer sicher.
- Bekannte `batchId` mit **abweichendem `payloadHash`** (Hub-Bug) ⇒ 409 `CONFLICT` + `DeviceAlert` — niemals stilles Zurückgeben des alten Ergebnisses.
- Antwort enthält Per-Item-Status: `accepted` | `duplicate` | `rejected` (mit Grund: `unknown_channel`, `no_valid_assignment`, `serial_mismatch`, `ts_out_of_bounds`, `non_monotonic_register`, `conflicting_value`, `schema`). Teilerfolge sind normal; der Hub löscht lokal `accepted`/`duplicate`.
- **Heilung von rejected-Items:** Der Hub sendet sie nach Ablauf einer Wartefrist in einem **neuen Batch (neue `batchId`)** erneut (z. B. nachdem der Kanal registriert wurde) — dieselbe `batchId` liefert konstruktionsbedingt ewig das persistierte Ergebnis.
- **Item-Dedupe** über `(meterId, ts, kind)` gegen das Original (DB-seitig: partieller Unique-Index `WHERE supersedesId IS NULL`, Plan §3.2): gleicher Schlüssel + **wertgleich** ⇒ `duplicate`; gleicher Schlüssel + **wertverschieden** ⇒ `rejected: conflicting_value` + `DeviceAlert`. Korrekturen entstehen ausschließlich serverseitig (Qualitätskette), nie durch Hub-Resend.

### 4. Pufferung & Nachlieferung (Hub-Pflichten)

- Lokale append-only-Queue; Übertragung mindestens alle 15 min, bei Fehlern Retry mit Backoff.
- Nach Verbindungswiederherstellung Nachlieferung in Originalreihenfolge. Werte mit `receivedAt − ts > LATE_THRESHOLD` (**Default 60 min, konfigurierbar** — bewusst getrennt von der Clock-Skew-Toleranz; im Normalbetrieb ist `receivedAt − ts` durch Intervallende + 15-min-Batching systembedingt bis ~30 min) werden als `late` markiert und stoßen die Aggregat-Neuberechnung der betroffenen Zeiträume an.
- Sensor-seitig höhere Erfassungsfrequenzen sind erlaubt, werden aber hub-seitig auf das 15-min-Raster **zusammengefasst** (nicht fachlich abgeleitet) übermittelt.

### 5. Verarbeitung in der Plattform

1. **Auth + Schema (Zod), Zeitprüfungen — zwei getrennte Mechanismen:** (a) *Clock-Skew des Envelopes:* `|sentAt − Serverzeit| > 5 min` ⇒ Batch wird **angenommen**, alle Readings werden mit Skew-Kennzeichnung versehen (Hub-Uhr-Alarm via `DeviceAlert`). (b) *Harte Grenzen je Reading-`ts`:* mehr als 5 min in der Zukunft oder älter als 90 Tage (konfigurierbar) ⇒ `rejected: ts_out_of_bounds`.
2. **Mapping (Präzedenz verbindlich):** maßgeblich ist ausschließlich `channelRef` → zum `ts` gültiges `DeviceAssignment` → `Meter` + `MeteringPoint`. `meterSerial` dient nur der Plausibilisierung: Mismatch zum Assignment ⇒ `rejected: serial_mismatch` + `DeviceAlert`. Kein zum `ts` gültiges Assignment (Lücke zwischen `validTo`/`validFrom`) ⇒ `rejected: no_valid_assignment` + `DeviceAlert`. Unbekannter Kanal ⇒ `rejected: unknown_channel` + `DeviceAlert`. Nichts wird still verworfen.
3. **Plausibilisierung:** Monotonie von Zählerständen (Ausnahme dokumentierter `MeterChange`), Sprungerkennung, Negativwerte ⇒ Qualitätsstatus bzw. `rejected: non_monotonic_register`.
4. **Schreiben & Qualitätskette (verbindliche Semantik, identisch in Plan §2.3):** Original-Readings werden append-only mit `quality = RAW` geschrieben. Der **einzige zulässige In-place-Übergang ist RAW→VALIDATED** (Statusfeld; `value`/`ts`/`kind` sind unveränderlich — „append-only" bezieht sich auf Messwerte, nicht auf dieses Statusfeld). SUBSTITUTE/ESTIMATED/CORRECTED entstehen **immer als neue Sätze** mit `supersedesId`; Ketten sind erlaubt. **Leseregel für alle Konsumenten (Aggregation, Abrechnung, App):** je `(meterId, ts, kind)` gilt der neueste, nicht-supersedete Satz; RAW-Werte fließen in vorläufige Aggregate ein (`isPreliminary`), abrechnungsrelevant sind nur Qualitäten ≥ VALIDATED.
5. `DomainEvent device.telemetry_received` (Outbox, ADR-001) → Worker: **serverseitige Delta-Ableitung** aus aufeinanderfolgenden Registern (über `MeterChange`-Grenzen: Delta = Endstand_alt − letzter_Stand + neuer_Stand − Anfangsstand_neu; über Lücken: kein Delta, `hasGaps = true`), `ConsumptionAggregate`-Neuberechnung, `DeviceState`-Materialisierung, Lückenerkennung (Erwartungsregel + Schwellwerte: Plan §3.2), ggf. `DeviceAlert`/Benachrichtigung (Anti-Spam-Regeln: Plan §3.3).
6. **Aggregate vs. Abrechnung:** `ConsumptionAggregate` repräsentiert stets die beste aktuelle Kenntnis und wird auch nach Abrechnungs-Finalisierung neu berechnet. Die Abrechnung nutzt ausschließlich separate, unveränderliche Finalisierungs-Snapshots (Billing-Domäne, Phase 6 — **out of scope dieser ADR**); verspätete/korrigierte Werte ändern finalisierte Snapshots nie.

### 6. Hub-Simulator als erster Client

`tools/hub-simulator` implementiert exakt diesen Vertrag (gleiche Zod-Schemas) und erzeugt: normale Lastprofile (Tag/Nacht, Wochenende, Saison), PV-Erzeugungsprofile, Datenlücken, Nachlieferungen, wertgleiche und wertverschiedene Duplikate, Zählerwechsel, fehlerhafte Werte. Die Regeln in §3/§5 machen jedes Szenario-Soll-Ergebnis deterministisch (Test-Assertions, F-08). Er läuft ausschließlich gegen den Testmandanten (ADR-006). Die echte Hub-Software implementiert später denselben Vertrag — die Plattform unterscheidet nicht zwischen Hub-Simulator und Hub.

## Alternativen (verworfen)

- **MQTT+TLS als Primärkanal:** erfordert Broker-Betrieb (Mosquitto/EMQX), Zertifikats-/ACL-Management und Monitoring einer weiteren Komponente; für 15-min-Batches ohne fachlichen Nutzen. Bleibt als Zusatzkanal für Sub-15-min-Livedaten vorgesehen (Bridge → gleiche Pipeline).
- **Plattform pollt Fleet-Tool/Hub:** vom PO ausgeschlossen; Fleet-Tool wäre sonst De-facto-Datenquelle der Abrechnung; Pull skaliert schlecht mit Flottengröße und NAT/Firewall-Realität der Gebäudeanschlüsse.
- **Direkte Geräteanbindung Cloud↔Sensor:** widerspricht Hub-zentrierter Architektur (Masterplan §7: lokale Normalisierung/Pufferung).

## Konsequenzen

- Hub-seitige Pflichten (Puffern, Batching, Idempotenz, Sequenzen, keine Ableitungen) sind vor Hub-Entwicklung verbindlich dokumentiert; der Hub-Simulator verifiziert den Vertrag vorab (F-08-Kern).
- Die Plattform braucht keinen neuen Infrastrukturbaustein; Betrieb bleibt Coolify/Compose-kompatibel.
- Später möglicher Ingest-Service-Split und MQTT-Zusatzkanal sind ohne Contract-Bruch möglich.
- Fleet-Tool-Funktionen (Firmware, Rollouts, Fernwartung) benötigen eigene, getrennte Kanäle — bewusst **nicht** Teil dieser ADR.
