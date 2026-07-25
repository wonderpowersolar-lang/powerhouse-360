import SwiftUI

/// Small "live" indicator dot with a gentle opacity pulse
/// (prototype `@keyframes pmPulse`), disabled under Reduce Motion.
struct PulseDot: View {
    var color: Color = Theme.acc
    var size: CGFloat = 8

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dim = false

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .opacity(dim ? 0.3 : 1)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                    dim = true
                }
            }
            .accessibilityHidden(true)
    }
}
