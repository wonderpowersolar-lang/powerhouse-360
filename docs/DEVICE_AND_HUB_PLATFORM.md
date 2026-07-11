# POWERHOUSE 360 — Hub- & Device-Plattform

> Status: 🔵 Entwurf v1 (2026-07-11). Umsetzung Phase 4 (Registry) + Phase 5 (PWA-Provisionierung). Ist-Zustand: Hub existiert nur als 3D-Modell/Produktfilm im Marketing — keinerlei Gerätecode im Repo.

## 1. Architekturüberblick

```
 Gebäude                                   VPS (Coolify)
┌───────────────────────────┐             ┌──────────────────────────────┐
│ Sensoren/Zähler/Melder    │  LoRaWAN /  │ apps/platform /api/v1/hubs/* │
│  (WMZ, HKV, RWM, Zähler,  │  Modbus /   │  → Device Registry (Postgres)│
│   Wallbox …)              │  wMBus/OCPP │  → Telemetrie/Readings       │
│        │                  │             │  → Alerts → Tickets          │
│  POWERHOUSE Hub (RPi5)    │──HTTPS push─▶ Worker: Regeln, Offline-     │
│  - lokaler NS/Decoder     │  (signiert) │  Erkennung, Events           │
│  - Puffer bei Offline     │◀─HTTPS pull─│ Konfig-Endpoint (Soll-Konfig)│
└───────────────────────────┘             └──────────────────────────────┘
```

Festlegungen:
- **Hub-zentriert:** LoRaWAN-Network-Server/Decoder laufen **lokal auf dem Hub** (RPi5). Die Cloud spricht nur ein Protokoll: signiertes HTTPS (Push von Messwerten/Alarmen/Heartbeats, Pull der Soll-Konfiguration). Kein offenes MQTT in Phase 4 — reduziert Angriffsfläche und Infrastruktur.
- **Puffern statt verlieren:** Hub puffert bei Verbindungsverlust lokal und liefert idempotente Batches nach (Batch-ID = Idempotenzschlüssel).
- **Adapter-Prinzip auch hier:** Hersteller-/Protokollspezifika (wMBus-Decoder, Modbus-Register, OCPP) leben in Hub-Modulen bzw. `packages/device-sdk`; die Registry kennt nur normalisierte Geräte/Messwerte.

## 2. Device Registry (Kern, Phase 4)

Entitäten siehe [DATA_MODEL.md §9](DATA_MODEL.md). Kernregeln:

1. **Eindeutigkeit:** `(manufacturer, model, serialNumber)` unique; zusätzlich `externalId` (DevEUI, OCPP-ID, MeLo) pro Protokollraum unique. Dubletten werden bei Registrierung hart abgewiesen (PWA zeigt bestehende Zuordnung).
2. **Lifecycle:** `registered → assigned → installed → active → faulty|removed → replaced`. Übergänge nur über definierte Aktionen (PWA-Installation, Funktionstest, Austauschauftrag); jede Änderung → Event + Audit.
3. **Zuordnung zeitbehaftet:** `DeviceAssignment`/`DeviceInstallation` mit `validFrom/validTo` — Historie (Wer hing wann wo an welchem Hub für welches Modul?) bleibt vollständig erhalten; Pflicht für Heatmieter-Nutzerwechsel und Eichrecht-Nachvollziehbarkeit.
4. **Zustands-Materialisierung:** `DeviceState` (online/offline, Batterie, Signal, letzter Messwert, letzter Kontakt) wird vom Worker aktuell gehalten — Dashboards lesen nie die Telemetrie-Rohtabelle.
5. **Alarme:** Regelwerk (Demontage, Batterie niedrig, X h ohne Kontakt, Störungscode) erzeugt `DeviceAlert`; `severity=critical` → automatisch `ServiceTicket` (Smokemieter-Pflichtprozess).

## 3. Hub-Verwaltung

| Funktion | Umsetzung |
|---|---|
| Registrierung/Identität | Hub-Seriennummer + Enrollment über Monteur-PWA; erzeugt `HubCredential` (Gerätetoken/mTLS-Zertifikat), Secret nur einmal sichtbar |
| Projekt-/Gebäude-/Standort-Zuordnung | `Hub` → Project/Building/TechnicalRoom |
| Konfiguration | `HubConfiguration` versioniert (JSON, schema-validiert): LoRaWAN-Keys der Geräte, Modbus-Map, Melde-Intervalle. Hub pollt `GET /config`, bestätigt angewandte Version |
| Status | Heartbeat (Intervall konfigurierbar); Worker markiert `offline` nach Schwellwert → `hub.offline`-Event → Alarmregel |
| Software/Firmware | `FirmwareVersion`-Katalog + `HubDeployment`/`FirmwareDeployment` als Rollout-Historie. Phase 4: nur Erfassung/Vorbereitung; OTA-Updates später |
| Logs/Diagnose | Hub sendet Diagnose-Bundle auf Anforderung (Flag in Soll-Konfig); Ablage als `Document` am Hub |
| Credentials | Rotation über Admin; kompromittierter Hub → Credential-Revoke, Hub fällt auf Enrollment zurück |

## 4. Ingest-Pfad & Datentrennung

1. `POST /api/v1/hubs/{id}/readings` (Batch): Rohwerte → `DeviceTelemetry` (alles) + fachliche Zählerstände → `DeviceReading(quality=raw)`.
2. Validierungsschicht (je Modul konfigurierbar: Plausibilität, Monotonie, Sprungerkennung) hebt Werte auf `validated` oder markiert sie zur Klärung; Ersatz-/Schätzwerte werden als **neue** Readings (`substitute`/`estimated`) erzeugt — Rohwerte bleiben unangetastet.
3. Abrechnungsrelevante Stände werden beim Finalisieren als Snapshot referenziert ([DATA_MODEL.md §14.5](DATA_MODEL.md)).
4. Aufbewahrung: Telemetrie rolliert (z. B. 13 Monate), Readings dauerhaft (Abrechnungsnachweis). Partitionierung/Timescale erst bei Bedarf (R-12).

## 5. Sicherheit

- Hub-Auth: individuelles Credential pro Hub, Scope = nur eigene Endpunkte; Rate-Limit; Replay-Schutz über Batch-IDs + Zeitfenster.
- Keine Inbound-Verbindungen zum Hub nötig (Hub initiiert alles) → keine offenen Ports im Gebäude.
- Gerätekeys (LoRaWAN AppKeys) werden verschlüsselt gespeichert, nur an den zugeordneten Hub ausgeliefert.
- Physische Provisionierung nur durch authentifizierte Monteure mit WorkOrder-Bezug (PWA), siehe unten.

## 6. Monteur-PWA — Provisionierungsprozess (Phase 5)

```
Auftrag öffnen → Gebäude bestätigen → Hub auswählen → Gerät scannen (QR/Barcode)
→ Dublettenprüfung → Modellvalidierung (DeviceModel erwartet Protokoll/Typ)
→ Einbauort zuordnen (Unit/Room/InstallationLocation)
→ Kommunikationstest (Hub bestätigt Empfang) → Messwert prüfen
→ Foto aufnehmen → Checkliste abschließen → Installation bestätigen → Modulfreigabe-Requirement grün
```

Regeln:
- Ein Gerät gilt **ohne bestandenen Funktionstest oder dokumentierte Ausnahme** (`OnboardingException`-Pendant im WorkOrder: `InstallationException`) nicht als installiert.
- Offline-Fähigkeit: Aufträge + Checklisten lokal gecacht; Aktionen in signierter Queue, Sync bei Verbindung (Konfliktregel: Server gewinnt bei Stammdaten, Monteur-Erfassung gewinnt bei Vor-Ort-Fakten, Konflikte werden sichtbar gemacht).
- Fotos/Unterschrift → `Attachment`/`InstallationProtocol` (PDF-Generierung im Worker).

## 7. Modul-Anbindung

| Modul | Gerätetypen | Besonderheit |
|---|---|---|
| Powermieter | Stromzähler (Messkonzept-Zählpunkte) | MeLo/MaLo-Bezug über `GridConnection`; TRuDi/SMGW-Thematik als offene Entscheidung (siehe RISK R-13) |
| Heatmieter | WMZ, HKV, Wasserzähler | Funk-Ablesung (wMBus/LoRa), Stichtags- & Zwischenablesung, Gerätewechsel-Prozess |
| Chargemieter | Wallboxen/Ladepunkte (OCPP), Abrechnungszähler | OCPP-Anbindung über Adapter (Hub-lokal oder Cloud-CSMS — Entscheidung in Phase 9, ADR folgt) |
| Smokemieter | Rauchwarnmelder (Funk) | Demontage-/Störungs-Erkennung → kritischer Alarm → Serviceprozess; Prüfhistorie je Gerät (DIN 14676) |
