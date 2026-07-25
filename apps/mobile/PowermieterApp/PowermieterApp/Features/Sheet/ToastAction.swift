import SwiftUI

/// Environment hook for the transient confirmation toast.
///
///     @Environment(\.showToast) private var showToast
///     Button("PDF öffnen") { showToast("PDF wird geöffnet … (Demo)") }
struct ToastAction {
    private let handler: (String) -> Void

    init(_ handler: @escaping (String) -> Void) {
        self.handler = handler
    }

    func callAsFunction(_ message: String) {
        handler(message)
    }

    static let noop = ToastAction { _ in }
}

extension EnvironmentValues {
    @Entry var showToast: ToastAction = .noop
}
