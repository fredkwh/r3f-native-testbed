import { Canvas, useNativeTexture } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import * as THREE from 'three'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

const TEXTURE_URL = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
const TEXTURE_URL_2K = 'https://threejs.org/examples/textures/brick_diffuse.jpg'

// 10 different texture URLs for the multi-texture stress test
const MULTI_TEXTURE_URLS = [
  'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
  'https://threejs.org/examples/textures/brick_diffuse.jpg',
  'https://threejs.org/examples/textures/hardwood2_diffuse.jpg',
  'https://threejs.org/examples/textures/water.jpg',
  'https://threejs.org/examples/textures/sprite0.png',
  'https://threejs.org/examples/textures/crate.gif', // will fail — not JPEG/PNG, tests error handling
  'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg',
  'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
  'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
]

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
  const [texture, isLoading, error] = useNativeTexture(
    TEXTURE_URL,
    (tex: any) => {
      const img = tex.image
      onStatus('pass', `Loaded ${img?.width}x${img?.height}`)
    },
    (err: Error) => {
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
  const [texture, isLoading, error] = useNativeTexture(
    TEXTURE_URL_2K,
    (tex: any) => {
      const img = tex.image
      onStatus('pass', `Loaded ${img?.width}x${img?.height}`)
    },
    (err: Error) => {
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

/** Single cube in the multi-texture grid */
function MultiTextureCube({ url, index, onResult }: {
  url: string
  index: number
  onResult: (i: number, status: 'pass' | 'fail', msg: string) => void
}) {
  const mesh = useRef<any>(null)
  const reportedRef = useRef(false)
  const [texture, isLoading, error] = useNativeTexture(url)

  const cols = 5
  const x = (index % cols) * 1.2 - ((cols - 1) * 1.2) / 2
  const y = Math.floor(index / cols) * 1.2 - 0.6

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.3

    if (!reportedRef.current) {
      if (error) {
        reportedRef.current = true
        onResult(index, 'fail', `#${index}: ${error.message.slice(0, 40)}`)
      } else if (!isLoading) {
        reportedRef.current = true
        const img = (texture.image as any)
        onResult(index, 'pass', `#${index}: ${img?.width}x${img?.height}`)
      }
    }
  })

  return (
    <mesh ref={mesh} position={[x, y, 0]}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial map={texture} color={error ? 'red' : 'white'} />
    </mesh>
  )
}

function MultiTextureScene({ onResult }: {
  onResult: (i: number, status: 'pass' | 'fail', msg: string) => void
}) {
  return (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[5, 5, 5]} />
      {MULTI_TEXTURE_URLS.map((url, i) => (
        <MultiTextureCube key={i} url={url} index={i} onResult={onResult} />
      ))}
    </>
  )
}

type Tab = 'basic' | 'multi'

export default function TextureScreen() {
  const [tab, setTab] = useState<Tab>('basic')
  const [proceduralStatus, setProceduralStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [remoteMsg, setRemoteMsg] = useState('')
  const [sync2kMsg, setSync2kMsg] = useState('loading...')
  const [async2kStatus, setAsync2kStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [async2kMsg, setAsync2kMsg] = useState('')
  const [multiResults, setMultiResults] = useState<Record<number, { status: 'pass' | 'fail'; msg: string }>>({})

  const multiDone = Object.keys(multiResults).length
  const multiFailed = Object.values(multiResults).filter((r) => r.status === 'fail').length

  const handleMultiResult = (i: number, status: 'pass' | 'fail', msg: string) => {
    setMultiResults((prev) => {
      if (prev[i]) return prev
      console.log(`[MultiTex] ${msg}`)
      return { ...prev, [i]: { status, msg } }
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'basic' && styles.tabActive]} onPress={() => setTab('basic')}>
          <Text style={[styles.tabText, tab === 'basic' && styles.tabTextActive]}>Basic</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'multi' && styles.tabActive]} onPress={() => setTab('multi')}>
          <Text style={[styles.tabText, tab === 'multi' && styles.tabTextActive]}>10 Textures</Text>
        </Pressable>
      </View>

      {tab === 'basic' ? (
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
      ) : (
        <View style={{ flex: 1 }}>
          <StatusBanner
            status={multiDone === 10 ? (multiFailed > 1 ? 'fail' : 'pass') : 'loading'}
            message={`10 textures: ${multiDone}/10 done, ${multiFailed} errors (1 expected: .gif)`}
          />
          <TestErrorBoundary name="Multi Texture">
            <Canvas camera={{ position: [0, 0, 5] }} style={{ flex: 1 }}>
              <MultiTextureScene onResult={handleMultiResult} />
            </Canvas>
          </TestErrorBoundary>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontSize: 12, color: '#666', paddingTop: 4 },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#1976d2',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
})
