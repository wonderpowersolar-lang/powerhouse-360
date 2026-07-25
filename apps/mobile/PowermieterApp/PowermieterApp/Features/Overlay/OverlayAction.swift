import SwiftUI

/// Environment hook so any screen can open an overlay without threading a
/// binding through every intermediate view.
///
///     @Environment(\.openOverlay) private var openOverlay
///     Button { openOverlay(.sonnenstrompreis) } label: { … }
struct OverlayAction {
    private let handler: (AppOverlay) -> Void

    init(_ handler: @escaping (AppOverlay) -> Void) {
        self.handler = handler
    }

    func callAsFunction(_ overlay: AppOverlay) {
        handler(overlay)
    }

    /// Used by previews and by any view rendered outside the tab shell.
    static let noop = OverlayAction { _ in }
}

extension EnvironmentValues {
    @Entry var openOverlay: OverlayAction = .noop
}
