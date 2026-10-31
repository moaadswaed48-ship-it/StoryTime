import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Book as BookData } from '@/content/schema'
import { createCoverAtlas, drawPageInto } from './coverAtlas'
import { BOOK } from './bookGeometry'

export interface BookHandle {
  group: THREE.Group
  hinge: THREE.Group
  materials: THREE.MeshStandardMaterial[]
  ensurePage: () => void
}

interface Props {
  book: BookData
  block: THREE.BufferGeometry
  board: THREE.BufferGeometry
  normalMap: THREE.Texture
  yaw: number
  lean: number
  atlasSize: number
  onPointerDown: () => void
  onClick: (delta: number) => void
}

/**
 * A hardcover: page block (spine/back/edges + first page on +z) and a front board hinged at the spine.
 * Materials are per book (own atlas) but geometries and the paper material are shared.
 */
export const BookMesh = forwardRef<BookHandle, Props>(function BookMesh({ book, block, board, normalMap, yaw, lean, atlasSize, onPointerDown, onClick }, ref) {
  const group = useRef<THREE.Group>(null)
  const hinge = useRef<THREE.Group>(null)
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null)
  const pageDrawn = useRef(false)

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: book.cover.palette.bg, roughness: 0.68, metalness: 0, normalMap, normalScale: new THREE.Vector2(0.35, 0.35) }),
    [book.cover.palette.bg, normalMap],
  )

  useEffect(() => {
    let alive = true
    let tex: THREE.Texture | null = null
    createCoverAtlas(book, atlasSize).then((t) => {
      if (!alive) return t.dispose()
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

  useImperativeHandle(ref, () => ({
    get group() {
      return group.current!
    },
    get hinge() {
      return hinge.current!
    },
    materials: [material],
    ensurePage: () => {
      if (pageDrawn.current || !map) return
      pageDrawn.current = true
      drawPageInto(map, book).catch(() => (pageDrawn.current = false))
    },
  }), [material, map, book])

  return (
    <group ref={group} rotation={[lean, yaw, 0]}>
      <mesh
        geometry={block}
        material={material}
        position={[0, BOOK.H / 2, -BOOK.BOARD / 2]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick(e.delta)
        }}
      />
      {/* hinge at the spine edge; rotate.y negative to open toward −x */}
      <group ref={hinge} position={[-BOOK.W / 2, 0, BOOK.T / 2 - BOOK.BOARD / 2]}>
        <mesh
          geometry={board}
          material={material}
          position={[BOOK.W / 2, BOOK.H / 2, 0]}
          onPointerDown={(e) => {
            e.stopPropagation()
            onPointerDown()
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick(e.delta)
          }}
        />
      </group>
    </group>
  )
})
