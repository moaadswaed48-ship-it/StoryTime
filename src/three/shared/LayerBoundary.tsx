import { Component, type ReactNode } from 'react'

/** Isolates a 3D layer: if it throws (shader compile, missing asset), only that layer disappears — not the whole scene. */
export class LayerBoundary extends Component<{ children: ReactNode; name: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.error(`[3D layer "${this.props.name}" disabled]`, err)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
