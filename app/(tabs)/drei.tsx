import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, Suspense } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'
import { OrbitControls, Center, useTexture, Environment, MeshReflectorMaterial } from '@react-three/drei'

// ─── Test 1: OrbitControls ───────────────────────────────────────────

function OrbitControlsTest({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  useFrame(() => {
    // If we get here, the scene is rendering
    onStatus('pass', 'Rendering with OrbitControls')
  })

  return (
    <>
      <OrbitControls />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="tomato" />
      </mesh>
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[5, 5, 5]} />
    </>
  )
}

// ─── Test 2: useTexture ──────────────────────────────────────────────

function UseTextureTest({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  const texture = useTexture('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
  const mesh = useRef<any>(null)

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
    if (texture) {
      const img = (texture as any).image
      onStatus('pass', `useTexture loaded ${img?.width || '?'}x${img?.height || '?'}`)
    }
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

// ─── Test 3: Environment ─────────────────────────────────────────────

function EnvironmentTest({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  const mesh = useRef<any>(null)

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.3
    onStatus('pass', 'Environment preset loaded')
  })

  return (
    <>
      <Environment preset="sunset" />
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial metalness={0.9} roughness={0.1} color="silver" />
      </mesh>
    </>
  )
}

// ─── Test 4: Center ──────────────────────────────────────────────────

function CenterTest({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  useFrame(() => {
    onStatus('pass', 'Center working')
  })

  return (
    <>
      <Center>
        <mesh>
          <dodecahedronGeometry args={[1]} />
          <meshStandardMaterial color="mediumpurple" />
        </mesh>
      </Center>
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[5, 5, 5]} />
    </>
  )
}

// ─── Test 6: MeshReflectorMaterial ───────────────────────────────────

function ReflectorTest({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  useFrame(() => {
    onStatus('pass', 'MeshReflectorMaterial rendering')
  })

  return (
    <>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <MeshReflectorMaterial
          mirror={0.5}
          resolution={256}
          mixBlur={1}
          color="#a0a0a0"
        />
      </mesh>
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[5, 5, 5]} />
    </>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────

type TestId = 'orbit' | 'useTexture' | 'environment' | 'center' | 'reflector'

const tests: { id: TestId; label: string }[] = [
  { id: 'orbit', label: 'OrbitControls' },
  { id: 'useTexture', label: 'useTexture' },
  { id: 'environment', label: 'Environment' },
  { id: 'center', label: 'Center' },
  { id: 'reflector', label: 'Reflector' },
]

export default function DreiScreen() {
  const [activeTest, setActiveTest] = useState<TestId>('orbit')
  const [statuses, setStatuses] = useState<Record<TestId, { status: 'loading' | 'pass' | 'fail'; msg: string }>>({
    orbit: { status: 'loading', msg: '' },
    useTexture: { status: 'loading', msg: '' },
    environment: { status: 'loading', msg: '' },
    center: { status: 'loading', msg: '' },
    reflector: { status: 'loading', msg: '' },
  })

  const updateStatus = (id: TestId) => (s: 'pass' | 'fail', msg: string) => {
    setStatuses((prev) => {
      if (prev[id].status === s && prev[id].msg === msg) return prev
      return { ...prev, [id]: { status: s, msg } }
    })
  }

  const current = statuses[activeTest]

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={current.status}
        message={`${tests.find((t) => t.id === activeTest)!.label}: ${current.msg || current.status.toUpperCase()}`}
      />
      <ScrollView horizontal style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {tests.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, activeTest === t.id && styles.tabActive]}
            onPress={() => setActiveTest(t.id)}
          >
            <View style={[styles.dot, { backgroundColor: statuses[t.id].status === 'pass' ? '#2e7d32' : statuses[t.id].status === 'fail' ? '#c62828' : '#f57f17' }]} />
            <Text style={[styles.tabText, activeTest === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flex: 1 }}>
        <TestErrorBoundary name={activeTest} key={activeTest}>
          <Canvas style={{ flex: 1 }}>
            <Suspense fallback={null}>
              {activeTest === 'orbit' && <OrbitControlsTest onStatus={updateStatus('orbit')} />}
              {activeTest === 'useTexture' && (
                <>
                  <ambientLight intensity={Math.PI / 2} />
                  <pointLight position={[5, 5, 5]} />
                  <UseTextureTest onStatus={updateStatus('useTexture')} />
                </>
              )}
              {activeTest === 'environment' && <EnvironmentTest onStatus={updateStatus('environment')} />}
              {activeTest === 'center' && <CenterTest onStatus={updateStatus('center')} />}
              {activeTest === 'reflector' && <ReflectorTest onStatus={updateStatus('reflector')} />}
            </Suspense>
          </Canvas>
        </TestErrorBoundary>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: {
    maxHeight: 44,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1976d2',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
