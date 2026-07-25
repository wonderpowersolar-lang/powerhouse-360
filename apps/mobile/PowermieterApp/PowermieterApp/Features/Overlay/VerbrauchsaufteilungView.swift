import SwiftUI

/// Overlay "Verbrauchsaufteilung" — where the building's kWh went this month.
struct VerbrauchsaufteilungView: View {
    let onBack: () -> Void

    private let slices: [(label: String, detail: String, share: Double, kwh: String, color: Color)] = [
        ("Wohnungen", "Wohnungen · 24 Einheiten", 0.58, "2.540 kWh", Theme.home),
        ("Wärmepumpe", "Wärmepumpe", 0.19, "830 kWh", Theme.wp),
        ("Allgemeinstrom", "Allgemeinstrom · Flur, Keller, Aufzug", 0.12, "525 kWh", Theme.grid),
        ("Ladepunkte", "Ladepunkte · 4 Wallboxen", 0.08, "350 kWh", Theme.bat),
        ("Technik", "Technik · Pumpen, Lüftung", 0.03, "165 kWh", Theme.tx3)
    ]

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Verbrauchsaufteilung",
                          subtitle: "Juli · Gebäude gesamt",
                          onBack: onBack)

            ScrollView {
                VStack(spacing: 13) {
                    donutCard
                    breakdownCard
                    HintNote(symbol: "checkmark.shield",
                             text: "Einzelne Wohnungen werden nur anonymisiert dargestellt. Personenbezogene Verbrauchsdetails sind geschützt.")
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    // MARK: Donut

    private var donutCard: some View {
        VStack(spacing: 18) {
            ZStack {
                ForEach(Array(slices.enumerated()), id: \.offset) { index, slice in
                    Circle()
                        .trim(from: startFraction(before: index),
                              to: startFraction(before: index) + slice.share)
                        .stroke(slice.color, style: StrokeStyle(lineWidth: 20, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                }

                VStack(spacing: 0) {
                    Text("4.410")
                        .font(.system(size: 24, weight: .heavy))
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                    Text("kWh gesamt")
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.tx2)
                }
            }
            .frame(width: 132, height: 132)
            .accessibilityElement()
            .accessibilityLabel("Verbrauchsaufteilung")
            .accessibilityValue("4.410 Kilowattstunden gesamt")

            VStack(spacing: 8) {
                ForEach(Array(slices.enumerated()), id: \.offset) { _, slice in
                    HStack(spacing: 9) {
                        Circle()
                            .fill(slice.color)
                            .frame(width: 9, height: 9)
                            .accessibilityHidden(true)
                        Text(slice.label)
                            .font(.system(size: 12.5))
                            .foregroundStyle(Theme.tx2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(Int((slice.share * 100).rounded())) %")
                            .font(.system(size: 12.5, weight: .bold))
                            .foregroundStyle(Theme.tx)
                            .monospacedDigit()
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .padding(16)
        .pmCard()
    }

    private func startFraction(before index: Int) -> Double {
        slices.prefix(index).reduce(0) { $0 + $1.share }
    }

    // MARK: Breakdown

    private var breakdownCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(slices.enumerated()), id: \.offset) { index, slice in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(spacing: 10) {
                    Text(slice.detail)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.tx2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(slice.kwh)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                }
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }
}

#Preview {
    VerbrauchsaufteilungView(onBack: {})
}
