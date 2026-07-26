import SwiftUI

/// Coordinates the onboarding sequence as a `NavigationStack`:
/// Willkommen (root) → Gebäude verbinden → Datenschutz → Fertig.
/// Calls `onFinish` to hand off to the app shell.
struct OnboardingFlow: View {
    var onFinish: () -> Void

    @State private var path: [OnboardingStep] = OnboardingFlow.initialPath()
    @State private var model = OnboardingModel()

    var body: some View {
        NavigationStack(path: $path) {
            WelcomeView(onStart: { path.append(.connect) }, onSkip: onFinish)
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: OnboardingStep.self, destination: destination)
        }
        .tint(Theme.acc)
    }

    @ViewBuilder
    private func destination(_ step: OnboardingStep) -> some View {
        Group {
            switch step {
            case .connect:
                ConnectBuildingView(model: model, onBack: pop, onNext: { path.append(.privacy) })
            case .privacy:
                PrivacyView(model: model, onBack: pop, onNext: { path.append(.done) })
            case .done:
                OnboardingDoneView(model: model, onEnter: onFinish)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(step == .done)
    }

    private func pop() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    /// Debug convenience: `SIMCTL_CHILD_PM_STEP=connect|privacy|done` seeds the
    /// stack so a given step can be launched (and screenshotted) directly.
    private static func initialPath() -> [OnboardingStep] {
        switch DebugEnvironment.value(.step) {
        case "connect": return [.connect]
        case "privacy": return [.connect, .privacy]
        case "done": return [.connect, .privacy, .done]
        default: return []
        }
    }
}
