import SwiftUI

/// Onboarding · Datenschutz — the prototype's `sPrivacy` screen (step 3 of 4).
/// Explains what is measured, why, and who sees it, then lets the tenant toggle
/// the two optional data settings before consenting.
struct PrivacyView: View {
    @Bindable var model: OnboardingModel
    var onBack: () -> Void
    var onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            OnboardingHeader(step: 2, onBack: onBack)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    title
                        .padding(.top, 26)

                    VStack(spacing: 12) {
                        infoCard(icon: "chart.bar.fill", tint: Theme.grid, chip: Theme.gridS,
                                 head: "Was wir messen",
                                 detail: "Verbrauch deiner Wohnung und PV-Erzeugung des Gebäudes, in 15-Minuten-Werten.")
                        infoCard(icon: "info.circle.fill", tint: Theme.acc, chip: Theme.accS,
                                 head: "Wofür wir es nutzen",
                                 detail: "Für deine Abrechnung, die Live-Anzeige und Spartipps. Keine Weitergabe zu Werbezwecken.")
                        infoCard(icon: "lock.shield.fill", tint: Theme.pv, chip: Theme.pvS,
                                 head: "Wer was sieht",
                                 detail: "Nur du siehst deine Wohnung. Vermieter und Verwaltung sehen ausschließlich Summen des Gebäudes.")
                    }
                    .padding(.top, 20)

                    settingsCard
                        .padding(.top, 12)
                }
                .padding(.bottom, 22)
            }

            PrimaryButton(title: "Zustimmen und fortfahren", action: onNext)
                .padding(.top, 22)
        }
        .padding(.horizontal, 22)
        .padding(.top, 8)
        .padding(.bottom, 30)
        .background(Theme.bg.ignoresSafeArea())
        .foregroundStyle(Theme.tx)
    }

    // MARK: - Pieces

    private var title: some View {
        Text("Deine Daten,\nklar geregelt")
            .font(.system(size: 27, weight: .heavy))
            .tracking(-0.4)
            .foregroundStyle(Theme.tx)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func infoCard(icon: String, tint: Color, chip: Color,
                          head: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 11, style: .continuous)
                .fill(chip)
                .frame(width: 36, height: 36)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(tint)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(head)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text(detail)
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.tx2)
                    .lineSpacing(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 15)
        .padding(.horizontal, 16)
        .pmCard(cornerRadius: 18)
    }

    private var settingsCard: some View {
        VStack(spacing: 0) {
            settingRow(title: "Abrechnung & Anzeige",
                       sub: "Erforderlich für Mieterstrom") {
                Text("immer aktiv")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .padding(.vertical, 4)
                    .padding(.horizontal, 9)
                    .background(Theme.elev, in: .capsule)
            }

            Divider().overlay(Theme.line)

            settingRow(title: "Anonyme Vergleichswerte",
                       sub: "Dein Verbrauch fließt anonym in den Gebäude-Durchschnitt ein") {
                Toggle("", isOn: $model.shareAnon)
                    .labelsHidden()
                    .tint(Theme.acc)
                    .accessibilityLabel("Anonyme Vergleichswerte")
            }

            Divider().overlay(Theme.line)

            settingRow(title: "Spartipps per Mitteilung",
                       sub: "Hinweise, wenn viel Solarstrom verfügbar ist") {
                Toggle("", isOn: $model.tips)
                    .labelsHidden()
                    .tint(Theme.acc)
                    .accessibilityLabel("Spartipps per Mitteilung")
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func settingRow<Trailing: View>(
        title: String,
        sub: String,
        @ViewBuilder trailing: () -> Trailing
    ) -> some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Theme.tx)
                Text(sub)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            trailing()
        }
        .padding(.vertical, 12)
    }
}

#Preview {
    PrivacyView(model: OnboardingModel(), onBack: {}, onNext: {})
}
