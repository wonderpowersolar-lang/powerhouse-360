import SwiftUI

/// Tappable KPI card wrapper — card chrome + press feedback. The varied
/// inner layouts from the prototype's grid are supplied via `content`.
struct KPITile<Content: View>: View {
    var accessibilityText: String
    /// Which explainer sheet this tile opens.
    var sheet: AppSheet?
    @ViewBuilder var content: () -> Content

    @Environment(\.openSheet) private var openSheet

    var body: some View {
        Button {
            if let sheet { openSheet(sheet) }
        } label: {
            content()
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14)
                .padding(.vertical, 13)
                .pmCard(cornerRadius: Theme.radiusTile)
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText)
    }
}
