import SwiftUI

/// Onboarding · Rolle — the prototype's `sRole` screen ("Wie nutzt du
/// Powermieter?"). Confirms the role that the invite link usually pre-selects.
struct RoleSelectView: View {
    @Bindable var model: OnboardingModel
    var onBack: () -> Void
    var onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            OnboardingHeader(step: 0, onBack: onBack)

            Text("Wie nutzt du\nPowermieter?")
                .font(.system(size: 27, weight: .heavy))
                .tracking(-0.4)
                .foregroundStyle(Theme.tx)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 26)

            Text("In der Regel ist deine Rolle schon über den Einladungslink gesetzt — hier kannst du sie bestätigen.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.tx2)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 10)

            VStack(spacing: 12) {
                ForEach(OnboardingRole.allCases) { role in
                    roleCard(role)
                }
            }
            .padding(.top, 24)

            Spacer(minLength: 24)

            PrimaryButton(title: "Weiter", action: onNext)
                .padding(.top, 22)
        }
        .padding(.top, 8)
        .padding(.horizontal, 22)
        .padding(.bottom, 30)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Theme.bg.ignoresSafeArea())
    }

    // MARK: - Pieces

    private func roleCard(_ role: OnboardingRole) -> some View {
        let selected = model.role == role
        return Button {
            model.role = role
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 13, style: .continuous)
                    .fill(role.chip)
                    .frame(width: 42, height: 42)
                    .overlay {
                        Image(systemName: role.symbol)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(role.tint)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(role.title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text(role.subtitle)
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                radio(selected: selected)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? Theme.accS : Theme.card,
                        in: .rect(cornerRadius: 16, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(selected ? Theme.acc : Theme.line,
                                  lineWidth: selected ? 1.5 : 1)
            }
            .pmCardShadow()
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(role.title)
        .accessibilityAddTraits(selected ? [.isSelected, .isButton] : .isButton)
    }

    private func radio(selected: Bool) -> some View {
        ZStack {
            if selected {
                Circle().fill(Theme.acc)
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
            } else {
                Circle().strokeBorder(Theme.line2, lineWidth: 1)
            }
        }
        .frame(width: 22, height: 22)
        .accessibilityHidden(true)
    }
}

#Preview {
    RoleSelectView(model: OnboardingModel(), onBack: {}, onNext: {})
}
