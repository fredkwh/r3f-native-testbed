import { Canvas } from '@react-three/native'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function DemandBox() {
  const mesh = useRef<any>(null)
  const frameCount = useRef(0)

  useFrame(() => {
    frameCount.current++
    if (mesh.current) {
      mesh.current.rotation.y += 0.1
    }
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="teal" />
    </mesh>
  )
}

function InvalidateButton({ onInvalidate }: { onInvalidate: () => void }) {
  const invalidate = useThree((s) => s.invalidate)

  const handlePress = useCallback(() => {
    invalidate()
    onInvalidate()
  }, [invalidate, onInvalidate])

  // This component is inside Canvas — render nothing visible,
  // just provide access to invalidate via parent callback
  return null
}

function InvalidateButtonBridge({ onInvalidateRef }: { onInvalidateRef: React.MutableRefObject<(() => void) | null> }) {
  const invalidate = useThree((s) => s.invalidate)
  onInvalidateRef.current = invalidate
  return null
}

export default function DemandScreen() {
  const [frameCount, setFrameCount] = useState(0)
  const [status, setStatus] = useState<'pass' | 'fail' | 'info'>('info')
  const invalidateRef = useRef<(() => void) | null>(null)

  const handleInvalidate = useCallback(() => {
    setFrameCount((c) => c + 1)
    setStatus('pass')
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={status}
        message={
          status === 'pass'
            ? `frameloop="demand" — ${frameCount} manual invalidations`
            : 'Tap "Invalidate" to trigger a render frame'
        }
      />
      <Text style={styles.hint}>
        The cube should NOT rotate continuously. Each tap rotates it one step.
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          invalidateRef.current?.()
          handleInvalidate()
        }}
      >
        <Text style={styles.buttonText}>Invalidate (render 1 frame)</Text>
      </Pressable>
      <TestErrorBoundary name="Demand Frameloop">
        <Canvas style={{ flex: 1 }} frameloop="demand">
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <DemandBox />
          <InvalidateButtonBridge onInvalidateRef={invalidateRef} />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    paddingVertical: 4,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
