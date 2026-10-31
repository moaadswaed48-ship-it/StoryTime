import { forwardRef, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Book as BookData } from '@/content/schema'
import { createCoverAtlas } from './coverAtlas'
import { BOOK } from './bookGeometry'

export const paperMaterial = new THREE.MeshStandardMaterial({ color: '#f1ebdd', roughness: 0.92, metalness: 0 })

interface Props {
  book: BookData
  geometry: THREE.BufferGeometry
  normalMap: THREE.Texture
  yaw: number
  lean: number
  atlasSize: number
}

/** A single hardcover: box with the atlas material (front/back/spine) + shared paper edges. */
export const BookMesh = forwardRef<THREE.Group, Props>(function BookMesh({ book, geometry, normalMap, yaw, lean, atlasSize }, ref) {
  const [map, setMap] = useState<THREE.Texture | null>(null)
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: book.cover.palette.bg,
        roughness: 0.68,
        metalness: 0,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
      }),
    [book.cover.palette.bg, normalMap],
  )

  useEffect(() => {
    let alive = true
    let tex: THREE.Texture | null = null
    createCoverAtlas(book, atlasSize).then((t) => {
      if (!alive) {
        t.dispose()
        return
      }
      tex = t
      setMap(t)
    })
    return () => {
      alive = false
      tex?.dispose()
    }
  }, [book, atlasSize])

  useEffect(() => {
    material.map = map
    material.color.set(map ? '#ffffff' : book.cover.palette.bg)
    material.needsUpdate = true
  }, [map, material, book.cover.palette.bg])

  useEffect(() => () => material.dispose(), [material])

  return (
    <group ref={ref} rotation={[lean, yaw, 0]}>
      <mesh geometry={geometry} material={[material, paperMaterial]} position={[0, BOOK.H / 2, 0]} castShadow />
    </group>
  )
})
