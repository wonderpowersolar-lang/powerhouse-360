import SwiftUI

/// Top-level flow gate: onboarding welcome → main app shell.
/// Mirrors the prototype's `sWelcome` → `sApp` screen states.
struct RootView: View {
    // Debug convenience: launch straight into the app shell via
    // `SIMCTL_CHILD_PM_START=app`. Defaults to the real onboarding entry.
    @State private var phase: AppPhase =
        DebugEnvironment.value(.start) == "app" ? .app : .onboarding
    /// Light/dark override from Einstellungen; `.system` follows iOS.
    @State private var appearance: AppAppearance = .system
    /// App-Daten. Läuft gegen `MockPowermieterAPI`, solange keine Basis-URL
    /// gesetzt ist — siehe `APIConfiguration`.
    @State private var store = PowermieterStore()

    var body: some View {
        ZStack {
            switch phase {
            case .onboarding:
                OnboardingFlow(onFinish: {
                    withAnimation(.easeInOut(duration: 0.35)) { phase = .app }
                })
                .transition(.opacity)
            case .app:
                MainTabView(appearance: $appearance)
                    .transition(.opacity)
            }
        }
        .tint(Theme.acc)
        // Obergrenze bei der ersten Bedienungshilfen-Stufe.
        //
        // Darüber sprengt der Text die aus dem Prototyp übernommenen festen
        // Zeilen- und Kachelhöhen, und Zahlen würden abgeschnitten — bei einer
        // Abrechnungs-App schlimmer als etwas kleinere Schrift. Die Grenze
        // fällt, sobald die Höhen selbst mitwachsen; siehe iOS-Design-Review
        // vom 2026-07-26.
        .dynamicTypeSize(...DynamicTypeSize.accessibility1)
        .preferredColorScheme(appearance.colorScheme)
        .environment(\.powermieterStore, store)
        .task { await store.load() }
    }
}

enum AppPhase {
    case onboarding
    case app
}

#Preview {
    RootView()
}
