import SwiftUI

/// Einstellungen tab (prototype `tabSet`). The appearance picker and the
/// demo role switcher write straight back into the app shell, so switching a
/// role here swaps the dashboards and the tab set live.
struct EinstellungenView: View {
    @Binding var appearance: AppAppearance

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.openSheet) private var openSheet
    @Environment(\.showToast) private var showToast

    @State private var notifySolar = true
    @State private var notifyBilling = true
    @State private var notifyFaults = true
    @State private var shareAnonymous = true
    @State private var shareTips = false

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 12) {
                    profileCard
                    appearanceCard
                    notificationsCard
                    sharingCard
                    detailRowsCard
                    logoutButton
                    footer
                }
                .padding(.horizontal, 20)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Einstellungen",
                            subtitle: "Profil und Datenschutz",
                            unreadCount: 0)
        }
        .background(Theme.bg)
    }

    // MARK: Profile

    private var profileCard: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Theme.accS)
                .frame(width: 48, height: 48)
                .overlay {
                    Text(initials)
                        .pmFont(16, weight: .heavy)
                        .foregroundStyle(Theme.acc)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .pmFont(15.5, weight: .heavy)
                    .foregroundStyle(Theme.tx)
                Text(subtitle)
                    .pmFont(12)
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    private let name = "Leon Berger"
    private let subtitle = "leon.berger@mail.de · WE 12"
    private let initials = "LB"

    // MARK: Appearance

    private var appearanceCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionTitle("Darstellung")

            HStack(spacing: 2) {
                appearanceOption("Hell", .light, isActive: colorScheme == .light)
                appearanceOption("Dunkel", .dark, isActive: colorScheme == .dark)
            }
            .padding(4)
            .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
            .padding(.top, 12)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .pmCard()
    }

    private func appearanceOption(_ title: String, _ value: AppAppearance,
                                  isActive: Bool) -> some View {
        Button {
            appearance = value
        } label: {
            Text(title)
                .pmFont(13, weight: .bold)
                .foregroundStyle(isActive ? Theme.btnT : Theme.tx2)
                .frame(maxWidth: .infinity)
                .frame(height: 36)
                .background {
                    if isActive {
                        RoundedRectangle(cornerRadius: 9, style: .continuous)
                            .fill(Theme.btn)
                    }
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(isActive ? [.isSelected, .isButton] : .isButton)
    }

    // MARK: Toggle groups

    private var notificationsCard: some View {
        VStack(spacing: 0) {
            sectionTitle("Benachrichtigungen")
                .padding(.top, 12)
                .padding(.bottom, 6)

            toggleRow("Solar-Hinweise", "Wenn viel Sonnenstrom verfügbar ist", $notifySolar)
            toggleRow("Rechnungen & Dokumente", "Neue Rechnung, Report, Vertrag", $notifyBilling)
            toggleRow("Störungen", "Zähler offline, Anlage gestört", $notifyFaults)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private var sharingCard: some View {
        VStack(spacing: 0) {
            sectionTitle("Datenfreigaben")
                .padding(.top, 12)
                .padding(.bottom, 6)

            toggleRow("Anonyme Vergleichswerte", "Für den Gebäude-Durchschnitt", $shareAnonymous)
            toggleRow("Spartipps", "Persönliche Empfehlungen", $shareTips)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func toggleRow(_ title: String, _ caption: String,
                           _ binding: Binding<Bool>) -> some View {
        Toggle(isOn: binding) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .pmFont(13.5, weight: .semibold)
                    .foregroundStyle(Theme.tx)
                Text(caption)
                    .pmFont(11.5)
                    .foregroundStyle(Theme.tx3)
            }
        }
        .tint(Theme.acc)
        .padding(.vertical, 12)
        .overlay(alignment: .top) { Divider().overlay(Theme.line) }
    }

    // MARK: Detail rows

    private var detailRowsCard: some View {
        VStack(spacing: 0) {
            detailRow("Persönliche Daten", value: nil, showsDivider: false, sheet: .info("personal"))
            detailRow("Wohnung & Gebäude", value: nil, sheet: .info("whg"))
            detailRow("Sprache", value: "Deutsch")
            detailRow("Zahlungsart", value: "SEPA ····4821", sheet: .info("pay"))
            detailRow("Datenschutz", value: nil, sheet: .info("privacy"))
            detailRow("Hilfe & Support", value: nil, target: .support)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func detailRow(_ title: String, value: String?,
                           showsDivider: Bool = true,
                           target: AppOverlay? = nil,
                           sheet: AppSheet? = nil) -> some View {
        Button {
            if let target { openOverlay(target) }
            if let sheet { openSheet(sheet) }
        } label: {
            HStack(spacing: 12) {
                Text(title)
                    .pmFont(14, weight: .semibold)
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if let value {
                    Text(value)
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx3)
                }
                Image(systemName: "chevron.right")
                    .pmFont(12, weight: .bold)
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.vertical, 12)
            .overlay(alignment: .top) {
                if showsDivider { Divider().overlay(Theme.line) }
            }
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Footer

    private var logoutButton: some View {
        Button { showToast("Abgemeldet (Demo).") } label: {
            Text("Abmelden")
                .pmFont(14, weight: .bold)
                .foregroundStyle(Theme.crit)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Theme.card, in: .rect(cornerRadius: 14, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(Theme.line2, lineWidth: 1)
                }
        }
        .buttonStyle(.pressable)
    }

    private var footer: some View {
        VStack(spacing: 8) {
            Text("Powermieter 1.0 · Teil von Powerhouse 360")
                .pmFont(11)
                .foregroundStyle(Theme.tx3)

            HStack(spacing: 8) {
                StatusPill(text: "Powermieter · aktiv", color: Theme.acc, background: Theme.accS)
                StatusPill(text: "Heatmieter · bald", color: Theme.tx3, background: Theme.elev)
            }
            HStack(spacing: 8) {
                StatusPill(text: "Chargemieter · bald", color: Theme.tx3, background: Theme.elev)
                StatusPill(text: "Smokemieter · bald", color: Theme.tx3, background: Theme.elev)
            }
        }
        .padding(.top, 4)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text.uppercased())
            .pmFont(12, weight: .bold)
            .tracking(0.6)
            .foregroundStyle(Theme.tx3)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    @Previewable @State var appearance: AppAppearance = .system
    EinstellungenView(appearance: $appearance)
}
