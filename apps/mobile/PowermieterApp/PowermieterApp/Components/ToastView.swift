import SwiftUI

/// The floating confirmation pill (prototype `toast`), shown above the tab bar.
struct ToastView: View {
    let message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark")
                .pmFont(12, weight: .bold)
                .accessibilityHidden(true)
            Text(message)
                .pmFont(13, weight: .semibold)
        }
        .foregroundStyle(Theme.accT)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.acc, in: .capsule)
        .shadow(color: Color(light: 0x081222, lightAlpha: 0.28, dark: 0x000000, darkAlpha: 0.5),
                radius: 14, x: 0, y: 8)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isStaticText)
    }
}
