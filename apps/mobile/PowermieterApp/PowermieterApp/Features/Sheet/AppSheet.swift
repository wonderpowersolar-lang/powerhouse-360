import SwiftUI

/// The bottom sheet's five flavours (prototype `S.sheet.type`).
enum AppSheet: Identifiable, Equatable {
    /// A KPI tile — "how is this number measured?"
    case kpi(String)
    /// A node of the energy-flow diagram.
    case node(String)
    /// A settings or explainer entry.
    case info(String)
    /// A filed document, with open/download actions.
    case document(String)
    /// The connected building.
    case building

    var id: String {
        switch self {
        case .kpi(let id): "kpi-\(id)"
        case .node(let id): "node-\(id)"
        case .info(let id): "info-\(id)"
        case .document(let title): "doc-\(title)"
        case .building: "building"
        }
    }
}
