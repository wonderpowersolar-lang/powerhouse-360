import SwiftUI

/// Overlay "Mitteilungen" — priority inbox, split into Wichtig and Weitere.
struct MitteilungenView: View {

    @Environment(\.openOverlay) private var openOverlay

    @State private var readIDs: Set<Int> = []
    @State private var cleared = false

    private struct Item: Identifiable {
        let id: Int
        let important: Bool
        let symbol: String
        let tint: Color
        let softTint: Color
        let title: String
        let body: String
        let time: String
        let target: AppOverlay
    }

    private var items: [Item] {
        let tenant = [
            Item(id: 1, important: true, symbol: "sun.max.fill", tint: Theme.pv, softTint: Theme.pvS,
                 title: "Hoher Solarüberschuss",
                 body: "Bis ca. 15:00 Uhr liefert euer Dach mehr Strom, als das Gebäude verbraucht. Guter Zeitpunkt für Waschmaschine oder Geschirrspüler.",
                 time: "11:02", target: .sonnenstrompreis),
            Item(id: 2, important: true, symbol: "exclamationmark.triangle.fill", tint: Theme.warn, softTint: Theme.warnS,
                 title: "Ungewöhnlich hoher Verbrauch",
                 body: "Gestern Abend lag dein Verbrauch 38 % über deinem Durchschnitt.",
                 time: "Gestern, 22:40", target: .detailanalyse),
            Item(id: 3, important: false, symbol: "doc.text.fill", tint: Theme.info, softTint: Theme.infoS,
                 title: "Monatsreport Juni verfügbar",
                 body: "Dein persönlicher Energiebericht ist da – mit 24,65 € Ersparnis.",
                 time: "01.07.", target: .monatsreport),
            Item(id: 4, important: false, symbol: "creditcard.fill", tint: Theme.acc, softTint: Theme.accS,
                 title: "Neue Rechnung",
                 body: "Rechnung Juni 2026 über 64,10 € wurde per SEPA eingezogen.",
                 time: "05.07.", target: .rechnungsdetail(month: "juni")),
            Item(id: 5, important: false, symbol: "clock", tint: Theme.tx2, softTint: Theme.elev,
                 title: "Messwert wurde geschätzt",
                 body: "Dein Zähler hat sich 05:00–07:00 Uhr nicht gemeldet. Die Lücke wurde nach Profil ersetzt.",
                 time: "Heute, 07:12", target: .detailanalyse)
        ]

        return tenant
    }

    private var important: [Item] { cleared ? [] : items.filter(\.important) }
    private var others: [Item] { cleared ? [] : items.filter { !$0.important } }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 12) {
                    if important.isEmpty && others.isEmpty {
                        emptyState
                    } else {
                        if !important.isEmpty {
                            sectionTitle("Wichtig")
                            ForEach(important) { row($0) }
                        }
                        if !others.isEmpty {
                            sectionTitle("Weitere")
                            ForEach(others) { row($0) }

                            Button {
                                cleared = true
                            } label: {
                                Text("Alle löschen")
                                    .pmFont(13.5, weight: .bold)
                                    .foregroundStyle(Theme.tx2)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Theme.card, in: .rect(cornerRadius: 14, style: .continuous))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .strokeBorder(Theme.line2, lineWidth: 1)
                                    }
                            }
                            .buttonStyle(.pressable)
                            .padding(.top, 4)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .pmOverlayChrome(title: "Mitteilungen")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Alle gelesen") { readIDs = Set(items.map(\.id)) }
                    .pmFont(12.5, weight: .bold)
                    .foregroundStyle(Theme.acc)
            }
        }
        .animation(.easeOut(duration: 0.22), value: cleared)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text.uppercased())
            .pmFont(11.5, weight: .bold)
            .tracking(0.6)
            .foregroundStyle(Theme.tx3)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 4)
    }

    private func row(_ item: Item) -> some View {
        let unread = !readIDs.contains(item.id)
        return Button {
            readIDs.insert(item.id)
            openOverlay(item.target)
        } label: {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(item.softTint)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: item.symbol)
                            .pmFont(16, weight: .semibold)
                            .foregroundStyle(item.tint)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .pmFont(14, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text(item.body)
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx2)
                    Text(item.time)
                        .pmFont(11)
                        .foregroundStyle(Theme.tx3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if unread {
                    Circle()
                        .fill(Theme.acc)
                        .frame(width: 8, height: 8)
                        .padding(.top, 6)
                        .accessibilityHidden(true)
                }
            }
            .padding(16)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(unread ? "Ungelesen. " : "")\(item.title). \(item.body) \(item.time)")
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(Theme.elev)
                .frame(width: 52, height: 52)
                .overlay {
                    Image(systemName: "bell")
                        .pmFont(22)
                        .foregroundStyle(Theme.tx2)
                }
                .accessibilityHidden(true)

            Text("Keine Benachrichtigungen")
                .pmFont(15.5, weight: .bold)
                .foregroundStyle(Theme.tx)

            Text("Neue Mitteilungen zu Solarstrom, Rechnungen und Störungen erscheinen hier.")
                .pmFont(13)
                .foregroundStyle(Theme.tx2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 270)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 36)
        .pmCard()
    }
}

#Preview {
    MitteilungenView()
}
