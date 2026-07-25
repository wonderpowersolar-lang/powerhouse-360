import SwiftUI

/// Shared top bar for the middle onboarding steps: a back button on the left,
/// centered progress dots, balanced by an equal spacer on the right.
struct OnboardingHeader: View {
    var step: Int
    var onBack: () -> Void

    var body: some View {
        HStack {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.tx2)
                    .frame(width: 40, height: 40)
                    .background(Theme.card, in: .rect(cornerRadius: 13, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                            .strokeBorder(Theme.line2, lineWidth: 1)
                    }
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Zurück")

            Spacer()
            ProgressDots(current: step)
            Spacer()

            Color.clear.frame(width: 40, height: 40)
        }
    }
}
