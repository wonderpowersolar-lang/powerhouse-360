import SwiftUI

/// Pinned top bar that content scrolls beneath (prototype app header with the
/// `linear-gradient(var(--bg) 55%, transparent)` fade).
struct DashboardHeader: View {
    var greeting: String
    var subtitle: String
    var unreadCount: Int

    @Environment(\.openOverlay) private var openOverlay

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Theme.acc)
                .frame(width: 34, height: 34)
                .overlay {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.accT)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(greeting)
                    .font(.system(size: 20, weight: .heavy))
                    .tracking(-0.4)
                    .foregroundStyle(Theme.tx)
                Text(subtitle)
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            iconButton(symbol: "sparkles", label: "Assistent") { openOverlay(.assistent) }
            iconButton(symbol: "bell.fill", label: "Benachrichtigungen",
                       badge: unreadCount) { openOverlay(.mitteilungen) }
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(
            LinearGradient(colors: [Theme.bg, Theme.bg.opacity(0)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea(edges: .top)
        )
    }

    private func iconButton(symbol: String, label: String, badge: Int = 0,
                            action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.tx2)
                .frame(width: 44, height: 44)
                .background(Theme.card, in: .rect(cornerRadius: 15, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 15, style: .continuous)
                        .strokeBorder(Theme.line2, lineWidth: 1)
                }
                .overlay(alignment: .topTrailing) {
                    if badge > 0 {
                        Text("\(badge)")
                            .font(.system(size: 9.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .frame(minWidth: 16, minHeight: 16)
                            .background(Theme.crit, in: .capsule)
                            .offset(x: -6, y: 6)
                    }
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(badge > 0 ? "\(label), \(badge) neue" : label)
    }
}
