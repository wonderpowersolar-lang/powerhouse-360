import SwiftUI

/// Ascending/descending bar cluster for the "PV-Erzeugung heute" tile.
struct MiniBars: View {
    /// Relative heights in 0...1.
    let values: [CGFloat]
    var color: Color

    var body: some View {
        HStack(alignment: .bottom, spacing: 4) {
            ForEach(Array(values.enumerated()), id: \.offset) { _, v in
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(color.opacity(0.45 + 0.55 * v))
                    .frame(height: max(4, v * 24))
            }
        }
        .frame(height: 26, alignment: .bottom)
    }
}
