import Foundation

/// Energiemenge in Kilowattstunden.
///
/// Der Vertrag überträgt kWh als Dezimal-String mit exakt drei Nachkommastellen
/// (`packages/api-contracts/src/app/common.ts`, `kwhStringSchema`). Intern wird
/// wie auf der Serverseite (`format.ts`) ausschließlich in ganzzahligen
/// Milli-kWh gerechnet — `Double` würde bei Summen über tausende Messwerte
/// Rundungsfehler einschleppen.
struct Kwh: Equatable, Hashable, Sendable {
    /// Wert in Milli-kWh. 12,345 kWh entspricht 12_345.
    let milli: Int

    init(milli: Int) {
        self.milli = milli
    }

    /// Parst das Wire-Format. Gibt `nil` zurück, wenn der String nicht dem
    /// Vertrag entspricht — der Aufrufer entscheidet, ob das ein Fehler ist.
    init?(wire: String) {
        let trimmed = wire.trimmingCharacters(in: .whitespaces)
        let negative = trimmed.hasPrefix("-")
        let digits = negative ? String(trimmed.dropFirst()) : trimmed
        let parts = digits.split(separator: ".", maxSplits: 1, omittingEmptySubsequences: false)

        guard let wholePart = parts.first,
              !wholePart.isEmpty,
              wholePart.allSatisfy(\.isNumber),
              let whole = Int(wholePart)
        else { return nil }

        var fraction = 0
        if parts.count == 2 {
            let fractionPart = parts[1]
            guard (1...3).contains(fractionPart.count),
                  fractionPart.allSatisfy(\.isNumber),
                  let parsed = Int(fractionPart.padding(toLength: 3, withPad: "0", startingAt: 0))
            else { return nil }
            fraction = parsed
        }

        let magnitude = whole * 1000 + fraction
        self.milli = negative ? -magnitude : magnitude
    }

    /// Wire-Format mit exakt drei Nachkommastellen.
    var wire: String {
        let sign = milli < 0 ? "-" : ""
        let magnitude = abs(milli)
        let fraction = String(magnitude % 1000)
        let padded = String(repeating: "0", count: 3 - fraction.count) + fraction
        return "\(sign)\(magnitude / 1000).\(padded)"
    }

    var doubleValue: Double { Double(milli) / 1000 }

    /// Anzeigeformat mit deutschem Dezimalkomma.
    func formatted(fractionDigits: Int = 1) -> String {
        String(format: "%.\(fractionDigits)f", doubleValue)
            .replacingOccurrences(of: ".", with: ",")
    }

    static func + (lhs: Kwh, rhs: Kwh) -> Kwh { Kwh(milli: lhs.milli + rhs.milli) }
    static func - (lhs: Kwh, rhs: Kwh) -> Kwh { Kwh(milli: lhs.milli - rhs.milli) }
}

extension Kwh: Codable {
    init(from decoder: any Decoder) throws {
        let wire = try decoder.singleValueContainer().decode(String.self)
        guard let value = Kwh(wire: wire) else {
            throw DecodingError.dataCorrupted(
                .init(codingPath: decoder.codingPath,
                      debugDescription: "kWh muss ein Dezimal-String mit bis zu 3 Nachkommastellen sein, war: \(wire)")
            )
        }
        self = value
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(wire)
    }
}
