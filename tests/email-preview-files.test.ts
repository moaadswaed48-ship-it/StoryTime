import { rmSync } from 'node:fs'
import { expect, it } from 'vitest'
import { previewTransport } from '@/emails/preview-transport'
import { renderEmail } from '@/emails/render'
import { sampleParams } from '@/emails/samples'
import { TEMPLATES } from '@/emails/types'
import { LANGS } from '@/i18n/config'

/**
 * Sends every email in four languages through the "preview" transport, which writes them to
 * qa/out/stage4b2/emails-html/ instead of sending. e2e/emails.spec.ts screenshots those files at phone width.
 */
export const OUT = 'qa/out/stage4b2/emails-html'

it('writes every email in every language to disk through the preview transport', async () => {
  rmSync(OUT, { recursive: true, force: true })
  const tr = previewTransport(OUT)
  for (const lang of LANGS) {
    for (const t of TEMPLATES) {
      const e = await renderEmail(t, lang, sampleParams(lang)[t] as never)
      await tr.send({ ...e, to: `preview-${lang}@example.test`, unsubscribeUrl: t === 'new_story' ? sampleParams(lang).new_story.unsubscribeUrl : undefined })
    }
  }
  expect(tr.files).toHaveLength(TEMPLATES.length * LANGS.length)
})
