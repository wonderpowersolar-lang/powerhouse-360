import Foundation

/// The linear post-welcome onboarding steps
/// (prototype states `sConnect` → `sPrivacy` → `sObDone`).
///
/// Die Rollenauswahl ist mit ADR-011 entfallen — die App ist eine reine
/// Bewohner-App.
enum OnboardingStep: Hashable {
    case connect
    case privacy
    case done
}
