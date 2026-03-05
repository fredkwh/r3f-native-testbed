import { Canvas } from '@react-three/native'
import { useFrame, useLoader } from '@react-three/fiber'
import { useRef, useState, Suspense } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb'

function Model({ onLoad }: { onLoad: () => void }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const ref = useRef<any>(null)

  // Signal success on first render
  useState(() => {
    onLoad()
  })

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.5
      ref.current.rotation.y += delta * 0.3
    }
  })

  return <primitive ref={ref} object={gltf.scene} />
}

function FallbackBox() {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => (mesh.current.rotation.y += delta))
  return (
    <mesh ref={mesh}>
      <boxGeometry />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  )
}

function LoadingFallback() {
  return <FallbackBox />
}

export default function GLTFScreen() {
  const [status, setStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [error, setError] = useState('')

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={status}
        message={
          status === 'pass'
            ? 'GLTF model loaded and rendered'
            : status === 'fail'
              ? `GLTF load failed: ${error}`
              : 'Loading GLTF model...'
        }
      />
      <Text style={styles.url} numberOfLines={1}>
        {MODEL_URL}
      </Text>
      <TestErrorBoundary name="GLTF Loading">
        <Canvas style={{ flex: 1 }}>
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={<LoadingFallback />}>
            <Model onLoad={() => setStatus('pass')} />
          </Suspense>
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  url: { fontSize: 10, color: '#999', paddingHorizontal: 10, paddingVertical: 2 },
})
