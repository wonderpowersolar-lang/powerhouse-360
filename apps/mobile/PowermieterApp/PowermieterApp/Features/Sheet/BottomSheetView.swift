import SwiftUI

/// The bottom sheet (prototype `sheet`) — a scrim plus a rounded panel that
/// explains a number, a flow node, a document or a settings entry.
struct BottomSheetView: View {
    let sheet: AppSheet
    let onClose: () -> Void

    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.showToast) private var showToast
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var content: SheetContent {
        SheetContent.resolve(sheet)
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Tapping the scrim dismisses; as a Button it is reachable by
            // VoiceOver too, not just by touch.
            Button(action: onClose) {
                Rectangle().fill(.black.opacity(0.38))
            }
            .buttonStyle(.plain)
            .ignoresSafeArea()
            .accessibilityLabel("Schließen")

            panel
                .transition(reduceMotion ? .opacity : .move(edge: .bottom))
        }
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Capsule()
                .fill(Theme.line2)
                .frame(width: 38, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 12)
                .padding(.bottom, 14)
                .accessibilityHidden(true)

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
                    .padding(.top, 14)
            }

            if let document = content.document {
                documentActions(document)
                    .padding(.top, 14)
            }

            if content.showsDetailCTA {
                Button {
                    onClose()
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
                .padding(.top, 14)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.bottom, 40)
        .background(Theme.card, in: .rect(topLeadingRadius: 24, topTrailingRadius: 24, style: .continuous))
        // The panel has to reach the screen edge, otherwise the content
        // behind it shows through the home-indicator strip.
        .ignoresSafeArea(edges: .bottom)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Theme.line2)
                .frame(height: 1)
        }
        .shadow(color: Color(light: 0x060E1A, lightAlpha: 0.28, dark: 0x000000, darkAlpha: 0.55),
                radius: 22, x: 0, y: -14)
    }

    private var header: some View {
        HStack(spacing: 9) {
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
                StatusPill(text: badge, color: Theme.tx2, background: Theme.elev, horizontalPadding: 9)
            }

            Spacer(minLength: 0)

            Button(action: onClose) {
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
                .padding(.vertical, 10)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 14)
        .background(Theme.card2, in: .rect(cornerRadius: 14, style: .continuous))
    }

    private func documentActions(_ document: DocumentItem) -> some View {
        HStack(spacing: 10) {
            Button {
                onClose()
                if let invoiceID = document.invoiceID {
                    openOverlay(.rechnungsdetail(month: invoiceID))
                } else if document.category == .bericht {
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
    BottomSheetView(sheet: .kpi("solar"), onClose: {})
}
