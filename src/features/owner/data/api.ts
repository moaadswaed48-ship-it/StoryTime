import type { Lang } from '@/i18n/config'
import type { AuditRow, Dashboard, MediaRecord, OwnerStory, OwnerStorySummary, StoryDraft, UploadMeta } from './types'
import type { PublishProblem, UploadRefusal } from './rules'

/**
 * The owner's area talks only to this interface. Two implementations, like the main data layer (src/data/api.ts):
 *   local     this browser's storage (content in localStorage, files in IndexedDB); the preview and the tests.
 *   supabase  the content tables, the `content` storage bucket and the owner functions in
 *             supabase/migrations. NOT run against a real project yet (none is approved).
 * Every method checks the owner role itself (local) or is refused by row-level security (Supabase).
 */
export interface OwnerApi {
  readonly kind: 'local' | 'supabase'
  listStories(): Promise<OwnerStorySummary[]>
  getStory(id: string): Promise<OwnerStory>
  /** A new, empty draft of StoryTime's own (the author's story is imported, never created here). */
  createStory(): Promise<OwnerStory>
  /** Saves the editable parts. Refused: the author's Arabic text changed; more than 3 trial stories in a group. */
  saveStory(id: string, draft: StoryDraft): Promise<OwnerStory>
  /** Checks type, real content, size and licence, stores the file and records it in the media table. */
  upload(file: File, meta: UploadMeta): Promise<MediaRecord>
  getMedia(ids: string[]): Promise<MediaRecord[]>
  /** A link the browser can show (an object URL locally, a short-lived signed link on Supabase). */
  mediaUrl(id: string): Promise<string>
  signOff(id: string, lang: Lang): Promise<OwnerStory>
  withdrawSignOff(id: string, lang: Lang): Promise<OwnerStory>
  /** `only` = "publish in these languages only"; null = every language the story can have. */
  publish(id: string, only: Lang[] | null): Promise<OwnerStory>
  unpublish(id: string): Promise<OwnerStory>
  listAudit(storyId?: string): Promise<AuditRow[]>
  dashboard(): Promise<Dashboard>
}

export type OwnerErrorCode =
  | 'not_owner'
  | 'not_signed_in'
  | 'not_found'
  | 'text_locked'
  | 'trial_limit'
  | 'publish_blocked'
  | 'signoff_blocked'
  | 'upload_refused'
  | 'storage_full'
  | 'network'
  | 'unknown'

export class OwnerError extends Error {
  readonly code: OwnerErrorCode
  readonly problems: PublishProblem[]
  readonly refusal: UploadRefusal | null
  constructor(code: OwnerErrorCode, opts: { problems?: PublishProblem[]; refusal?: UploadRefusal; detail?: string } = {}) {
    super(opts.detail ? `${code}: ${opts.detail}` : code)
    this.name = 'OwnerError'
    this.code = code
    this.problems = opts.problems ?? []
    this.refusal = opts.refusal ?? null
  }
}

export function ownerCodeOf(e: unknown): OwnerErrorCode {
  if (e instanceof OwnerError) return e.code
  const msg = String((e as { message?: string })?.message ?? e)
  if (/fetch|network|Load failed|dynamically imported module/i.test(msg)) return 'network'
  if (/QuotaExceeded/i.test(msg)) return 'storage_full'
  return 'unknown'
}
