import SwiftUI

/// "Dein Monatsreport … ist da" call-to-action row.
struct MonthReportRow: View {
    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        Button { openOverlay(.monatsreport) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color(light: 0x4A7DBF, lightAlpha: 0.12, dark: 0x7FB4E8, darkAlpha: 0.14))
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "doc.text.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color(light: 0x4A7DBF, dark: 0x7FB4E8))
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Dein Monatsreport Juni ist da")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text("Verbrauch −6 % · Solaranteil 70 % · 24,65 € gespart")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .pmCard()
        }
        .buttonStyle(.pressable)
    }
}

#Preview {
    MonthReportRow().padding().background(Theme.bg)
}
