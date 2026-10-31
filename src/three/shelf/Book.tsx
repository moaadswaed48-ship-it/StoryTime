import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Book as BookData } from '@/content/schema'
import { createCoverAtlas } from './coverAtlas'
import { createPageTexture } from './pageTexture'
import { BOOK } from './bookGeometry'

export const paperMaterial = new THREE.MeshStandardMaterial({ color: '#f1ebdd', roughness: 0.92, metalness: 0 })

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
  const [map, setMap] = useState<THREE.Texture | null>(null)
  const [page, setPage] = useState<THREE.Texture | null>(null)
  const wantPage = useRef(false)
  const [, bump] = useState(0)

  const mats = useMemo(() => {
    const cloth = new THREE.MeshStandardMaterial({ color: book.cover.palette.bg, roughness: 0.68, metalness: 0, normalMap, normalScale: new THREE.Vector2(0.35, 0.35) })
    const clothPlain = new THREE.MeshStandardMaterial({ color: book.cover.palette.bg, roughness: 0.7, metalness: 0, normalMap, normalScale: new THREE.Vector2(0.3, 0.3) })
    const pageMat = new THREE.MeshStandardMaterial({ color: '#f6f1e6', roughness: 0.95, metalness: 0 })
    return { cloth, clothPlain, pageMat }
  }, [book.cover.palette.bg, normalMap])

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
    mats.cloth.map = map
    mats.cloth.color.set(map ? '#ffffff' : book.cover.palette.bg)
    mats.cloth.needsUpdate = true
  }, [map, mats, book.cover.palette.bg])

  useEffect(() => {
    mats.pageMat.map = page
    mats.pageMat.color.set(page ? '#ffffff' : '#f6f1e6')
    mats.pageMat.needsUpdate = true
  }, [page, mats])

  useEffect(() => () => {
    mats.cloth.dispose()
    mats.clothPlain.dispose()
    mats.pageMat.dispose()
    page?.dispose()
  }, [mats, page])

  useImperativeHandle(ref, () => ({
    get group() {
      return group.current!
    },
    get hinge() {
      return hinge.current!
    },
    materials: [mats.cloth, mats.clothPlain, mats.pageMat],
    ensurePage: () => {
      if (wantPage.current) return
      wantPage.current = true
      createPageTexture(book).then((t) => {
        setPage(t)
        bump((n) => n + 1)
      })
    },
  }))

  return (
    <group ref={group} rotation={[lean, yaw, 0]}>
      <mesh
        geometry={block}
        material={[mats.cloth, paperMaterial, mats.pageMat]}
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
          material={[mats.cloth, mats.clothPlain]}
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
