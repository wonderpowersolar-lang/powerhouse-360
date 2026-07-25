import SwiftUI

/// The full-width navy/green CTA used across onboarding (`--btn` / `--btnT`).
struct PrimaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16.5, weight: .bold))
                .foregroundStyle(Theme.btnT)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Theme.btn, in: .rect(cornerRadius: Theme.radiusButton))
        }
        .buttonStyle(.pressable)
    }
}

/// Subtle scale-on-press feedback (mirrors `style-active:transform:scale(.985)`).
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PressableButtonStyle {
    static var pressable: PressableButtonStyle { PressableButtonStyle() }
}
