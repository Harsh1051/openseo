import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, mergeSettings, readableTextOn } from '@shared/settings'

describe('mergeSettings', () => {
	it('keeps valid changes', () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, {
			brandName: '  Silver Design ',
			brandColor: '#3B5BFD',
			ctaUrl: 'https://cal.com/alex',
			pagespeedEnabled: true,
			crawlPageLimit: 250,
			theme: 'dark'
		})
		expect(merged).toMatchObject({
			theme: 'dark',
			brandName: 'Silver Design',
			brandColor: '#3b5bfd',
			ctaUrl: 'https://cal.com/alex',
			pagespeedEnabled: true,
			crawlPageLimit: 250
		})
	})

	it('drops anything invalid', () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, {
			brandColor: 'red',
			ctaUrl: 'javascript:alert(1)',
			brandLogo: 'data:text/html;base64,PHNjcmlwdD4=',
			pagespeedEnabled: 'yes',
			brokenLinkLimit: -5,
			theme: 'sepia',
			unknown: true
		})
		expect(merged).toEqual(DEFAULT_SETTINGS)
	})

	it('caps numbers and falls back to the default name', () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, { crawlPageLimit: 10_000, brandName: '   ' })
		expect(merged.crawlPageLimit).toBe(500)
		expect(merged.brandName).toBe('OpenSEO')
	})
})

describe('readableTextOn', () => {
	it('picks ink on light colors and white on dark ones', () => {
		expect(readableTextOn('#c8f135')).toBe('#0b1220')
		expect(readableTextOn('#0b1220')).toBe('#ffffff')
	})
})
