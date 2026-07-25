import SwiftUI

/// Top-level flow gate: onboarding welcome → main app shell.
/// Mirrors the prototype's `sWelcome` → `sApp` screen states.
struct RootView: View {
    // Debug convenience: launch straight into the app shell via
    // `SIMCTL_CHILD_PM_START=app`, optionally with `SIMCTL_CHILD_PM_ROLE=vermieter`.
    // Defaults to the real onboarding entry as a Mieter.
    @State private var phase: AppPhase =
        ProcessInfo.processInfo.environment["PM_START"] == "app" ? .app : .onboarding
    @State private var role: OnboardingRole = RootView.initialRole()
    /// Light/dark override from Einstellungen; `.system` follows iOS.
    @State private var appearance: AppAppearance = .system

    var body: some View {
        ZStack {
            switch phase {
            case .onboarding:
                OnboardingFlow(onFinish: { chosen in
                    role = chosen
                    withAnimation(.easeInOut(duration: 0.35)) { phase = .app }
                })
                .transition(.opacity)
            case .app:
                MainTabView(role: $role, appearance: $appearance)
                    .transition(.opacity)
            }
        }
        .tint(Theme.acc)
        .preferredColorScheme(appearance.colorScheme)
    }

    private static func initialRole() -> OnboardingRole {
        switch ProcessInfo.processInfo.environment["PM_ROLE"] {
        case "vermieter", "eigentuemer": return .eigentuemer
        case "verwaltung": return .verwaltung
        default: return .mieter
        }
    }
}

enum AppPhase {
    case onboarding
    case app
}

#Preview {
    RootView()
}
