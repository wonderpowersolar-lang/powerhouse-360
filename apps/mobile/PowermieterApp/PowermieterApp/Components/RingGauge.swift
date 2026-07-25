import SwiftUI

/// Circular progress ring for the "Solarstromanteil" tile.
struct RingGauge: View {
    /// Fraction filled, 0...1.
    let fraction: CGFloat
    var color: Color
    var track: Color = Theme.elev
    var lineWidth: CGFloat = 6

    var body: some View {
        ZStack {
            Circle()
                .stroke(track, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: max(0, min(1, fraction)))
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}
