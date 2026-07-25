import SwiftUI

/// A single filed document (prototype `DM` / `DB` seed lists).
struct DocumentItem: Identifiable {
    enum Status {
        case ok, info, warn, muted

        var color: Color {
            switch self {
            case .ok: Theme.ok
            case .info: Theme.info
            case .warn: Theme.warn
            case .muted: Theme.tx2
            }
        }

        var background: Color {
            switch self {
            case .ok: Theme.okS
            case .info: Theme.infoS
            case .warn: Theme.warnS
            case .muted: Theme.elev
            }
        }
    }

    let id = UUID()
    let category: DocumentCategory
    let title: String
    let date: String
    let size: String
    let statusText: String
    let status: Status

    var isNew: Bool { statusText == "neu" }
    var meta: String { "\(date) · \(size)" }

    /// Invoices open the bill detail overlay; other documents stay inert.
    var invoiceID: String? {
        switch title {
        case "Rechnung Juni 2026": "juni"
        case "Rechnung Mai 2026": "mai"
        case "Rechnung April 2026": "april"
        case "Rechnung März 2026": "maerz"
        default: nil
        }
    }
}

extension DocumentItem {
    /// What a tenant sees.
    static let tenant: [DocumentItem] = [
        .init(category: .vertrag, title: "Stromliefervertrag Mieterstrom",
              date: "12.03.2025", size: "PDF · 1,1 MB", statusText: "unterschrieben", status: .ok),
        .init(category: .vertrag, title: "SEPA-Lastschriftmandat",
              date: "12.03.2025", size: "PDF · 0,2 MB", statusText: "aktiv", status: .ok),
        .init(category: .vertrag, title: "Vertragsänderung: Dynamischer Tarif",
              date: "01.06.2026", size: "PDF · 0,4 MB", statusText: "offen", status: .warn),
        .init(category: .rechnung, title: "Rechnung Juni 2026",
              date: "05.07.2026", size: "PDF · 0,3 MB", statusText: "bezahlt", status: .ok),
        .init(category: .rechnung, title: "Rechnung Mai 2026",
              date: "05.06.2026", size: "PDF · 0,3 MB", statusText: "bezahlt", status: .ok),
        .init(category: .rechnung, title: "Rechnung April 2026",
              date: "05.05.2026", size: "PDF · 0,3 MB", statusText: "bezahlt", status: .ok),
        .init(category: .bericht, title: "Monatsreport Juni 2026",
              date: "01.07.2026", size: "PDF · 0,8 MB", statusText: "neu", status: .info),
        .init(category: .bericht, title: "Monatsreport Mai 2026",
              date: "01.06.2026", size: "PDF · 0,8 MB", statusText: "gelesen", status: .muted),
        .init(category: .preis, title: "Preisblatt Mieterstrom 2026",
              date: "01.01.2026", size: "PDF · 0,1 MB", statusText: "gültig", status: .ok),
        .init(category: .preis, title: "Preisblatt Mieterstrom 2025",
              date: "01.01.2025", size: "PDF · 0,1 MB", statusText: "abgelaufen", status: .muted),
        .init(category: .sonst, title: "Datenschutzerklärung",
              date: "12.03.2025", size: "PDF · 0,2 MB", statusText: "Version 2.1", status: .muted)
    ]

    /// What an owner or a property manager sees.
    static let building: [DocumentItem] = [
        .init(category: .vertrag, title: "Betreibervertrag Mieterstrom",
              date: "12.03.2025", size: "PDF · 2,4 MB", statusText: "unterschrieben", status: .ok),
        .init(category: .vertrag, title: "Wartungsvertrag PV-Anlage",
              date: "02.04.2025", size: "PDF · 0,9 MB", statusText: "aktiv", status: .ok),
        .init(category: .rechnung, title: "Einspeiseabrechnung Q2 2026",
              date: "10.07.2026", size: "PDF · 0,3 MB", statusText: "583,20 € gutgeschrieben", status: .ok),
        .init(category: .rechnung, title: "Sammelrechnung Allgemeinstrom Juni",
              date: "30.06.2026", size: "PDF · 0,2 MB", statusText: "bezahlt", status: .ok),
        .init(category: .bericht, title: "Monatsreport Gebäude Juni 2026",
              date: "01.07.2026", size: "PDF · 1,1 MB", statusText: "neu", status: .info),
        .init(category: .preis, title: "Preisblatt Mieterstrom 2026",
              date: "01.01.2026", size: "PDF · 0,1 MB", statusText: "gültig", status: .ok),
        .init(category: .sonst, title: "Messkonzept Gebäude",
              date: "12.03.2025", size: "PDF · 1,6 MB", statusText: "Version 1.3", status: .muted),
        .init(category: .sonst, title: "Aushang Energieinfo Juli",
              date: "05.07.2026", size: "PDF · 0,3 MB", statusText: "neu", status: .info)
    ]

    static func all(for role: OnboardingRole) -> [DocumentItem] {
        role == .mieter ? tenant : building
    }
}
