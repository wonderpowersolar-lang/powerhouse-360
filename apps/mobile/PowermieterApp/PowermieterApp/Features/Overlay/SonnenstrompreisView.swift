import SwiftUI

/// Overlay "Sonnenstrompreis" — the current dynamic price and the 24-hour
/// forecast with the cheap window highlighted.
struct SonnenstrompreisView: View {
    let onBack: () -> Void

    @State private var remindMidday = false
    @State private var remindCheapest = false

    /// ct/kWh per hour — cheap around noon, expensive in the evening peak.
    private var prices: [Double] {
        (0..<24).map { hour in
            let h = Double(hour)
            let solar = exp(-pow((h - 13) / 3.1, 2))
            let evening = exp(-pow((h - 19.5) / 2.2, 2))
            return 33.4 - 10.6 * solar + 2.4 * evening
        }
    }

    private var solarForecast: [Double] {
        (0..<24).map { exp(-pow((Double($0) - 13) / 3.1, 2)) }
    }

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Sonnenstrompreis",
                          subtitle: "Dynamischer Mieterstrom · Prognose",
                          onBack: onBack)

            ScrollView {
                VStack(spacing: 13) {
                    priceCard
                    forecastCard

                    Text("Empfohlene Zeitfenster")
                        .pmFont(14.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 3)

                    windowRow(title: "11:30 – 15:00 Uhr",
                              caption: "Sehr günstig · viel Sonne · Ø 24,1 ct",
                              isOn: $remindMidday)
                    windowRow(title: "13:00 – 14:00 Uhr",
                              caption: "Günstigste Stunde · 23,1 ct/kWh",
                              isOn: $remindCheapest)

                    Text("Prognose auf Basis von Wetterdaten und Börsenpreisen · alle Preise inkl. USt.")
                        .pmFont(11)
                        .foregroundStyle(Theme.tx3)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    // MARK: Current price

    private var priceCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text("Dein Preis jetzt")
                    .pmFont(12)
                    .foregroundStyle(Theme.tx2)
                StatusPill(text: "günstig", color: Theme.ok, background: Theme.okS, horizontalPadding: 8)
                Spacer(minLength: 0)
                Text("Stand 11:24 Uhr")
                    .pmFont(11)
                    .foregroundStyle(Theme.tx3)
            }

            HStack(alignment: .firstTextBaseline, spacing: 5) {
                Text("26,4")
                    .pmFont(36, weight: .heavy)
                    .tracking(-1)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                Text("ct/kWh")
                    .pmFont(14, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
            }
            .padding(.top, 4)

            Text("76 % deines Stroms kommen gerade vom Dach.")
                .pmFont(12.5)
                .foregroundStyle(Theme.tx2)
                .padding(.top, 2)

            HStack(spacing: 12) {
                sourcePrice("Solarstrom", "24,9 ct", Theme.pv)
                sourcePrice("Netzstrom", "34,2 ct", Theme.grid)
            }
            .padding(.top, 14)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private func sourcePrice(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 8, height: 8)
                Text(label)
                    .pmFont(11.5)
                    .foregroundStyle(Theme.tx2)
            }
            Text(value)
                .pmFont(15, weight: .heavy)
                .foregroundStyle(Theme.tx)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    // MARK: Forecast

    private var forecastCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                Text("Nächste 24 Stunden")
                    .pmFont(14.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity, alignment: .leading)
                legendItem("Preis", Theme.acc)
                legendItem("Solarprognose", Theme.pv)
            }

            Canvas { context, size in
                // Zero-based bars would all look the same height — the spread
                // between 23 and 36 ct is what matters here, so scale to it.
                let low = (prices.min() ?? 0) - 2.5
                let span = max(0.1, (prices.max() ?? 1) + 1.5 - low)

                // Cheap window 11:30–15:00 highlighted behind the bars.
                let slot = size.width / 24
                let windowRect = CGRect(x: slot * 11.5, y: 0,
                                        width: slot * 3.5, height: size.height)
                context.fill(Path(roundedRect: windowRect, cornerRadius: 8),
                             with: .color(Theme.accS))

                // Solar forecast as a filled curve.
                var solar = Path()
                for (index, value) in solarForecast.enumerated() {
                    let x = size.width * CGFloat(index) / 23
                    let y = size.height - CGFloat(value) * (size.height - 18) - 4
                    if index == 0 { solar.move(to: CGPoint(x: x, y: y)) }
                    else { solar.addLine(to: CGPoint(x: x, y: y)) }
                }
                solar.addLine(to: CGPoint(x: size.width, y: size.height))
                solar.addLine(to: CGPoint(x: 0, y: size.height))
                solar.closeSubpath()
                context.fill(solar, with: .color(Theme.pvS))

                // Price bars.
                for (index, price) in prices.enumerated() {
                    let height = CGFloat((price - low) / span) * (size.height - 8)
                    let rect = CGRect(x: slot * CGFloat(index) + slot / 2 - 4.75,
                                      y: size.height - height,
                                      width: 9.5, height: height)
                    let cheap = (11...14).contains(index)
                    context.fill(Path(roundedRect: rect, cornerRadius: 2.5),
                                 with: .color(cheap ? Theme.acc : Theme.acc.opacity(0.35)))
                }
            }
            .frame(height: 126)
            .padding(.top, 10)
            .accessibilityElement()
            .accessibilityLabel("Preisprognose für 24 Stunden")
            .accessibilityValue("Günstigstes Fenster zwischen 11:30 und 15:00 Uhr, Tief 23,1 Cent um 13 Uhr")

            HStack(spacing: 0) {
                ForEach(["00", "06", "12", "18", "24"], id: \.self) { label in
                    Text(label)
                        .pmFont(11)
                        .foregroundStyle(Theme.tx3)
                    if label != "24" { Spacer(minLength: 0) }
                }
            }
            .padding(.top, 5)
            .accessibilityHidden(true)

            HintNote(symbol: "sun.max",
                     text: "Zwischen 11:30 und 15:00 Uhr wird besonders viel Solarstrom erwartet — dann ist dein Strom am günstigsten.",
                     tint: Theme.pv)
                .padding(.top, 11)
        }
        .padding(16)
        .pmCard()
    }

    private func legendItem(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .pmFont(11)
                .foregroundStyle(Theme.tx2)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: Reminder windows

    private func windowRow(title: String, caption: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                Text(caption)
                    .pmFont(12)
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                isOn.wrappedValue.toggle()
            } label: {
                Image(systemName: isOn.wrappedValue ? "bell.fill" : "bell")
                    .pmFont(16, weight: .semibold)
                    .foregroundStyle(isOn.wrappedValue ? Theme.acc : Theme.tx3)
                    .frame(width: 40, height: 40)
                    .background(isOn.wrappedValue ? Theme.accS : Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Erinnerung \(title)")
            .accessibilityValue(isOn.wrappedValue ? "an" : "aus")
        }
        .padding(16)
        .pmCard()
    }
}

#Preview {
    SonnenstrompreisView(onBack: {})
}
