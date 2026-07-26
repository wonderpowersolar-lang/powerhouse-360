import SwiftUI

/// Overlay "Assistent" — demo chat that explains prices, storage and meter
/// readings. Answers are canned; the typing pause is simulated.
struct AssistentView: View {
    let onBack: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private struct Message: Identifiable {
        let id = UUID()
        let text: String
        let fromUser: Bool
    }

    @State private var messages: [Message] = []
    @State private var typing = false
    @State private var input = ""

    private let suggestions = [
        "Warum lädt der Speicher?",
        "Wie hoch ist mein Solaranteil?",
        "Wann ist Strom am günstigsten?"
    ]

    private let answers: [String: String] = [
        "Warum lädt der Speicher?":
            "Euer Dach liefert gerade 18,4 kW, das Gebäude braucht nur 11,2 kW. Der Überschuss geht zuerst in den Speicher (aktuell 74 %) und erst danach ins Netz — so bleibt möglichst viel Sonnenstrom im Haus.",
        "Wie hoch ist mein Solaranteil?":
            "Im Juli kamen 76 % deines Stroms direkt vom Dach — dein bisher bester Wert. Der Rest wurde nachts und an zwei bewölkten Tagen aus dem Netz ergänzt.",
        "Wann ist Strom am günstigsten?":
            "Heute zwischen 11:30 und 15:00 Uhr: dort liegt der Preis bei durchschnittlich 24,1 ct/kWh, in der günstigsten Stunde (13–14 Uhr) sogar bei 23,1 ct."
    ]

    private var greeting: String {
        " Leon"
    }

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Assistent",
                          subtitle: "Erklärt Preise, Speicher & Messwerte",
                          onBack: onBack) {
                StatusPill(text: "Demo", color: Theme.tx2, background: Theme.elev)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        assistantBubble("Hallo\(greeting)! Ich erkläre dir, was in eurem Gebäude gerade passiert – frag mich zum Beispiel:")

                        ForEach(messages) { message in
                            if message.fromUser {
                                userBubble(message.text)
                            } else {
                                assistantBubble(message.text)
                            }
                        }

                        if typing {
                            typingIndicator
                        }

                        Color.clear.frame(height: 1).id("bottom")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 18)
                    .padding(.top, 4)
                    .padding(.bottom, 12)
                }
                .scrollIndicators(.hidden)
                .onChange(of: messages.count) {
                    withAnimation(reduceMotion ? nil : .easeOut(duration: 0.25)) {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                }
            }

            if messages.isEmpty {
                suggestionChips
            }

            inputBar

            Text("Demo mit Beispielantworten. Im Produkt analysiert der Assistent eure Live-Messwerte, Tarife und Wetterprognose.")
                .font(.system(size: 11))
                .foregroundStyle(Theme.tx3)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .padding(.top, 8)
                .padding(.bottom, 12)
        }
        .background(Theme.bg)
    }

    // MARK: Bubbles

    private func assistantBubble(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13.5))
            .foregroundStyle(Theme.tx)
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(Theme.card, in: .rect(cornerRadius: 16, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Theme.line, lineWidth: 1)
            }
            .frame(maxWidth: 300, alignment: .leading)
    }

    private func userBubble(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13.5, weight: .semibold))
            .foregroundStyle(Theme.accT)
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(Theme.acc, in: .rect(cornerRadius: 16, style: .continuous))
            .frame(maxWidth: 300, alignment: .trailing)
            .frame(maxWidth: .infinity, alignment: .trailing)
    }

    private var typingIndicator: some View {
        HStack(spacing: 5) {
            ForEach(0..<3, id: \.self) { _ in
                Circle()
                    .fill(Theme.tx3)
                    .frame(width: 6, height: 6)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Theme.card, in: .rect(cornerRadius: 16, style: .continuous))
        .accessibilityLabel("Assistent schreibt")
    }

    // MARK: Input

    private var suggestionChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(suggestions, id: \.self) { suggestion in
                    Button {
                        send(suggestion)
                    } label: {
                        Text(suggestion)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(Theme.tx2)
                            .lineLimit(1)
                            .padding(.horizontal, 13)
                            .frame(height: 36)
                            .background(Theme.card, in: .capsule)
                            .overlay {
                                Capsule().strokeBorder(Theme.line2, lineWidth: 1)
                            }
                    }
                    .buttonStyle(.pressable)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
    }

    private var inputBar: some View {
        HStack(spacing: 9) {
            TextField("Eigene Frage stellen …", text: $input)
                .font(.system(size: 13.5))
                .foregroundStyle(Theme.tx)
                .padding(.horizontal, 14)
                .frame(height: 46)
                .background(Theme.card, in: .rect(cornerRadius: 14, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(Theme.line2, lineWidth: 1)
                }
                .submitLabel(.send)
                .onSubmit { send(input) }
                .accessibilityLabel("Frage an den Assistenten")

            Button {
                send(input)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(Theme.btnT)
                    .frame(width: 46, height: 46)
                    .background(Theme.btn, in: .rect(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Senden")
        }
        .padding(.horizontal, 18)
        .padding(.top, 10)
    }

    // MARK: Behaviour

    private func send(_ text: String) {
        let question = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty else { return }

        messages.append(Message(text: question, fromUser: true))
        input = ""
        typing = true

        Task {
            try? await Task.sleep(for: .milliseconds(900))
            typing = false
            let answer = answers[question]
                ?? "Dazu habe ich in der Demo noch keine Beispielantwort. Im Produkt beantworte ich solche Fragen anhand eurer Live-Messwerte."
            messages.append(Message(text: answer, fromUser: false))
        }
    }
}

#Preview {
    AssistentView(onBack: {})
}
