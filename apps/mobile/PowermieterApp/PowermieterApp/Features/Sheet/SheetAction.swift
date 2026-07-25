import SwiftUI

/// Environment hook for opening the bottom sheet from anywhere in the tree,
/// mirroring `OverlayAction`.
///
///     @Environment(\.openSheet) private var openSheet
///     KPITile(…) { … } action: { openSheet(.kpi("solar")) }
struct SheetAction {
    private let handler: (AppSheet) -> Void

    init(_ handler: @escaping (AppSheet) -> Void) {
        self.handler = handler
    }

    func callAsFunction(_ sheet: AppSheet) {
        handler(sheet)
    }

    static let noop = SheetAction { _ in }
}

extension EnvironmentValues {
    @Entry var openSheet: SheetAction = .noop
}
