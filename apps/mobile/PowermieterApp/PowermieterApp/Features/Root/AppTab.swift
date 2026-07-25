import SwiftUI

/// Every bottom-nav destination in the app. Which five a user actually sees
/// depends on their role — see `tabs(for:)`, mirroring the prototype's
/// per-role `navItems`.
enum AppTab: String, CaseIterable, Identifiable {
    case uebersicht
    case analyse
    case nachhaltig
    case gebaeude
    case vorgaenge
    case dokumente
    case einstellungen

    var id: String { rawValue }

    var title: String {
        switch self {
        case .uebersicht: "Übersicht"
        case .analyse: "Analyse"
        case .nachhaltig: "Nachhaltig"
        case .gebaeude: "Gebäude"
        case .vorgaenge: "Vorgänge"
        case .dokumente: "Dokumente"
        case .einstellungen: "Einstellungen"
        }
    }

    var symbol: String {
        switch self {
        case .uebersicht: "house.fill"
        case .analyse: "chart.bar.fill"
        case .nachhaltig: "leaf.fill"
        case .gebaeude: "building.2.fill"
        case .vorgaenge: "checklist"
        case .dokumente: "doc.text.fill"
        case .einstellungen: "gearshape.fill"
        }
    }

    /// The five tabs shown for a given role.
    static func tabs(for role: OnboardingRole) -> [AppTab] {
        switch role {
        case .mieter:
            [.uebersicht, .analyse, .nachhaltig, .dokumente, .einstellungen]
        case .eigentuemer:
            [.uebersicht, .analyse, .gebaeude, .dokumente, .einstellungen]
        case .verwaltung:
            [.uebersicht, .gebaeude, .vorgaenge, .dokumente, .einstellungen]
        }
    }
}
