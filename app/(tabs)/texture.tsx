import { Canvas, useNativeTexture } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

const TEXTURE_URL = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
// 2048x2048 remote texture for size limit test
const TEXTURE_URL_2K = 'https://threejs.org/examples/textures/brick_diffuse.jpg'

/** Procedural DataTexture — sync baseline (64x64) */
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

/** Procedural DataTexture at 2048x2048 — sync, tests GPU size limit */
function Procedural2kBox({ onStatus }: { onStatus: (s: string) => void }) {
  const mesh = useRef<any>(null)
  const texture = useMemo(() => {
    const size = 2048
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      const x = i % size
      const y = Math.floor(i / size)
      const checker = ((x >> 5) + (y >> 5)) % 2 === 0
      data[i * 4] = checker ? 255 : 30
      data[i * 4 + 1] = checker ? 100 : 200
      data[i * 4 + 2] = checker ? 50 : 255
      data[i * 4 + 3] = 255
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.needsUpdate = true
    onStatus(`sync 2048x2048 created`)
    return tex
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.3
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

/** Remote 2k texture via useNativeTexture — async, tests size limit + async path */
function NativeTexture2kBox({ onStatus }: { onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  const mesh = useRef<any>(null)
  const texture = useNativeTexture(
    TEXTURE_URL_2K,
    (tex) => {
      const img = tex.image as any
      onStatus('pass', `Loaded ${img?.width}x${img?.height}`)
    },
    (err) => {
      onStatus('fail', err.message)
    },
  )

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.x += delta * 0.3
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
  const [sync2kMsg, setSync2kMsg] = useState('loading...')
  const [async2kStatus, setAsync2kStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [async2kMsg, setAsync2kMsg] = useState('')

  return (
    <ScrollView style={{ flex: 1 }}>
      <StatusBanner
        status={proceduralStatus}
        message={`Procedural 64x64: ${proceduralStatus.toUpperCase()}`}
      />
      <StatusBanner
        status={remoteStatus}
        message={remoteMsg ? `Remote ~1k: ${remoteMsg}` : `Remote ~1k: ${remoteStatus.toUpperCase()}`}
      />
      <StatusBanner
        status={sync2kMsg.includes('created') ? 'pass' : 'loading'}
        message={`Sync 2048x2048: ${sync2kMsg}`}
      />
      <StatusBanner
        status={async2kStatus}
        message={async2kMsg ? `Async 2k: ${async2kMsg}` : `Async 2k: ${async2kStatus.toUpperCase()}`}
      />

      <View style={{ flexDirection: 'row', height: 250 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Procedural 64</Text>
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
          <Text style={styles.label}>Remote ~1k</Text>
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

      <View style={{ flexDirection: 'row', height: 250 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Sync 2048</Text>
          <TestErrorBoundary name="Sync 2k Texture">
            <Canvas style={{ flex: 1 }}>
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[5, 5, 5]} />
              <Procedural2kBox onStatus={setSync2kMsg} />
            </Canvas>
          </TestErrorBoundary>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Async 2k</Text>
          <TestErrorBoundary name="Async 2k Texture">
            <Canvas style={{ flex: 1 }}>
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[5, 5, 5]} />
              <NativeTexture2kBox
                onStatus={(s, msg) => {
                  setAsync2kStatus(s)
                  setAsync2kMsg(msg)
                }}
              />
            </Canvas>
          </TestErrorBoundary>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontSize: 12, color: '#666', paddingTop: 4 },
})
