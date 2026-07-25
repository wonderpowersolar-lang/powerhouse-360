import SwiftUI

/// „Offene Vorgänge" — the open-cases list card (prototype `homeH` second card).
struct OpenCasesCard: View {
    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        VStack(spacing: 0) {
            Text("Offene Vorgänge")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 11)
                .padding(.bottom, 7)

            Divider().overlay(Theme.line)

            Button { openOverlay(.messsystem) } label: {
                row(chipFill: Theme.warnS,
                    symbol: "exclamationmark.triangle.fill",
                    iconTint: Theme.warn,
                    title: "Zähler WE 07 verzögert",
                    subtitle: "seit 6 Std · Ersatzwerte aktiv") {
                    Text("hoch")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.crit)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(Theme.critS, in: .capsule)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Theme.tx3)
                        .accessibilityHidden(true)
                }
            }
            .buttonStyle(.pressable)
            .accessibilityElement(children: .combine)

            Divider().overlay(Theme.line)

            row(chipFill: Theme.infoS,
                symbol: "envelope.fill",
                iconTint: Theme.info,
                title: "SEPA-Mandat WE 14 ausstehend",
                subtitle: "seit 12 Tagen") {
                remindButton
            }

            Divider().overlay(Theme.line)

            row(chipFill: Theme.elev,
                symbol: "doc.text.fill",
                iconTint: Theme.tx2,
                title: "Vertragsänderung WE 03",
                subtitle: "Unterschrift offen") {
                remindButton
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    // MARK: Row

    private func row<Trailing: View>(chipFill: Color,
                                     symbol: String,
                                     iconTint: Color,
                                     title: String,
                                     subtitle: String,
                                     @ViewBuilder trailing: () -> Trailing) -> some View {
        HStack(spacing: 11) {
            chip(fill: chipFill, symbol: symbol, tint: iconTint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text(subtitle)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            trailing()
        }
        .padding(.vertical, 11)
    }

    // MARK: Icon chip

    private func chip(fill: Color, symbol: String, tint: Color) -> some View {
        RoundedRectangle(cornerRadius: 11, style: .continuous)
            .fill(fill)
            .frame(width: 36, height: 36)
            .overlay {
                Image(systemName: symbol)
                    .font(.system(size: 18))
                    .foregroundStyle(tint)
            }
            .accessibilityHidden(true)
    }

    // MARK: Outline „Erinnern" button

    private var remindButton: some View {
        Button {} label: {
            Text("Erinnern")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Theme.tx)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Theme.card2, in: .rect(cornerRadius: 10, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(Theme.line2, lineWidth: 1)
                }
        }
        .buttonStyle(.pressable)
    }
}

#Preview {
    OpenCasesCard()
        .padding()
        .background(Theme.bg)
}
