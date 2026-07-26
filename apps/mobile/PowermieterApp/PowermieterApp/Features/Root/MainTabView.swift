import SwiftUI

/// The app shell after onboarding: a full-bleed screen with the content
/// scrolling under the floating tab bar (prototype `sApp` container).
struct MainTabView: View {
    @Binding var role: OnboardingRole
    @Binding var appearance: AppAppearance

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // Debug convenience: open a specific tab via `SIMCTL_CHILD_PM_TAB=analyse`.
    @State private var selection: AppTab = MainTabView.initialTab()
    // Debug convenience: open an overlay straight away via
    // `SIMCTL_CHILD_PM_OVERLAY=energiebilanz`.
    @State private var overlay: AppOverlay? = MainTabView.initialOverlay()
    // Debug convenience: `SIMCTL_CHILD_PM_SHEET=kpi:solar`, `…=node:bat`,
    // `…=info:naeh`, `…=building`; `SIMCTL_CHILD_PM_TOAST=Nachricht`.
    @State private var sheet: AppSheet? = MainTabView.initialSheet()
    @State private var toast: String? = MainTabView.initialToast()
    @State private var toastTask: Task<Void, Never>?

    private var tabs: [AppTab] { AppTab.tabs(for: role) }

    private static func initialTab() -> AppTab {
        guard let raw = DebugEnvironment.value(.tab),
              let tab = AppTab(rawValue: raw) else { return .uebersicht }
        return tab
    }

    private static func initialToast() -> String? {
        // Leere Werte filtert DebugEnvironment bereits heraus.
        DebugEnvironment.value(.toast)
    }

    private static func initialSheet() -> AppSheet? {
        guard let raw = DebugEnvironment.value(.sheet) else { return nil }
        let parts = raw.split(separator: ":", maxSplits: 1).map(String.init)
        guard let kind = parts.first else { return nil }
        let argument = parts.count > 1 ? parts[1] : ""

        return switch kind {
        case "kpi": .kpi(argument)
        case "node": .node(argument)
        case "info": .info(argument)
        case "doc": .document(argument)
        case "building": .building
        default: nil
        }
    }

    private static func initialOverlay() -> AppOverlay? {
        switch DebugEnvironment.value(.overlay) {
        case "detailanalyse": .detailanalyse
        case "verbrauchsaufteilung": .verbrauchsaufteilung
        case "wohneinheiten": .wohneinheiten
        case "monatsreport": .monatsreport
        case "sonnenstrompreis": .sonnenstrompreis
        case "assistent": .assistent
        case "energiebilanz": .energiebilanz
        case "mitteilungen": .mitteilungen
        case "rechnungen": .rechnungen
        case "rechnungsdetail": .rechnungsdetail(month: "juni")
        case "messsystem": .messsystem
        case "stoerungsfall": .stoerungsfall
        case "support": .support
        default: nil
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.bg.ignoresSafeArea()

            Group {
                switch selection {
                case .uebersicht:
                    dashboard
                case .analyse:
                    AnalyseView(role: role)
                case .nachhaltig:
                    NachhaltigkeitView()
                case .gebaeude:
                    GebaeudeView()
                case .vorgaenge:
                    VorgaengeView()
                case .dokumente:
                    DokumenteView(role: role)
                case .einstellungen:
                    EinstellungenView(role: $role, appearance: $appearance)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            FloatingTabBar(tabs: tabs, selection: $selection)

            // Overlays sit above the tab bar, like the prototype's z-index 7.
            if let overlay {
                OverlayHost(overlay: overlay, role: role) { self.overlay = nil }
                    .transition(reduceMotion
                                ? .opacity
                                : .move(edge: .trailing).combined(with: .opacity))
                    .zIndex(1)
            }

            // The sheet layers on top of an open overlay, the toast on top of all.
            if let sheet {
                BottomSheetView(sheet: sheet, role: role) { self.sheet = nil }
                    .transition(.opacity)
                    .zIndex(2)
            }

            if let toast {
                VStack(spacing: 0) {
                    // An open sheet owns the bottom of the screen, so the
                    // toast moves to the top instead of landing on its rows.
                    if sheet != nil {
                        ToastView(message: toast).padding(.top, 8)
                        Spacer(minLength: 0)
                    } else {
                        Spacer(minLength: 0)
                        ToastView(message: toast).padding(.bottom, 96)
                    }
                }
                .transition(reduceMotion
                            ? .opacity
                            : .move(edge: sheet != nil ? .top : .bottom).combined(with: .opacity))
                .zIndex(3)
                .allowsHitTesting(false)
            }
        }
        .environment(\.openOverlay, OverlayAction { requested in
            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.3)) {
                overlay = requested
            }
        })
        .environment(\.openSheet, SheetAction { requested in
            withAnimation(reduceMotion ? nil : .spring(duration: 0.34, bounce: 0.12)) {
                sheet = requested
            }
        })
        .environment(\.showToast, ToastAction { message in
            toastTask?.cancel()
            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { toast = message }
            toastTask = Task {
                try? await Task.sleep(for: .seconds(2.6))
                guard !Task.isCancelled else { return }
                withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { toast = nil }
            }
        })
        .animation(reduceMotion ? nil : .easeOut(duration: 0.3), value: overlay)
        .animation(reduceMotion ? nil : .spring(duration: 0.34, bounce: 0.12), value: sheet)
        .onChange(of: role, initial: true) {
            // A role switch can strand the selection on a tab that role
            // doesn't have — fall back to Übersicht.
            if !tabs.contains(selection) { selection = .uebersicht }
        }
    }

    /// The Übersicht tab is role-specific.
    @ViewBuilder
    private var dashboard: some View {
        switch role {
        case .mieter:
            MieterDashboardView()
        case .eigentuemer:
            VermieterDashboardView()
        case .verwaltung:
            VerwaltungDashboardView()
        }
    }
}

#Preview("Mieter") {
    @Previewable @State var role: OnboardingRole = .mieter
    @Previewable @State var appearance: AppAppearance = .system
    MainTabView(role: $role, appearance: $appearance)
}

#Preview("Vermieter") {
    @Previewable @State var role: OnboardingRole = .eigentuemer
    @Previewable @State var appearance: AppAppearance = .system
    MainTabView(role: $role, appearance: $appearance)
}

#Preview("Verwaltung") {
    @Previewable @State var role: OnboardingRole = .verwaltung
    @Previewable @State var appearance: AppAppearance = .system
    MainTabView(role: $role, appearance: $appearance)
}
