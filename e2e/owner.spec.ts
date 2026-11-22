import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import arOwner from '../src/i18n/ar/owner.ts'
import enOwner from '../src/i18n/en/owner.ts'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Stage 4 part B2: the owner's area on the built site with the local (test-mode) backend, in English and Arabic,
 * at 390 px and 1440 px: create a story, fill it in four languages, upload a picture, save, check each language,
 * publish (all languages, or only some), preview as a family, unpublish; the change history and overview; a parent
 * account is refused; the author's Arabic text is read-only. Screenshots go to qa/out/stage4b2/.
 */
const SHOTS = 'qa/out/stage4b2'
mkdirSync(SHOTS, { recursive: true })
const DICT = { en: { od: enOwner, d: en }, ar: { od: arOwner, d: ar } } as const
type L = keyof typeof DICT
const LANGS = ['ar', 'he', 'en', 'da'] as const
const TEXT: Record<(typeof LANGS)[number], { title: string; page: string }> = {
  ar: { title: 'القمر الصغير', page: 'في الليل خرج القمر الصغير ليلعب.' },
  he: { title: 'הירח הקטן', page: 'בלילה יצא הירח הקטן לשחק.' },
  en: { title: 'The little moon', page: 'At night the little moon came out to play.' },
  da: { title: 'Den lille måne', page: 'Om natten kom den lille måne ud for at lege.' },
}

test.describe.configure({ timeout: 180_000 })

/** A small, real PNG (a soft two-colour gradient) made here, so the test needs no image file. */
function png(w = 160, h = 120): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (b: Buffer) => {
    let c = 0xffffffff
    for (const x of b) c = crcTable[(c ^ x) & 0xff]! ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const rows: number[] = []
  for (let y = 0; y < h; y++) {
    rows.push(0)
    for (let x = 0; x < w; x++) rows.push(40 + (x * 120) / w, 70 + (y * 100) / h, 140)
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.from(rows))), chunk('IEND', Buffer.alloc(0))])
}

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}

async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true })
}

async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
}

/** Puts a signed-in account straight into the local backend (the owner role is set by the database owner only). */
async function signInAs(page: Page, lang: L, role: 'owner' | 'parent') {
  await page.goto(`${lang}/`)
  const id = `${role}-e2e`
  const salt = 'e2e'
  const hash = createHash('sha256').update(`${salt}:a long test password`).digest('hex')
  const now = new Date().toISOString()
  await page.evaluate(([id, role, hash, now, lang]) => {
    localStorage.setItem('storytime.local.v1', JSON.stringify({
      version: 1,
      users: [{ id, email: `${role}@example.test`, salt: 'e2e', hash, confirmedAt: now, createdAt: now }],
      profiles: { [id]: { role, language: lang, storyLanguage: null, onboardedAt: now, createdAt: now } },
      learners: [], consents: [], trials: [], orders: [], payments: [], passes: [], refunds: [], providerEvents: [], cancellationRequests: [],
      outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
    }))
    localStorage.setItem('storytime.local.session', JSON.stringify({ userId: id, email: `${role}@example.test` }))
  }, [id, role, hash, now, lang] as const)
}

test('a parent account cannot open the owner’s area', async ({ page }, info) => {
  const errors = watchErrors(page)
  for (const lang of ['en', 'ar'] as const) {
    await signInAs(page, lang, 'parent')
    await page.goto(`${lang}/app/owner/`)
    await expect(page.getByTestId('owner-refused')).toBeVisible()
    await expect(page.getByRole('heading', { name: DICT[lang].od.area.notOwnerTitle })).toBeVisible()
    await expect(page.getByRole('link', { name: DICT[lang].d.common.nav.owner })).toHaveCount(0)
    await expect(page.getByTestId('owner-area')).toHaveCount(0)
    if (info.project.name === 'phone') await shot(page, info, `owner-refused-${lang}`)
  }
  expect(errors).toEqual([])
})

for (const lang of ['en', 'ar'] as const) {
  test(`owner creates, checks, previews and publishes a story (${lang})`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const { od, d } = DICT[lang]
    await signInAs(page, lang, 'owner')
    await page.goto(`${lang}/app/library/`)
    await page.getByRole('link', { name: d.common.nav.owner }).click()
    await expect(page.getByText(od.list.empty, { exact: true })).toBeVisible()
    await shot(page, info, `owner-list-empty-${lang}`)

    await page.getByTestId('new-story').click()
    await expect(page.getByTestId('owner-editor')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    // Every language starts with visible "Missing" markers.
    expect(await page.getByTestId('missing-mark').count()).toBeGreaterThanOrEqual(8)

    await page.getByLabel(d.commerce.groups['4-5']).check()
    await page.getByLabel(od.editor.trialToggle).check()
    for (const l of LANGS) {
      await page.getByTestId(`title-${l}`).fill(TEXT[l].title)
      await page.getByTestId(`page-1-text-${l}`).fill(TEXT[l].page)
    }
    await expect(page.getByTestId('title-ar')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('title-he')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('title-da')).toHaveAttribute('dir', 'ltr')
    await page.getByTestId('page-1-picture-input').setInputFiles({ name: 'page-1.png', mimeType: 'image/png', buffer: png() })
    await expect(page.getByTestId('page-1-picture').locator('img')).toBeVisible()
    // Where the words sit: the reading side, at the top.
    await page.getByTestId('page-1').getByText(od.editor.zoneSide.start, { exact: true }).click()
    await page.getByTestId('page-1').getByText(od.editor.zoneV.top, { exact: true }).click()
    await expect(page.getByTestId('save-state')).toHaveText(od.editor.unsaved)
    await page.getByTestId('save-story').click()
    await expect(page.getByTestId('save-state')).toHaveText(od.editor.saved)
    await expect(page.getByTestId('missing-mark')).toHaveCount(0)

    // Not checked yet: publishing is blocked and says why.
    await expect(page.getByTestId('publish')).toBeDisabled()
    await expect(page.getByTestId('publish-problems').locator('li')).toHaveCount(4)
    await noSideScroll(page)
    await shot(page, info, `owner-editor-${lang}`)

    if (lang === 'en') {
      for (const l of LANGS) await page.getByTestId(`signoff-${l}-button`).click()
      await expect(page.getByTestId('publish-problems')).toHaveCount(0)
      await page.getByTestId('publish').click()
      await expect(page.getByTestId('story-status')).toContainText('العربية, עברית, English, Dansk')
    } else {
      // "Publish in these languages only": Arabic and Hebrew are checked, the other two are not yet.
      await page.getByTestId('signoff-ar-button').click()
      await page.getByTestId('signoff-he-button').click()
      await page.getByTestId('scope-only').check()
      await page.getByTestId('only-ar').check()
      await page.getByTestId('only-he').check()
      await expect(page.getByTestId('publish')).toBeEnabled()
      await page.getByTestId('publish').click()
      await expect(page.getByTestId('story-status')).toContainText('العربية, עברית')
      await expect(page.getByTestId('story-status')).not.toContainText('English')
    }
    await shot(page, info, `owner-published-${lang}`)

    // Preview exactly the content a family gets, in the chosen language and direction.
    await page.getByTestId('open-preview').click()
    const view = page.getByTestId('family-view')
    await expect(view).toBeVisible()
    await expect(view).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    await expect(view.getByText(TEXT[lang].page)).toBeVisible()
    await expect(view.locator('img')).toHaveCount(1)
    await page.getByTestId('owner-preview').locator('label', { hasText: 'עברית' }).click()
    await expect(view).toHaveAttribute('dir', 'rtl')
    await expect(view.getByText(TEXT.he.page)).toBeVisible()
    await noSideScroll(page)
    await shot(page, info, `owner-preview-${lang}`)

    // Back to the editor; take it off the site again.
    await page.getByRole('link', { name: od.editor.back }).click()
    await page.getByTestId('unpublish').click()
    await expect(page.getByTestId('story-status')).toHaveText(od.publish.isDraft)

    // The list shows the story with its state per language; the history shows the changes.
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.stories, exact: true }).click()
    await expect(page.getByTestId('owner-story-list').locator('li').first()).toContainText(TEXT[lang].title)
    await shot(page, info, `owner-list-${lang}`)
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.changes, exact: true }).click()
    await expect(page.getByTestId('audit-list').locator('li').first()).toContainText(od.changes.actions.unpublish)
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.dashboard, exact: true }).click()
    await expect(page.getByTestId('dash-total')).toHaveText('0')
    await noSideScroll(page)
    await shot(page, info, `owner-dashboard-${lang}`)
    expect(errors).toEqual([])
  })
}

test("the author's Arabic text is read-only", async ({ page }, info) => {
  await signInAs(page, 'en', 'owner')
  const now = new Date().toISOString()
  const empty = { title: '', teaser: '', pages: {}, activity: { title: '', goal: '', materials: [], steps: {}, safety: '', forAdult: '', inClass: '' } }
  await page.evaluate(([now, empty]) => {
    const texts = { ar: { ...empty, title: 'عنوان الكاتبة', pages: { p1: { text: 'نص الكاتبة كما هو', speech: '' } } }, he: empty, en: empty, da: empty }
    const films = { ar: { videoId: null, captionsId: null }, he: { videoId: null, captionsId: null }, en: { videoId: null, captionsId: null }, da: { videoId: null, captionsId: null } }
    localStorage.setItem('storytime.local.content.v1', JSON.stringify({ version: 1, media: [], audit: [], stories: [{
      id: 'author-story', slug: 'author-story', status: 'draft', credit: 'author', textLocked: true, groups: [{ group: '4-5', trial: false }], publishLangs: null,
      pages: [{ key: 'p1', pictureId: null, zone: { side: 'full', v: 'bottom', size: 'm' } }], texts, films, activity: { steps: [] }, signoffs: {},
      createdAt: now, updatedAt: now, publishedAt: null,
    }] }))
  }, [now, empty] as const)
  await page.goto('en/app/owner/story/author-story/')
  await expect(page.getByText(enOwner.editor.lockedNote).first()).toBeVisible()
  await expect(page.getByTestId('title-ar')).toHaveAttribute('readonly', '')
  await expect(page.getByTestId('page-1-text-ar')).toHaveAttribute('readonly', '')
  // Her story has only Arabic: no other language's fields.
  await expect(page.getByTestId('title-en')).toHaveCount(0)
  await expect(page.getByTestId('add-page')).toHaveCount(0)
  if (info.project.name === 'phone') await shot(page, info, 'owner-author-locked-en')
})
