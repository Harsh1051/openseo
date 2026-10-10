import { memo } from 'react'
import { StatusMark } from '@web/components/status-mark'
import { PLATFORM_KIND } from '@web/components/share-previews/share-previews.constants'
import { previewTone } from '@web/components/share-previews/share-previews.utils'
import { PreviewFrame } from './components/preview-frame'
import type { PreviewCardProps } from './preview-card.types'

/** One platform: a mock of its preview, then what's wrong with it. */
const PreviewCard = (props: PreviewCardProps) => {
	const { preview } = props

	const headingId = `share-${preview.platform}`

	return (
		<article className="share-card" aria-labelledby={headingId}>
			<header className="share-card-head">
				<StatusMark status={previewTone(preview.notes)} size={20} />
				<h3 id={headingId}>{preview.name}</h3>
				<span className="muted">{PLATFORM_KIND[preview.platform]}</span>
			</header>
			<div className={`share-stage share-stage--${preview.platform}`}>
				<PreviewFrame preview={preview} />
			</div>
			<ul className="share-notes">
				{preview.notes.map((note) => (
					<li key={note.text}>
						<StatusMark status={note.tone} size={16} />
						<span>{note.text}</span>
					</li>
				))}
			</ul>
		</article>
	)
}

export default memo(PreviewCard)
