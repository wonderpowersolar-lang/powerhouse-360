import SwiftUI

/// Overlay "Hilfe & Support" — assistant shortcut, FAQ accordion, a report
/// form, callback request and the user's own tickets.
struct SupportView: View {
    let onBack: () -> Void

    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.showToast) private var showToast

    @State private var openQuestion: Int?
    @State private var category = "Zähler & Messung"
    @State private var message = ""
    @State private var attached = false
    @State private var tickets: [(id: String, title: String, state: String, date: String)] = [
        ("#2481", "Zählerstand-Foto eingereicht", "in Bearbeitung", "12.07.2026"),
        ("#2432", "Frage zur Rechnung Mai", "beantwortet", "28.06.2026")
    ]

    private let categories = ["Zähler & Messung", "Rechnung & Vertrag", "App & Zugang", "Sonstiges"]

    private let faq: [(question: String, answer: String)] = [
        ("Woher kommt mein Strom?",
         "Zuerst vom Dach eures Gebäudes. Reicht die Sonne nicht, fließt automatisch Netzstrom nach – du merkst davon nichts."),
        ("Wie berechnet sich meine Ersparnis?",
         "Wir vergleichen deine tatsächlichen Kosten mit dem örtlichen Grundversorgungstarif (38,7 ct/kWh + 12,90 € Grundpreis pro Monat)."),
        ("Was bedeutet „geschätzter Messwert“?",
         "Meldet sich dein Zähler kurz nicht, ersetzen wir die Lücke nach einem Standardprofil. Sobald echte Werte da sind, korrigieren wir automatisch."),
        ("Was passiert nachts oder bei Wolken?",
         "Dann liefert zuerst der Batteriespeicher gespeicherten Sonnenstrom, danach übernimmt das Netz – ohne Unterbrechung.")
    ]

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Hilfe & Support", onBack: onBack)

            ScrollView {
                VStack(spacing: 12) {
                    assistantRow
                    faqCard
                    reportForm
                    callbackCard

                    Text("Meine Anfragen")
                        .pmFont(14.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 4)

                    ticketList
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    // MARK: Assistant shortcut

    private var assistantRow: some View {
        Button {
            openOverlay(.assistent)
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.accS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "sparkles")
                            .pmFont(16, weight: .semibold)
                            .foregroundStyle(Theme.acc)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Assistent fragen")
                        .pmFont(14, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text("„Warum lädt der Speicher?“ – Antworten in Sekunden")
                        .pmFont(12)
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .pmFont(13, weight: .bold)
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: FAQ

    private var faqCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(faq.enumerated()), id: \.offset) { index, entry in
                if index > 0 { Divider().overlay(Theme.line) }

                let isOpen = openQuestion == index
                Button {
                    openQuestion = isOpen ? nil : index
                } label: {
                    HStack(spacing: 12) {
                        Text(entry.question)
                            .pmFont(13.5, weight: .semibold)
                            .foregroundStyle(Theme.tx)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Image(systemName: "chevron.down")
                            .pmFont(12, weight: .bold)
                            .foregroundStyle(Theme.tx3)
                            .rotationEffect(.degrees(isOpen ? 180 : 0))
                            .accessibilityHidden(true)
                    }
                    .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(entry.question)
                .accessibilityAddTraits(isOpen ? [.isSelected, .isButton] : .isButton)

                if isOpen {
                    Text(entry.answer)
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.bottom, 12)
                }
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
        .animation(.easeOut(duration: 0.22), value: openQuestion)
    }

    // MARK: Report a problem

    private var reportForm: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Problem melden")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)

            Picker("Kategorie", selection: $category) {
                ForEach(categories, id: \.self) { Text($0).tag($0) }
            }
            .pickerStyle(.menu)
            .tint(Theme.tx)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))

            TextEditor(text: $message)
                .pmFont(13.5)
                .foregroundStyle(Theme.tx)
                .scrollContentBackground(.hidden)
                .frame(height: 92)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
                .overlay(alignment: .topLeading) {
                    if message.isEmpty {
                        Text("Beschreibe kurz dein Anliegen …")
                            .pmFont(13.5)
                            .foregroundStyle(Theme.tx3)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 16)
                            .allowsHitTesting(false)
                    }
                }
                .accessibilityLabel("Nachricht")

            Button {
                attached = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: attached ? "checkmark" : "camera")
                        .pmFont(13, weight: .semibold)
                        .accessibilityHidden(true)
                    Text(attached ? "zaehlerstand_we12.jpg" : "Zählerstand oder Foto anhängen")
                        .pmFont(12.5, weight: .semibold)
                }
                .foregroundStyle(attached ? Theme.ok : Theme.tx2)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Theme.card2, in: .rect(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.pressable)

            PrimaryButton(title: "Nachricht senden") {
                let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return }
                tickets.insert(("#2496", "\(category) – neue Anfrage", "offen", "21.07.2026"), at: 0)
                message = ""
                attached = false
                showToast("Anfrage gesendet – wir melden uns per E-Mail.")
            }
        }
        .padding(16)
        .pmCard()
    }

    // MARK: Callback

    private var callbackCard: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Theme.infoS)
                .frame(width: 38, height: 38)
                .overlay {
                    Image(systemName: "phone.fill")
                        .pmFont(15, weight: .semibold)
                        .foregroundStyle(Theme.info)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text("Rückruf anfordern")
                    .pmFont(13.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Text("Mo–Fr, 9–17 Uhr · meist innerhalb von 2 Std")
                    .pmFont(11.5)
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button { showToast("Rückruf angefordert – wir melden uns.") } label: {
                Text("Anfordern")
                    .pmFont(12.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .padding(.horizontal, 12)
                    .frame(height: 36)
                    .background(Theme.card2, in: .rect(cornerRadius: 11, style: .continuous))
            }
            .buttonStyle(.pressable)
        }
        .padding(16)
        .pmCard()
    }

    // MARK: Tickets

    private var ticketList: some View {
        VStack(spacing: 0) {
            ForEach(Array(tickets.enumerated()), id: \.offset) { index, ticket in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(spacing: 12) {
                    Text(ticket.id)
                        .pmFont(12, weight: .bold)
                        .foregroundStyle(Theme.tx3)
                        .monospacedDigit()

                    VStack(alignment: .leading, spacing: 2) {
                        Text(ticket.title)
                            .pmFont(13.5, weight: .semibold)
                            .foregroundStyle(Theme.tx)
                        Text(ticket.date)
                            .pmFont(11.5)
                            .foregroundStyle(Theme.tx3)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    StatusPill(text: ticket.state,
                               color: ticket.state == "beantwortet" ? Theme.ok : Theme.info,
                               background: ticket.state == "beantwortet" ? Theme.okS : Theme.infoS)
                }
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }
}

#Preview {
    SupportView(onBack: {})
}
