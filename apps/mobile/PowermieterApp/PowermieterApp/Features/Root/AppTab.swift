import SwiftUI

/// The five bottom-nav destinations. Seit ADR-011 ist die App eine reine
/// Bewohner-App — es gibt keine rollenabhängigen Tab-Sets mehr.
enum AppTab: String, CaseIterable, Identifiable {
    case uebersicht
    case analyse
    case nachhaltig
    case dokumente
    case einstellungen

    var id: String { rawValue }

    var title: String {
        switch self {
        case .uebersicht: "Übersicht"
        case .analyse: "Analyse"
        case .nachhaltig: "Nachhaltig"
        case .dokumente: "Dokumente"
        case .einstellungen: "Einstellungen"
        }
    }

    var symbol: String {
        switch self {
        case .uebersicht: "house.fill"
        case .analyse: "chart.bar.fill"
        case .nachhaltig: "leaf.fill"
        case .dokumente: "doc.text.fill"
        case .einstellungen: "gearshape.fill"
        }
    }
}
