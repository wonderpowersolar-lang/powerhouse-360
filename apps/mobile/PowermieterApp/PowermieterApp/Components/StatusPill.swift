import SwiftUI

/// The small capsule status badge used across Gebäude, Verwaltung and
/// Dokumente (prototype's `pill()` helper).
struct StatusPill: View {
    let text: String
    var color: Color
    var background: Color
    var horizontalPadding: CGFloat = 10

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(color)
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, 4)
            .background(background, in: .capsule)
    }
}
