import SwiftUI

/// Mieter · Übersicht — the primary tenant dashboard (prototype `homeM`).
struct MieterDashboardView: View {
    @Environment(\.powermieterStore) private var store

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    liveRow
                    EnergyFlowCard()
                    kpiGrid
                    SolarTipCard()
                    DayCurveCard()
                    MonthReportRow()
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Hallo, Lena",
                            subtitle: "Friedrichsruher Str. 35 · WE 12",
                            unreadCount: 3)
        }
        .background(Theme.bg)
    }

    /// „vor 1 Min" stammt aus dataStatus.lastReceivedAt, sobald geladen.
    private var liveText: String {
        guard let relative = store.lastReceivedText() else {
            return "Live · aktualisiert vor 1 Min"
        }
        return "Live · aktualisiert \(relative)"
    }

    // MARK: Live row

    private var liveRow: some View {
        HStack(spacing: 8) {
            PulseDot()
            Text(liveText)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.tx2)
            Spacer()
            Text("Mo, 21. Juli")
                .font(.system(size: 12))
                .foregroundStyle(Theme.tx3)
        }
    }

    // MARK: KPI grid

    // MARK: Werte aus dem Store

    /// Der Contract liefert einen 15-Minuten-Mittelwert, keinen Momentanwert —
    /// die Beschriftung sagt das jetzt auch.
    private var powerCaption: String {
        guard let minutes = store.summary?.recentPower?.intervalMinutes else {
            return "Aktueller Verbrauch"
        }
        return "Ø letzte \(minutes) Min"
    }

    private var powerValue: String {
        store.summary?.recentPower?.kilowattsText ?? "3,2"
    }

    private var powerAccessibilityText: String {
        "\(powerCaption) \(powerValue) Kilowatt"
    }

    private var solarSharePercent: Int {
        store.summary?.today.pvSharePercent ?? 76
    }

    private var todayCostText: String {
        guard let cents = store.summary?.today.costCents else { return "2,34 €" }
        return String(format: "%.2f €", Double(cents) / 100)
            .replacingOccurrences(of: ".", with: ",")
    }

    private var kpiGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            KPITile(accessibilityText: powerAccessibilityText, sheet: .kpi("verb")) {
                VStack(alignment: .leading, spacing: 7) {
                    HStack(spacing: 6) {
                        Text(powerCaption).font(.system(size: 12)).foregroundStyle(Theme.tx2)
                        PulseDot(size: 6)
                    }
                    value(powerValue, unit: "kW")
                    Sparkline(points: [0.35, 0.42, 0.38, 0.5, 0.44, 0.72, 0.58, 0.9], color: Theme.home)
                        .frame(height: 26)
                }
            }

            KPITile(accessibilityText: "PV-Erzeugung heute 132 Kilowattstunden", sheet: .kpi("pvT")) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("PV-Erzeugung heute").font(.system(size: 12)).foregroundStyle(Theme.tx2)
                    value("132", unit: "kWh")
                    MiniBars(values: [0.28, 0.44, 0.62, 0.8, 0.95, 0.86, 0.66], color: Theme.pv)
                }
            }

            KPITile(accessibilityText: "Solarstromanteil \(solarSharePercent) Prozent heute", sheet: .kpi("solar")) {
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Solarstromanteil")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.tx2)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        value(String(solarSharePercent), unit: "%")
                        Text("heute").font(.system(size: 11)).foregroundStyle(Theme.tx3)
                    }
                    Spacer(minLength: 0)
                    RingGauge(fraction: CGFloat(solarSharePercent) / 100, color: Theme.pv)
                        .frame(width: 44, height: 44)
                }
            }

            KPITile(accessibilityText: "Kosten heute \(todayCostText)", sheet: .kpi("kosten")) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("Kosten heute").font(.system(size: 12)).foregroundStyle(Theme.tx2)
                    value(todayCostText, unit: nil)
                    Text("Ø 27,2 ct/kWh · Messwert").font(.system(size: 11)).foregroundStyle(Theme.tx3)
                }
            }

            KPITile(accessibilityText: "Ersparnis im Juli 18,45 Euro, plus 24 Prozent gegenüber Vorjahr", sheet: .kpi("ersp")) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("Ersparnis im Juli").font(.system(size: 12)).foregroundStyle(Theme.tx2)
                    value("18,45 €", unit: nil, color: Theme.acc)
                    Text("+24 % vs. Vorjahr")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.ok)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Theme.okS, in: .capsule)
                }
            }

            KPITile(accessibilityText: "CO2 vermieden 12,6 Kilogramm im Juli", sheet: .kpi("co2")) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("CO₂ vermieden").font(.system(size: 12)).foregroundStyle(Theme.tx2)
                    value("12,6", unit: "kg")
                    Text("≈ 63 Pkw-km · im Juli").font(.system(size: 11)).foregroundStyle(Theme.tx3)
                }
            }
        }
    }

    private func value(_ text: String, unit: String?, color: Color = Theme.tx) -> some View {
        (Text(text).font(.system(size: 24, weight: .heavy)).foregroundStyle(color)
         + Text(unit.map { " \($0)" } ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.tx2))
            .tracking(-0.4)
            .monospacedDigit()
    }
}

#Preview {
    MieterDashboardView()
}
