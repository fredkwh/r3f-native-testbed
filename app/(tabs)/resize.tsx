import { Canvas } from '@react-three/native'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function SizeReporter({ onSize }: { onSize: (w: number, h: number) => void }) {
  const { size } = useThree()
  useEffect(() => {
    onSize(size.width, size.height)
  }, [size.width, size.height])
  return null
}

function Sphere() {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => (mesh.current.rotation.y += delta))
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color="mediumpurple" />
    </mesh>
  )
}

type SizeMode = 'full' | 'half' | 'small'

const sizeStyles: Record<SizeMode, any> = {
  full: { flex: 1 },
  half: { height: 300, alignSelf: 'stretch' as const },
  small: { width: 200, height: 200, alignSelf: 'center' as const },
}

export default function ResizeScreen() {
  const [mode, setMode] = useState<SizeMode>('full')
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const [sizeHistory, setSizeHistory] = useState<string[]>([])

  const handleSize = (w: number, h: number) => {
    setCanvasSize({ w, h })
    setSizeHistory((prev) => [`${Math.round(w)}x${Math.round(h)}`, ...prev.slice(0, 4)])
  }

  const cycle = () => {
    setMode((m) => (m === 'full' ? 'half' : m === 'half' ? 'small' : 'full'))
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={sizeHistory.length > 1 ? 'pass' : 'info'}
        message={
          sizeHistory.length > 1
            ? `Resize detected: ${sizeHistory[0]} (${sizeHistory.length - 1} changes)`
            : `Current: ${Math.round(canvasSize.w)}x${Math.round(canvasSize.h)} — tap button to resize`
        }
      />
      <Pressable style={styles.button} onPress={cycle}>
        <Text style={styles.buttonText}>
          Mode: {mode.toUpperCase()} (tap to cycle)
        </Text>
      </Pressable>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={[sizeStyles[mode], styles.canvasContainer]}>
          <TestErrorBoundary name="Resize">
            <Canvas style={{ flex: 1 }}>
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[10, 10, 10]} />
              <Sphere />
              <SizeReporter onSize={handleSize} />
            </Canvas>
          </TestErrorBoundary>
        </View>
      </View>
      <View style={styles.history}>
        <Text style={styles.historyTitle}>Size history:</Text>
        {sizeHistory.map((s, i) => (
          <Text key={i} style={styles.historyEntry}>
            {i === 0 ? '> ' : '  '}
            {s}
          </Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1976d2',
    padding: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  canvasContainer: { borderWidth: 2, borderColor: '#1976d2', borderStyle: 'dashed' },
  history: { backgroundColor: '#1a1a2e', padding: 10 },
  historyTitle: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  historyEntry: { color: '#4fc3f7', fontSize: 12, fontFamily: 'Courier' },
})
