'use client'

import { memo, useState } from 'react'
import { Button } from '@web/components/button'
import { Input } from '@web/components/input'
import type { ApiKeyFieldProps } from './api-key-field.types'

/** The key is never sent back to the browser, so this only replaces or removes it. */
const ApiKeyField = (props: ApiKeyFieldProps) => {
	const { id, hasKey, fromEnv, onChange } = props

	const [draft, setDraft] = useState('')

	const handleBlur = () => {
		if (!draft.trim()) return
		onChange({ pagespeedApiKey: draft.trim() })
		setDraft('')
	}

	if (fromEnv) return <span className="muted">Set by PAGESPEED_API_KEY</span>

	return (
		<div className="field-pair field-pair--tight">
			<Input
				id={id}
				type="password"
				autoComplete="off"
				placeholder={hasKey ? 'Saved. Type to replace it' : 'Paste your API key'}
				value={draft}
				onChange={(e) => setDraft(e.currentTarget.value)}
				onBlur={handleBlur}
			/>
			{hasKey && (
				<Button variant="danger-quiet" onClick={() => onChange({ pagespeedApiKey: '' })}>
					Remove
				</Button>
			)}
		</div>
	)
}

export default memo(ApiKeyField)
