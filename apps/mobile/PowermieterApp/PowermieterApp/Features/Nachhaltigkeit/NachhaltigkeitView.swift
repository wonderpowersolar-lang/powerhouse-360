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
                VStack(spacing: 13) {
                    co2HeroCard
                    equivalentTiles
                    localShareCard
                    buildingTotalCard
                    reportRow
                }
                .padding(.horizontal, 18)
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
        HStack(spacing: 14) {
            RingGauge(fraction: 0.76, color: Theme.acc, lineWidth: 8)
                .frame(width: 72, height: 72)
                .overlay {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(Theme.acc)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 0) {
                Text("CO₂ vermieden im Juli")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.tx2)

                Text("12,6 kg")
                    .font(.system(size: 30, weight: .heavy))
                    .tracking(-0.6)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                    .padding(.top, 2)

                Button { openSheet(.info("naeh")) } label: {
                    HStack(spacing: 5) {
                        Text("Näherungswert")
                            .font(.system(size: 11, weight: .bold))
                        Image(systemName: "info.circle")
                            .font(.system(size: 10, weight: .semibold))
                            .accessibilityHidden(true)
                    }
                    .foregroundStyle(Theme.tx2)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Theme.elev, in: .capsule)
                }
                .buttonStyle(.pressable)
                .padding(.top, 5)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 18)
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
                .font(.system(size: 19))
                .foregroundStyle(tint)
                // Fixed box so both tiles put their value on the same baseline
                // regardless of the glyph's own height.
                .frame(height: 24)
                .accessibilityHidden(true)
            Text(value)
                .font(.system(size: 21, weight: .heavy))
                .foregroundStyle(Theme.tx)
                .monospacedDigit()
            Text(caption)
                .font(.system(size: 11.5))
                .foregroundStyle(Theme.tx2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .pmCard(cornerRadius: Theme.radiusTile)
        .accessibilityElement(children: .combine)
    }

    // MARK: Local energy share

    private var localShareCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Anteil lokaler Energie")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Spacer()
                Text("letzte 6 Monate")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tx3)
            }

            HStack(spacing: 16) {
                RingGauge(fraction: 0.76, color: Theme.pv, lineWidth: 8)
                    .frame(width: 64, height: 64)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 0) {
                    Text("76 %")
                        .font(.system(size: 24, weight: .heavy))
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                    Text("deines Stroms kamen im Juli direkt vom Dach – dein bester Wert bisher.")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.top, 12)
            .accessibilityElement(children: .combine)

            HStack(alignment: .bottom, spacing: 10) {
                ForEach(monthShare, id: \.month) { entry in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 5, style: .continuous)
                            .fill(entry.isCurrent ? Theme.pv : Theme.elev)
                            .frame(height: entry.height)
                        Text(entry.month)
                            .font(.system(size: 10, weight: entry.isCurrent ? .bold : .regular))
                            .foregroundStyle(entry.isCurrent ? Theme.tx : Theme.tx3)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 56, alignment: .bottom)
            .padding(.top, 14)
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
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("3,1 t")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                Text("CO₂ vermieden seit Januar")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.tx2)
            }
            .padding(.top, 10)

            Text("Entspricht etwa 15.500 Pkw-Kilometern oder der Jahresbindung von 250 Bäumen.")
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.tx2)
                .padding(.top, 8)

            Button { openSheet(.info("naeh")) } label: {
                Text("Alle Werte sind Näherungswerte – so rechnen wir")
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(Theme.tx3)
                    .underline()
            }
            .buttonStyle(.plain)
            .padding(.top, 10)
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
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Theme.info)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Monatsreport Juni öffnen")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("Mit persönlichen Empfehlungen")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    NachhaltigkeitView()
}
