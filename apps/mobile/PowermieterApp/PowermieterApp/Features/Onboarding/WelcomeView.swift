import SwiftUI

/// Onboarding · Willkommen — the prototype's `sWelcome` screen.
struct WelcomeView: View {
    /// "Loslegen" — begin the onboarding sequence.
    let onStart: () -> Void
    /// "Ich habe bereits ein Konto" — skip straight into the app shell.
    let onSkip: () -> Void

    var body: some View {
        ZStack {
            heroBackground.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    brandRow
                        .padding(.top, 48)

                    headline
                        .padding(.top, 40)

                    Text("Sieh live, wie viel Solarstrom euer Dach liefert, was deine Wohnung verbraucht und was du dabei sparst.")
                        .font(.system(size: 15.5))
                        .foregroundStyle(Theme.tx2)
                        .lineSpacing(4)
                        .frame(maxWidth: 300, alignment: .leading)
                        .padding(.top, 16)

                    VStack(alignment: .leading, spacing: 14) {
                        featureRow(icon: "sun.max.fill", tint: Theme.pv, chip: Theme.pvS,
                                   text: "Live-Energiefluss deines Hauses")
                        featureRow(icon: "chart.bar.fill", tint: Theme.acc, chip: Theme.accS,
                                   text: "Kosten & Ersparnis pro Tag, Monat, Jahr")
                        featureRow(icon: "checkmark.shield.fill", tint: Theme.grid, chip: Theme.gridS,
                                   text: "Nur du siehst deine Verbrauchsdaten")
                    }
                    .padding(.top, 30)

                    Spacer(minLength: 40)

                    PrimaryButton(title: "Loslegen", action: onStart)
                        .padding(.top, 24)

                    Button("Ich habe bereits ein Konto", action: onSkip)
                        .font(.system(size: 14.5, weight: .semibold))
                        .foregroundStyle(Theme.tx2)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .padding(.top, 14)

                    Text("POWERHOUSE 360 · GANZHEITLICHE ENERGIESYSTEME")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(1.4)
                        .foregroundStyle(Theme.tx3)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 14)
                }
                .padding(.horizontal, 26)
                .padding(.bottom, 28)
                .frame(minHeight: heroMinHeight, alignment: .top)
            }
        }
        .foregroundStyle(Theme.tx)
    }

    // MARK: - Pieces

    private var brandRow: some View {
        HStack(spacing: 11) {
            RoundedRectangle(cornerRadius: 11, style: .continuous)
                .fill(Theme.acc)
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundStyle(Theme.accT)
                }
            (Text("power").foregroundStyle(Theme.tx)
             + Text("mieter").foregroundStyle(Theme.acc))
                .font(.system(size: 21, weight: .heavy))
                .tracking(-0.4)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("powermieter")
    }

    private var headline: some View {
        (Text("Dein Strom.\nDein Gebäude.\n").foregroundStyle(Theme.tx)
         + Text("Volle Transparenz.").foregroundStyle(Theme.acc))
            .font(.system(size: 36, weight: .heavy))
            .tracking(-0.8)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func featureRow(icon: String, tint: Color, chip: Color, text: String) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(chip)
                .frame(width: 34, height: 34)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(tint)
                }
            Text(text)
                .font(.system(size: 14.5))
                .foregroundStyle(Theme.tx)
        }
    }

    private var heroBackground: some View {
        ZStack {
            LinearGradient(
                colors: [Color(light: 0xE0EFE6, dark: 0x101E1C),
                         Color(light: 0xEFF2F3, dark: 0x0A1117)],
                startPoint: .top, endPoint: .bottom
            )
            RadialGradient(
                colors: [Theme.acc.opacity(0.12), .clear],
                center: .init(x: 0.5, y: -0.05), startRadius: 0, endRadius: 360
            )
        }
    }

    private var heroMinHeight: CGFloat { 640 }
}

#Preview {
    WelcomeView(onStart: {}, onSkip: {})
}
