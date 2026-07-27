import SwiftUI

/// The small capsule status badge used across the app (prototype's `pill()`
/// helper).
struct StatusPill: View {
    let text: String
    var color: Color
    var background: Color
    /// Auf dem Raster: 12 als Normalfall, 8 wo eine Zeile eng wird.
    var horizontalPadding: CGFloat = 12

    var body: some View {
        Text(text)
            .pmFont(11, weight: .bold)
            .foregroundStyle(color)
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, 4)
            .background(background, in: .capsule)
    }
}
