import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EmailTransport } from './send'

/**
 * The "preview" transport: writes each email to `dir` as <n>-<template>-<lang>.html, .txt and .json (subject,
 * recipient, headers) and sends nothing. Node only. Used by the tests and by any script until a sending account
 * exists. The dev-only gallery /lab/emails renders the same templates in the browser.
 */
export function previewTransport(dir: string): EmailTransport & { files: string[] } {
  const files: string[] = []
  let n = 0
  return {
    name: 'preview',
    files,
    async send(e) {
      mkdirSync(dir, { recursive: true })
      n += 1
      const base = join(dir, `${String(n).padStart(3, '0')}-${e.template}-${e.lang}`)
      writeFileSync(`${base}.html`, e.html)
      writeFileSync(`${base}.txt`, `Subject: ${e.subject}\nTo: ${e.to}\n\n${e.text}`)
      writeFileSync(`${base}.json`, JSON.stringify({ to: e.to, subject: e.subject, preview: e.preview, template: e.template, lang: e.lang, unsubscribeUrl: e.unsubscribeUrl ?? null }, null, 2))
      files.push(`${base}.html`)
      return { id: `preview-${n}`, transport: 'preview' }
    },
  }
}
