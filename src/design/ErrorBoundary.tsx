import { Component, type ReactNode } from 'react'
import { t } from '@/i18n/copy'
import { Pill } from './ui'

/**
 * Catches a screen that failed to load or render (a lost connection while its code was fetched, for example)
 * so one failure never blanks the whole app. Shows a calm "try again"; `onError` lets a caller switch to its
 * own fallback instead (pass `fallback={null}` then).
 */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError?.()
  }
  render() {
    if (!this.state.failed) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback
    return (
      <div className="flex min-h-[70svh] flex-col items-center justify-center gap-5 px-6 text-center" role="alert">
        <p className="t-lede max-w-[28ch]">{t.ui.retry.text}</p>
        <Pill variant="ink" size="lg" onClick={() => window.location.reload()}>
          {t.ui.retry.again}
        </Pill>
      </div>
    )
  }
}
