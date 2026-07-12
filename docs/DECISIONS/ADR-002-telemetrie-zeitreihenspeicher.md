# ADR-002 — Telemetrie-Speicher: TimescaleDB-Extension, append-only

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12) · Umsetzung: Phase 4

## Entscheidung
Gerätetelemetrie und Messwerte (`DeviceTelemetry`, `DeviceReading`) werden in einem **zeitreihenoptimierten Speicher** gehalten: **TimescaleDB als Postgres-Extension**, in einem eigenen Schema getrennt vom transaktionalen Modell, aber **in derselben Datenbankinstanz**, solange die Last es erlaubt. Rohdaten sind **append-only**; Korrekturen erzeugen neue Datensätze mit Referenz (Qualitätskette raw → validated → substitute/estimated/corrected), niemals Updates.

## Umsetzungshinweise (Phase 4)
- Prod-/Dev-Postgres-Image auf `timescale/timescaledb:*-pg16` umstellen (aktuell `postgres:16-alpine`) bzw. Extension installieren; Migration aktiviert `CREATE EXTENSION timescaledb` + Hypertables für Telemetrie.
- Aufbewahrung: Telemetrie rolliert (Retention-Policy), abrechnungsrelevante Readings dauerhaft.
- Dashboards lesen materialisierte Zustände (`DeviceState`), nie die Rohtabellen.

## Konsequenzen
+ Skalierbare Zeitreihen ohne zweites Datenbanksystem; Backup-/Betriebskonzept bleibt eines.
− Image-/Betriebsabhängigkeit von Timescale; bei Lastgrenzen späterer Split auf eigene Instanz vorgesehen (R-12).
