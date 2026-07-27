import SwiftUI

/// The app shell after onboarding: a full-bleed screen with the content
/// scrolling under the floating tab bar (prototype `sApp` container).
struct MainTabView: View {
    @Binding var appearance: AppAppearance

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.powermieterStore) private var store

    // Debug convenience: open a specific tab via `SIMCTL_CHILD_PM_TAB=analyse`.
    @State private var selection: AppTab = MainTabView.initialTab()
    /// Navigationspfad der Detailscreens.
    ///
    /// Vorher hielt die Hülle genau *ein* `overlay`. Die fünf Ketten
    /// (Rechnungen → Rechnungsdetail → Support → Assistent) haben sich damit
    /// gegenseitig ersetzt, und „Zurück" landete im Tab statt eine Ebene
    /// höher. Ein Pfad statt eines Slots behebt das.
    // Debug convenience: open an overlay straight away via
    // `SIMCTL_CHILD_PM_OVERLAY=energiebilanz`.
    @State private var path: [AppOverlay] = MainTabView.initialOverlay().map { [$0] } ?? []
    // Debug convenience: `SIMCTL_CHILD_PM_SHEET=kpi:solar`, `…=node:bat`,
    // `…=info:naeh`; `SIMCTL_CHILD_PM_TOAST=Nachricht`.
    @State private var sheet: AppSheet? = MainTabView.initialSheet()
    @State private var toast: String? = MainTabView.initialToast()
    @State private var toastTask: Task<Void, Never>?

    @ViewBuilder
    private var tabContent: some View {
        switch selection {
        case .uebersicht: MieterDashboardView()
        case .analyse: AnalyseView()
        case .nachhaltig: NachhaltigkeitView()
        case .dokumente: DokumenteView()
        case .einstellungen: EinstellungenView(appearance: $appearance)
        }
    }

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
        default: nil
        }
    }

    private static func initialOverlay() -> AppOverlay? {
        switch DebugEnvironment.value(.overlay) {
        case "detailanalyse": .detailanalyse
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

    /// An jede Präsentationsgrenze zu hängen — siehe `ShellActions.swift`.
    private var actions: ShellActions {
        ShellActions(openOverlay: { path.append($0) },
                     openSheet: { sheet = $0 },
                     showToast: { present(toast: $0) })
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.bg.ignoresSafeArea()

            NavigationStack(path: $path) {
                tabContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    // Nur die Tab-Wurzel hat keine Leiste — sie bringt ihren
                    // eigenen Kopfbereich mit. Die Detailscreens brauchen die
                    // Systemleiste, sonst gibt es keinen Kantenwisch zurück.
                    .toolbar(.hidden, for: .navigationBar)
                    .modifier(actions)
                    .navigationDestination(for: AppOverlay.self) { overlay in
                        OverlayHost(overlay: overlay)
                            .modifier(actions)
                    }
            }

            // Beim Push verschwindet die Leiste, wie vorher das Overlay sie
            // verdeckt hat.
            if path.isEmpty {
                FloatingTabBar(tabs: AppTab.allCases, selection: $selection)
                    .transition(.opacity)
            }

            // Ladefehler steht über den Tabs: Er gilt für die ganze App.
            if case .failed(let message) = store.state {
                VStack(spacing: 0) {
                    DataStatusBanner(message: message) {
                        Task { await store.load() }
                    }
                    .padding(.top, 4)
                    Spacer(minLength: 0)
                }
                .transition(reduceMotion ? .opacity : .move(edge: .top).combined(with: .opacity))
                .zIndex(0.5)
            }

            // Bei offenem Sheet zeigt das Sheet den Toast selbst — es ist eine
            // eigene Präsentation und läge sonst darüber.
            if let toast, sheet == nil {
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    ToastView(message: toast).padding(.bottom, 96)
                }
                .transition(reduceMotion ? .opacity
                                         : .move(edge: .bottom).combined(with: .opacity))
                .zIndex(3)
                .allowsHitTesting(false)
            }
        }
        .sheet(item: $sheet) { presented in
            SheetHost(sheet: presented, toast: toast)
                .modifier(actions)
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.25), value: store.state)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.3), value: path)
    }

    /// Zeigt einen Toast und blendet ihn nach 2,6 s wieder aus.
    private func present(toast message: String) {
        toastTask?.cancel()
        withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { toast = message }
        toastTask = Task {
            try? await Task.sleep(for: .seconds(2.6))
            guard !Task.isCancelled else { return }
            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) { toast = nil }
        }
    }
}


#Preview {
    @Previewable @State var appearance: AppAppearance = .system
    MainTabView(appearance: $appearance)
}
