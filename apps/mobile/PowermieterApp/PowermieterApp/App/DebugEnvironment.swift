import Foundation

/// Debug-Umschaltungen aus der Prozessumgebung, gesetzt über
/// `SIMCTL_CHILD_PM_…` beim Start im Simulator.
///
/// **Im Release-Build liefert jede Abfrage `nil`.** Das ist der Zweck dieses
/// Typs: Ein ausgelieferter Build darf sich nicht über Umgebungsvariablen
/// umkonfigurieren lassen — am heikelsten wäre `PM_API_BASE_URL`, das sonst
/// sämtliche API-Aufrufe auf einen fremden Server umlenken könnte. Da der
/// Compiler den Zweig im Release entfernt, tauchen weder die Schlüsselnamen
/// noch der Lesepfad im ausgelieferten Binary auf.
///
/// Eine Stelle statt neun verstreuter `#if DEBUG` — so gibt es genau einen
/// Ort zu prüfen, und leere Werte werden einheitlich wie „nicht gesetzt"
/// behandelt.
enum DebugEnvironment {
    enum Key: String {
        case start = "PM_START"
        case role = "PM_ROLE"
        case step = "PM_STEP"
        case tab = "PM_TAB"
        case overlay = "PM_OVERLAY"
        case sheet = "PM_SHEET"
        case toast = "PM_TOAST"
        case scrub = "PM_SCRUB"
        case apiBaseURL = "PM_API_BASE_URL"
    }

    /// Wert der Umschaltung, oder `nil` — im Release immer `nil`.
    /// Ein leer gesetzter Wert zählt bewusst als nicht gesetzt.
    static func value(_ key: Key) -> String? {
        #if DEBUG
        guard let raw = ProcessInfo.processInfo.environment[key.rawValue],
              !raw.isEmpty
        else { return nil }
        return raw
        #else
        return nil
        #endif
    }
}
