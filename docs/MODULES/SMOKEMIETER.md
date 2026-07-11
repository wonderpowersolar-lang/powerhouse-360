# Modul: Smokemieter (Rauchwarnmelder)

> Status: ⚪ Software nicht vorhanden. Marketing: `/smokemieter`-Rewind-Story + Domain smokemieter.de produktiv. Umsetzung: Phase 7 (erstes Betriebs-/Service-Modul nach Powermieter — geringste regulatorische Abhängigkeit, maximale Nutzung des Device-Fundaments).

## 1. Fachlicher Kern

Digitale Rauchwarnmelder mit Ferninspektion (DIN 14676): Gebäude-/Einheiten-/Raumzuordnung, Batteriestatus, Funkstatus, Demontageerkennung, Störungen, Prüfhistorie, Austauschplanung, Bewohnerkommunikation, Serviceprozesse.

## 2. Modell-Ergänzungen

| Entität | Inhalt |
|---|---|
| `SmokeProject` | Modulinstanz je Property |
| Melder | Kern-Registry: `Device` (Typ RWM) mit Raum-Pflichtzuordnung (`Room`), Einbau über `DeviceInstallation` |
| `InspectionRun` | Ferninspektions-Lauf (periodisch): je Gerät Prüfergebnis (Funk, Batterie, Demontage, Verschmutzung je nach Gerätefähigkeit) |
| `InspectionRecord` | Prüfhistorie je Gerät (DIN-14676-Nachweis), append-only |
| `ReplacementPlan` | Austauschplanung (10-Jahres-Frist je Gerät aus `DeviceInstallation` + Batterielebensdauer) |
| `ResidentNotice` | Bewohnerkommunikation (Ankündigungen, Störungshinweise) |

## 3. Kritischer Serviceprozess (verbindlich)

```
DeviceAlert (severity=critical: Demontage, dauerhafte Störung, Batterie kritisch)
→ automatisch ServiceTicket (SLA-Frist je Vertragskonfiguration)
→ WorkOrder (Austausch/Prüfung vor Ort) → PWA-Abarbeitung mit Funktionstest
→ InspectionRecord + Ticket-Abschluss → Alert resolved → Nachweis im Portal
```

Kein kritischer Alarm darf ohne Ticket bleiben (Worker-Regel + Monitoring-Query als Wächter).

## 4. Ferninspektion & Nachweise

- Periodische `InspectionRun`s werten Gerätestatus aus (Funkprüfung); Ergebnis je Gerät dokumentiert.
- Nicht fernprüfbare Kriterien (Umfeld/Sichtprüfung je Gerätetyp) → geplante Begehungs-WorkOrders.
- Jahres-/Objektbericht als generiertes PDF (`Document`) für HV/Eigentümer — der eigentliche Produktwert.

## 5. Verträge (Documenso)

Betreibervertrag (Projektebene: Eigentümer/HV überträgt Betreiberpflichten), Servicevertrag; Bewohner-Information als Consent-/Notice-Schritt im Onboarding.

## 6. Offene fachliche Entscheidungen

- O-S1: Gerätehersteller/Funkprotokoll-Festlegung (bestimmt Hub-Decoder-Aufwand)
- O-S2: Umfang der DIN-14676-Ferninspektionskriterien je Gerätemodell (Katalogpflege in `DeviceModel`)

## 7. Definition of Done (E2E F-13)

Projekt → Betreibervertrag (Documenso) → Geräteplanung → Installation (PWA, Funktionstest) → Aktivierung → simulierte Demontage-Störung → automatisches Ticket → Austausch-WorkOrder → Abschluss mit Prüfnachweis — auf Staging vollständig durchlaufen.
