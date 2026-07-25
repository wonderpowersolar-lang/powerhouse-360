import SwiftUI

/// Standard elevated card surface (`--card` + `--line` + `--shadow`).
struct CardBackground: ViewModifier {
    var cornerRadius: CGFloat = Theme.radiusCard

    func body(content: Content) -> some View {
        content
            .background(Theme.card, in: .rect(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Theme.line, lineWidth: 1)
            }
            .pmCardShadow()
    }
}

extension View {
    func pmCard(cornerRadius: CGFloat = Theme.radiusCard) -> some View {
        modifier(CardBackground(cornerRadius: cornerRadius))
    }
}
