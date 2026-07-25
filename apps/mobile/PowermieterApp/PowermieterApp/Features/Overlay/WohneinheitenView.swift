import SwiftUI

/// Overlay "Wohneinheiten" — anonymised per-unit consumption for June.
struct WohneinheitenView: View {
    let onBack: () -> Void

    enum Sort: Hashable { case nummer, verbrauch }

    @State private var sort: Sort = .nummer

    private let average = 214.0

    /// 24 units, deterministic so the list is stable across renders.
    private var units: [(nr: Int, kwh: Double, contract: String, delayed: Bool)] {
        (1...24).map { index in
            let wave = sin(Double(index) * 1.7) * 46 + sin(Double(index) / 2.3) * 34
            return (nr: index,
                    kwh: (average + wave).rounded(),
                    contract: index % 7 == 3 ? "Grundversorgung" : "Mieterstrom",
                    delayed: index == 7)
        }
    }

    private var sortedUnits: [(nr: Int, kwh: Double, contract: String, delayed: Bool)] {
        sort == .nummer ? units : units.sorted { $0.kwh > $1.kwh }
    }

    private var maxKwh: Double { units.map(\.kwh).max() ?? 1 }

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Wohneinheiten",
                          subtitle: "Juni · Ø 214 kWh · anonymisiert",
                          onBack: onBack) {
                SegmentedControl(options: [Sort.nummer, .verbrauch],
                                 title: { $0 == .nummer ? "Nr." : "Verbrauch" },
                                 selection: $sort,
                                 height: 30,
                                 fontSize: 11.5,
                                 cornerRadius: 9)
                    .frame(width: 132)
            }

            ScrollView {
                VStack(spacing: 13) {
                    HintNote(symbol: "checkmark.shield",
                             text: "Ohne Namen und Personenbezug — nur Einheitennummern und Monatswerte.")

                    ForEach(sortedUnits, id: \.nr) { unit in
                        unitRow(unit)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    private func unitRow(_ unit: (nr: Int, kwh: Double, contract: String, delayed: Bool)) -> some View {
        let delta = unit.kwh - average
        let deltaText = "\(delta >= 0 ? "+" : "−")\(Int(abs(delta).rounded())) kWh"

        return VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 8) {
                Text("WE \(String(format: "%02d", unit.nr))")
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()

                if unit.delayed {
                    StatusPill(text: "verzögert", color: Theme.warn, background: Theme.warnS)
                }

                Spacer(minLength: 0)

                Text("\(Int(unit.kwh)) kWh")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()

                Text(deltaText)
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(delta >= 0 ? Theme.warn : Theme.ok)
                    .monospacedDigit()
            }

            HStack(spacing: 10) {
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.elev)
                    GeometryReader { geo in
                        Capsule()
                            .fill(unit.delayed ? Theme.warn : Theme.home)
                            .frame(width: geo.size.width * (unit.kwh / maxKwh))
                    }
                }
                .frame(height: 7)

                Text(unit.contract)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.tx3)
                    .layoutPriority(1)
            }
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 13)
        .pmCard(cornerRadius: Theme.radiusTile)
        .accessibilityElement()
        .accessibilityLabel("Wohneinheit \(unit.nr)\(unit.delayed ? ", Zähler verzögert" : "")")
        .accessibilityValue("\(Int(unit.kwh)) Kilowattstunden, \(deltaText) gegenüber Durchschnitt, \(unit.contract)")
    }
}

#Preview {
    WohneinheitenView(onBack: {})
}
