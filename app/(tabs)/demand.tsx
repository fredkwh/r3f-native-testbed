import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function SpinningBox() {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
  })
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="teal" />
    </mesh>
  )
}

export default function DemandScreen() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status="info"
        message='frameloop="demand" is a known limitation — using "always" for now'
      />
      <Text style={styles.hint}>
        frameloop="demand" requires endFrameEXP integration with R3F v10's
        scheduler. This is tracked as a Phase 2 item.
      </Text>
      <TestErrorBoundary name="Frameloop">
        <Canvas style={{ flex: 1 }}>
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <SpinningBox />
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
})
