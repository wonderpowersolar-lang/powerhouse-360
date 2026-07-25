import SwiftUI

/// Time range of the Analyse tab (prototype segmented control
/// Heute · Woche · Monat · Jahr · Eigene).
enum AnalysePeriod: String, CaseIterable, Identifiable {
    case heute, woche, monat, jahr, eigene

    var id: String { rawValue }

    var title: String {
        switch self {
        case .heute: "Heute"
        case .woche: "Woche"
        case .monat: "Monat"
        case .jahr: "Jahr"
        case .eigene: "Eigene"
        }
    }

    /// Headline of the comparison card underneath the chart.
    var comparisonTitle: String {
        switch self {
        case .heute: "Vergleich zum Vortag"
        case .woche: "Vergleich zur Vorwoche"
        case .monat: "Vergleich zum Vormonat"
        case .jahr: "Vergleich zum Vorjahr"
        case .eigene: ""
        }
    }

    /// Rows of the comparison card: label, delta, and whether the delta is
    /// a good (`true`) or a watch-out (`false`) development.
    var comparisonRows: [(label: String, delta: String, isGood: Bool)] {
        switch self {
        case .heute:
            [("Verbrauch", "−9 %", true), ("Solaranteil", "+6 Pkt.", true), ("Kosten", "−11 %", true)]
        case .woche:
            [("Verbrauch", "+3 %", false), ("Solaranteil", "+3 Pkt.", true), ("Kosten", "+2 %", false)]
        case .monat:
            [("Verbrauch", "−6 %", true), ("Solaranteil", "+4 Pkt.", true), ("Kosten", "−8 %", true)]
        case .jahr:
            [("Verbrauch", "−3 %", true), ("Solaranteil", "+7 Pkt.", true), ("Kosten", "−12 %", true)]
        case .eigene:
            []
        }
    }
}
