import SwiftUI

/// Overlay "Rechnungsdetail" — one month's bill broken into its line items.
struct RechnungsdetailView: View {
    let invoice: Invoice
    let onBack: () -> Void

    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.showToast) private var showToast

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: invoice.title, subtitle: invoice.period, onBack: onBack)

            ScrollView {
                VStack(spacing: 13) {
                    amountCard
                    lineItemsCard
                    comparisonCard
                    actions
                    legalNote
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    // MARK: Amount

    private var amountCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Rechnungsbetrag")
                    .pmFont(12)
                    .foregroundStyle(Theme.tx2)
                Spacer()
                StatusPill(text: invoice.paid, color: Theme.ok, background: Theme.okS)
            }

            Text(invoice.sum)
                .pmFont(32, weight: .heavy)
                .tracking(-0.8)
                .foregroundStyle(Theme.tx)
                .monospacedDigit()
                .padding(.top, 4)

            // Solar / grid split of the billed kilowatt-hours.
            HStack(spacing: 3) {
                GeometryReader { geo in
                    HStack(spacing: 3) {
                        Capsule()
                            .fill(Theme.pv)
                            .frame(width: max(0, (geo.size.width - 3) * invoice.solarShare))
                        Capsule()
                            .fill(Theme.grid)
                    }
                }
            }
            .frame(height: 10)
            .padding(.top, 14)

            HStack(spacing: 12) {
                legendItem("Solar \(Int((invoice.solarShare * 100).rounded())) %", Theme.pv)
                legendItem("Netz", Theme.grid)
                Spacer(minLength: 0)
                Text("\(invoice.kwh) gesamt")
                    .pmFont(11.5, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
                    .monospacedDigit()
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    private func legendItem(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .pmFont(11.5)
                .foregroundStyle(Theme.tx2)
        }
    }

    // MARK: Line items

    private var lineItemsCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(invoice.rows.enumerated()), id: \.offset) { index, row in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(alignment: .top, spacing: 10) {
                    Text(row.key)
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(row.value)
                        .pmFont(12.5, weight: .semibold)
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                }
                .padding(.vertical, 11)
                .accessibilityElement(children: .combine)
            }

            Divider().overlay(Theme.line2)

            HStack {
                Text("Gesamtbetrag")
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(invoice.sum)
                    .pmFont(14, weight: .heavy)
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
            }
            .padding(.vertical, 12)
            .accessibilityElement(children: .combine)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    // MARK: Comparison

    private var comparisonCard: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Grundversorgung hätte gekostet")
                    .pmFont(13)
                    .foregroundStyle(Theme.tx2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(invoice.reference)
                    .pmFont(13, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
                    .monospacedDigit()
                    .strikethrough()
            }
            .padding(.vertical, 11)
            .accessibilityElement(children: .combine)

            Divider().overlay(Theme.line)

            HStack {
                Text("Deine Ersparnis")
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(invoice.saving)
                    .pmFont(15, weight: .heavy)
                    .foregroundStyle(Theme.ok)
                    .monospacedDigit()
            }
            .padding(.vertical, 12)
            .accessibilityElement(children: .combine)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    // MARK: Actions

    private var actions: some View {
        HStack(spacing: 10) {
            Button { showToast("PDF wird geöffnet … (Demo)") } label: {
                Text("PDF öffnen")
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.btnT)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.btn, in: .rect(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.pressable)

            Button {
                openOverlay(.support)
            } label: {
                Text("Frage stellen")
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.tx)
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
    }

    private var legalNote: some View {
        Text("Alle Preise inkl. 19 % USt. · Abrechnung nach § 42a EnWG · Zählpunkt DE 0001 4711 0012")
            .pmFont(11)
            .foregroundStyle(Theme.tx3)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
    }
}

#Preview {
    RechnungsdetailView(invoice: .named("juni"), onBack: {})
}
