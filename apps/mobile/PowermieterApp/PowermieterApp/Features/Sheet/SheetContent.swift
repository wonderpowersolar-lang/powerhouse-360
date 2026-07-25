import SwiftUI

/// What a bottom sheet shows (prototype `KP` / `ND` / `INFO` catalogues).
struct SheetContent {
    var title: String
    var value: String?
    var badge: String?
    var dot: Color?
    var description: String?
    var rows: [(key: String, value: String)] = []
    /// KPI/node sheets that offer "Zur Detailanalyse".
    var showsDetailCTA = false
    /// Document sheets get an open + download row instead.
    var document: DocumentItem?
    /// The building sheet lists the connected property.
    var isBuilding = false
}

extension SheetContent {
    static func resolve(_ sheet: AppSheet, role: OnboardingRole) -> SheetContent {
        switch sheet {
        case .kpi(let id): kpi(id)
        case .node(let id): node(id, role: role)
        case .info(let id): info(id)
        case .document(let title): document(title)
        case .building: SheetContent(title: "Verbundenes Gebäude", isBuilding: true)
        }
    }

    // MARK: KPI tiles

    private static func kpi(_ id: String) -> SheetContent {
        switch id {
        case "verb":
            SheetContent(title: "Aktueller Verbrauch", value: "3,2 kW", badge: "Messwert",
                         description: "Momentane Leistung deiner Wohnung, gemessen vom Smart Meter.",
                         rows: [("Zählpunkt", "DE 0001 4711 0012"),
                                ("Letzte Messung", "vor 12 Sekunden"),
                                ("Heute bisher", "8,6 kWh")])
        case "pvT":
            SheetContent(title: "PV-Erzeugung heute", value: "132 kWh", badge: "Gemessen",
                         description: "Gesamte Erzeugung der Dachanlage eures Gebäudes seit Mitternacht.",
                         rows: [("Anlage", "52,9 kWp · 128 Module"),
                                ("Aktuelle Leistung", "18,6 kW"),
                                ("Bestwert im Juli", "141 kWh (12.07.)")])
        case "solar":
            SheetContent(title: "Solarstromanteil", value: "76 %", badge: "Berechnet",
                         description: "Anteil deines heutigen Verbrauchs, der direkt vom Dach kam.",
                         rows: [("Formel", "Solarstrom ÷ Gesamtverbrauch"),
                                ("Solarstrom", "6,5 kWh"),
                                ("Gesamtverbrauch", "8,6 kWh")])
        case "kosten":
            SheetContent(title: "Kosten heute", value: "2,34 €", badge: "Messwert",
                         description: "Summe aus Solar- und Netzstrom seit 0:00 Uhr, inkl. USt. Der Grundpreis (9,90 €/Monat) kommt monatlich dazu.",
                         rows: [("Zeitraum", "Heute, 00:00–11:24 Uhr"),
                                ("Solarstrom", "6,5 kWh × 24,9 ct = 1,62 €"),
                                ("Netzstrom", "2,1 kWh × 34,2 ct = 0,72 €"),
                                ("Tarif", "Mieterstrom Basis 2026")])
        case "ersp":
            SheetContent(title: "Ersparnis im Juli", value: "18,45 €", badge: "Berechnet",
                         description: "Vergleich deiner tatsächlichen Kosten mit dem örtlichen Grundversorgungstarif.",
                         rows: [("Referenztarif", "38,7 ct/kWh + 12,90 €/Monat"),
                                ("Dein Mix", "Ø 27,2 ct/kWh + 9,90 €/Monat"),
                                ("Stand", "21. Juli, 11:24 Uhr")])
        case "co2":
            SheetContent(title: "CO₂-Einsparung", value: "12,6 kg", badge: "Näherungswert",
                         description: "Vermiedene Emissionen, weil Solarstrom statt Netzstrom (Bundesmix) genutzt wurde.",
                         rows: [("Solarstrom im Juli", "33,2 kWh"),
                                ("Faktor", "0,38 kg CO₂ je kWh"),
                                ("Entspricht", "≈ 63 Pkw-Kilometern")])
        case "vbT":
            SheetContent(title: "Gesamtverbrauch heute", value: "103 kWh", badge: "Gemessen",
                         description: "Alle Wohnungen, Allgemeinstrom, Wärmepumpe und Ladepunkte zusammen.",
                         rows: [("Wohnungen", "62 kWh"), ("Wärmepumpe", "14 kWh"),
                                ("Allgemein & Technik", "18 kWh"), ("Ladepunkte", "9 kWh")])
        case "evq":
            SheetContent(title: "Eigenverbrauchsquote", value: "57 %", badge: "Berechnet",
                         description: "Anteil der PV-Erzeugung, der heute direkt im Gebäude verbraucht wurde.",
                         rows: [("Eigenverbrauch", "75 kWh"), ("PV-Erzeugung", "132 kWh"),
                                ("Formel", "Eigenverbrauch ÷ Erzeugung")])
        case "aut":
            SheetContent(title: "Autarkiegrad", value: "73 %", badge: "Berechnet",
                         description: "Anteil des Gebäudeverbrauchs, der heute aus PV und Speicher gedeckt wurde.",
                         rows: [("Eigenverbrauch", "75 kWh"), ("Gesamtverbrauch", "103 kWh"),
                                ("Formel", "Eigenverbrauch ÷ Verbrauch")])
        case "einsp":
            SheetContent(title: "Einspeisung heute", value: "57 kWh", badge: "Gemessen",
                         description: "Überschüssiger Solarstrom, der ins öffentliche Netz geliefert wurde.",
                         rows: [("Vergütung", "7,9 ct/kWh"), ("Erlös heute", "≈ 4,50 €"),
                                ("Spitze", "13:10 Uhr · 6,8 kW")])
        case "netzb":
            SheetContent(title: "Netzbezug heute", value: "28 kWh", badge: "Gemessen",
                         description: "Strom aus dem öffentlichen Netz – vor allem in den frühen Morgenstunden.",
                         rows: [("Zeitfenster", "v. a. 05:00–08:00 Uhr"), ("Kosten", "≈ 9,60 €")])
        case "erspV":
            SheetContent(title: "Ersparnis & Erlöse im Juli", value: "1.486 €", badge: "Berechnet",
                         description: "Mieterstrom-Erlöse plus Einspeisevergütung, abzüglich Betriebskosten.",
                         rows: [("Mieterstrom-Erlöse", "1.184 €"), ("Einspeisung", "302 €"),
                                ("vs. Vorjahresmonat", "+21 %")])
        case "co2V":
            SheetContent(title: "CO₂-Einsparung im Juli", value: "2,3 t", badge: "Näherungswert",
                         description: "Vermiedene Emissionen des gesamten Gebäudes durch lokale Solarnutzung.",
                         rows: [("Solar genutzt", "6,1 MWh"), ("Faktor", "0,38 kg CO₂ je kWh"),
                                ("Entspricht", "≈ 11.500 Pkw-Kilometern")])
        default:
            SheetContent(title: "Kennzahl")
        }
    }

    // MARK: Energy-flow nodes

    private static func node(_ id: String, role: OnboardingRole) -> SheetContent {
        let isTenant = role == .mieter

        switch id {
        case "pv":
            return SheetContent(title: "PV-Anlage", value: "18,6 kW", dot: Theme.pv,
                                description: "Eure Dachanlage liefert gerade kräftig.",
                                rows: [("Leistung", "52,9 kWp"), ("Heute erzeugt", "132 kWh"),
                                       ("Status", "Online · vor 1 Min")],
                                showsDetailCTA: true)
        case "netz":
            return SheetContent(title: "Netzanschluss",
                                value: isTenant ? "0,8 kW Bezug" : "0,0 kW Bezug",
                                dot: Theme.grid,
                                description: isTenant
                                    ? "Der kleine Rest, den die Sonne gerade nicht deckt."
                                    : "Das Gebäude läuft aktuell komplett solar – Überschuss wird eingespeist.",
                                rows: isTenant
                                    ? [("Heute bezogen", "2,1 kWh"), ("Netztarif", "34,2 ct/kWh")]
                                    : [("Einspeisung jetzt", "3,4 kW"), ("Heute bezogen", "28 kWh"),
                                       ("Heute eingespeist", "57 kWh")])
        case "whg":
            return SheetContent(title: "Deine Wohnung", value: "3,2 kW", dot: Theme.home,
                                description: "Dein aktueller Verbrauch – zu 76 % direkt von der Sonne gedeckt.",
                                rows: [("Davon Solar", "2,4 kW (76 %)"), ("Heute", "8,6 kWh"),
                                       ("Zähler", "Online")],
                                showsDetailCTA: true)
        case "geb":
            return SheetContent(title: "Gebäude", value: "12,8 kW", dot: Theme.home,
                                description: "Gesamtverbrauch aller Einheiten und Anlagen.",
                                rows: [("Wohnungen", "8,7 kW"), ("Wärmepumpe", "2,4 kW"),
                                       ("Allgemein & Technik", "1,7 kW")],
                                showsDetailCTA: true)
        case "bat":
            return SheetContent(title: "Batteriespeicher", value: "74 %", dot: Theme.bat,
                                description: "Lädt gerade Überschuss für den Abend.",
                                rows: [("Ladeleistung", "+2,8 kW"), ("Kapazität", "144 kWh"),
                                       ("Herkunft der Ladung", "86 % Solar · 14 % Netz"),
                                       ("Reicht heute Abend", "≈ 4,5 Stunden")])
        case "wp":
            return SheetContent(title: "Wärmepumpe", value: "2,4 kW", dot: Theme.wp,
                                description: "Bereitet gerade Warmwasser – bevorzugt mit Sonnenstrom.",
                                rows: [("Heute", "14,2 kWh"), ("Betrieb", "Warmwasser"),
                                       ("Zähler", "Online")])
        case "wb":
            return SheetContent(title: "Wallbox", value: "1,7 kW", dot: Theme.feed,
                                description: "Zwei Ladepunkte sind gerade belegt.",
                                rows: [("Ladepunkte", "2 von 4 belegt"), ("Heute geladen", "9,8 kWh")])
        default:
            return SheetContent(title: "Anlagenteil")
        }
    }

    // MARK: Explainers and settings

    private static func info(_ id: String) -> SheetContent {
        switch id {
        case "naeh":
            SheetContent(title: "Näherungswerte",
                         description: "CO₂- und Vergleichswerte basieren auf dem deutschen Strommix (0,38 kg CO₂/kWh), 0,2 kg CO₂ je Pkw-Kilometer und 12,5 kg CO₂-Bindung je Baum und Jahr. Sie dienen der Einordnung, nicht der Bilanzierung.")
        case "personal":
            SheetContent(title: "Persönliche Daten",
                         description: "Änderungen wirken sich auf Vertrag und Rechnungen aus.",
                         rows: [("Name", "Leon Berger"), ("E-Mail", "leon.berger@mail.de"),
                                ("Telefon", "+49 172 5540 812")])
        case "whg":
            SheetContent(title: "Wohnung & Gebäude",
                         rows: [("Wohnung", "WE 12 · 3. OG links"),
                                ("Gebäude", "Friedrichsruher Str. 35, 14193 Berlin"),
                                ("Zählpunkt", "DE 0001 4711 0012")])
        case "pay":
            SheetContent(title: "Zahlungsart",
                         description: "Abbuchung jeweils zum 1. des Monats.",
                         rows: [("Verfahren", "SEPA-Lastschrift"),
                                ("IBAN", "DE89 •••• •••• 4821"),
                                ("Kontoinhaber", "Leon Berger")])
        case "privacy":
            SheetContent(title: "Datenschutz",
                         description: "Deine Verbrauchsdaten werden ausschließlich für Abrechnung und Anzeige verarbeitet. Andere Bewohner sehen deine Werte nicht. Details in der Datenschutzerklärung unter Dokumente.")
        default:
            SheetContent(title: "Information")
        }
    }

    // MARK: Documents

    private static func document(_ title: String) -> SheetContent {
        let all = DocumentItem.tenant + DocumentItem.building
        guard let item = all.first(where: { $0.title == title }) else {
            return SheetContent(title: title)
        }
        return SheetContent(title: item.title,
                            badge: item.statusText,
                            rows: [("Datum", item.date), ("Datei", item.size),
                                   ("Status", item.statusText)],
                            document: item)
    }
}
