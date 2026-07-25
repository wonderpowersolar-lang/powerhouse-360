import SwiftUI

/// Onboarding · Fertig — the prototype's `sObDone` screen. No back button:
/// the building is connected and the only way forward is into the app shell.
struct OnboardingDoneView: View {
    var model: OnboardingModel
    var onEnter: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    var body: some View {
        VStack(spacing: 0) {
            successBadge
                .padding(.top, 34)

            Text("Alles startklar!")
                .font(.system(size: 27, weight: .heavy))
                .tracking(-0.4)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity)
                .padding(.top, 22)
                .accessibilityAddTraits(.isHeader)

            Text("Dein Gebäude ist verbunden und liefert Daten.")
                .font(.system(size: 14))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.tx2)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

            statusCard
                .padding(.top, 28)

            Spacer(minLength: 24)

            PrimaryButton(title: "Zur Übersicht", action: onEnter)
        }
        .padding(.horizontal, 22)
        .padding(.top, 48)
        .padding(.bottom, 30)
        .background(Theme.bg.ignoresSafeArea())
        .onAppear {
            if reduceMotion {
                appeared = true
            } else {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                    appeared = true
                }
            }
        }
    }

    // MARK: - Pieces

    private var successBadge: some View {
        RoundedRectangle(cornerRadius: 28, style: .continuous)
            .fill(Theme.accS)
            .frame(width: 86, height: 86)
            .overlay {
                Image(systemName: "checkmark")
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundStyle(Theme.acc)
            }
            .frame(maxWidth: .infinity)
            .scaleEffect(appeared ? 1 : 0.6)
            .opacity(appeared ? 1 : 0)
            .accessibilityHidden(true)
    }

    private var statusCard: some View {
        VStack(spacing: 0) {
            statusRow(
                leadingDot: AnyView(dot),
                title: "Gebäude verbunden",
                trailing: "Friedrichsruher Str. 35"
            )
            Divider().overlay(Theme.line)
            statusRow(
                leadingDot: AnyView(dot),
                title: "Vertragsstatus",
                trailing: "aktiv · Mieterstrom"
            )
            Divider().overlay(Theme.line)
            statusRow(
                leadingDot: AnyView(PulseDot(color: Theme.ok, size: 9)),
                title: "Messdaten",
                trailing: "live · vor 1 Min"
            )
        }
        .padding(.horizontal, 18)
        .pmCard()
    }

    private var dot: some View {
        Circle()
            .fill(Theme.ok)
            .frame(width: 9, height: 9)
            .accessibilityHidden(true)
    }

    private func statusRow(leadingDot: AnyView, title: String, trailing: String) -> some View {
        HStack(spacing: 12) {
            leadingDot
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(trailing)
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.tx2)
        }
        .padding(.vertical, 13)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(trailing)")
    }
}

#Preview {
    OnboardingDoneView(model: OnboardingModel(), onEnter: {})
}
