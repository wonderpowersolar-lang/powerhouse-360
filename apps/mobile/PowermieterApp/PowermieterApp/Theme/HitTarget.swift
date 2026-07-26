import SwiftUI

extension View {
    /// Grows the tappable area to Apple's 44 × 44 pt minimum without changing
    /// how the control looks.
    ///
    /// The prototype drew its icon buttons at 32–38 pt, which reads well but is
    /// below the HIG floor — and the controls affected are the ones you least
    /// want people to miss (back, close). Applied to the *styled* view, so the
    /// visible chrome keeps its size and only the hit region grows.
    func pmHitTarget(_ side: CGFloat = 44) -> some View {
        frame(minWidth: side, minHeight: side)
            .contentShape(.rect)
    }
}
