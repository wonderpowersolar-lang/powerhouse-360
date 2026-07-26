import SwiftUI

/// Overlay "Detailanalyse" — the 24-hour curve with per-series toggles,
/// a day switch and the cost breakdown underneath.
struct DetailanalyseView: View {
    let onBack: () -> Void

    @Environment(\.openOverlay) private var openOverlay

    enum Day: Hashable { case heute, gestern }

    /// One toggleable curve.
    private enum Series: String, CaseIterable {
        case pv, verbrauch, netz, einspeisung, speicher, waermepumpe

        var label: String {
            switch self {
            case .pv: "PV-Erzeugung"
            case .verbrauch: "Verbrauch"
            case .netz: "Netzbezug"
            case .einspeisung: "Einspeisung"
            case .speicher: "Speicher"
            case .waermepumpe: "Wärmepumpe"
            }
        }

        var tenantLabel: String {
            self == .pv ? "PV-Anteil" : label
        }

        var color: Color {
            switch self {
            case .pv: Theme.pv
            case .verbrauch: Theme.home
            case .netz: Theme.grid
            case .einspeisung: Theme.feed
            case .speicher: Theme.bat
            case .waermepumpe: Theme.wp
            }
        }
    }

    @State private var day: Day = .heute
    @State private var active: Set<Series> = [.pv, .verbrauch, .netz]
    @State private var compare = false
    @State private var selected: Int?

    private var availableSeries: [Series] {
        [.pv, .verbrauch, .netz]
    }

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Detailanalyse", onBack: onBack) {
                SegmentedControl(options: [Day.heute, .gestern],
                                 title: { $0 == .heute ? "Heute" : "Gestern" },
                                 selection: $day,
                                 height: 30,
                                 fontSize: 11.5,
                                 cornerRadius: 9)
                    .frame(width: 126)
            }

            ScrollView {
                VStack(spacing: 13) {
                    seriesChips
                    chartCard

                    costCard
                    recommendationCard
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .onChange(of: day) { selected = nil }
    }

    // MARK: Series chips

    private var seriesChips: some View {
        FlowChips {
            ForEach(availableSeries, id: \.self) { series in
                let on = active.contains(series)
                Button {
                    if on { active.remove(series) } else { active.insert(series) }
                    selected = nil
                } label: {
                    chipLabel(series.tenantLabel,
                              dot: { Circle().fill(series.color).frame(width: 8, height: 8) },
                              on: on)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(series.label)
                .accessibilityAddTraits(on ? [.isSelected, .isButton] : .isButton)
            }

            Button {
                compare.toggle()
            } label: {
                chipLabel("Vorwoche",
                          dot: {
                              Circle()
                                  .strokeBorder(Theme.tx3, style: StrokeStyle(lineWidth: 1.5, dash: [2, 2]))
                                  .frame(width: 8, height: 8)
                          },
                          on: compare)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Vorwoche vergleichen")
            .accessibilityAddTraits(compare ? [.isSelected, .isButton] : .isButton)
        }
    }

    private func chipLabel<Dot: View>(_ title: String,
                                      @ViewBuilder dot: () -> Dot,
                                      on: Bool) -> some View {
        HStack(spacing: 7) {
            dot()
            Text(title)
                .font(.system(size: 12, weight: .semibold))
        }
        .foregroundStyle(on ? Theme.tx : Theme.tx3)
        .padding(.horizontal, 12)
        .frame(height: 34)
        .background(on ? Theme.card : Theme.card2, in: .capsule)
        .overlay {
            Capsule().strokeBorder(on ? Theme.line2 : Theme.line, lineWidth: 1)
        }
    }

    // MARK: Chart

    private var chartCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                Canvas { context, size in
                    draw(in: &context, size: size)
                }
                .accessibilityHidden(true)

                HStack(spacing: 0) {
                    ForEach(0..<24, id: \.self) { hour in
                        Rectangle()
                            .fill(.clear)
                            .contentShape(.rect)
                            .onTapGesture { selected = (selected == hour) ? nil : hour }
                    }
                }
                .accessibilityHidden(true)
            }
            .frame(height: 150)

            HStack(spacing: 0) {
                ForEach(["00", "06", "12", "18", "24"], id: \.self) { label in
                    Text(label)
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.tx3)
                    if label != "24" { Spacer(minLength: 0) }
                }
            }
            .padding(.top, 5)
            .accessibilityHidden(true)

            if let selected {
                HStack(spacing: 8) {
                    Text(readout(for: selected))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.tx2)
                        .monospacedDigit()
                    if (5...7).contains(selected) {
                        StatusPill(text: "geschätzt", color: Theme.tx2,
                                   background: Theme.elev, horizontalPadding: 8)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Theme.card2, in: .rect(cornerRadius: 10, style: .continuous))
                .padding(.top, 9)
            }

            HintNote(symbol: "info.circle",
                     text: "05:00–07:00 Uhr: Zähler-Sync — Werte wurden nach Standardprofil geschätzt und später korrigiert.")
                .padding(.top, 11)
        }
        .padding(16)
        .pmCard()
    }

    private func draw(in context: inout GraphicsContext, size: CGSize) {
        var grid = Path()
        for fraction in [0.253, 0.507, 0.76] {
            let y = size.height * fraction
            grid.move(to: CGPoint(x: 0, y: y))
            grid.addLine(to: CGPoint(x: size.width, y: y))
        }
        context.stroke(grid, with: .color(Theme.line),
                       style: StrokeStyle(lineWidth: 1, dash: [3, 4]))

        let maxV = scaleMax

        if active.contains(.pv) {
            context.fill(area(values(for: .pv), size, maxV), with: .color(Theme.pvS))
        }

        if compare {
            let previous = values(for: .verbrauch).map { $0 * 1.09 }
            context.stroke(line(previous, size, maxV), with: .color(Theme.tx3),
                           style: StrokeStyle(lineWidth: 1.4, dash: [4, 3]))
        }

        // Verbrauch last so the primary curve stays on top.
        for series in availableSeries.filter({ $0 != .verbrauch }) where active.contains(series) {
            context.stroke(line(values(for: series), size, maxV), with: .color(series.color),
                           style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
        }
        if active.contains(.verbrauch) {
            context.stroke(line(values(for: .verbrauch), size, maxV), with: .color(Theme.home),
                           style: StrokeStyle(lineWidth: 2.2, lineCap: .round))
        }
    }

    // MARK: Series data

    private var scale: Double { 1 }
    private var scaleMax: Double { 1.35 }

    private func gauss(_ value: Double, _ mean: Double, _ spread: Double) -> Double {
        exp(-pow((value - mean) / spread, 2))
    }

    private func values(for series: Series) -> [Double] {
        (0..<24).map { hour in
            let h = Double(hour)
            // "Gestern" is the same shape, slightly damped and shifted.
            let shift = day == .heute ? 0.0 : 0.6
            let pv = 1.18 * gauss(h - shift, 13, 3.1)
            let consumption = 0.16 + 0.52 * gauss(h - shift, 7.5, 1.5)
                + 0.88 * gauss(h - shift, 19.5, 2.1) + 0.14 * gauss(h - shift, 13, 3.4)
            let damping = day == .heute ? 1.0 : 0.92

            let raw: Double = switch series {
            case .pv: pv
            case .verbrauch: consumption
            case .netz: max(0, consumption - pv)
            case .einspeisung: max(0, pv - consumption)
            case .speicher: 0.42 * gauss(h - shift, 11, 2.6) + 0.3 * gauss(h - shift, 20, 2.4)
            case .waermepumpe: 0.3 * gauss(h - shift, 6, 2.0) + 0.34 * gauss(h - shift, 17, 2.6)
            }
            return raw * damping * scale
        }
    }

    private func x(_ i: Int, _ count: Int, _ width: CGFloat) -> CGFloat {
        count <= 1 ? 0 : CGFloat(i) / CGFloat(count - 1) * width
    }

    private func y(_ value: Double, _ maxV: Double, _ height: CGFloat) -> CGFloat {
        height - 3 - CGFloat(min(1, value / maxV)) * (height - 12)
    }

    private func line(_ points: [Double], _ size: CGSize, _ maxV: Double) -> Path {
        guard points.count > 1, maxV > 0 else { return Path() }
        let n = points.count
        return Path { path in
            path.move(to: CGPoint(x: x(0, n, size.width), y: y(points[0], maxV, size.height)))
            for i in 1..<n {
                let previous = CGPoint(x: x(i - 1, n, size.width),
                                       y: y(points[i - 1], maxV, size.height))
                let current = CGPoint(x: x(i, n, size.width),
                                      y: y(points[i], maxV, size.height))
                let mid = CGPoint(x: (previous.x + current.x) / 2,
                                  y: (previous.y + current.y) / 2)
                path.addQuadCurve(to: mid, control: previous)
            }
            path.addLine(to: CGPoint(x: x(n - 1, n, size.width),
                                     y: y(points[n - 1], maxV, size.height)))
        }
    }

    private func area(_ points: [Double], _ size: CGSize, _ maxV: Double) -> Path {
        var path = line(points, size, maxV)
        guard !path.isEmpty else { return path }
        path.addLine(to: CGPoint(x: size.width, y: size.height))
        path.addLine(to: CGPoint(x: 0, y: size.height))
        path.closeSubpath()
        return path
    }

    private func readout(for hour: Int) -> String {
        let unit = "kW"
        let parts = availableSeries.filter { active.contains($0) }.map { series in
            let value = values(for: series)[hour]
            let formatted = String(format: "%.1f", value).replacingOccurrences(of: ".", with: ",")
            return "\(series.tenantLabel) \(formatted) \(unit)"
        }
        return "\(String(format: "%02d", hour)):00 Uhr · " + parts.joined(separator: " · ")
    }

    // MARK: Bottom cards

    private var costCard: some View {
        VStack(spacing: 0) {
            cardTitle("Kosten heute")
            valueRow("Solarstrom · 6,5 kWh × 24,9 ct", "1,62 €")
            valueRow("Netzstrom · 2,1 kWh × 34,2 ct", "0,72 €")
            valueRow("Summe bis 11:24 Uhr", "2,34 €", emphasised: true)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func cardTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14.5, weight: .bold))
            .foregroundStyle(Theme.tx)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 12)
            .padding(.bottom, 4)
    }

    private func valueRow(_ label: String, _ value: String,
                          emphasised: Bool = false) -> some View {
        VStack(spacing: 0) {
            Divider().overlay(Theme.line)
            HStack {
                Text(label)
                    .font(.system(size: 12.5, weight: emphasised ? .bold : .regular))
                    .foregroundStyle(emphasised ? Theme.tx : Theme.tx2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(value)
                    .font(.system(size: emphasised ? 14 : 12.5, weight: emphasised ? .heavy : .semibold))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
            }
            .padding(.vertical, 11)
        }
        .accessibilityElement(children: .combine)
    }

    private var recommendationCard: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("Empfehlung")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)

            Text("Verschiebe Waschmaschine und Geschirrspüler in die Mittagszeit — dort kostet deine Kilowattstunde bis zu 27 % weniger.")
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.tx2)

            Button {
                openOverlay(.sonnenstrompreis)
            } label: {
                Text("Sonnenstrompreis ansehen")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.btnT)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Theme.btn, in: .rect(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.pressable)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }
}

#Preview {
    DetailanalyseView(onBack: {})
}
