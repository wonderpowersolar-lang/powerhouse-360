import Foundation

/// Spiegel von `configResponseSchema` in
/// `packages/api-contracts/src/app/settings.ts`. Der einzige Endpunkt ohne
/// Anmeldung — die App fragt ihn vor dem Login ab, um bei zu alter Version
/// blockieren zu können.
struct ConfigResponse: Decodable {
    struct Features: Decodable {
        let co2: Bool
    }

    let minAppVersion: String
    let privacyUrl: URL
    let imprintUrl: URL
    let features: Features
}
