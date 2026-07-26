import SwiftUI

/// Onboarding · Gebäude verbinden — the prototype's `sConnect` screen.
/// Shows the data pre-filled from the invite link, then runs a small
/// connection simulation (three checks) before enabling "weiter".
struct ConnectBuildingView: View {
    @Bindable var model: OnboardingModel
    var onBack: () -> Void
    var onNext: () -> Void

    private enum Phase { case idle, connecting, connected }

    @State private var phase: Phase = .idle
    @State private var checksDone = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            OnboardingHeader(step: 1, onBack: onBack)
                .padding(.top, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Gebäude verbinden")
                        .pmFont(27, weight: .heavy)
                        .tracking(-0.4)
                        .foregroundStyle(Theme.tx)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 26)

                    Text("Wir haben deine Daten aus dem Einladungslink übernommen.")
                        .pmFont(14)
                        .foregroundStyle(Theme.tx2)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 8)

                    infoCard
                        .padding(.top, 22)

                    if phase == .connecting || phase == .connected {
                        busyCard
                            .padding(.top, 16)
                            .transition(.opacity)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .scrollIndicators(.hidden)

            bottomButton
                .padding(.top, 22)
        }
        .padding(.horizontal, 22)
        .padding(.bottom, 30)
        .background(Theme.bg.ignoresSafeArea())
    }

    // MARK: - Info card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            labelledField("Gebäudeadresse", value: "Friedrichsruher Straße 35, 14193 Berlin")

            labelledField("Wohnung", value: "WE 12 · 3. OG links")

            invitationField

            scanButton
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .pmCard()
    }

    private func labelledField(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            fieldLabel(label)
            valueBox { Text(value) }
        }
    }

    private var invitationField: some View {
        VStack(alignment: .leading, spacing: 7) {
            fieldLabel("Einladungscode")
            valueBox {
                HStack(spacing: 10) {
                    Text("PWM-8H4T-2026")
                        .pmFont(15, weight: .semibold, design: .monospaced)
                    Spacer(minLength: 8)
                    Text("übernommen")
                        .pmFont(11, weight: .bold)
                        .foregroundStyle(Theme.ok)
                        .padding(.vertical, 4)
                        .padding(.horizontal, 9)
                        .background(Theme.okS, in: .capsule)
                }
            }
        }
    }

    private var scanButton: some View {
        Button(action: {}) {
            HStack(spacing: 9) {
                Image(systemName: "qrcode.viewfinder")
                    .accessibilityHidden(true)
                Text("Stattdessen QR-Code scannen")
            }
            .pmFont(13.5, weight: .semibold)
            .foregroundStyle(Theme.tx2)
            .frame(maxWidth: .infinity)
            .padding(12)
            .overlay {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(Theme.line2, style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Stattdessen QR-Code scannen")
    }

    private func fieldLabel(_ text: String) -> some View {
        Text(text)
            .pmFont(11.5, weight: .semibold)
            .textCase(.uppercase)
            .tracking(0.5)
            .foregroundStyle(Theme.tx3)
    }

    private func valueBox<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .pmFont(15, weight: .semibold)
            .foregroundStyle(Theme.tx)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 13)
            .padding(.horizontal, 14)
            .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(Theme.line, lineWidth: 1)
            }
    }

    // MARK: - Connection simulation

    private var busyCard: some View {
        VStack(alignment: .leading, spacing: 11) {
            checkRow(index: 0, label: "Gateway erreichbar")
            checkRow(index: 1, label: "Zählpunkt zugeordnet")
            checkRow(index: 2, label: "Vertrag gefunden")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private func checkRow(index: Int, label: String) -> some View {
        HStack(spacing: 9) {
            statusDot(index)
            Text(label)
                .pmFont(13.5)
                .foregroundStyle(Theme.tx)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(index < checksDone ? "\(label), erledigt" : "\(label), wird geprüft")
    }

    @ViewBuilder
    private func statusDot(_ index: Int) -> some View {
        ZStack {
            if index < checksDone {
                Circle()
                    .fill(Theme.ok)
                    .frame(width: 9, height: 9)
                    .overlay {
                        Image(systemName: "checkmark")
                            .pmFont(5, weight: .bold)
                            .foregroundStyle(.white)
                    }
            } else {
                ProgressView()
                    .scaleEffect(0.6)
            }
        }
        .frame(width: 14, height: 14)
        .accessibilityHidden(true)
    }

    // MARK: - Bottom CTA

    @ViewBuilder
    private var bottomButton: some View {
        switch phase {
        case .idle:
            PrimaryButton(title: "Verbinden", action: startConnect)
        case .connecting:
            connectingButton
        case .connected:
            PrimaryButton(title: "Verbunden — weiter", action: onNext)
        }
    }

    private var connectingButton: some View {
        HStack(spacing: 10) {
            ProgressView()
                .tint(.white)
            Text("Verbinde …")
                .pmFont(16.5, weight: .bold)
                .foregroundStyle(Theme.btnT)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 54)
        .background(Theme.btn.opacity(0.7), in: .rect(cornerRadius: Theme.radiusButton))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Verbinde")
    }

    // MARK: - Actions

    private func startConnect() {
        animate { phase = .connecting }

        Task { @MainActor in
            for _ in 0..<3 {
                try? await Task.sleep(for: .milliseconds(reduceMotion ? 120 : 600))
                animate { checksDone += 1 }
            }
            animate { phase = .connected }
        }
    }

    /// Applies `withAnimation` only when the user allows motion.
    private func animate(_ changes: () -> Void) {
        if reduceMotion {
            changes()
        } else {
            withAnimation(.easeOut(duration: 0.28), changes)
        }
    }
}

#Preview {
    ConnectBuildingView(model: OnboardingModel(), onBack: {}, onNext: {})
}
