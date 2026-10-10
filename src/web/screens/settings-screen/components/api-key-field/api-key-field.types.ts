import type { UpdateSettings } from '@web/screens/settings-screen'

export interface ApiKeyFieldProps {
	id: string
	hasKey: boolean
	/** The key comes from PAGESPEED_API_KEY and can't be changed here. */
	fromEnv: boolean
	onChange: UpdateSettings
}
