import { Canvas } from '@react-three/native'
import { useRef, useState } from 'react'
import { View } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'
import { FPSCounter } from '../../components/FPSCounter'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

// ─── SceneV1 Schema ─────────────────────────────────────────────────
// Y-up, room centered at origin, dimensions in meters

interface SceneV1 {
  room: {
    width: number   // X axis
    depth: number   // Z axis
    height: number  // Y axis
    floor: { color: string }
    walls: {
      north: { color: string }
      south: { color: string }
      east: { color: string }
      west: { color: string }
    }
  }
  furniture: {
    id: string
    modelId: string
    label: string
    position: [number, number, number]
    rotation: number // Y-axis rotation in radians
    scale: [number, number, number]
    color: string
  }[]
}

// ─── Hardcoded test scene ───────────────────────────────────────────

const testScene: SceneV1 = {
  room: {
    width: 6,
    depth: 5,
    height: 2.8,
    floor: { color: '#c4a882' },
    walls: {
      north: { color: '#e8e0d4' },
      south: { color: '#e8e0d4' },
      east: { color: '#d5cdc1' },
      west: { color: '#d5cdc1' },
    },
  },
  furniture: [
    {
      id: 'sofa-1',
      modelId: 'sofa_3seat',
      label: 'Sofa',
      position: [0, 0.4, -1.8],
      rotation: 0,
      scale: [2.0, 0.8, 0.9],
      color: '#5c6b7a',
    },
    {
      id: 'table-1',
      modelId: 'coffee_table',
      label: 'Coffee Table',
      position: [0, 0.25, -0.5],
      rotation: 0,
      scale: [1.2, 0.5, 0.6],
      color: '#8b6914',
    },
    {
      id: 'chair-1',
      modelId: 'armchair',
      label: 'Armchair',
      position: [2.0, 0.35, -0.5],
      rotation: -Math.PI / 4,
      scale: [0.8, 0.7, 0.8],
      color: '#a0522d',
    },
  ],
}

// ─── Drag helpers ───────────────────────────────────────────────────

const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _hitPoint = new THREE.Vector3()

// ─── Room Component ─────────────────────────────────────────────────

function Room({ room }: { room: SceneV1['room'] }) {
  const { width, depth, height } = room
  const halfW = width / 2
  const halfD = depth / 2
  const halfH = height / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={room.floor.color} side={THREE.DoubleSide} />
      </mesh>

      {/* North wall (back, -Z) */}
      <mesh position={[0, halfH, -halfD]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={room.walls.north.color} side={THREE.DoubleSide} />
      </mesh>

      {/* South wall (front, +Z) */}
      <mesh position={[0, halfH, halfD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={room.walls.south.color} side={THREE.DoubleSide} />
      </mesh>

      {/* East wall (+X) */}
      <mesh position={[halfW, halfH, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={room.walls.east.color} side={THREE.DoubleSide} />
      </mesh>

      {/* West wall (-X) */}
      <mesh position={[-halfW, halfH, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={room.walls.west.color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Furniture Component ────────────────────────────────────────────

function FurniturePiece({
  item,
  position,
  selected,
  onSelect,
  onDragStart,
}: {
  item: SceneV1['furniture'][0]
  position: [number, number, number]
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (itemId: string, ray: THREE.Ray) => void
}) {
  return (
    <mesh
      position={position}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
        console.log(`[Scene] Selected: ${item.id} (${item.label})`)
      }}
      onPointerDown={(e) => {
        if (selected) {
          e.stopPropagation()
          onDragStart(item.id, e.ray)
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

// ─── Scene Root ─────────────────────────────────────────────────────

function SceneContent({
  scene,
  selectedId,
  onSelect,
  onFPS,
}: {
  scene: SceneV1
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFPS: (fps: number) => void
}) {
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>(() => {
    const map: Record<string, [number, number, number]> = {}
    for (const item of scene.furniture) {
      map[item.id] = [...item.position]
    }
    return map
  })
  const dragRef = useRef<{ itemId: string; offsetX: number; offsetZ: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleDragStart(itemId: string, ray: THREE.Ray) {
    const hit = ray.intersectPlane(XZ_PLANE, _hitPoint)
    if (!hit) return
    const pos = positions[itemId]
    dragRef.current = {
      itemId,
      offsetX: pos[0] - hit.x,
      offsetZ: pos[2] - hit.z,
    }
    setDragging(true)
  }

  function handleDragMove(e: any) {
    const drag = dragRef.current
    if (!drag) return
    const hit = e.ray.intersectPlane(XZ_PLANE, _hitPoint)
    if (!hit) return
    const item = scene.furniture.find((f) => f.id === drag.itemId)!
    const margin = Math.max(item.scale[0], item.scale[2]) / 2
    const halfW = scene.room.width / 2
    const halfD = scene.room.depth / 2
    const x = Math.max(-(halfW - margin), Math.min(halfW - margin, hit.x + drag.offsetX))
    const z = Math.max(-(halfD - margin), Math.min(halfD - margin, hit.z + drag.offsetZ))
    setPositions((prev) => ({ ...prev, [drag.itemId]: [x, prev[drag.itemId][1], z] }))
  }

  function handleDragEnd() {
    const drag = dragRef.current
    if (!drag) return
    const pos = positions[drag.itemId]
    const label = scene.furniture.find((f) => f.id === drag.itemId)?.label ?? drag.itemId
    console.log(
      `[Scene] Moved ${label} (${drag.itemId}) to [${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}]`
    )
    dragRef.current = null
    setDragging(false)
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} near={0.1} far={1000} />
      <OrbitControls
        makeDefault
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={20}
        enabled={!dragging}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={1.0} />
      <pointLight position={[-2, 2.5, 1]} intensity={0.4} />

      <group
        onClick={() => onSelect(null)}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <Room room={scene.room} />
        {scene.furniture.map((item) => (
          <FurniturePiece
            key={item.id}
            item={item}
            position={positions[item.id]}
            selected={selectedId === item.id}
            onSelect={onSelect}
            onDragStart={handleDragStart}
          />
        ))}
      </group>

      <FPSCounter onFPS={onFPS} label="Scene" />
    </>
  )
}

// ─── Screen ─────────────────────────────────────────────────────────

export default function NativeSceneScreen() {
  const [fps, setFPS] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedLabel = selectedId
    ? testScene.furniture.find((f) => f.id === selectedId)?.label ?? selectedId
    : 'none'

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status="pass"
        message={`${testScene.room.width}x${testScene.room.depth}m | ${testScene.furniture.length} items | Selected: ${selectedLabel} | FPS: ${fps}`}
      />
      <TestErrorBoundary name="Scene">
        <Canvas style={{ flex: 1 }}>
          <SceneContent
            scene={testScene}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onFPS={setFPS}
          />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}
