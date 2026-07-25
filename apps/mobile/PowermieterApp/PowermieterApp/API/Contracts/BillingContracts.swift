import Foundation

/// Spiegel von `packages/api-contracts/src/app/billing.ts`.
enum BillingContracts {
    enum InvoiceStatus: String, Decodable {
        case draft = "DRAFT"
        case issued = "ISSUED"
        case paid = "PAID"
        case cancelled = "CANCELLED"
    }

    struct InvoiceSummary: Decodable, Identifiable, Hashable {
        let id: String
        let number: String
        let periodStart: Date
        let periodEnd: Date
        let totalCents: Int
        let status: InvoiceStatus
    }

    struct InvoiceList: Decodable {
        let items: [InvoiceSummary]
        /// `nil` = keine weitere Seite.
        let nextCursor: String?
    }

    struct InvoiceDetail: Decodable {
        let id: String
        let number: String
        let periodStart: Date
        let periodEnd: Date
        let totalCents: Int
        let status: InvoiceStatus
        let documentId: String
    }

    /// Kurzlebige signierte URL — nicht cachen, nicht weitergeben.
    struct DocumentDownload: Decodable {
        let url: URL
        let expiresAt: Date
        let fileName: String
        let mimeType: String
    }

    struct Contract: Decodable {
        enum Status: String, Decodable {
            case draft = "DRAFT"
            case active = "ACTIVE"
            case ended = "ENDED"
            case cancelled = "CANCELLED"
        }

        struct Tariff: Decodable {
            let name: String
            let validFrom: Date
            let workPricePvCents: Int
            let workPriceGridCents: Int
            let basePriceCents: Int
        }

        let contractNumber: String
        let status: Status
        let startAt: Date
        let endAt: Date?
        let tariff: Tariff
    }
}
