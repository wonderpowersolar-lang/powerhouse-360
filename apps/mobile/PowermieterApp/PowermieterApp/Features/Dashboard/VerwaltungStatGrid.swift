import SwiftUI

/// Verwaltung · Übersicht — the top stat grid (prototype `verwaltung` overview tiles).
/// Flat tiles (no shadow, unlike `pmCard`): filled surface + hairline border.
struct VerwaltungStatGrid: View {
    private let columns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10)
    ]

    private struct Stat: Identifiable {
        /// The label is unique per tile, so it doubles as a stable identity —
        /// no fresh UUIDs on every render pass.
        var id: String { label }
        let number: String
        let label: String
        let numberColor: Color
    }

    private let stats: [Stat] = [
        Stat(number: "1", label: "Gebäude", numberColor: Theme.tx),
        Stat(number: "24", label: "Einheiten", numberColor: Theme.tx),
        Stat(number: "21", label: "Teilnehmer", numberColor: Theme.tx),
        Stat(number: "1", label: "Störung", numberColor: Theme.warn),
        Stat(number: "3", label: "Aufgaben", numberColor: Theme.tx),
        Stat(number: "2", label: "Dok. offen", numberColor: Theme.tx)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(stats) { stat in
                tile(stat)
            }
        }
    }

    private func tile(_ stat: Stat) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(stat.number)
                .font(.system(size: 21, weight: .heavy))
                .monospacedDigit()
                .foregroundStyle(stat.numberColor)
            Text(stat.label)
                .font(.system(size: 11))
                .foregroundStyle(Theme.tx2)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.card, in: .rect(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Theme.line, lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    VerwaltungStatGrid()
        .padding()
        .background(Theme.bg)
}
