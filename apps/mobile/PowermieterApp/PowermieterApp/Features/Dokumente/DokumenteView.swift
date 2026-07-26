import SwiftUI

/// Dokumente tab (prototype `tabDocs`) — the billing summary plus a folder
/// grid that drills down into a filtered document list.
struct DokumenteView: View {
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.openSheet) private var openSheet

    @State private var filter: DocumentCategory?

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    private var documents: [DocumentItem] { DocumentItem.tenant }

    private var filtered: [DocumentItem] {
        guard let filter else { return [] }
        return documents.filter { $0.category == filter }
    }

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    if let filter {
                        listHeader(for: filter)
                        if filtered.isEmpty {
                            emptyState
                        } else {
                            ForEach(filtered) { document in
                                documentRow(document)
                            }
                        }
                    } else {
                        billingCard
                        categoryGrid
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Dokumente",
                            subtitle: "Verträge & Rechnungen",
                            unreadCount: 0)
        }
        .background(Theme.bg)
        .animation(.easeOut(duration: 0.22), value: filter)
    }

    // MARK: Billing summary

    private var billingCard: some View {
        Button { openOverlay(.rechnungen) } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Aktueller Abschlag")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("68,00 €")
                            .font(.system(size: 23, weight: .heavy))
                            .foregroundStyle(Theme.tx)
                            .monospacedDigit()
                        Text("/ Monat")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Theme.tx2)
                    }
                    .padding(.top, 3)

                    Text("Offene Beträge: 0,00 € · nächste Abbuchung 01.08.")
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.tx3)
                        .padding(.top, 4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                StatusPill(text: "alles bezahlt", color: Theme.ok, background: Theme.okS)

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(16)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Folder grid

    private var categoryGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(DocumentCategory.allCases) { category in
                let items = documents.filter { $0.category == category }
                Button {
                    filter = category
                } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(alignment: .top) {
                            RoundedRectangle(cornerRadius: 13, style: .continuous)
                                .fill(category.softTint)
                                .frame(width: 42, height: 42)
                                .overlay {
                                    Image(systemName: category.symbol)
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundStyle(category.tint)
                                }
                                .accessibilityHidden(true)

                            Spacer(minLength: 0)

                            if items.contains(where: \.isNew) {
                                StatusPill(text: "neu", color: Theme.info,
                                           background: Theme.infoS, horizontalPadding: 8)
                            }
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(category.title)
                                .font(.system(size: 14.5, weight: .bold))
                                .foregroundStyle(Theme.tx)
                            Text(countLabel(items.count))
                                .font(.system(size: 11.5))
                                .foregroundStyle(Theme.tx3)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                    .padding(15)
                    // Min height applied after the padding, matching the
                    // prototype's `box-sizing: border-box` tile.
                    .frame(minHeight: 118, alignment: .topLeading)
                    .pmCard()
                }
                .buttonStyle(.pressable)
                .accessibilityElement(children: .combine)
            }
        }
    }

    private func countLabel(_ count: Int) -> String {
        switch count {
        case 0: "leer"
        case 1: "1 Dokument"
        default: "\(count) Dokumente"
        }
    }

    // MARK: Drilled-down list

    private func listHeader(for category: DocumentCategory) -> some View {
        HStack(spacing: 10) {
            Button {
                filter = nil
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.tx2)
                    .frame(width: 36, height: 36)
                    .background(Theme.card, in: .rect(cornerRadius: 12, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(Theme.line2, lineWidth: 1)
                    }
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Zurück zu Kategorien")

            VStack(alignment: .leading, spacing: 0) {
                Text(category.title)
                    .font(.system(size: 15.5, weight: .heavy))
                    .foregroundStyle(Theme.tx)
                    .accessibilityAddTraits(.isHeader)
                Text(filtered.isEmpty ? "Keine Dokumente" : countLabel(filtered.count))
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func documentRow(_ document: DocumentItem) -> some View {
        Button {
            openSheet(.document(document.title))
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.card2)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "doc.text")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.tx2)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(document.title)
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(Theme.tx)
                        .lineLimit(1)
                    Text(document.meta)
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.tx3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                StatusPill(text: document.statusText,
                           color: document.status.color,
                           background: document.status.background)
            }
            .padding(.horizontal, 15)
            .padding(.vertical, 13)
            .pmCard(cornerRadius: Theme.radiusTile)
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(Theme.elev)
                .frame(width: 52, height: 52)
                .overlay {
                    Image(systemName: "folder")
                        .font(.system(size: 21))
                        .foregroundStyle(Theme.tx2)
                }
                .accessibilityHidden(true)

            Text("Hier ist noch nichts abgelegt")
                .font(.system(size: 15.5, weight: .bold))
                .foregroundStyle(Theme.tx)

            Text("Ältere Dokumente werden nach 24 Monaten automatisch ins Archiv verschoben.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.tx2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 270)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 34)
        .pmCard()
    }
}

#Preview {
    DokumenteView()
}
