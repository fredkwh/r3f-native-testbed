import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { TestErrorBoundary } from '../../components/ErrorBoundary'
import { FPSCounter } from '../../components/FPSCounter'

const MESH_COUNTS = [10, 50, 100, 200, 500] as const

function SpinningCube({ position }: { position: [number, number, number] }) {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => {
    mesh.current.rotation.x += delta * 0.5
    mesh.current.rotation.y += delta * 0.3
  })
  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function CubeGrid({ count }: { count: number }) {
  const positions = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(count))
    const spacing = 1.0
    const offset = ((cols - 1) * spacing) / 2
    const result: [number, number, number][] = []
    for (let i = 0; i < count; i++) {
      const x = (i % cols) * spacing - offset
      const y = Math.floor(i / cols) * spacing - offset
      result.push([x, y, 0])
    }
    return result
  }, [count])

  return (
    <>
      {positions.map((pos, i) => (
        <SpinningCube key={i} position={pos} />
      ))}
    </>
  )
}

function StressScene({ count, onFPS }: { count: number; onFPS: (fps: number) => void }) {
  const cols = Math.ceil(Math.sqrt(count))
  const camZ = Math.max(cols * 0.8, 5)

  return (
    <>
      <FPSCounter onFPS={onFPS} label={`${count} meshes`} />
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[10, 10, 10]} />
      <CubeGrid count={count} />
    </>
  )
}

export default function PerfScreen() {
  const [count, setCount] = useState<number>(10)
  const [fps, setFPS] = useState(0)

  const camZ = Math.max(Math.ceil(Math.sqrt(count)) * 0.8, 5)

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.fpsText}>FPS: {fps}</Text>
        <Text style={styles.countText}>{count} meshes</Text>
      </View>
      <View style={styles.buttons}>
        {MESH_COUNTS.map((n) => (
          <Pressable
            key={n}
            style={[styles.btn, count === n && styles.btnActive]}
            onPress={() => setCount(n)}
          >
            <Text style={[styles.btnText, count === n && styles.btnTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <TestErrorBoundary name="Perf" key={count}>
          <Canvas camera={{ position: [0, 0, camZ] }} style={{ flex: 1 }}>
            <StressScene count={count} onFPS={setFPS} />
          </Canvas>
        </TestErrorBoundary>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a2e',
  },
  fpsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    fontVariant: ['tabular-nums'],
  },
  countText: {
    fontSize: 16,
    color: '#aaa',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  btnActive: {
    backgroundColor: '#1976d2',
  },
  btnText: {
    fontSize: 13,
    color: '#666',
  },
  btnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
})
