import { Canvas, useNativeTexture } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

const TEXTURE_URL = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'

/** Procedural DataTexture — sync baseline */
function ProceduralBox() {
  const mesh = useRef<any>(null)
  const texture = useMemo(() => {
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
    return tex
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

/** Remote texture via useNativeTexture hook */
function NativeTextureBox({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  const mesh = useRef<any>(null)
  const texture = useNativeTexture(
    TEXTURE_URL,
    (tex) => {
      const img = tex.image as any
      onStatus('pass', `Loaded ${img?.width}x${img?.height}`)
    },
    (err) => {
      onStatus('fail', err.message)
    },
  )

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.x += delta * 0.5
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

export default function TextureScreen() {
  const [proceduralStatus, setProceduralStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [remoteMsg, setRemoteMsg] = useState('')

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={proceduralStatus}
        message={`Procedural DataTexture: ${proceduralStatus.toUpperCase()}`}
      />
      <StatusBanner
        status={remoteStatus}
        message={remoteMsg ? `useNativeTexture: ${remoteMsg}` : `useNativeTexture: ${remoteStatus.toUpperCase()}`}
      />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Procedural</Text>
          <TestErrorBoundary name="Procedural Texture">
            <Canvas
              style={{ flex: 1 }}
              onCreated={() => setProceduralStatus('pass')}
            >
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[5, 5, 5]} />
              <ProceduralBox />
            </Canvas>
          </TestErrorBoundary>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>useNativeTexture</Text>
          <TestErrorBoundary name="Native Texture">
            <Canvas style={{ flex: 1 }}>
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[5, 5, 5]} />
              <NativeTextureBox
                onStatus={(s, msg) => {
                  setRemoteStatus(s)
                  setRemoteMsg(msg)
                }}
              />
            </Canvas>
          </TestErrorBoundary>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontSize: 12, color: '#666', paddingTop: 4 },
})
