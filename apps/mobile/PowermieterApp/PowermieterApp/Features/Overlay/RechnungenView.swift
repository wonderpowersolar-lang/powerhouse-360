import SwiftUI

/// Overlay "Rechnungen & Abschlag" — the standing charge plus the archive of
/// monthly bills.
struct RechnungenView: View {

    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        VStack(spacing: 0) {

            ScrollView {
                VStack(spacing: 12) {
                    abschlagCard
                    creditCard

                    Text("Monatsrechnungen")
                        .pmFont(14.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 4)

                    invoiceList
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .pmOverlayChrome(title: "Rechnungen & Abschlag")
    }

    private var abschlagCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Aktueller Abschlag")
                .pmFont(12)
                .foregroundStyle(Theme.tx2)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("68,00 €")
                    .pmFont(28, weight: .heavy)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                Text("/ Monat")
                    .pmFont(13, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
            }
            .padding(.top, 4)
            .padding(.bottom, 6)

            infoRow("Nächste Abbuchung", "01.08.2026")
            infoRow("Zahlweise", "SEPA-Lastschrift ····4821")
            infoRow("Offene Beträge", "0,00 €")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        VStack(spacing: 0) {
            Divider().overlay(Theme.line)
            HStack {
                Text(label)
                    .pmFont(13)
                    .foregroundStyle(Theme.tx2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(value)
                    .pmFont(13, weight: .semibold)
                    .foregroundStyle(Theme.tx)
            }
            .padding(.vertical, 12)
        }
        .accessibilityElement(children: .combine)
    }

    private var creditCard: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Theme.okS)
                .frame(width: 38, height: 38)
                .overlay {
                    Image(systemName: "checkmark")
                        .pmFont(16, weight: .bold)
                        .foregroundStyle(Theme.ok)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text("Guthaben aus Jahresabrechnung 2025")
                    .pmFont(13.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Text("42,30 € — erstattet am 15.02.2026")
                    .pmFont(12)
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    private var invoiceList: some View {
        VStack(spacing: 0) {
            ForEach(Array(Invoice.all.enumerated()), id: \.element.id) { index, invoice in
                if index > 0 { Divider().overlay(Theme.line) }
                Button {
                    openOverlay(.rechnungsdetail(month: invoice.id))
                } label: {
                    HStack(spacing: 12) {
                        Text(invoice.shortTitle)
                            .pmFont(13.5, weight: .semibold)
                            .foregroundStyle(Theme.tx)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(invoice.sum)
                            .pmFont(13.5, weight: .bold)
                            .foregroundStyle(Theme.tx)
                            .monospacedDigit()
                        StatusPill(text: "bezahlt", color: Theme.ok, background: Theme.okS)
                        Image(systemName: "chevron.right")
                            .pmFont(12, weight: .bold)
                            .foregroundStyle(Theme.tx3)
                            .accessibilityHidden(true)
                    }
                    .padding(.vertical, 12)
                }
                .buttonStyle(.pressable)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }
}

#Preview {
    RechnungenView()
}
