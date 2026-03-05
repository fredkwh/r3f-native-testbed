import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function SpinningMesh({ geometry, color, speed }: { geometry: 'box' | 'sphere' | 'torus'; color: string; speed: number }) {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * speed
      mesh.current.rotation.y += delta * speed * 0.7
    }
  })

  return (
    <mesh ref={mesh}>
      {geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {geometry === 'sphere' && <sphereGeometry args={[0.7, 32, 32]} />}
      {geometry === 'torus' && <torusGeometry args={[0.5, 0.2, 16, 32]} />}
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function CanvasCell({
  geometry,
  color,
  speed,
  label,
  onReady,
}: {
  geometry: 'box' | 'sphere' | 'torus'
  color: string
  speed: number
  label: string
  onReady: () => void
}) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TestErrorBoundary name={label}>
        <Canvas style={{ flex: 1 }} onCreated={onReady}>
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[5, 5, 5]} />
          <SpinningMesh geometry={geometry} color={color} speed={speed} />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}

export default function MultiScreen() {
  const [readyCount, setReadyCount] = useState(0)
  const total = 4

  const markReady = () => setReadyCount((c) => Math.min(c + 1, total))

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={readyCount === total ? 'pass' : readyCount > 0 ? 'loading' : 'info'}
        message={
          readyCount === total
            ? `All ${total} canvases rendering independently`
            : `${readyCount}/${total} canvases ready`
        }
      />
      <View style={styles.grid}>
        <View style={styles.row}>
          <CanvasCell geometry="box" color="tomato" speed={1} label="Canvas 1" onReady={markReady} />
          <CanvasCell geometry="sphere" color="dodgerblue" speed={0.7} label="Canvas 2" onReady={markReady} />
        </View>
        <View style={styles.row}>
          <CanvasCell geometry="torus" color="mediumpurple" speed={1.3} label="Canvas 3" onReady={markReady} />
          <CanvasCell geometry="box" color="orange" speed={0.5} label="Canvas 4" onReady={markReady} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flex: 1, padding: 4 },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, margin: 4, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  cellLabel: { textAlign: 'center', fontSize: 11, color: '#666', paddingVertical: 2, backgroundColor: '#f5f5f5' },
})
