import SwiftUI

/// The translucent floating pill nav from the prototype (`--navbg`, blur,
/// 26pt radius, inset 12pt from the edges).
struct FloatingTabBar: View {
    /// The role-specific tab set to render (see `AppTab.tabs(for:)`).
    let tabs: [AppTab]
    @Binding var selection: AppTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { tab in
                let active = tab == selection
                Button {
                    selection = tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.symbol)
                            .font(.system(size: 18, weight: .semibold))
                        Text(tab.title)
                            .font(.system(size: 10, weight: .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(active ? Theme.accT : Color.white.opacity(0.6))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background {
                        if active {
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(Theme.acc)
                        }
                    }
                    .animation(.easeOut(duration: 0.18), value: active)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(active ? [.isSelected, .isButton] : .isButton)
            }
        }
        .padding(6)
        .background {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color(light: 0x111E30, lightAlpha: 0.95, dark: 0x0A1218, darkAlpha: 0.96))
                .background(.ultraThinMaterial, in: .rect(cornerRadius: 26, style: .continuous))
        }
        .shadow(color: Color(light: 0x081222, lightAlpha: 0.3, dark: 0x000000, darkAlpha: 0.5),
                radius: 17, x: 0, y: 14)
        .padding(.horizontal, 12)
    }
}
