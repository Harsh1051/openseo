import type { PublicSettings, Settings } from '@shared/settings'
import { getSettings } from './store'

/** The PageSpeed key from the environment wins over the one saved in Settings. */
export function pagespeedConfig(settings: Settings): { enabled: boolean; apiKey?: string } {
	const apiKey = process.env.PAGESPEED_API_KEY || settings.pagespeedApiKey || undefined

	return { enabled: settings.pagespeedEnabled, apiKey }
}

export function toPublicSettings(settings: Settings): PublicSettings {
	const { pagespeedApiKey, ...rest } = settings

	return {
		...rest,
		hasPagespeedKey: Boolean(process.env.PAGESPEED_API_KEY || pagespeedApiKey),
		pagespeedKeyFromEnv: Boolean(process.env.PAGESPEED_API_KEY)
	}
}

export async function getPublicSettings(): Promise<PublicSettings> {
	return toPublicSettings(await getSettings())
}
