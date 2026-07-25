import SwiftUI

/// Vermieter · Übersicht — the landlord/building dashboard (prototype `homeV`).
struct VermieterDashboardView: View {
    @Environment(\.openOverlay) private var openOverlay

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    statusCard
                    VermieterEnergyFlowCard()
                    kpiGrid
                    VermieterLoadCurveCard()
                    actionTiles
                    reportRow
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Guten Tag",
                            subtitle: "Friedrichsruher Str. 35 · 24 Einheiten",
                            unreadCount: 2)
        }
        .background(Theme.bg)
    }

    // MARK: Status card

    private var statusCard: some View {
        VStack(spacing: 0) {
            statusRow {
                dot(Theme.ok)
                statusTitle("Anlage läuft normal")
                Text("52,9 kWp · Speicher 74 %")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tx3)
            }

            Divider().overlay(Theme.line)

            Button { openOverlay(.wohneinheiten) } label: {
                statusRow {
                    dot(Theme.info)
                    statusTitle("21 von 24 Einheiten aktiv")
                    chevron
                }
            }
            .buttonStyle(.plain)

            Divider().overlay(Theme.line)

            Button { openOverlay(.messsystem) } label: {
                statusRow {
                    PulseDot(color: Theme.warn, size: 9)
                    statusTitle("1 Warnung · Zähler WE 07 verzögert")
                    chevron
                }
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func statusRow<Row: View>(@ViewBuilder _ content: () -> Row) -> some View {
        HStack(spacing: 10) { content() }
            .padding(.vertical, 11)
    }

    private func statusTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13.5, weight: .semibold))
            .foregroundStyle(Theme.tx)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func dot(_ color: Color) -> some View {
        Circle()
            .fill(color)
            .frame(width: 9, height: 9)
            .accessibilityHidden(true)
    }

    private var chevron: some View {
        Image(systemName: "chevron.right")
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(Theme.tx3)
            .accessibilityHidden(true)
    }

    // MARK: KPI grid

    private var kpiGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            KPITile(accessibilityText: "PV-Erzeugung heute 132 Kilowattstunden, gerade 18,6 Kilowatt", sheet: .kpi("pvT")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("PV-Erzeugung heute")
                    value("132", unit: "kWh")
                    footer("gerade 18,6 kW")
                }
            }

            KPITile(accessibilityText: "Gesamtverbrauch heute 103 Kilowattstunden, 24 Einheiten plus Technik", sheet: .kpi("vbT")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("Gesamtverbrauch heute")
                    value("103", unit: "kWh")
                    footer("24 Einheiten + Technik")
                }
            }

            KPITile(accessibilityText: "Eigenverbrauch 57 Prozent heute", sheet: .kpi("evq")) {
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        kpiTitle("Eigenverbrauch")
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        value("57", unit: "%")
                        Text("heute").font(.system(size: 11)).foregroundStyle(Theme.tx3)
                    }
                    Spacer(minLength: 0)
                    RingGauge(fraction: 0.57, color: Theme.home)
                        .frame(width: 44, height: 44)
                }
            }

            KPITile(accessibilityText: "Autarkiegrad 73 Prozent heute", sheet: .kpi("aut")) {
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        kpiTitle("Autarkiegrad")
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        value("73", unit: "%")
                        Text("heute").font(.system(size: 11)).foregroundStyle(Theme.tx3)
                    }
                    Spacer(minLength: 0)
                    RingGauge(fraction: 0.73, color: Theme.feed)
                        .frame(width: 44, height: 44)
                }
            }

            KPITile(accessibilityText: "Einspeisung heute 57 Kilowattstunden, etwa 4,50 Euro Erlös", sheet: .kpi("einsp")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("Einspeisung heute")
                    value("57", unit: "kWh")
                    footer("≈ 4,50 € Erlös")
                }
            }

            KPITile(accessibilityText: "Netzbezug heute 28 Kilowattstunden, vor allem früher Morgen", sheet: .kpi("netzb")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("Netzbezug heute")
                    value("28", unit: "kWh")
                    footer("v. a. früher Morgen")
                }
            }

            KPITile(accessibilityText: "Erlöse plus Ersparnis im Juli 1.486 Euro, plus 21 Prozent gegenüber Vorjahr", sheet: .kpi("erspV")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("Erlöse + Ersparnis Juli")
                    value("1.486 €", unit: nil, color: Theme.acc)
                    Text("+21 % vs. Vorjahr")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.ok)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Theme.okS, in: .capsule)
                }
            }

            KPITile(accessibilityText: "CO2 vermieden 2,3 Tonnen im Juli, etwa 11.500 Pkw-Kilometer", sheet: .kpi("co2V")) {
                VStack(alignment: .leading, spacing: 7) {
                    kpiTitle("CO₂ vermieden Juli")
                    value("2,3", unit: "t")
                    footer("≈ 11.500 Pkw-km")
                }
            }
        }
    }

    // MARK: Action tiles

    private var actionTiles: some View {
        HStack(spacing: 12) {
            actionTile(symbol: "chart.pie.fill",
                       tint: Theme.home,
                       title: "Verbrauchsaufteilung",
                       caption: "Wohnungen, WP, Allgemein …",
                       target: .verbrauchsaufteilung)
            actionTile(symbol: "chart.bar.fill",
                       tint: Theme.tx2,
                       title: "Wohneinheiten",
                       caption: "24 Einheiten · anonymisiert",
                       target: .wohneinheiten)
        }
    }

    private func actionTile(symbol: String, tint: Color, title: String, caption: String,
                            target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: symbol)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(tint)
                    .accessibilityHidden(true)
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

    // MARK: Report row

    private var reportRow: some View {
        Button { openOverlay(.monatsreport) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(Theme.infoS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "doc.text.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Theme.info)
                            .accessibilityHidden(true)
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Monatsreport Gebäude · Juni")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("Eigenverbrauch +3 Pkt. · 1.412 € Erlöse")
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

    // MARK: Helpers

    private func kpiTitle(_ text: String) -> some View {
        Text(text).font(.system(size: 12)).foregroundStyle(Theme.tx2)
    }

    private func footer(_ text: String) -> some View {
        Text(text).font(.system(size: 11)).foregroundStyle(Theme.tx3)
    }

    private func value(_ text: String, unit: String?, color: Color = Theme.tx) -> some View {
        (Text(text).font(.system(size: 24, weight: .heavy)).foregroundStyle(color)
         + Text(unit.map { " \($0)" } ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.tx2))
            .tracking(-0.4)
            .monospacedDigit()
    }
}

#Preview {
    VermieterDashboardView()
}
