import SwiftUI

/// "Tagesverlauf" card — solar area + consumption/grid lines over 24h.
struct DayCurveCard: View {
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.powermieterStore) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Abgelesene Stunde. Bleibt nach dem Abheben stehen: beim Ziehen
    /// verdeckt der Finger genau die Stelle, die man lesen will.
    /// Debug: Startwert per `SIMCTL_CHILD_PM_SCRUB=14` setzen, um den Zustand
    /// ohne Geste zeigen zu können.
    @State private var scrubbedHour: Int? = ProcessInfo.processInfo
        .environment["PM_SCRUB"].flatMap(Int.init)

    // Representative 24h sample curves (0...1), matching the prototype's shape.
    private let solar: [CGFloat] = [0, 0, 0, 0, 0, 0.02, 0.08, 0.2, 0.38, 0.58, 0.76, 0.9, 0.97, 0.94, 0.82, 0.64, 0.44, 0.25, 0.1, 0.03, 0, 0, 0, 0]
    private let consumption: [CGFloat] = [0.22, 0.18, 0.15, 0.14, 0.16, 0.24, 0.4, 0.52, 0.44, 0.36, 0.34, 0.4, 0.5, 0.42, 0.36, 0.34, 0.4, 0.55, 0.72, 0.68, 0.56, 0.44, 0.34, 0.26]
    private let grid: [CGFloat] = [0.22, 0.18, 0.15, 0.14, 0.16, 0.22, 0.32, 0.32, 0.06, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.62, 0.65, 0.56, 0.44, 0.34, 0.26]

    // MARK: Kurven

    /// Stundenwerte aus dem Store; nil, solange nichts geladen ist.
    private var hourly: [ConsumptionContracts.Point]? {
        guard let points = store.today?.points, points.count >= 2 else { return nil }
        return points
    }

    /// Alle Serien teilen sich denselben Maßstab, sonst wären sie nicht
    /// vergleichbar.
    private var scaleMax: Double {
        guard let hourly else { return 1 }
        return max(0.001, hourly.map { $0.kwhTotal.doubleValue }.max() ?? 1)
    }

    private func normalized(_ value: Kwh?) -> CGFloat {
        CGFloat((value?.doubleValue ?? 0) / scaleMax)
    }

    private var solarCurve: [CGFloat] {
        hourly.map { $0.map { normalized($0.kwhPv) } } ?? solar
    }

    private var consumptionCurve: [CGFloat] {
        hourly.map { $0.map { normalized($0.kwhTotal) } } ?? consumption
    }

    private var gridCurve: [CGFloat] {
        hourly.map { $0.map { normalized($0.kwhGrid) } } ?? grid
    }

    /// Fällt auf die Prototyp-Werte zurück, solange nichts geladen ist.
    private var todayText: String {
        guard let total = store.todayKwhText, let solar = store.todaySolarKwh else {
            return "Heute: 8,6 kWh · davon 6,5 kWh Solar"
        }
        return "Heute: \(total) kWh · davon \(solar.formatted(fractionDigits: 1)) kWh Solar"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("Tagesverlauf")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Spacer(minLength: 0)
                legendDot(color: Theme.pv, label: "Solar")
                legendDot(color: Theme.home, label: "Verbrauch")
                legendDot(color: Theme.grid, label: "Netz")
            }

            chart
                .frame(height: 146)

            HStack {
                ForEach(["00", "06", "12", "18", "24"], id: \.self) { h in
                    Text(h).font(.system(size: 11)).foregroundStyle(Theme.tx3)
                    if h != "24" { Spacer() }
                }
            }

            Divider().overlay(Theme.line)

            HStack(spacing: 8) {
                Text(scrubbedHour.flatMap(readout) ?? todayText)
                    .font(.system(size: 12, weight: scrubbedHour == nil ? .regular : .semibold))
                    .foregroundStyle(scrubbedHour == nil ? Theme.tx2 : Theme.tx)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                    .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: scrubbedHour)
                Spacer()
                Button("Detailanalyse") { openOverlay(.detailanalyse) }
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(Theme.acc)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .pmCard()
    }

    private var chart: some View {
        GeometryReader { geo in
            let size = geo.size
            ZStack {
                ForEach([0.25, 0.5, 0.75], id: \.self) { f in
                    Path { p in
                        let y = size.height * f
                        p.move(to: CGPoint(x: 0, y: y))
                        p.addLine(to: CGPoint(x: size.width, y: y))
                    }
                    .stroke(Theme.line, style: StrokeStyle(lineWidth: 1, dash: [3, 4]))
                }

                areaPath(solarCurve, in: size).fill(Theme.pvS)
                linePath(gridCurve, in: size).stroke(Theme.grid.opacity(0.85), style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
                linePath(consumptionCurve, in: size).stroke(Theme.home, style: StrokeStyle(lineWidth: 2.2, lineCap: .round, lineJoin: .round))

                if let hour = scrubbedHour {
                    scrubIndicator(hour: hour, in: size)
                }
            }
            .contentShape(.rect)
            // Antippen statt Ziehen — bewusst.
            //
            // Jede DragGesture auf einem Kind der ScrollView beansprucht die
            // Berührung und macht das Dashboard über dem Chart unscrollbar;
            // das gilt auch mit vorgeschaltetem LongPress und auch für
            // `simultaneousGesture` (beides im Simulator geprüft). Ein Tap
            // konkurriert nicht mit dem Scrollen — dasselbe Muster benutzt
            // `AnalyseChartCard`. Erneutes Antippen derselben Stunde blendet
            // den Wert wieder aus.
            .overlay {
                HStack(spacing: 0) {
                    ForEach(0..<max(consumptionCurve.count, 1), id: \.self) { hour in
                        Rectangle()
                            .fill(.clear)
                            .contentShape(.rect)
                            .onTapGesture {
                                scrubbedHour = (scrubbedHour == hour) ? nil : hour
                            }
                    }
                }
            }
            // Für iPad-Trackpad und Mac: echtes Zeiger-Hover.
            .onContinuousHover { phase in
                switch phase {
                case .active(let location): scrub(to: location.x, width: size.width)
                case .ended: break
                }
            }
        }
        .accessibilityHidden(true)
    }

    // MARK: Scrubbing

    /// Nur noch für Zeiger-Hover (iPad-Trackpad, Mac) — auf dem Telefon
    /// wählt der Tap die Stunde.
    private func scrub(to x: CGFloat, width: CGFloat) {
        guard hourly != nil, width > 0 else { return }
        let count = consumptionCurve.count
        let step = width / CGFloat(count - 1)
        let hour = min(count - 1, max(0, Int((x / step).rounded())))
        guard hour != scrubbedHour else { return }
        scrubbedHour = hour
    }

    @ViewBuilder
    private func scrubIndicator(hour: Int, in size: CGSize) -> some View {
        let x = size.width * CGFloat(hour) / CGFloat(consumptionCurve.count - 1)

        Path { path in
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: size.height))
        }
        .stroke(Theme.tx3, style: StrokeStyle(lineWidth: 1, dash: [2, 3]))

        marker(at: point(consumptionCurve, hour, size), color: Theme.home)
        marker(at: point(solarCurve, hour, size), color: Theme.pv)
        marker(at: point(gridCurve, hour, size), color: Theme.grid)
    }

    private func marker(at position: CGPoint, color: Color) -> some View {
        Circle()
            .fill(color)
            .frame(width: 7, height: 7)
            .overlay { Circle().strokeBorder(Theme.card, lineWidth: 1.5) }
            .position(position)
    }

    /// Ablesewert für die angetippte Stunde.
    private func readout(for hour: Int) -> String? {
        guard let hourly, hour < hourly.count else { return nil }
        let entry = hourly[hour]
        let time = String(format: "%02d:00", hour)
        var parts = ["\(time) Uhr", "\(entry.kwhTotal.formatted(fractionDigits: 2)) kWh"]
        if let pv = entry.kwhPv {
            parts.append("Solar \(pv.formatted(fractionDigits: 2))")
        }
        if let grid = entry.kwhGrid {
            parts.append("Netz \(grid.formatted(fractionDigits: 2))")
        }
        return parts.joined(separator: " · ")
    }

    private func point(_ values: [CGFloat], _ i: Int, _ size: CGSize) -> CGPoint {
        let x = size.width * CGFloat(i) / CGFloat(values.count - 1)
        let y = size.height * (1 - values[i])
        return CGPoint(x: x, y: y)
    }

    private func linePath(_ values: [CGFloat], in size: CGSize) -> Path {
        Path { p in
            for i in values.indices {
                let pt = point(values, i, size)
                if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
            }
        }
    }

    private func areaPath(_ values: [CGFloat], in size: CGSize) -> Path {
        Path { p in
            p.move(to: CGPoint(x: 0, y: size.height))
            for i in values.indices { p.addLine(to: point(values, i, size)) }
            p.addLine(to: CGPoint(x: size.width, y: size.height))
            p.closeSubpath()
        }
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.system(size: 11)).foregroundStyle(Theme.tx2)
        }
    }
}

#Preview {
    DayCurveCard().padding().background(Theme.bg)
}
