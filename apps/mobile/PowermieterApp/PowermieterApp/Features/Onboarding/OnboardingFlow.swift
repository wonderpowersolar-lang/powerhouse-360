import SwiftUI

/// Coordinates the onboarding sequence as a `NavigationStack`:
/// Willkommen (root) → Rolle → Gebäude verbinden → Datenschutz → Fertig.
/// Calls `onFinish` to hand off to the app shell.
struct OnboardingFlow: View {
    /// Hands the chosen role to the app shell so it can pick the right dashboard.
    var onFinish: (OnboardingRole) -> Void

    @State private var path: [OnboardingStep] = OnboardingFlow.initialPath()
    @State private var model = OnboardingModel()

    var body: some View {
        NavigationStack(path: $path) {
            WelcomeView(onStart: { path.append(.role) }, onSkip: { onFinish(model.role) })
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: OnboardingStep.self, destination: destination)
        }
        .tint(Theme.acc)
    }

    @ViewBuilder
    private func destination(_ step: OnboardingStep) -> some View {
        Group {
            switch step {
            case .role:
                RoleSelectView(model: model, onBack: pop, onNext: { path.append(.connect) })
            case .connect:
                ConnectBuildingView(model: model, onBack: pop, onNext: { path.append(.privacy) })
            case .privacy:
                PrivacyView(model: model, onBack: pop, onNext: { path.append(.done) })
            case .done:
                OnboardingDoneView(model: model, onEnter: { onFinish(model.role) })
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
        switch ProcessInfo.processInfo.environment["PM_STEP"] {
        case "role": return [.role]
        case "connect": return [.role, .connect]
        case "privacy": return [.role, .connect, .privacy]
        case "done": return [.role, .connect, .privacy, .done]
        default: return []
        }
    }
}
