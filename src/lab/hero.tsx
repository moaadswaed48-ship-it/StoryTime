import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { HERO_SAMPLES } from '@/cast/samples'
import { CAST } from '@/cast/cast'
import { HeroStage, type HeroMode } from '@/hero3d/HeroStage'
import { LabButton } from './Button'

/**
 * 3D hero lab: the stage with the six sample characters (add ?cast=all for every sheet in the first cast).
 * ?mode=live|still|flat forces a mode; ?qa=1 exposes window.__hero for the screenshot script.
 */
export default function HeroLab() {
  const [params] = useSearchParams()
  const sheets = params.get('cast') === 'all' ? CAST : HERO_SAMPLES
  const qa = params.get('qa') === '1'
  const asked = params.get('mode')
  const [mode, setMode] = useState<HeroMode | undefined>(asked === 'live' || asked === 'still' || asked === 'flat' ? asked : undefined)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  /** Writes the first character with its skeleton and all gesture clips to a GLB file and reads it back. */
  async function exportGlb(id: string) {
    setBusy(true)
    try {
      const { roundTrip } = await import('@/hero3d/glb')
      const sheet = sheets.find((s) => s.id === id) ?? sheets[0]
      const { bytes, summary } = await roundTrip(sheet)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${sheet.id}.glb`
      a.click()
      URL.revokeObjectURL(url)
      setNote(`${sheet.id}.glb: ${(bytes.byteLength / 1024).toFixed(0)} KB, ${summary.bones.length} bones, ${summary.clips.length} clips (${summary.clips.join(', ')})`)
    } catch (e) {
      setNote(String(e))
    } finally {
      setBusy(false)
    }
  }

  if (qa) return <main className="p-0"><HeroStage sheets={sheets} mode={mode} debug /></main>
  return (
    <main className="flex flex-col items-center gap-4 p-3 pb-10">
      <HeroStage sheets={sheets} mode={mode} />
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4">
        {(['live', 'still', 'flat'] as const).map((m) => (
          <LabButton key={m} aria-pressed={mode === m} onClick={() => setMode(mode === m ? undefined : m)}>{m}</LabButton>
        ))}
        {sheets.map((s) => (
          <LabButton key={s.id} disabled={busy} onClick={() => exportGlb(s.id)}>GLB: {s.name.en}</LabButton>
        ))}
      </div>
      <p className="max-w-prose text-center text-sm text-ink-muted" role="status">{note || 'live = moving 3D, still = reduced motion, flat = no WebGL. The GLB buttons download a figure with its skeleton and every gesture clip.'}</p>
    </main>
  )
}
