import SwiftUI

/// Shared top bar of every overlay: back button, title (optionally with a
/// subtitle) and an optional trailing control.
struct OverlayHeader<Trailing: View>: View {
    let title: String
    var subtitle: String?
    let onBack: () -> Void
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "arrow.left")
                    .pmFont(16, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
                    .frame(width: 38, height: 38)
                    .background(Theme.card, in: .rect(cornerRadius: 12, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(Theme.line2, lineWidth: 1)
                    }
                    .pmHitTarget()
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Zurück")

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .pmFont(17, weight: .heavy)
                    .tracking(-0.2)
                    .foregroundStyle(Theme.tx)
                    .accessibilityAddTraits(.isHeader)
                if let subtitle {
                    Text(subtitle)
                        .pmFont(11.5)
                        .foregroundStyle(Theme.tx3)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            trailing
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }
}

extension OverlayHeader where Trailing == EmptyView {
    init(title: String, subtitle: String? = nil, onBack: @escaping () -> Void) {
        self.init(title: title, subtitle: subtitle, onBack: onBack) { EmptyView() }
    }
}
