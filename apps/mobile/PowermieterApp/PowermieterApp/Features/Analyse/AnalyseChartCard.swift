import SwiftUI

/// "Verlauf" card of the Analyse tab. Renders the prototype's inline SVG
/// natively: smoothed area/line for Heute and Monat, grouped bars for Woche
/// and Jahr. Tapping a column reveals the value read-out underneath.
struct AnalyseChartCard: View {
    let period: AnalysePeriod

    @State private var selected: Int?

    private let chartHeight: CGFloat = 150

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            legend

            ZStack {
                Canvas { context, size in
                    draw(in: &context, size: size)
                }
                .accessibilityHidden(true)

                tapColumns
            }
            .frame(height: chartHeight)
            .padding(.top, 10)

            axisLabels
                .padding(.top, 5)

            if let selected, let readout = readout(for: selected) {
                Text(readout)
                    .pmFont(12, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
                    .monospacedDigit()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Theme.card2, in: .rect(cornerRadius: 10, style: .continuous))
                    .padding(.top, 9)
            }
        }
        .padding(16)
        .pmCard()
        .onChange(of: period) { selected = nil }
    }

    // MARK: Legend

    private var legend: some View {
        HStack(spacing: 12) {
            Text("Verlauf")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity, alignment: .leading)

            legendItem("PV / Solar", Theme.pv)
            legendItem("Verbrauch", Theme.home)
            if period == .heute {
                legendItem("Netz", Theme.grid)
            }
        }
    }

    private func legendItem(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 5) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(label)
                .pmFont(11)
                .foregroundStyle(Theme.tx2)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: Canvas

    private func draw(in context: inout GraphicsContext, size: CGSize) {
        var grid = Path()
        for fraction in [0.253, 0.507, 0.76] {
            let y = size.height * fraction
            grid.move(to: CGPoint(x: 0, y: y))
            grid.addLine(to: CGPoint(x: size.width, y: y))
        }
        context.stroke(grid, with: .color(Theme.line),
                       style: StrokeStyle(lineWidth: 1, dash: [3, 4]))

        switch period {
        case .heute:
            let s = hourly
            let maxV = (s.cons + s.pv).max() ?? 1
            context.fill(area(s.pv, size, maxV), with: .color(Theme.pvS))
            context.stroke(line(s.grid, size, maxV), with: .color(Theme.grid.opacity(0.85)),
                           style: StrokeStyle(lineWidth: 1.6))
            context.stroke(line(s.cons, size, maxV), with: .color(Theme.home),
                           style: StrokeStyle(lineWidth: 2.2, lineCap: .round))

        case .monat:
            let s = daily
            let maxV = (s.cons + s.pv).max() ?? 1
            context.fill(area(s.pv, size, maxV), with: .color(Theme.pvS))
            context.stroke(line(s.cons, size, maxV), with: .color(Theme.home),
                           style: StrokeStyle(lineWidth: 2.2, lineCap: .round))

        case .woche, .jahr:
            drawBars(in: &context, size: size)

        case .eigene:
            break
        }
    }

    private func drawBars(in context: inout GraphicsContext, size: CGSize) {
        let s = grouped
        let maxV = (s.pv + s.vb).max() ?? 1
        let count = s.pv.count
        guard count > 0, maxV > 0 else { return }

        let slot = size.width / CGFloat(count)
        let barWidth = min(13, slot / 2.6)
        let usable = size.height - 26

        for i in 0..<count {
            let center = slot * CGFloat(i) + slot / 2
            for (value, color, offset) in [(s.pv[i], Theme.pv, -barWidth - 2),
                                           (s.vb[i], Theme.home, CGFloat(2))] {
                let height = CGFloat(value / maxV) * usable
                let rect = CGRect(x: center + offset, y: size.height - 4 - height,
                                  width: barWidth, height: height)
                context.fill(Path(roundedRect: rect, cornerRadius: 3), with: .color(color))
            }
        }
    }

    // MARK: Path helpers — mirrors the prototype's quadratic smoothing

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

    // MARK: Sample series

    /// Household scale factor — the building sees roughly 21× a single flat.
    /// Wohnungsmassstab — die App zeigt seit ADR-011 nur Bewohnerdaten.
    private var scale: Double { 1 }

    private func gauss(_ value: Double, _ mean: Double, _ spread: Double) -> Double {
        exp(-pow((value - mean) / spread, 2))
    }

    private var hourly: (pv: [Double], cons: [Double], grid: [Double]) {
        var pv: [Double] = [], cons: [Double] = [], grid: [Double] = []
        for hour in 0..<24 {
            let h = Double(hour)
            let p = 1.18 * gauss(h, 13, 3.1) * scale
            let c = (0.16 + 0.52 * gauss(h, 7.5, 1.5)
                     + 0.88 * gauss(h, 19.5, 2.1) + 0.14 * gauss(h, 13, 3.4)) * scale
            pv.append(p)
            cons.append(c)
            grid.append(max(0, c - p))
        }
        return (pv, cons, grid)
    }

    private var daily: (pv: [Double], cons: [Double]) {
        var pv: [Double] = [], cons: [Double] = []
        for index in 0..<21 {
            let i = Double(index)
            let c = 6.2 + 1.5 * sin(i / 2.9) + 1.2 * sin(i * 1.7) + 0.5 * sin(i * 0.7)
            cons.append(c)
            pv.append(c * (0.62 + 0.18 * sin(i / 3 + 1)))
        }
        return (pv, cons)
    }

    private var grouped: (pv: [Double], vb: [Double]) {
        switch period {
        case .woche:
            ([7.9, 9.4, 8.2, 10.1, 9.6, 6.4, 8.8].map { $0 * scale },
             [6.8, 7.1, 6.4, 7.9, 8.3, 9.1, 8.6].map { $0 * scale })
        case .jahr:
            ([61, 94, 168, 232, 286, 301, 312, 279, 208, 132, 74, 52].map { $0 * scale },
             [212, 186, 178, 154, 141, 136, 139, 143, 158, 184, 203, 224].map { $0 * scale })
        default:
            ([], [])
        }
    }

    // MARK: Selection

    private var columnCount: Int {
        switch period {
        case .heute: 24
        case .woche: 7
        case .monat: 21
        case .jahr: 12
        case .eigene: 0
        }
    }

    private var tapColumns: some View {
        HStack(spacing: 0) {
            ForEach(0..<max(columnCount, 1), id: \.self) { index in
                Rectangle()
                    .fill(.clear)
                    .contentShape(.rect)
                    .onTapGesture {
                        selected = (selected == index) ? nil : index
                    }
            }
        }
        .accessibilityHidden(true)
    }

    private func readout(for index: Int) -> String? {
        switch period {
        case .heute:
            let s = hourly
            guard index < s.cons.count else { return nil }
            let hour = String(format: "%02d", index)
            return "\(hour):00 Uhr · Verbrauch \(decimal(s.cons[index])) kW · Solar \(decimal(s.pv[index])) kW"
        case .woche:
            let s = grouped
            guard index < s.pv.count else { return nil }
            return "\(weekdayLabels[index]) · PV \(decimal(s.pv[index])) kWh · Verbrauch \(decimal(s.vb[index])) kWh"
        case .monat:
            let s = daily
            guard index < s.cons.count else { return nil }
            return "\(index + 1). Juli · Verbrauch \(decimal(s.cons[index])) kWh · Solar \(Int((s.pv[index] / s.cons[index] * 100).rounded())) %"
        case .jahr:
            let s = grouped
            guard index < s.pv.count else { return nil }
            return "\(monthLabels[index]) · PV \(Int(s.pv[index].rounded())) kWh · Verbrauch \(Int(s.vb[index].rounded())) kWh"
        case .eigene:
            return nil
        }
    }

    private func decimal(_ value: Double) -> String {
        String(format: "%.1f", value).replacingOccurrences(of: ".", with: ",")
    }

    // MARK: Axis

    private let weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    private let monthLabels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
                               "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

    @ViewBuilder
    private var axisLabels: some View {
        switch period {
        case .heute:
            spreadLabels(["00", "06", "12", "18", "23"])
        case .monat:
            spreadLabels(["1. Juli", "8.", "15.", "21. Juli"])
        case .woche:
            slotLabels(weekdayLabels)
        case .jahr:
            slotLabels(monthLabels.map { String($0.prefix(1)) })
        case .eigene:
            EmptyView()
        }
    }

    private func spreadLabels(_ labels: [String]) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                axisText(label)
                if index < labels.count - 1 { Spacer(minLength: 0) }
            }
        }
        .accessibilityHidden(true)
    }

    private func slotLabels(_ labels: [String]) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(labels.enumerated()), id: \.offset) { _, label in
                axisText(label)
                    .frame(maxWidth: .infinity)
            }
        }
        .accessibilityHidden(true)
    }

    private func axisText(_ label: String) -> some View {
        Text(label)
            .pmFont(11)
            .foregroundStyle(Theme.tx3)
    }
}

#Preview {
    AnalyseChartCard(period: .heute)
        .padding()
        .background(Theme.bg)
}
