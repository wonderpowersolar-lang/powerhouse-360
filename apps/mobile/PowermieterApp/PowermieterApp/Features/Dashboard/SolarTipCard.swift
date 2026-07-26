import SwiftUI

/// "Jetzt viel Solarstrom verfügbar" nudge card (pv-tinted gradient).
struct SolarTipCard: View {
    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.pvS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "sun.max.fill")
                            .pmFont(18, weight: .semibold)
                            .foregroundStyle(Theme.pv)
                    }
                VStack(alignment: .leading, spacing: 3) {
                    Text("Jetzt viel Solarstrom verfügbar")
                        .pmFont(15, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text("Ein guter Zeitpunkt für Waschmaschine oder Geschirrspüler – bis ca. 15:00 Uhr liefert das Dach mehr, als das Haus verbraucht.")
                        .pmFont(13)
                        .foregroundStyle(Theme.tx2)
                        .lineSpacing(3)
                }
            }

            Button { openOverlay(.sonnenstrompreis) } label: {
                Text("Details ansehen")
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.btnT)
                    .padding(.horizontal, 18)
                    .frame(height: 42)
                    .background(Theme.btn, in: .rect(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.pressable)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            ZStack {
                Theme.card
                LinearGradient(colors: [Theme.pvS, .clear],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            }
        }
        .clipShape(.rect(cornerRadius: Theme.radiusCard, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous).strokeBorder(Theme.line, lineWidth: 1) }
        .pmCardShadow()
    }
}

#Preview {
    SolarTipCard().padding().background(Theme.bg)
}
