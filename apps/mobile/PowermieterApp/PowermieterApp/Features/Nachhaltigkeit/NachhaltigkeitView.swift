import SwiftUI

/// Nachhaltigkeit tab (prototype `tabNach`) — avoided CO₂ with everyday
/// equivalents, the local-energy share, and the building total.
struct NachhaltigkeitView: View {
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.openSheet) private var openSheet

    private let monthShare: [(month: String, height: CGFloat, isCurrent: Bool)] = [
        ("Feb", 26, false), ("Mär", 30, false), ("Apr", 34, false),
        ("Mai", 36, false), ("Jun", 38, false), ("Jul", 42, true)
    ]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 12) {
                    co2HeroCard
                    equivalentTiles
                    localShareCard
                    buildingTotalCard
                    reportRow
                }
                .padding(.horizontal, 20)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Nachhaltigkeit",
                            subtitle: "Wohnung 12 · Juli 2026",
                            unreadCount: 0)
        }
        .background(Theme.bg)
    }

    // MARK: CO₂ hero

    private var co2HeroCard: some View {
        HStack(spacing: 16) {
            RingGauge(fraction: 0.76, color: Theme.acc, lineWidth: 8)
                .frame(width: 72, height: 72)
                .overlay {
                    Image(systemName: "leaf.fill")
                        .pmFont(20)
                        .foregroundStyle(Theme.acc)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 0) {
                Text("CO₂ vermieden im Juli")
                    .pmFont(12.5)
                    .foregroundStyle(Theme.tx2)

                Text("12,6 kg")
                    .pmFont(30, weight: .heavy)
                    .tracking(-0.6)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                    .padding(.top, 2)

                Button { openSheet(.info("naeh")) } label: {
                    HStack(spacing: 6) {
                        Text("Näherungswert")
                            .pmFont(11, weight: .bold)
                        Image(systemName: "info.circle")
                            .pmFont(10, weight: .semibold)
                            .accessibilityHidden(true)
                    }
                    .foregroundStyle(Theme.tx2)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(Theme.elev, in: .capsule)
                }
                .buttonStyle(.pressable)
                .padding(.top, 6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 20)
        .background {
            // Clipped to the card radius so the tint can't bleed past the corners.
            LinearGradient(colors: [Theme.accS, .clear],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .clipShape(.rect(cornerRadius: Theme.radiusCard, style: .continuous))
        }
        .pmCard()
    }

    // MARK: Everyday equivalents

    private var equivalentTiles: some View {
        HStack(spacing: 12) {
            equivalentTile(symbol: "car.fill", tint: Theme.tx2,
                           value: "≈ 63 km", caption: "Autofahrt vermieden – diesen Monat")
            equivalentTile(symbol: "tree.fill", tint: Theme.acc,
                           value: "≈ 1,2", caption: "Baum-Jahre CO₂-Bindung")
        }
    }

    private func equivalentTile(symbol: String, tint: Color,
                                value: String, caption: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: symbol)
                .pmFont(19)
                .foregroundStyle(tint)
                // Fixed box so both tiles put their value on the same baseline
                // regardless of the glyph's own height.
                .frame(height: 24)
                .accessibilityHidden(true)
            Text(value)
                .pmFont(21, weight: .heavy)
                .foregroundStyle(Theme.tx)
                .monospacedDigit()
            Text(caption)
                .pmFont(11.5)
                .foregroundStyle(Theme.tx2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard(cornerRadius: Theme.radiusTile)
        .accessibilityElement(children: .combine)
    }

    // MARK: Local energy share

    private var localShareCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Anteil lokaler Energie")
                    .pmFont(14.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Spacer()
                Text("letzte 6 Monate")
                    .pmFont(12)
                    .foregroundStyle(Theme.tx3)
            }

            HStack(spacing: 16) {
                RingGauge(fraction: 0.76, color: Theme.pv, lineWidth: 8)
                    .frame(width: 64, height: 64)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 0) {
                    Text("76 %")
                        .pmFont(24, weight: .heavy)
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                    Text("deines Stroms kamen im Juli direkt vom Dach – dein bester Wert bisher.")
                        .pmFont(12)
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.top, 12)
            .accessibilityElement(children: .combine)

            HStack(alignment: .bottom, spacing: 12) {
                ForEach(monthShare, id: \.month) { entry in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 5, style: .continuous)
                            .fill(entry.isCurrent ? Theme.pv : Theme.elev)
                            .frame(height: entry.height)
                        Text(entry.month)
                            .pmFont(10, weight: entry.isCurrent ? .bold : .regular)
                            .foregroundStyle(entry.isCurrent ? Theme.tx : Theme.tx3)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 56, alignment: .bottom)
            .padding(.top, 16)
            .accessibilityElement()
            .accessibilityLabel("Verlauf lokaler Energieanteil")
            .accessibilityValue("Februar bis Juli, steigend auf 76 Prozent")
        }
        .padding(16)
        .pmCard()
    }

    // MARK: Building total

    private var buildingTotalCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Euer Haus gesamt")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("3,1 t")
                    .pmFont(26, weight: .heavy)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                Text("CO₂ vermieden seit Januar")
                    .pmFont(12.5)
                    .foregroundStyle(Theme.tx2)
            }
            .padding(.top, 12)

            Text("Entspricht etwa 15.500 Pkw-Kilometern oder der Jahresbindung von 250 Bäumen.")
                .pmFont(12.5)
                .foregroundStyle(Theme.tx2)
                .padding(.top, 8)

            Button { openSheet(.info("naeh")) } label: {
                Text("Alle Werte sind Näherungswerte – so rechnen wir")
                    .pmFont(11.5, weight: .semibold)
                    .foregroundStyle(Theme.tx3)
                    .underline()
            }
            .buttonStyle(.plain)
            .padding(.top, 12)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    // MARK: Report row

    private var reportRow: some View {
        Button { openOverlay(.monatsreport) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.infoS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "doc.text.fill")
                            .pmFont(16, weight: .semibold)
                            .foregroundStyle(Theme.info)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Monatsreport Juni öffnen")
                        .pmFont(14, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text("Mit persönlichen Empfehlungen")
                        .pmFont(12)
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .pmFont(13, weight: .bold)
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    NachhaltigkeitView()
}
