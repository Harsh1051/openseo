import type { PublicSettings } from '@shared/settings'
import type { AuditReport } from '@shared/types'

export interface ReportScreenProps {
	report: AuditReport
	settings: PublicSettings
}
