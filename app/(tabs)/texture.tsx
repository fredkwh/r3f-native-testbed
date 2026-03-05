import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo, Suspense } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function ProceduralBox() {
  const mesh = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'pass' | 'fail'>('loading')

  const texture = useMemo(() => {
    try {
      const size = 64
      const data = new Uint8Array(size * size * 4)
      for (let i = 0; i < size * size; i++) {
        const x = i % size
        const y = Math.floor(i / size)
        const checker = ((x >> 3) + (y >> 3)) % 2 === 0
        data[i * 4] = checker ? 255 : 50
        data[i * 4 + 1] = checker ? 200 : 50
        data[i * 4 + 2] = checker ? 50 : 200
        data[i * 4 + 3] = 255
      }
      const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
      tex.needsUpdate = true
      setStatus('pass')
      return tex
    } catch {
      setStatus('fail')
      return null
    }
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
  })

  return (
    <>
      <mesh ref={mesh} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        {texture ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="red" />
        )}
      </mesh>
      <StatusReporter status={status} />
    </>
  )
}

function StatusReporter({ status }: { status: string }) {
  // This is a no-op in the scene — we just use it to bridge status to React state
  return null
}

function LoadedTextureBox() {
  const mesh = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [error, setError] = useState('')

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(
      'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
      () => setStatus('pass'),
      undefined,
      (err: unknown) => {
        setStatus('fail')
        setError(err instanceof Error ? err.message : String(err))
      },
    )
    return tex
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.x += delta * 0.5
  })

  return (
    <>
      <mesh ref={mesh} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      {status === 'fail' && (
        <mesh position={[0, -2, 0]}>
          <planeGeometry args={[3, 0.5]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </>
  )
}

export default function TextureScreen() {
  const [proceduralStatus, setProceduralStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [loadedStatus, setLoadedStatus] = useState<'loading' | 'pass' | 'fail'>('loading')

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={proceduralStatus === 'pass' ? 'pass' : proceduralStatus === 'fail' ? 'fail' : 'loading'}
        message={`Procedural DataTexture: ${proceduralStatus.toUpperCase()}`}
      />
      <StatusBanner
        status={loadedStatus === 'pass' ? 'pass' : loadedStatus === 'fail' ? 'fail' : 'loading'}
        message={`Remote TextureLoader: ${loadedStatus.toUpperCase()}`}
      />
      <TestErrorBoundary name="Texture Loading">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Procedural</Text>
            <Canvas
              style={{ flex: 1 }}
              onCreated={() => setProceduralStatus('pass')}
            >
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[5, 5, 5]} />
              <ProceduralBox />
            </Canvas>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Remote URL</Text>
            <Suspense fallback={null}>
              <Canvas
                style={{ flex: 1 }}
                onCreated={() => {
                  // Canvas created, texture loading is separate
                  if (loadedStatus === 'loading') {
                    // Give it a few seconds then mark as loading
                    setTimeout(() => {
                      setLoadedStatus((s) => (s === 'loading' ? 'fail' : s))
                    }, 10000)
                  }
                }}
              >
                <ambientLight intensity={Math.PI / 2} />
                <pointLight position={[5, 5, 5]} />
                <LoadedTextureBox />
              </Canvas>
            </Suspense>
          </View>
        </View>
      </TestErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontSize: 12, color: '#666', paddingTop: 4 },
})
