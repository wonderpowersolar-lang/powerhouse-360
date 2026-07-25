import SwiftUI

/// The 4-step onboarding progress indicator. Steps before and at `current`
/// are accent-colored; the current one is elongated; later steps are muted
/// (prototype's `--acc` / `--elev` dot row).
struct ProgressDots: View {
    var current: Int
    var count: Int = 4

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { index in
                Capsule()
                    .fill(index <= current ? Theme.acc : Theme.elev)
                    .frame(width: index == current ? 18 : 6, height: 6)
            }
        }
        .accessibilityElement()
        .accessibilityLabel("Schritt \(current + 1) von \(count)")
    }
}
