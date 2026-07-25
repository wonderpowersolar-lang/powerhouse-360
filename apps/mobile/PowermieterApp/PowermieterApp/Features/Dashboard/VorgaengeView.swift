import SwiftUI

/// Verwaltung · Vorgänge — Supportfälle & Anfragen (prototype `tabFaelle`).
struct VorgaengeView: View {
    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    titleRow
                    ForEach(tickets) { ticket in
                        ticketCard(ticket)
                    }
                    messsystemRow
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Vorgänge",
                            subtitle: "Supportfälle & Anfragen",
                            unreadCount: 3)
        }
        .background(Theme.bg)
    }

    // MARK: Titelzeile

    private var titleRow: some View {
        HStack {
            Text("Supportfälle & Anfragen")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)
            Spacer()
            Button { openOverlay(.stoerungsfall) } label: {
                Text("Fall melden")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(Theme.btnT)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Theme.btn, in: .rect(cornerRadius: 11, style: .continuous))
            }
            .buttonStyle(.pressable)
        }
    }

    // MARK: Tickets

    /// Stable identity comes from the ticket number — never a fresh UUID per render.
    private struct Ticket: Identifiable {
        let id: String
        let title: String
        let date: String
        let status: String
        let tint: Color
        let soft: Color
    }

    private let tickets: [Ticket] = [
        Ticket(id: "#2481",
               title: "Zählerstand-Foto eingereicht",
               date: "12.07.2026",
               status: "in Bearbeitung",
               tint: Theme.info,
               soft: Theme.infoS),
        Ticket(id: "#2432",
               title: "Frage zur Rechnung Mai",
               date: "28.06.2026",
               status: "beantwortet",
               tint: Theme.ok,
               soft: Theme.okS)
    ]

    private func ticketCard(_ ticket: Ticket) -> some View {
        HStack(spacing: 12) {
            Text(ticket.id)
                .font(.system(size: 12, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.tx3)

            VStack(alignment: .leading, spacing: 2) {
                Text(ticket.title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text(ticket.date)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text(ticket.status)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(ticket.tint)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(ticket.soft, in: .capsule)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .pmCard(cornerRadius: Theme.radiusTile)
        .accessibilityElement(children: .combine)
    }

    // MARK: Messsystem

    private var messsystemRow: some View {
        Button { openOverlay(.messsystem) } label: {
            HStack(spacing: 12) {
                PulseDot(color: Theme.warn, size: 9)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Messsystemstatus prüfen")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("1 Zähler verzögert · WE 07")
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
    VorgaengeView()
}
