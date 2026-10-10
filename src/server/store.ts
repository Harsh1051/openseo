import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DEFAULT_SETTINGS, mergeSettings, type Settings } from '@shared/settings'
import type { AuditReport, CrawlReport, CrawlSummary, ReportSummary } from '@shared/types'

/**
 * Everything OpenSEO keeps, as plain JSON files:
 *
 *   <dir>/reports/<id>.json   one audit report each
 *   <dir>/reports.json        the history index, newest first
 *   <dir>/crawls/<id>.json    one crawl each
 *   <dir>/crawls.json         the crawl index, newest first
 *   <dir>/settings.json       branding and options
 *
 * Set OPENSEO_DATA_DIR to keep them somewhere else.
 */
// The data folder is chosen at runtime, so the bundler mustn't try to trace it.
export const DATA_DIR = resolve(
	/* turbopackIgnore: true */ process.env.OPENSEO_DATA_DIR || join(process.cwd(), 'data')
)

const ID = /^[A-Za-z0-9_-]{6,40}$/

/** Writes to one file happen one at a time, so concurrent audits can't lose index entries. */
const locks = new Map<string, Promise<unknown>>()

function withLock<T>(file: string, work: () => Promise<T>): Promise<T> {
	const previous = locks.get(file) ?? Promise.resolve()
	const next = previous.then(work, work)
	locks.set(
		file,
		next.catch(() => {})
	)

	return next
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
	try {
		return JSON.parse(await readFile(file, 'utf8')) as T
	} catch {
		return fallback
	}
}

/** Writes through a temporary file and a rename, so a crash never leaves half a file. */
async function writeJson(file: string, data: unknown): Promise<void> {
	await mkdir(join(file, '..'), { recursive: true })
	const temp = `${file}.${randomUUID()}.tmp`
	await writeFile(temp, JSON.stringify(data))
	await rename(temp, file)
}

function updateJson<T>(file: string, fallback: T, change: (current: T) => T): Promise<T> {
	return withLock(file, async () => {
		const next = change(await readJson(file, fallback))
		await writeJson(file, next)

		return next
	})
}

export function isValidId(id: string): boolean {
	return ID.test(id)
}

const reportsIndex = join(DATA_DIR, 'reports.json')
const crawlsIndex = join(DATA_DIR, 'crawls.json')
const settingsFile = join(DATA_DIR, 'settings.json')

export async function saveReport(report: AuditReport): Promise<void> {
	await writeJson(join(DATA_DIR, 'reports', `${report.id}.json`), report)
	const summary: ReportSummary = {
		id: report.id,
		url: report.url,
		finalUrl: report.finalUrl,
		domain: report.domain,
		title: report.overview.title,
		createdAt: report.createdAt,
		score: report.score,
		grade: report.grade,
		source: report.source
	}
	await updateJson<ReportSummary[]>(reportsIndex, [], (list) => [summary, ...list])
}

export async function getReport(id: string): Promise<AuditReport | null> {
	if (!isValidId(id)) return null

	return readJson<AuditReport | null>(join(DATA_DIR, 'reports', `${id}.json`), null)
}

export function listReports(): Promise<ReportSummary[]> {
	return readJson<ReportSummary[]>(reportsIndex, [])
}

export async function deleteReport(id: string): Promise<boolean> {
	if (!isValidId(id)) return false
	await rm(join(DATA_DIR, 'reports', `${id}.json`), { force: true })
	let found = false
	await updateJson<ReportSummary[]>(reportsIndex, [], (list) => {
		found = list.some((r) => r.id === id)

		return list.filter((r) => r.id !== id)
	})

	return found
}

export async function saveCrawl(crawl: CrawlReport): Promise<void> {
	await writeJson(join(DATA_DIR, 'crawls', `${crawl.id}.json`), crawl)
	const summary: CrawlSummary = {
		id: crawl.id,
		startUrl: crawl.startUrl,
		domain: crawl.domain,
		createdAt: crawl.createdAt,
		pages: crawl.pages.length,
		health: crawl.health,
		issues: crawl.issues.reduce((n, i) => n + i.count, 0)
	}
	await updateJson<CrawlSummary[]>(crawlsIndex, [], (list) => [summary, ...list])
}

export async function getCrawl(id: string): Promise<CrawlReport | null> {
	if (!isValidId(id)) return null

	return readJson<CrawlReport | null>(join(DATA_DIR, 'crawls', `${id}.json`), null)
}

export function listCrawls(): Promise<CrawlSummary[]> {
	return readJson<CrawlSummary[]>(crawlsIndex, [])
}

export async function deleteCrawl(id: string): Promise<boolean> {
	if (!isValidId(id)) return false
	await rm(join(DATA_DIR, 'crawls', `${id}.json`), { force: true })
	let found = false
	await updateJson<CrawlSummary[]>(crawlsIndex, [], (list) => {
		found = list.some((c) => c.id === id)

		return list.filter((c) => c.id !== id)
	})

	return found
}

export async function getSettings(): Promise<Settings> {
	return mergeSettings(DEFAULT_SETTINGS, await readJson<unknown>(settingsFile, {}))
}

export function updateSettings(patch: unknown): Promise<Settings> {
	return withLock(settingsFile, async () => {
		const next = mergeSettings(await getSettings(), patch)
		await writeJson(settingsFile, next)

		return next
	})
}
