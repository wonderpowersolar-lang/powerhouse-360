import SwiftUI

/// Verwaltung · Übersicht — the property-management dashboard.
struct VerwaltungDashboardView: View {
    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    VerwaltungStatGrid()
                    OpenCasesCard()
                    anmeldeStatusCard
                    kommunikationCard
                    messsystemRow
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Guten Tag",
                            subtitle: "Verwaltung · Friedrichsruher Str. 35",
                            unreadCount: 3)
        }
        .background(Theme.bg)
    }

    // MARK: Anmeldestatus

    private var anmeldeStatusCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Anmeldestatus")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Spacer()
                Text("21 von 24")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tx2)
                    .monospacedDigit()
            }

            ZStack(alignment: .leading) {
                Capsule().fill(Theme.elev)
                GeometryReader { geo in
                    Capsule()
                        .fill(Theme.acc)
                        .frame(width: geo.size.width * 0.875)
                }
            }
            .frame(height: 8)
            .padding(.top, 10)
            .accessibilityElement()
            .accessibilityLabel("Anmeldestatus")
            .accessibilityValue("21 von 24 angemeldet")

            HStack(spacing: 8) {
                pill("21 aktiv", color: Theme.ok, background: Theme.okS)
                pill("2 eingeladen", color: Theme.info, background: Theme.infoS)
                pill("1 nicht registriert", color: Theme.tx3, background: Theme.elev)
            }
            .padding(.top, 10)

            Button {} label: {
                Text("Einladungen verwalten")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity)
                    .frame(height: 42)
                    .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(Theme.line2, lineWidth: 1)
                    }
            }
            .buttonStyle(.pressable)
            .padding(.top, 12)
        }
        .padding(16)
        .pmCard()
    }

    private func pill(_ text: String, color: Color, background: Color) -> some View {
        StatusPill(text: text, color: color, background: background, horizontalPadding: 9)
    }

    // MARK: Kommunikation

    private var kommunikationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Kommunikation")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text("Vorlage „Sonnige Woche – günstige Waschzeiten“ ist bereit.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.tx2)
            }

            HStack(spacing: 10) {
                Button {} label: {
                    Text("Rundschreiben senden")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(Theme.btnT)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(Theme.btn, in: .rect(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.pressable)

                Button {} label: {
                    Text("Aushang als PDF")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(Theme.line2, lineWidth: 1)
                        }
                }
                .buttonStyle(.pressable)
            }
        }
        .padding(16)
        .pmCard()
    }

    // MARK: Messsystem

    private var messsystemRow: some View {
        Button { openOverlay(.messsystem) } label: {
            HStack(spacing: 12) {
                PulseDot(color: Theme.warn, size: 9)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Messsystem: 27 von 28 online")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("WE 07 verzögert · letzter Empfang vor 2 Min")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    VerwaltungDashboardView()
}
