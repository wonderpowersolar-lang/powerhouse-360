import SwiftUI

/// Mieter · Übersicht — the primary tenant dashboard (prototype `homeM`).
struct MieterDashboardView: View {
    @Environment(\.powermieterStore) private var store
    // Nötig, damit die verketteten Text-Zeilen (`value`) bei einer Änderung
    // der Systemschriftgröße neu gerendert werden.
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 12) {
                    liveRow
                    EnergyFlowCard()
                    kpiGrid
                    SolarTipCard()
                    DayCurveCard()
                    MonthReportRow()
                }
                .padding(.horizontal, 20)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)
            // Ohne geladene Daten zeigt der ganze Schirm graue Blöcke statt
            // Zahlen.
            //
            // Nur die store-gebundenen Werte zu neutralisieren hätte nichts
            // gebracht: Energiefluss, PV-Erzeugung, Ersparnis und CO₂ hängen
            // noch an Prototyp-Konstanten und stehen prominenter als alles,
            // was aus dem Store kommt. Ein Platzhalter, den man nicht lesen
            // kann, wird nicht für einen Messwert gehalten — eine erfundene
            // Zahl in korrekter Formatierung schon.
            .redacted(reason: store.presentation == .ready ? [] : .placeholder)

            DashboardHeader(greeting: "Hallo, Lena",
                            subtitle: "Friedrichsruher Str. 35 · WE 12",
                            unreadCount: 3)
        }
        .background(Theme.bg)
    }

    /// „vor 1 Min" stammt aus dataStatus.lastReceivedAt, sobald geladen.
    private var liveText: String {
        guard let relative = store.lastReceivedText() else {
            return store.presentation == .unavailable
                ? "Keine aktuellen Messwerte"
                : "Live · wird geladen"
        }
        return "Live · aktualisiert \(relative)"
    }

    /// Kein Messwert heißt „–", nicht „irgendeine plausible Zahl".
    private var isLive: Bool { store.presentation == .ready }

    // MARK: Live row

    private var liveRow: some View {
        HStack(spacing: 8) {
            if isLive {
                PulseDot()
            } else {
                Circle()
                    .fill(Theme.tx3)
                    .frame(width: 8, height: 8)
                    .accessibilityHidden(true)
            }
            Text(liveText)
                .pmFont(12, weight: .semibold)
                .foregroundStyle(Theme.tx2)
            Spacer()
            Text("Mo, 21. Juli")
                .pmFont(12)
                .foregroundStyle(Theme.tx3)
        }
        // Der Grund, warum der Rest grau ist, muss lesbar bleiben.
        .unredacted()
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

    /// Platzhalterstrich für alles, was der Server nicht geliefert hat.
    private static let missing = "–"

    /// Die eine Regel für jeden Messwert:
    ///
    /// - Wert da → Wert.
    /// - Wird geladen → `shape`, aber die Ansicht ist dabei redigiert, also
    ///   sieht man nur einen grauen Block in der richtigen Breite.
    /// - Sonst (Fehler oder Server liefert das Feld nicht) → „–".
    ///
    /// Entscheidend ist der letzte Fall: Vorher stand dort der Prototyp-Wert,
    /// und ein Ladefehler war von einem echten Messwert nicht zu unterscheiden.
    private func display(_ value: String?, shape: String) -> String {
        if let value { return value }
        return store.presentation == .placeholder ? shape : Self.missing
    }

    private var powerValue: String {
        display(store.summary?.recentPower?.kilowattsText, shape: "3,2")
    }

    private var powerAccessibilityText: String {
        powerValue == Self.missing
            ? "\(powerCaption): kein Messwert verfügbar"
            : "\(powerCaption) \(powerValue) Kilowatt"
    }

    private var solarSharePercent: Int? {
        store.summary?.today.pvSharePercent
    }

    private var solarShareText: String {
        display(solarSharePercent.map(String.init), shape: "76")
    }

    /// `.redacted` greift nur auf Text und Bilder, nicht auf gezeichnete
    /// Formen — der Ring braucht seinen Platzhalterwert deshalb selbst.
    private var solarShareFraction: CGFloat {
        if let solarSharePercent { return CGFloat(solarSharePercent) / 100 }
        return store.presentation == .placeholder ? 0.76 : 0
    }

    private var solarShareAccessibilityText: String {
        solarShareText == Self.missing
            ? "Solarstromanteil: kein Wert verfügbar"
            : "Solarstromanteil \(solarShareText) Prozent heute"
    }

    private var todayCostText: String {
        let formatted = store.summary?.today.costCents.map {
            String(format: "%.2f €", Double($0) / 100)
                .replacingOccurrences(of: ".", with: ",")
        }
        return display(formatted, shape: "2,34 €")
    }

    private var kpiGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            KPITile(accessibilityText: powerAccessibilityText, sheet: .kpi("verb")) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        Text(powerCaption).pmFont(12).foregroundStyle(Theme.tx2)
                        PulseDot(size: 6)
                    }
                    value(powerValue, unit: "kW")
                    Sparkline(points: [0.35, 0.42, 0.38, 0.5, 0.44, 0.72, 0.58, 0.9], color: Theme.home)
                        .frame(height: 26)
                }
            }

            KPITile(accessibilityText: "PV-Erzeugung heute 132 Kilowattstunden", sheet: .kpi("pvT")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("PV-Erzeugung heute").pmFont(12).foregroundStyle(Theme.tx2)
                    value("132", unit: "kWh")
                    MiniBars(values: [0.28, 0.44, 0.62, 0.8, 0.95, 0.86, 0.66], color: Theme.pv)
                }
            }

            KPITile(accessibilityText: solarShareAccessibilityText, sheet: .kpi("solar")) {
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Solarstromanteil")
                            .pmFont(12)
                            .foregroundStyle(Theme.tx2)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        value(solarShareText, unit: "%")
                        Text("heute").pmFont(11).foregroundStyle(Theme.tx3)
                    }
                    Spacer(minLength: 0)
                    RingGauge(fraction: solarShareFraction, color: Theme.pv)
                        .frame(width: 44, height: 44)
                }
            }

            KPITile(accessibilityText: "Kosten heute \(todayCostText)", sheet: .kpi("kosten")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Kosten heute").pmFont(12).foregroundStyle(Theme.tx2)
                    value(todayCostText, unit: nil)
                    Text("Ø 27,2 ct/kWh · Messwert").pmFont(11).foregroundStyle(Theme.tx3)
                }
            }

            KPITile(accessibilityText: "Ersparnis im Juli 18,45 Euro, plus 24 Prozent gegenüber Vorjahr", sheet: .kpi("ersp")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ersparnis im Juli").pmFont(12).foregroundStyle(Theme.tx2)
                    value("18,45 €", unit: nil, color: Theme.acc)
                    Text("+24 % vs. Vorjahr")
                        .pmFont(11, weight: .bold)
                        .foregroundStyle(Theme.ok)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Theme.okS, in: .capsule)
                }
            }

            KPITile(accessibilityText: "CO2 vermieden 12,6 Kilogramm im Juli", sheet: .kpi("co2")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("CO₂ vermieden").pmFont(12).foregroundStyle(Theme.tx2)
                    value("12,6", unit: "kg")
                    Text("≈ 63 Pkw-km · im Juli").pmFont(11).foregroundStyle(Theme.tx3)
                }
            }
        }
    }

    private func value(_ text: String, unit: String?, color: Color = Theme.tx) -> some View {
        (Text(text).font(.pmScaled(24, weight: .heavy, for: dynamicTypeSize)).foregroundStyle(color)
         + Text(unit.map { " \($0)" } ?? "").font(.pmScaled(13, weight: .semibold, for: dynamicTypeSize)).foregroundStyle(Theme.tx2))
            .tracking(-0.4)
            .monospacedDigit()
    }
}

#Preview {
    MieterDashboardView()
}
