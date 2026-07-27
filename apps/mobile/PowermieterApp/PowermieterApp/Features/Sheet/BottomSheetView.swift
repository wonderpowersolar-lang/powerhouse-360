import SwiftUI

/// Der Inhalt des Bottom-Sheets — erklärt eine Zahl, einen Knoten im
/// Energiefluss, ein Dokument oder einen Einstellungseintrag.
///
/// Scrim, Griff, Ecken, Wischen-zum-Schließen und die Sicherheitsbereiche
/// kommen vom System (`.sheet` mit `presentationDetents`, siehe `SheetHost`).
/// Vorher war das alles nachgebaut, und dem Nachbau fehlte genau das, was man
/// bei einem Sheet als Erstes versucht: es nach unten wegzuziehen.
struct BottomSheetView: View {
    let sheet: AppSheet

    @Environment(\.dismiss) private var dismiss
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.showToast) private var showToast

    private var content: SheetContent {
        SheetContent.resolve(sheet)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header

                if let value = content.value {
                    Text(value)
                        .pmFont(27, weight: .heavy)
                        .tracking(-0.6)
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                        .padding(.top, 8)
                }

                if let description = content.description {
                    Text(description)
                        .pmFont(13)
                        .foregroundStyle(Theme.tx2)
                        .padding(.top, content.value == nil ? 6 : 8)
                }

                if !content.rows.isEmpty {
                    rowsCard
                        .padding(.top, 16)
                }

                if let document = content.document {
                    documentActions(document)
                        .padding(.top, 16)
                }

                if content.showsDetailCTA {
                    Button {
                        dismiss()
                        openOverlay(.detailanalyse)
                    } label: {
                        Text("Zur Detailanalyse")
                            .pmFont(14, weight: .bold)
                            .foregroundStyle(Theme.btnT)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Theme.btn, in: .rect(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.pressable)
                    .padding(.top, 16)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            // Oben Platz für den Griff des Systems.
            .padding(.top, 24)
            .padding(.bottom, 32)
        }
        // Kurze Inhalte sollen nicht federn, lange schon.
        .scrollBounceBehavior(.basedOnSize)
    }

    private var header: some View {
        HStack(spacing: 8) {
            if let dot = content.dot {
                Circle()
                    .fill(dot)
                    .frame(width: 10, height: 10)
                    .accessibilityHidden(true)
            }

            Text(content.title)
                .pmFont(16.5, weight: .heavy)
                .foregroundStyle(Theme.tx)
                .accessibilityAddTraits(.isHeader)

            if let badge = content.badge {
                StatusPill(text: badge, color: Theme.tx2, background: Theme.elev, horizontalPadding: 8)
            }

            Spacer(minLength: 0)

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .pmFont(12, weight: .bold)
                    .foregroundStyle(Theme.tx2)
                    .frame(width: 32, height: 32)
                    .background(Theme.card2, in: .circle)
                    .pmHitTarget()
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Schließen")
        }
    }

    private var rowsCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(content.rows.enumerated()), id: \.offset) { index, row in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(alignment: .top, spacing: 12) {
                    Text(row.key)
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx2)
                    Spacer(minLength: 8)
                    Text(row.value)
                        .pmFont(12.5, weight: .semibold)
                        .foregroundStyle(Theme.tx)
                        .multilineTextAlignment(.trailing)
                }
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .background(Theme.card2, in: .rect(cornerRadius: 14, style: .continuous))
    }

    private func documentActions(_ document: DocumentItem) -> some View {
        HStack(spacing: 12) {
            Button {
                if let invoiceID = document.invoiceID {
                    dismiss()
                    openOverlay(.rechnungsdetail(month: invoiceID))
                } else if document.category == .bericht {
                    dismiss()
                    openOverlay(.monatsreport)
                } else {
                    showToast("Vorschau geöffnet (Demo-PDF).")
                }
            } label: {
                Text(openLabel(for: document))
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.btnT)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.btn, in: .rect(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.pressable)

            Button {
                showToast("Download gestartet …")
            } label: {
                Image(systemName: "arrow.down")
                    .pmFont(16, weight: .bold)
                    .foregroundStyle(Theme.tx2)
                    .frame(width: 48, height: 48)
                    .background(Theme.card2, in: .rect(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Herunterladen")
        }
    }

    private func openLabel(for document: DocumentItem) -> String {
        if document.invoiceID != nil { "Rechnung öffnen" }
        else if document.category == .bericht { "Report öffnen" }
        else { "Dokument öffnen" }
    }
}

#Preview {
    Color.clear.sheet(isPresented: .constant(true)) {
        SheetHost(sheet: .kpi("solar"), toast: nil)
    }
}
