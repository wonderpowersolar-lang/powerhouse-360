import SwiftUI

/// Overlay "Störungsfall" — raise a support case for the delayed WE 07 meter.
/// Submitting swaps the form for the confirmation state.
struct StoerungsfallView: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let onBack: () -> Void

    @State private var submitted = false

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Störung · WE 07",
                          subtitle: "Wohnungszähler · verzögert",
                          onBack: onBack)

            ScrollView {
                VStack(spacing: 13) {
                    if submitted {
                        confirmation
                    } else {
                        meterCard
                        timelineCard
                        descriptionCard
                        submitButton
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .animation(.easeOut(duration: 0.25), value: submitted)
    }

    // MARK: Form

    private var meterCard: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Theme.elev)
                .frame(width: 38, height: 38)
                .overlay {
                    Image(systemName: "gauge.with.dots.needle.bottom.50percent")
                        .pmFont(16, weight: .semibold)
                        .foregroundStyle(Theme.tx2)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text("Wohnungszähler WE 07")
                    .pmFont(13.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Text("Nr. 1EMH0047110712 · LoRaWAN")
                    .pmFont(11.5)
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            StatusPill(text: "verzögert", color: Theme.warn, background: Theme.warnS)
        }
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    private var timelineCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Verlauf")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)
                .padding(.bottom, 10)

            timelineRow(color: Theme.tx3, time: "04:12 Uhr", text: "letzte Daten empfangen")
            timelineRow(color: Theme.warn, time: "06:30 Uhr",
                        text: "Status „verzögert“, automatischer Reconnect läuft")
            timelineRow(color: Theme.info, time: "seither",
                        text: "Ersatzwerte nach Standardprofil")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private func timelineRow(color: Color, time: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .padding(.top, 5)
                .accessibilityHidden(true)

            Group {
                Text(time).font(.pmScaled(12.5, weight: .bold, for: dynamicTypeSize))
                + Text(" — ").font(.pmScaled(12.5, for: dynamicTypeSize))
                + Text(text).font(.pmScaled(12.5, for: dynamicTypeSize))
            }
            .foregroundStyle(Theme.tx2)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 5)
        .accessibilityElement(children: .combine)
    }

    private var descriptionCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Kategorie")
                    .pmFont(12.5)
                    .foregroundStyle(Theme.tx2)
                Spacer()
                Text("Zähler & Messtechnik")
                    .pmFont(12.5, weight: .semibold)
                    .foregroundStyle(Theme.tx)
            }
            .padding(.bottom, 11)
            .accessibilityElement(children: .combine)

            Divider().overlay(Theme.line)

            Text("Wohnungszähler WE 07 liefert seit 04:12 Uhr keine Daten. Reconnect über Gateway erfolglos. Bitte Funkstrecke bzw. Zähler vor Ort prüfen.")
                .pmFont(12.5)
                .foregroundStyle(Theme.tx2)
                .padding(.top, 11)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private var submitButton: some View {
        PrimaryButton(title: "Supportfall erstellen") {
            submitted = true
        }
    }

    // MARK: Confirmation

    private var confirmation: some View {
        VStack(spacing: 11) {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.okS)
                .frame(width: 64, height: 64)
                .overlay {
                    Image(systemName: "checkmark")
                        .pmFont(28, weight: .bold)
                        .foregroundStyle(Theme.ok)
                }
                .accessibilityHidden(true)

            Text("Fall #2493 angelegt")
                .pmFont(17, weight: .heavy)
                .foregroundStyle(Theme.tx)
                .accessibilityAddTraits(.isHeader)

            Text("Der Messstellenbetreiber wurde informiert. Den Status findest du jederzeit unter Vorgänge bzw. Hilfe & Support.")
                .pmFont(13)
                .foregroundStyle(Theme.tx2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)

            StatusPill(text: "Status: offen", color: Theme.info, background: Theme.infoS)
                .padding(.top, 2)

            PrimaryButton(title: "Fertig", action: onBack)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
        .padding(.vertical, 30)
        .pmCard()
    }
}

#Preview {
    StoerungsfallView(onBack: {})
}
