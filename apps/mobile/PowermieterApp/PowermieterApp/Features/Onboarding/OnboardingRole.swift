import SwiftUI

/// The three roles offered on the "Wie nutzt du Powermieter?" step
/// (prototype `pickM` / `pickV` / `pickH`). Default is `.mieter`, matching
/// the invite-link pre-selection.
enum OnboardingRole: CaseIterable, Identifiable {
    case mieter
    case eigentuemer
    case verwaltung

    var id: Self { self }

    var title: String {
        switch self {
        case .mieter: "Mieter:in"
        case .eigentuemer: "Eigentümer:in / Vermieter:in"
        case .verwaltung: "Hausverwaltung"
        }
    }

    var subtitle: String {
        switch self {
        case .mieter: "Ich wohne hier und beziehe Mieterstrom"
        case .eigentuemer: "Mir gehört das Gebäude oder die Anlage"
        case .verwaltung: "Ich betreue Gebäude und Bewohner"
        }
    }

    var symbol: String {
        switch self {
        case .mieter: "house.fill"
        case .eigentuemer: "building.2.fill"
        case .verwaltung: "checkmark.seal.fill"
        }
    }

    var tint: Color {
        switch self {
        case .mieter: Theme.home
        case .eigentuemer: Theme.pv
        case .verwaltung: Theme.grid
        }
    }

    var chip: Color {
        switch self {
        case .mieter: Theme.homeS
        case .eigentuemer: Theme.pvS
        case .verwaltung: Theme.gridS
        }
    }
}
