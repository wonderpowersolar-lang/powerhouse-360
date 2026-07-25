import SwiftUI

/// "Lastverlauf heute" card — PV area plus grid, heat-pump and consumption lines over 24h.
struct VermieterLoadCurveCard: View {
    // Representative 24h sample curves (0...1) with a plausible daytime-solar shape.
    private let pv: [CGFloat] = [0, 0, 0, 0, 0, 0.02, 0.09, 0.22, 0.4, 0.6, 0.78, 0.91, 0.98, 0.95, 0.83, 0.65, 0.45, 0.26, 0.11, 0.03, 0, 0, 0, 0]
    private let consumption: [CGFloat] = [0.24, 0.2, 0.17, 0.16, 0.18, 0.28, 0.46, 0.58, 0.5, 0.42, 0.4, 0.46, 0.56, 0.48, 0.42, 0.4, 0.46, 0.6, 0.78, 0.74, 0.62, 0.5, 0.38, 0.28]
    private let grid: [CGFloat] = [0.24, 0.2, 0.17, 0.16, 0.18, 0.26, 0.36, 0.34, 0.08, 0, 0, 0, 0, 0, 0, 0, 0, 0.32, 0.66, 0.7, 0.6, 0.48, 0.38, 0.28]
    private let wp: [CGFloat] = [0.04, 0.03, 0.02, 0.02, 0.03, 0.05, 0.1, 0.14, 0.34, 0.46, 0.38, 0.22, 0.16, 0.2, 0.42, 0.5, 0.4, 0.24, 0.14, 0.1, 0.08, 0.06, 0.05, 0.04]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("Lastverlauf heute")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Spacer(minLength: 0)
                legendDot(color: Theme.pv, label: "PV")
                legendDot(color: Theme.home, label: "Verbrauch")
                legendDot(color: Theme.grid, label: "Netz")
                legendDot(color: Theme.wp, label: "WP")
            }

            chart
                .frame(height: 146)

            HStack {
                ForEach(["00", "06", "12", "18", "24"], id: \.self) { h in
                    Text(h).font(.system(size: 11)).foregroundStyle(Theme.tx3)
                    if h != "24" { Spacer() }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .pmCard()
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Lastverlauf heute — Tageskurven für PV, Verbrauch, Netzbezug und Wärmepumpe über 24 Stunden.")
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

                areaPath(pv, in: size).fill(Theme.pvS)
                linePath(grid, in: size).stroke(Theme.grid.opacity(0.85), style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
                linePath(wp, in: size).stroke(Theme.wp.opacity(0.9), style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
                linePath(consumption, in: size).stroke(Theme.home, style: StrokeStyle(lineWidth: 2.2, lineCap: .round, lineJoin: .round))
            }
        }
        .accessibilityHidden(true)
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
    VermieterLoadCurveCard().padding().background(Theme.bg)
}
