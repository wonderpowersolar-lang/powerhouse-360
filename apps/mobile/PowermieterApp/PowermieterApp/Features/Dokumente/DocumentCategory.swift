import SwiftUI

/// Document folders of the Dokumente tab (prototype `CATL` / `CATI`).
enum DocumentCategory: String, CaseIterable, Identifiable {
    case vertrag, rechnung, bericht, preis, sonst, archiv

    var id: String { rawValue }

    var title: String {
        switch self {
        case .vertrag: "Verträge"
        case .rechnung: "Rechnungen"
        case .bericht: "Berichte"
        case .preis: "Preisblätter"
        case .sonst: "Sonstiges"
        case .archiv: "Archiv"
        }
    }

    var symbol: String {
        switch self {
        case .vertrag: "doc.text"
        case .rechnung: "creditcard"
        case .bericht: "chart.bar.doc.horizontal"
        case .preis: "tag"
        case .sonst: "folder"
        case .archiv: "archivebox"
        }
    }

    var tint: Color {
        switch self {
        case .vertrag: Theme.acc
        case .rechnung: Theme.info
        case .bericht: Theme.feed
        case .preis: Theme.pv
        case .sonst: Theme.tx2
        case .archiv: Theme.tx3
        }
    }

    var softTint: Color {
        switch self {
        case .vertrag: Theme.accS
        case .rechnung: Theme.infoS
        case .bericht: Theme.feedS
        case .preis: Theme.pvS
        case .sonst, .archiv: Theme.elev
        }
    }
}
