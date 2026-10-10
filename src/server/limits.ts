const HOUR = 60 * 60 * 1000

const hits = new Map<string, number[]>()

/** Audits allowed per visitor per hour on public endpoints. 0 turns the limit off. */
function perHour(): number {
	const value = Number(process.env.OPENSEO_RATE_LIMIT ?? 60)

	return Number.isFinite(value) && value >= 0 ? value : 60
}

/** The visitor's IP as reported by the proxy in front of OpenSEO, or "local". */
export function ipFromHeaders(headers: Headers): string {
	const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()

	return forwarded || headers.get('x-real-ip') || 'local'
}

export function clientIp(request: Request): string {
	return ipFromHeaders(request.headers)
}

/** Counts a request against the visitor's hourly allowance. Returns false once it's used up. */
export function takeRateLimit(key: string): boolean {
	const limit = perHour()
	if (!limit) return true
	const now = Date.now()
	const recent = (hits.get(key) ?? []).filter((t) => now - t < HOUR)
	if (recent.length >= limit) {
		hits.set(key, recent)

		return false
	}
	recent.push(now)
	hits.set(key, recent)

	return true
}

let running = 0
const waiting: (() => void)[] = []

function maxConcurrent(): number {
	const value = Number(process.env.OPENSEO_MAX_CONCURRENT ?? 4)

	return Number.isFinite(value) && value > 0 ? value : 4
}

/** Runs heavy work (audits, crawls) a few at a time; the rest wait their turn. */
export async function withSlot<T>(work: () => Promise<T>): Promise<T> {
	if (running >= maxConcurrent()) {
		await new Promise<void>((resolve) => waiting.push(resolve))
	}
	running++
	try {
		return await work()
	} finally {
		running--
		waiting.shift()?.()
	}
}
