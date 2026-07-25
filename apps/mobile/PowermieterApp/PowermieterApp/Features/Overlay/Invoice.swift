import SwiftUI

/// One monthly bill (prototype `INV` seed map).
struct Invoice: Identifiable {
    let id: String
    let title: String
    let period: String
    let sum: String
    let paid: String
    let kwh: String
    /// Share of the kWh that came straight from the roof, 0...1.
    let solarShare: Double
    let reference: String
    let saving: String
    let rows: [(key: String, value: String)]

    var shortTitle: String {
        title.replacingOccurrences(of: "Rechnung ", with: "")
    }
}

extension Invoice {
    static let all: [Invoice] = [
        .init(id: "juni", title: "Rechnung Juni 2026", period: "01.06.–30.06.2026",
              sum: "64,10 €", paid: "Bezahlt · SEPA am 05.07.2026", kwh: "196 kWh",
              solarShare: 0.70, reference: "88,75 €", saving: "24,65 €",
              rows: [("Solarstrom vom Dach · 138 kWh × 24,9 ct", "34,36 €"),
                     ("Netzstrom · 58 kWh × 34,2 ct", "19,84 €"),
                     ("Grundpreis Juni", "9,90 €"),
                     ("Enthaltene USt. (19 %)", "10,23 €")]),
        .init(id: "mai", title: "Rechnung Mai 2026", period: "01.05.–31.05.2026",
              sum: "68,45 €", paid: "Bezahlt · SEPA am 05.06.2026", kwh: "209 kWh",
              solarShare: 0.67, reference: "93,78 €", saving: "25,33 €",
              rows: [("Solarstrom vom Dach · 139 kWh × 24,9 ct", "34,61 €"),
                     ("Netzstrom · 70 kWh × 34,2 ct", "23,94 €"),
                     ("Grundpreis Mai", "9,90 €"),
                     ("Enthaltene USt. (19 %)", "10,93 €")]),
        .init(id: "april", title: "Rechnung April 2026", period: "01.04.–30.04.2026",
              sum: "71,18 €", paid: "Bezahlt · SEPA am 05.05.2026", kwh: "214 kWh",
              solarShare: 0.60, reference: "95,72 €", saving: "24,54 €",
              rows: [("Solarstrom vom Dach · 128 kWh × 24,9 ct", "31,87 €"),
                     ("Netzstrom · 86 kWh × 34,2 ct", "29,41 €"),
                     ("Grundpreis April", "9,90 €"),
                     ("Enthaltene USt. (19 %)", "11,36 €")]),
        .init(id: "maerz", title: "Rechnung März 2026", period: "01.03.–31.03.2026",
              sum: "76,90 €", paid: "Bezahlt · SEPA am 05.04.2026", kwh: "228 kWh",
              solarShare: 0.52, reference: "101,14 €", saving: "24,24 €",
              rows: [("Solarstrom vom Dach · 118 kWh × 24,9 ct", "29,38 €"),
                     ("Netzstrom · 110 kWh × 34,2 ct", "37,62 €"),
                     ("Grundpreis März", "9,90 €"),
                     ("Enthaltene USt. (19 %)", "12,28 €")])
    ]

    static func named(_ id: String) -> Invoice {
        all.first { $0.id == id } ?? all[0]
    }
}
