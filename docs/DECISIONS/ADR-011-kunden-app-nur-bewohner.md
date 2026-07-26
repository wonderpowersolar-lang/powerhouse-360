# ADR-011: Kunden-App bleibt Bewohner-App — Vermieter und Verwaltung über die Web-Plattform

**Status:** Angenommen (PO Leon, 2026-07-26)
**Datum:** 2026-07-26
**Bezug:** Kunden-App-Architekturplan §4.2 (`docs/superpowers/specs/2026-07-22-kunden-app-architekturplan.md`), ADR-004 (Mandantenisolation), ADR-007 (Stack), WP-APP-2 (Aggregation + App-API)

## Kontext

Der Powermieter-Prototyp und der daraus portierte SwiftUI-Client bilden **drei** Rollen ab: Mieter, Eigentümer/Vermieter und Hausverwaltung. Jede Rolle hat ein eigenes Dashboard, ein eigenes Tab-Set und eigene Detailscreens (Gebäude, Vorgänge, Wohneinheiten-Vergleich, Verbrauchsaufteilung, Anlagenstatus).

Die in §4.2 spezifizierte App-API ist dagegen **ausschließlich bewohnerbezogen**. Ihr Scope-Anker ist `PowerParticipant`, jede Route erzwingt `assertParticipantScope`, und der Kontext-Umschalter listet Teilnahmen. Für Gebäudeaggregate, Wohneinheiten-Vergleiche oder Anlagenstatus gibt es keinen einzigen Endpunkt.

Diese Lücke fiel beim Bau der Client-Schicht am 2026-07-26 auf: Die App zeigt für zwei ihrer drei Rollen Daten an, die der Contract nicht liefert und auch nicht liefern kann, weil ihm der passende Scope fehlt.

Die technischen Voraussetzungen für eine Gebäudeseite existieren bereits: `AccessScope` (`scopeType`, `propertyId`, `buildingId`) aus WP-1.3 ist der Objekt-Scope-Anker, und das Rollenmodell kennt `PROPERTY_MANAGER` und `OWNER_BOARD`. Es fehlen nur der Endpunktsatz und die zugehörigen Permissions.

## Entscheidung

**Die Kunden-App ist eine Bewohner-App. Vermieter und Hausverwaltung arbeiten über die Web-Plattform (`apps/platform`).**

Es wird **kein** zweiter, objekt-scoped Endpunktsatz für die App gebaut. Die App-API bleibt bei `PowerParticipant` + `assertParticipantScope` als einzigem Scope-Mechanismus.

## Begründung

- **Ein Scope-Mechanismus statt zwei.** Mieter sind an ihre Teilnahme gebunden, Eigentümer an ihr Objekt. Das sind zwei verschiedene Autorisierungspfade. Beide in derselben API zu führen verdoppelt die Angriffsfläche der Zugriffskontrolle — genau dort, wo Fehler am teuersten sind (fremde Verbrauchsdaten).
- **Die halbe API-Fläche entfällt.** Gebäudeaggregate, Wohneinheiten-Vergleich, Anlagenstatus und Vorgänge sind kein kleiner Anbau, sondern ein zweites Produkt.
- **Der Bedarf ist unbelegt.** Die Rollen-UI stammt aus dem Prototyp, nicht aus Nutzerbeobachtung. Kein Vermieter und keine Verwaltung hat die App je benutzt.
- **Die Plattform kann es schon.** `/admin/objects` liefert den Objektbaum hinter `object.read`; Mitglieder-, Einladungs- und Audit-Verwaltung existieren dort ebenfalls. Die Verwaltungsarbeit ist Schreibtischarbeit.

## Konsequenzen

**Positiv**
- WP-APP-2 bleibt in seinem jetzigen Zuschnitt gültig; es entsteht kein Bedarf, den Contract nachträglich umzubauen.
- Der Permission-Katalog braucht nur die sieben `*_own`-Einträge aus WP-APP-2, keine objekt-scoped Verbrauchs-Permissions.
- Das Sicherheitsmodell der App bleibt auf einen einzigen, testbaren Pfad reduziert.

**Negativ**
- **Mobile Anwendungsfälle entfallen**, die inhaltlich sinnvoll gewesen wären: Anlagenstatus, Störungswarnung „Zähler WE 07 verzögert", offene Vorgänge — Dinge, die man unterwegs oder im Haus prüft, nicht am Schreibtisch. Das ist der reale Preis dieser Entscheidung.
- Die Web-Plattform muss für Vermieter und Verwaltung mobiltauglich sein. Sie ist es heute nicht; das ist bislang nirgends als Arbeitspaket erfasst.
- Im SwiftUI-Client existiert **gebaute, ab jetzt funktionslose UI** für beide Rollen (Vermieter- und Verwaltungs-Dashboard, Gebäude- und Vorgänge-Tab, rollenspezifische Tab-Sets, Rollenumschalter in den Einstellungen, rollenabhängige Zweige in Analyse, Dokumente, Monatsreport, Mitteilungen, Energiebilanz und Detailanalyse).

## Folgepunkt: Rollen-UI ausgebaut (2026-07-26)

Die Rollen-UI wurde am selben Tag entfernt, statt sie als Demo-Modus stehen zu lassen. Eine funktionslose Oberfläche im Code hätte dauerhaft ein Produkt abgebildet, das es nicht gibt, und jeden künftigen Mitlesenden zu der Annahme eingeladen, die Rollen seien vorgesehen.

Entfernt: `OnboardingRole` samt Rollenauswahl im Onboarding, Vermieter- und Verwaltungs-Dashboard mit ihren Karten, die Tabs Gebäude und Vorgänge, die gebäudebezogenen Overlays Wohneinheiten und Verbrauchsaufteilung, der Rollenumschalter in den Einstellungen, die gebäudebezogenen Einträge im Bottom-Sheet-Katalog sowie sämtliche rollenabhängigen Zweige in Analyse, Dokumente, Monatsreport, Mitteilungen, Energiebilanz, Detailanalyse und Assistent.

12 Dateien gelöscht, der Rollenbegriff aus 20 weiteren entfernt: 10.165 → 8.006 Zeilen (−21 %). `AppTab` hat keine `tabs(for:)`-Funktion mehr, sondern fünf feste Fälle. Debug- und Release-Build grün, App im Simulator gegengeprüft.

## Revision

Sollte sich später Bedarf für eine mobile Vermieter- oder Verwaltungssicht zeigen, ist der Weg vorgezeichnet und diese ADR entsprechend abzulösen: ein eigener Endpunktsatz `/api/v1/app/buildings/:id/*` mit `AccessScope` als Anker und einem eigenen `assertObjectScope`, getrennt vom Bewohnerpfad — nicht durch Aufbohren von `assertParticipantScope`.
