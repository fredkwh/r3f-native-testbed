import { Canvas, useNativeGLTF } from '@react-three/native'
import { useRef, useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'
import { FPSCounter } from '../../components/FPSCounter'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

// Load mock scene data (simulates API response)
const mockScene = require('../../assets/mock-scene.json')

// ─── SceneV1 Schema ─────────────────────────────────────────────────
// Y-up, room centered at origin, dimensions in meters

interface SceneV1 {
  id: string
  name: string
  room: {
    width: number
    depth: number
    height: number
    floor: { materialId: string }
    walls: {
      north: { materialId: string }
      south: { materialId: string }
      east: { materialId: string }
      west: { materialId: string }
    }
  }
  openings: {
    id: string
    type: 'window' | 'door'
    wall: 'north' | 'south' | 'east' | 'west'
    offsetX: number
    width: number
    height: number
    sillHeight: number
  }[]
  furniture: {
    id: string
    modelId: string
    label: string
    position: [number, number, number]
    rotation: number
    scale: [number, number, number]
    color: string
  }[]
}

// ─── Material presets ───────────────────────────────────────────────

const WALL_PRESETS: Record<string, string> = {
  wall_default: '#f5f5f5',
  wall_white: '#ffffff',
  wall_beige: '#f5f5dc',
  wall_gray: '#d3d3d3',
  wall_warm_gray: '#c4b9a8',
  wall_cream: '#fffdd0',
  wall_sage: '#b2ac88',
  wall_blue_gray: '#a4b0be',
  wall_taupe: '#b38b6d',
  wall_charcoal: '#555555',
  wall_navy: '#2c3e50',
  wall_terracotta: '#c87941',
}

const FLOOR_PRESETS: Record<string, string> = {
  floor_oak: '#c4a882',
  floor_walnut: '#5c4033',
  floor_maple: '#deb887',
  floor_concrete: '#b0b0b0',
  floor_marble: '#e8e8e0',
  floor_tile_white: '#f0f0f0',
}

function resolveColor(materialId: string, presets: Record<string, string>): string {
  return presets[materialId] ?? materialId
}

// ─── GLB model URLs (modelId → URL) ─────────────────────────────────
// Items with a URL here render as GLB models; others fall back to box placeholders.

const MODEL_URLS: Record<string, string> = {
  coffee_table:
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxTextured/glTF-Binary/BoxTextured.glb',
  armchair:
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
}

// ─── Drag helpers ───────────────────────────────────────────────────

const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _hitPoint = new THREE.Vector3()

// ─── Wall segments with openings ────────────────────────────────────

type WallDir = 'north' | 'south' | 'east' | 'west'

interface WallSegment {
  x: number
  y: number
  w: number
  h: number
}

function computeWallSegments(
  wallWidth: number,
  wallHeight: number,
  openings: SceneV1['openings'],
): WallSegment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: wallHeight / 2, w: wallWidth, h: wallHeight }]
  }

  // Sort openings by offsetX
  const sorted = [...openings].sort((a, b) => a.offsetX - b.offsetX)
  const segments: WallSegment[] = []

  let cursor = -wallWidth / 2

  for (const op of sorted) {
    const opLeft = op.offsetX - op.width / 2
    const opRight = op.offsetX + op.width / 2
    const opBottom = op.sillHeight
    const opTop = op.sillHeight + op.height

    // Left segment (full height, from cursor to opening left edge)
    if (opLeft > cursor + 0.001) {
      const segW = opLeft - cursor
      segments.push({
        x: cursor + segW / 2,
        y: wallHeight / 2,
        w: segW,
        h: wallHeight,
      })
    }

    // Header above opening (from opTop to wallHeight)
    if (opTop < wallHeight - 0.001) {
      const headerH = wallHeight - opTop
      segments.push({
        x: op.offsetX,
        y: opTop + headerH / 2,
        w: op.width,
        h: headerH,
      })
    }

    // Sill below opening (from 0 to opBottom) — only for windows
    if (opBottom > 0.001) {
      segments.push({
        x: op.offsetX,
        y: opBottom / 2,
        w: op.width,
        h: opBottom,
      })
    }

    cursor = opRight
  }

  // Right segment (full height, from last opening right edge to wall end)
  const wallRight = wallWidth / 2
  if (cursor < wallRight - 0.001) {
    const segW = wallRight - cursor
    segments.push({
      x: cursor + segW / 2,
      y: wallHeight / 2,
      w: segW,
      h: wallHeight,
    })
  }

  return segments
}

// ─── Room Component ─────────────────────────────────────────────────

function Room({ scene }: { scene: SceneV1 }) {
  const { room, openings } = scene
  const { width, depth, height } = room
  const halfW = width / 2
  const halfD = depth / 2

  const floorColor = resolveColor(room.floor.materialId, FLOOR_PRESETS)

  const wallConfigs: {
    dir: WallDir
    position: [number, number, number]
    rotation: [number, number, number]
    wallWidth: number
  }[] = [
    { dir: 'north', position: [0, 0, -halfD], rotation: [0, 0, 0], wallWidth: width },
    { dir: 'south', position: [0, 0, halfD], rotation: [0, Math.PI, 0], wallWidth: width },
    { dir: 'east', position: [halfW, 0, 0], rotation: [0, -Math.PI / 2, 0], wallWidth: depth },
    { dir: 'west', position: [-halfW, 0, 0], rotation: [0, Math.PI / 2, 0], wallWidth: depth },
  ]

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls with openings */}
      {wallConfigs.map(({ dir, position, rotation, wallWidth }) => {
        const wallColor = resolveColor(room.walls[dir].materialId, WALL_PRESETS)
        const wallOpenings = openings.filter((o) => o.wall === dir)
        const segments = computeWallSegments(wallWidth, height, wallOpenings)

        return (
          <group key={dir} position={position} rotation={rotation}>
            {segments.map((seg, i) => (
              <mesh key={i} position={[seg.x, seg.y, 0]}>
                <planeGeometry args={[seg.w, seg.h]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
              </mesh>
            ))}
            {/* Opening frames */}
            {wallOpenings.map((op) => {
              const frameColor = op.type === 'window' ? '#87ceeb' : '#8b6914'
              return (
                <mesh
                  key={op.id}
                  position={[op.offsetX, op.sillHeight + op.height / 2, 0.01]}
                >
                  <planeGeometry args={[op.width, op.height]} />
                  <meshStandardMaterial
                    color={frameColor}
                    transparent
                    opacity={op.type === 'window' ? 0.3 : 0.6}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

// ─── Furniture Component ────────────────────────────────────────────

function FurniturePiece({
  item,
  position,
  rotation,
  selected,
  onSelect,
  onDragStart,
}: {
  item: SceneV1['furniture'][0]
  position: [number, number, number]
  rotation: number
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (itemId: string, ray: THREE.Ray, object: THREE.Object3D) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
      scale={item.scale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
        console.log(`[Scene] Selected: ${item.id} (${item.label})`)
      }}
      onPointerDown={(e) => {
        if (selected && meshRef.current) {
          e.stopPropagation()
          onDragStart(item.id, e.ray, meshRef.current)
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={selected ? '#ffffff' : item.color}
        emissive={selected ? '#4488ff' : '#000000'}
        emissiveIntensity={selected ? 0.4 : 0}
      />
    </mesh>
  )
}

// ─── GLB Furniture Component ────────────────────────────────────────

function GLBFurniturePiece({
  url,
  item,
  position,
  rotation,
  selected,
  onSelect,
  onDragStart,
}: {
  url: string
  item: SceneV1['furniture'][0]
  position: [number, number, number]
  rotation: number
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (itemId: string, ray: THREE.Ray, object: THREE.Object3D) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const gltf = useNativeGLTF(url)
  const cloned = useMemo(() => {
    const s = gltf.scene.clone(true)
    // Override materials with flat color (PBR textures don't work on expo-gl)
    s.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: item.color })
      }
    })
    return s
  }, [gltf.scene, item.color])

  useEffect(() => {
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.color.set(selected ? '#ffffff' : item.color)
        child.material.emissive = new THREE.Color(selected ? '#4488ff' : '#000000')
        child.material.emissiveIntensity = selected ? 0.4 : 0
      }
    })
  }, [selected, cloned, item.color])

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotation, 0]}
      scale={item.scale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
        console.log(`[Scene] Selected: ${item.id} (${item.label}) [GLB]`)
      }}
      onPointerDown={(e) => {
        if (selected && groupRef.current) {
          e.stopPropagation()
          onDragStart(item.id, e.ray, groupRef.current)
        }
      }}
    >
      <primitive object={cloned} />
    </group>
  )
}

// ─── Scene Root ─────────────────────────────────────────────────────

function SceneContent({
  scene,
  selectedId,
  onSelect,
  onFPS,
  furnitureItems,
  positions,
  rotations,
  setPositions,
}: {
  scene: SceneV1
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFPS: (fps: number) => void
  furnitureItems: SceneV1['furniture']
  positions: Record<string, [number, number, number]>
  rotations: Record<string, number>
  setPositions: React.Dispatch<React.SetStateAction<Record<string, [number, number, number]>>>
}) {
  const controlsRef = useRef<any>(null)
  const dragRef = useRef<{
    itemId: string
    offsetX: number
    offsetZ: number
    object: THREE.Object3D
    liveX: number
    liveZ: number
  } | null>(null)
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function commitDrag() {
    const drag = dragRef.current
    if (!drag) return
    const y = positions[drag.itemId]?.[1] ?? 0
    setPositions((prev) => ({ ...prev, [drag.itemId]: [drag.liveX, y, drag.liveZ] }))
    const label = furnitureItems.find((f) => f.id === drag.itemId)?.label ?? drag.itemId
    console.log(
      `[Scene] Moved ${label} (${drag.itemId}) to [${drag.liveX.toFixed(2)}, ${y.toFixed(2)}, ${drag.liveZ.toFixed(2)}]`
    )
  }

  function cleanupDrag() {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
    dragRef.current = null
    if (controlsRef.current) controlsRef.current.enabled = true
  }

  function handleDragStart(itemId: string, ray: THREE.Ray, object: THREE.Object3D) {
    const hit = ray.intersectPlane(XZ_PLANE, _hitPoint)
    if (!hit) return
    const pos = positions[itemId]
    dragRef.current = {
      itemId,
      offsetX: pos[0] - hit.x,
      offsetZ: pos[2] - hit.z,
      object,
      liveX: pos[0],
      liveZ: pos[2],
    }
    if (controlsRef.current) controlsRef.current.enabled = false

    // Safety timeout — force end drag after 5s
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
    dragTimeoutRef.current = setTimeout(() => {
      console.warn('[Scene] Drag timeout (5s) — force ending drag')
      commitDrag()
      cleanupDrag()
    }, 5000)
  }

  function handleDragMove(e: any) {
    const drag = dragRef.current
    if (!drag) return
    const hit = e.ray.intersectPlane(XZ_PLANE, _hitPoint)
    if (!hit) return
    const item = furnitureItems.find((f) => f.id === drag.itemId)
    if (!item) return
    const margin = Math.max(item.scale[0], item.scale[2]) / 2
    const halfW = scene.room.width / 2
    const halfD = scene.room.depth / 2
    const x = Math.max(-(halfW - margin), Math.min(halfW - margin, hit.x + drag.offsetX))
    const z = Math.max(-(halfD - margin), Math.min(halfD - margin, hit.z + drag.offsetZ))
    // Directly mutate Three.js object — no React re-render
    drag.object.position.x = x
    drag.object.position.z = z
    drag.liveX = x
    drag.liveZ = z
  }

  function handleDragEnd() {
    if (!dragRef.current) return
    commitDrag()
    cleanupDrag()
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} near={0.1} far={1000} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={15}
        enableDamping
        dampingFactor={0.1}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={1.0} />
      <pointLight position={[-2, 2.5, 1]} intensity={0.4} />

      <group
        onClick={() => onSelect(null)}
        onPointerMove={handleDragMove}
        onPointerUp={(e) => {
          handleDragEnd()
          // Force-reset OrbitControls state to recover from stuck gestures
          // (e.g. pinch zoom where one finger lifts before the other)
          if (controlsRef.current) {
            controlsRef.current.dispatchEvent({ type: 'end' })
          }
        }}
      >
        <Room scene={scene} />
        {furnitureItems.map((item) => {
          const glbUrl = MODEL_URLS[item.modelId]
          const commonProps = {
            item,
            position: positions[item.id],
            rotation: rotations[item.id],
            selected: selectedId === item.id,
            onSelect,
            onDragStart: handleDragStart,
          }
          if (glbUrl) {
            return (
              <Suspense key={item.id} fallback={<FurniturePiece {...commonProps} />}>
                <GLBFurniturePiece url={glbUrl} {...commonProps} />
              </Suspense>
            )
          }
          return <FurniturePiece key={item.id} {...commonProps} />
        })}
      </group>

      <FPSCounter onFPS={onFPS} label="Scene" />
    </>
  )
}

// ─── Screen ─────────────────────────────────────────────────────────

export default function NativeSceneScreen() {
  const scene: SceneV1 = mockScene
  const [fps, setFPS] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [furnitureItems, setFurnitureItems] = useState<SceneV1['furniture']>(() => [...scene.furniture])
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>(() => {
    const map: Record<string, [number, number, number]> = {}
    for (const item of scene.furniture) {
      map[item.id] = [...item.position] as [number, number, number]
    }
    return map
  })
  const [rotations, setRotations] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const item of scene.furniture) {
      map[item.id] = item.rotation
    }
    return map
  })

  const selectedLabel = selectedId
    ? furnitureItems.find((f) => f.id === selectedId)?.label ?? selectedId
    : 'none'

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    const label = furnitureItems.find((f) => f.id === selectedId)?.label ?? selectedId
    console.log(`[Scene] Deleted: ${selectedId} (${label})`)
    setFurnitureItems((prev) => prev.filter((f) => f.id !== selectedId))
    setPositions((prev) => {
      const next = { ...prev }
      delete next[selectedId]
      return next
    })
    setRotations((prev) => {
      const next = { ...prev }
      delete next[selectedId]
      return next
    })
    setSelectedId(null)
  }, [selectedId, furnitureItems])

  const handleRotate = useCallback(() => {
    if (!selectedId) return
    setRotations((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? 0) + Math.PI / 2,
    }))
    console.log(`[Scene] Rotated: ${selectedId} by 90deg`)
  }, [selectedId])

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status="pass"
        message={`${scene.name} (${scene.room.width}x${scene.room.depth}m) | ${furnitureItems.length} items | Selected: ${selectedLabel} | FPS: ${fps}`}
      />

      {selectedId && (
        <View style={styles.toolbar}>
          <Pressable style={styles.toolBtn} onPress={handleRotate}>
            <Text style={styles.toolBtnText}>Rotate 90</Text>
          </Pressable>
          <Pressable style={[styles.toolBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={[styles.toolBtnText, styles.deleteBtnText]}>Delete</Text>
          </Pressable>
        </View>
      )}

      <TestErrorBoundary name="Scene">
        <Canvas style={{ flex: 1 }}>
          <SceneContent
            scene={scene}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onFPS={setFPS}
            furnitureItems={furnitureItems}
            positions={positions}
            rotations={rotations}
            setPositions={setPositions}
          />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderBottomWidth: 1,
    borderBottomColor: '#90caf9',
  },
  toolBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1976d2',
  },
  toolBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#c62828',
  },
  deleteBtnText: {
    color: '#fff',
  },
})
