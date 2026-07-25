import SwiftUI

/// A small smooth line for KPI tiles (prototype's inline `<path>` sparkline).
struct Sparkline: View {
    let points: [CGFloat]
    var color: Color

    var body: some View {
        GeometryReader { geo in
            let path = linePath(in: geo.size)
            path.stroke(color, style: StrokeStyle(lineWidth: 1.8, lineCap: .round, lineJoin: .round))
        }
    }

    private func linePath(in size: CGSize) -> Path {
        guard points.count > 1 else { return Path() }
        let maxV = points.max() ?? 1
        let minV = points.min() ?? 0
        let range = max(maxV - minV, 0.0001)
        let stepX = size.width / CGFloat(points.count - 1)

        return Path { p in
            for (i, v) in points.enumerated() {
                let x = CGFloat(i) * stepX
                let y = size.height - (v - minV) / range * size.height
                if i == 0 { p.move(to: CGPoint(x: x, y: y)) }
                else { p.addLine(to: CGPoint(x: x, y: y)) }
            }
        }
    }
}
