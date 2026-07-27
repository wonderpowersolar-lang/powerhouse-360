import SwiftUI

/// Sagt es, wenn die App-Daten nicht geladen werden konnten.
///
/// Ohne diesen Streifen fällt jede View still auf ihre Anzeigewerte zurück und
/// der Bewohner hält veraltete oder erfundene Zahlen für seinen echten
/// Verbrauch. Bei einer Abrechnungs-App ist das der schlimmste Fehlerpfad, den
/// man haben kann — also ist er sichtbar statt still.
struct DataStatusBanner: View {
    let message: String
    let onRetry: () -> Void

    @State private var retrying = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .pmFont(14, weight: .semibold)
                .foregroundStyle(Theme.warn)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text("Daten konnten nicht geladen werden")
                    .pmFont(13, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Text(message)
                    .pmFont(11.5)
                    .foregroundStyle(Theme.tx2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                retrying = true
                onRetry()
            } label: {
                Text(retrying ? "Lädt …" : "Erneut")
                    .pmFont(12.5, weight: .bold)
                    .foregroundStyle(Theme.accT)
                    .padding(.horizontal, 12)
                    .frame(height: 32)
                    .background(Theme.acc, in: .capsule)
                    .pmHitTarget()
            }
            .buttonStyle(.pressable)
            .disabled(retrying)
        }
        .padding(12)
        .background(Theme.card, in: .rect(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Theme.warn.opacity(0.35), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.10), radius: 14, y: 4)
        .padding(.horizontal, 20)
        .accessibilityElement(children: .contain)
        .onChange(of: message) { retrying = false }
    }
}

#Preview {
    DataStatusBanner(message: "Der Server ist nicht erreichbar.", onRetry: {})
        .padding(.vertical, 40)
        .background(Theme.bg)
}
