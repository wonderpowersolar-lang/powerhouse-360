import SwiftUI

/// Schriftgrößen, die mit der Systemschrift mitwachsen.
///
/// Die App stammt aus einem HTML-Prototyp und hatte deshalb an jeder Stelle
/// eine feste Punktgröße (`.font(.system(size: 13))`). Feste Größen ignorieren
/// „Textgröße" in den iOS-Einstellungen vollständig — der häufigste
/// Bedienungshilfen-Eingriff überhaupt, weit vor VoiceOver. Bei einer
/// Abrechnungs-App mit Zahlenkolonnen ist das kein Detail.
///
/// Die Punktgrößen selbst sind bewusst erhalten geblieben: Sie sind über die
/// ganze App aufeinander abgestimmt, und sie auf die sieben semantischen
/// Stufen einzudampfen hätte jede Karte neu ausbalanciert. Stattdessen wird
/// jede Größe an die nächstpassende Textstufe gekoppelt und von
/// `ScaledMetric` mitskaliert — die Proportionen bleiben, die Skalierung
/// kommt dazu.
extension View {
    /// - Parameter style: Nur setzen, wenn die automatische Zuordnung nicht
    ///   passt — etwa bei einer Zahl, die sich wie eine Überschrift verhalten
    ///   soll, obwohl sie klein gesetzt ist.
    func pmFont(_ size: CGFloat,
                weight: Font.Weight = .regular,
                design: Font.Design = .default,
                relativeTo style: Font.TextStyle? = nil) -> some View {
        modifier(ScaledSystemFont(size: size,
                                  weight: weight,
                                  design: design,
                                  textStyle: style ?? Font.TextStyle.pmDefault(for: size)))
    }
}

private struct ScaledSystemFont: ViewModifier {
    let weight: Font.Weight
    let design: Font.Design
    @ScaledMetric private var size: CGFloat

    init(size: CGFloat, weight: Font.Weight, design: Font.Design, textStyle: Font.TextStyle) {
        self.weight = weight
        self.design = design
        _size = ScaledMetric(wrappedValue: size, relativeTo: textStyle)
    }

    func body(content: Content) -> some View {
        content.font(.system(size: size, weight: weight, design: design))
    }
}

extension Font.TextStyle {
    /// Ordnet eine Punktgröße der Textstufe zu, deren Standardgröße ihr am
    /// nächsten liegt. Die Stufe bestimmt nur, *wie stark* skaliert wird —
    /// große Schrift wächst langsamer als kleine, so wie im System auch.
    static func pmDefault(for size: CGFloat) -> Font.TextStyle {
        switch size {
        case 28...: .largeTitle
        case 24..<28: .title
        case 20..<24: .title2
        case 18..<20: .title3
        case 16..<18: .body
        case 14..<16: .subheadline
        case 12..<14: .footnote
        case 11..<12: .caption
        default: .caption2
        }
    }
}

extension Font {
    /// Für `Text(…) + Text(…)`-Verkettungen, die einen `Font` brauchen statt
    /// eines View-Modifiers. Skaliert nur korrekt, wenn die umgebende View
    /// `\.dynamicTypeSize` liest — sonst rendert sie bei einer Änderung der
    /// Textgröße nicht neu. `pmScaled` erzwingt das über den Parameter.
    static func pmScaled(_ size: CGFloat,
                         weight: Font.Weight = .regular,
                         for dynamicTypeSize: DynamicTypeSize,
                         relativeTo style: Font.TextStyle? = nil) -> Font {
        _ = dynamicTypeSize
        let metrics = UIFontMetrics(forTextStyle:
            (style ?? Font.TextStyle.pmDefault(for: size)).uiTextStyle)
        return .system(size: metrics.scaledValue(for: size), weight: weight)
    }
}

private extension Font.TextStyle {
    var uiTextStyle: UIFont.TextStyle {
        switch self {
        case .largeTitle: .largeTitle
        case .title: .title1
        case .title2: .title2
        case .title3: .title3
        case .headline: .headline
        case .subheadline: .subheadline
        case .body: .body
        case .callout: .callout
        case .footnote: .footnote
        case .caption: .caption1
        case .caption2: .caption2
        @unknown default: .body
        }
    }
}
