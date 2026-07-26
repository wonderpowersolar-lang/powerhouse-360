import Observation

/// Shared state carried across the onboarding steps so choices survive
/// back/forward navigation. `shareAnon` / `tips` mirror the prototype's
/// `swShare` / `swTips` toggles (both default on).
@Observable
final class OnboardingModel {
    var shareAnon: Bool = true
    var tips: Bool = true
}
