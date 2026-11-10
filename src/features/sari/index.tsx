import { Suspense } from 'react'
import { LazyCanvas } from '@/design/LazyCanvas'
import { SariModel } from '@/design/SariModel'

/** TEMPORARY rig check: three Saris (idle, wave, run). Will be replaced by the real section. */
export function MeetSari() {
  return (
    <section id="sari" className="relative h-[100svh] bg-night-2">
      <LazyCanvas camera={{ position: [0, 0.6, 3.6], fov: 26 }} onCreated={({ camera }) => camera.lookAt(0, 0.55, 0)}>
        <hemisphereLight args={['#fff3dc', '#8a5a2a', 1.4]} />
        <directionalLight position={[2, 4, 3]} intensity={2.4} color="#fff0d6" />
        <Suspense fallback={null}>
          <SariModel action="idle" position={[-0.9, 0, 0]} />
          <SariModel action="wave" position={[0, 0, 0]} />
          <SariModel action="run" position={[0.9, 0, 0]} rotation={[0, -0.6, 0]} />
        </Suspense>
      </LazyCanvas>
    </section>
  )
}
