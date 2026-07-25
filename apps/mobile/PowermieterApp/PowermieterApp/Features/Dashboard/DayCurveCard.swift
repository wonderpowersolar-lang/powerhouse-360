import SwiftUI

/// "Tagesverlauf" card — solar area + consumption/grid lines over 24h.
struct DayCurveCard: View {
    @Environment(\.openOverlay) private var openOverlay

    // Representative 24h sample curves (0...1), matching the prototype's shape.
    private let solar: [CGFloat] = [0, 0, 0, 0, 0, 0.02, 0.08, 0.2, 0.38, 0.58, 0.76, 0.9, 0.97, 0.94, 0.82, 0.64, 0.44, 0.25, 0.1, 0.03, 0, 0, 0, 0]
    private let consumption: [CGFloat] = [0.22, 0.18, 0.15, 0.14, 0.16, 0.24, 0.4, 0.52, 0.44, 0.36, 0.34, 0.4, 0.5, 0.42, 0.36, 0.34, 0.4, 0.55, 0.72, 0.68, 0.56, 0.44, 0.34, 0.26]
    private let grid: [CGFloat] = [0.22, 0.18, 0.15, 0.14, 0.16, 0.22, 0.32, 0.32, 0.06, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.62, 0.65, 0.56, 0.44, 0.34, 0.26]

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
                Text("Heute: 8,6 kWh · davon 6,5 kWh Solar")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tx2)
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

                areaPath(solar, in: size).fill(Theme.pvS)
                linePath(grid, in: size).stroke(Theme.grid.opacity(0.85), style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
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
    DayCurveCard().padding().background(Theme.bg)
}
