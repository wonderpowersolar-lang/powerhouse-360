import SwiftUI

/// The muted explanatory note used across the overlays — a small glyph next
/// to a sentence on the `--card2` surface.
struct HintNote: View {
    let symbol: String
    let text: String
    var tint: Color = Theme.tx3

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: symbol)
                .pmFont(12, weight: .semibold)
                .foregroundStyle(tint)
                .padding(.top, 2)
                .accessibilityHidden(true)
            Text(text)
                .pmFont(11.5)
                .foregroundStyle(Theme.tx3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
    }
}
