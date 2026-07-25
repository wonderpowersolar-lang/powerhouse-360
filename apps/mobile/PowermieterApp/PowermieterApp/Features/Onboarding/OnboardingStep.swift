import Foundation

/// The linear post-welcome onboarding steps
/// (prototype states `sRole` → `sConnect` → `sPrivacy` → `sObDone`).
enum OnboardingStep: Hashable {
    case role
    case connect
    case privacy
    case done
}
