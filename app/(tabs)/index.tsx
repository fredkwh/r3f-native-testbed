import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function Box() {
  const mesh = useRef<any>(null)
  const [active, setActive] = useState(false)
  useFrame((_, delta) => (mesh.current.rotation.x += delta))
  return (
    <mesh ref={mesh} scale={active ? 1.5 : 1} onClick={() => setActive(!active)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={active ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

type CameraMode = 'default' | 'custom' | 'ortho'

const cameraModes: { key: CameraMode; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'custom', label: 'Perspective (fov:50, pos:[0,5,10])' },
  { key: 'ortho', label: 'Orthographic' },
]

export default function BoxScreen() {
  const [mode, setMode] = useState<CameraMode>('default')

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status="pass"
        message={`Camera: ${cameraModes.find((m) => m.key === mode)!.label}`}
      />
      <View style={styles.buttons}>
        {cameraModes.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.btn, mode === m.key && styles.btnActive]}
            onPress={() => setMode(m.key)}
          >
            <Text style={[styles.btnText, mode === m.key && styles.btnTextActive]}>
              {m.key === 'custom' ? 'Persp' : m.key === 'ortho' ? 'Ortho' : 'Default'}
            </Text>
          </Pressable>
        ))}
      </View>
      <TestErrorBoundary name="Box" key={mode}>
        <Canvas
          orthographic={mode === 'ortho'}
          camera={
            mode === 'custom'
              ? { position: [0, 5, 10], fov: 50 }
              : mode === 'ortho'
                ? { position: [0, 0, 5], zoom: 100 }
                : undefined
          }
        >
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <Box />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
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
