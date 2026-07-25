import SwiftUI

/// Analyse tab (prototype `tabAnalyse`) — period picker, KPI chips, the
/// Verlauf chart, a period comparison, and role-specific follow-ups.
struct AnalyseView: View {
    var role: OnboardingRole = .mieter

    @Environment(\.openOverlay) private var openOverlay

    @State private var period: AnalysePeriod = .monat

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    periodPicker

                    if period == .eigene {
                        emptyState
                    } else {
                        kpiChips
                        AnalyseChartCard(period: period, role: role)
                        comparisonCard
                    }

                    if role == .mieter {
                        flatComparisonCard
                    } else {
                        buildingTiles
                    }

                    outlineActions
                    solarPriceRow
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Analyse",
                            subtitle: subtitle,
                            unreadCount: 0)
        }
        .background(Theme.bg)
    }

    private var subtitle: String {
        role == .mieter ? "Wohnung 12 · Juli 2026" : "Gebäude · Juli 2026"
    }

    // MARK: Period picker

    private var periodPicker: some View {
        HStack(spacing: 2) {
            ForEach(AnalysePeriod.allCases) { option in
                let active = option == period
                Button {
                    period = option
                } label: {
                    Text(option.title)
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(active ? Theme.btnT : Theme.tx2)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background {
                            if active {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(Theme.btn)
                            }
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(option.title)
                .accessibilityAddTraits(active ? [.isSelected, .isButton] : .isButton)
            }
        }
        .padding(3)
        .pmCard(cornerRadius: 13)
    }

    // MARK: KPI chips

    private var kpiChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 9) {
                ForEach(chips, id: \.label) { chip in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(chip.label)
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.tx2)
                        Text(chip.value)
                            .font(.system(size: 15.5, weight: .heavy))
                            .foregroundStyle(Theme.tx)
                            .monospacedDigit()
                    }
                    .lineLimit(1)
                    .frame(minWidth: 96, alignment: .leading)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .pmCard(cornerRadius: 14)
                    .accessibilityElement(children: .combine)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
        .padding(.horizontal, -18)
    }

    private var chips: [(label: String, value: String)] {
        if role == .mieter {
            [("Verbrauch", "196 kWh"), ("Solaranteil", "76 %"),
             ("Netzbezug", "47 kWh"), ("Kosten", "51,40 €")]
        } else {
            [("Erzeugung", "4,2 MWh"), ("Eigenverbrauch", "68 %"),
             ("Einspeisung", "1,3 MWh"), ("Erlös", "583 €")]
        }
    }

    // MARK: Comparison

    private var comparisonCard: some View {
        VStack(spacing: 0) {
            Text(period.comparisonTitle)
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 11)
                .padding(.bottom, 5)

            ForEach(period.comparisonRows, id: \.label) { row in
                Divider().overlay(Theme.line)
                HStack(spacing: 10) {
                    Text(row.label)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.tx2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    StatusPill(text: row.delta,
                               color: row.isGood ? Theme.ok : Theme.warn,
                               background: row.isGood ? Theme.okS : Theme.warnS)
                }
                .padding(.vertical, 10)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    // MARK: Empty state for a custom range

    private var emptyState: some View {
        VStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(Theme.elev)
                .frame(width: 52, height: 52)
                .overlay {
                    Image(systemName: "clock")
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(Theme.tx2)
                }
                .accessibilityHidden(true)

            Text("Noch keine Daten für diesen Zeitraum")
                .font(.system(size: 15.5, weight: .bold))
                .foregroundStyle(Theme.tx)

            Text("Benutzerdefinierte Zeiträume werden aus dem Messstellen-Archiv geladen. Im Prototyp stehen Heute, Woche, Monat und Jahr bereit.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.tx2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)

            Button {
                period = .monat
            } label: {
                Text("Zurück zu Monat")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.btnT)
                    .padding(.horizontal, 20)
                    .frame(height: 42)
                    .background(Theme.btn, in: .rect(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.pressable)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 34)
        .pmCard()
    }

    // MARK: Role-specific blocks

    private var flatComparisonCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Deine Wohnung im Vergleich")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)

            VStack(spacing: 10) {
                comparisonBar(label: "Meine Wohnung (Juni)", value: "196 kWh",
                              fraction: 0.74, color: Theme.home)
                comparisonBar(label: "Ø Gebäude (anonymisiert)", value: "231 kWh",
                              fraction: 0.87, color: Theme.tx3)
            }
            .padding(.top, 12)

            HStack(alignment: .top, spacing: 9) {
                Image(systemName: "checkmark.shield")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
                Text("Verbrauchsdaten anderer Wohnungen sind geschützt und nur als anonymer Durchschnitt sichtbar.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx3)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
            .padding(.top, 12)
        }
        .padding(16)
        .pmCard()
    }

    private func comparisonBar(label: String, value: String,
                               fraction: CGFloat, color: Color) -> some View {
        VStack(spacing: 5) {
            HStack {
                Text(label)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tx2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(value)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
            }
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.elev)
                GeometryReader { geo in
                    Capsule()
                        .fill(color)
                        .frame(width: geo.size.width * fraction)
                }
            }
            .frame(height: 8)
        }
        .accessibilityElement()
        .accessibilityLabel(label)
        .accessibilityValue(value)
    }

    private var buildingTiles: some View {
        HStack(spacing: 12) {
            actionTile(title: "Verbrauchsaufteilung", caption: "Donut nach Kategorie",
                       target: .verbrauchsaufteilung)
            actionTile(title: "Wohneinheiten", caption: "Vergleich · Messstatus",
                       target: .wohneinheiten)
        }
    }

    private func actionTile(title: String, caption: String, target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            VStack(alignment: .leading, spacing: 7) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text(caption)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .pmCard(cornerRadius: Theme.radiusTile)
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Footer actions

    private var outlineActions: some View {
        HStack(spacing: 10) {
            outlineButton("Detailanalyse", target: .detailanalyse)
            outlineButton("Energiebilanz", target: .energiebilanz)
        }
    }

    private func outlineButton(_ title: String, target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            Text(title)
                .font(.system(size: 13.5, weight: .bold))
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Theme.card, in: .rect(cornerRadius: 14, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(Theme.line2, lineWidth: 1)
                }
        }
        .buttonStyle(.pressable)
    }

    private var solarPriceRow: some View {
        Button { openOverlay(.sonnenstrompreis) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.pvS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Theme.pv)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Dynamischer Sonnenstrompreis")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("Jetzt 26,4 ct/kWh · günstig bis 15:00 Uhr")
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

#Preview("Mieter") {
    AnalyseView(role: .mieter)
}

#Preview("Vermieter") {
    AnalyseView(role: .eigentuemer)
}
