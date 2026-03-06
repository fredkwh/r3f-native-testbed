import { Canvas, useNativeGLTF } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, Suspense } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

// BoxTextured.glb — geometry + embedded UV texture (working)
const TEXTURED_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxTextured/glTF-Binary/BoxTextured.glb'

// DamagedHelmet.glb — complex PBR model (known limitation: PBR textures render black on expo-gl)
const HELMET_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'

function RotatingModel({ url, onStatus }: { url: string; onStatus: (s: 'pass' | 'fail', msg: string) => void }) {
  const gltf = useNativeGLTF(url)
  const ref = useRef<any>(null)

  useState(() => {
    const textures: string[] = []
    gltf.scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mat = child.material
        if (mat.map) textures.push(`map:${mat.map.image?.width}x${mat.map.image?.height}`)
        if (mat.normalMap) textures.push('normalMap')
        if (mat.emissiveMap) textures.push('emissiveMap')
        if (mat.aoMap) textures.push('aoMap')
        if (mat.metalnessMap) textures.push('metalnessMap')
      }
    })
    const msg = textures.length > 0
      ? `${textures.length} textures: ${textures.join(', ')}`
      : 'No textures (geometry only)'
    onStatus('pass', msg)
  })

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
    }
  })

  return <primitive ref={ref} object={gltf.scene} scale={url === HELMET_URL ? 1.5 : 1} />
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

type ModelKey = 'textured' | 'helmet'
const models: { key: ModelKey; label: string; url: string; note?: string }[] = [
  { key: 'textured', label: 'BoxTextured', url: TEXTURED_URL },
  { key: 'helmet', label: 'Helmet (limited)', url: HELMET_URL, note: 'PBR textures black — expo-gl limitation' },
]

export default function GLTFScreen() {
  const [active, setActive] = useState<ModelKey>('textured')
  const [status, setStatus] = useState<'loading' | 'pass' | 'fail'>('loading')
  const [msg, setMsg] = useState('')

  const activeModel = models.find((m) => m.key === active)!

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={status}
        message={
          status === 'pass'
            ? `${activeModel.label}: ${msg}`
            : status === 'fail'
              ? `Failed: ${msg}`
              : `Loading ${activeModel.label}...`
        }
      />
      {activeModel.note && (
        <Text style={styles.note}>{activeModel.note}</Text>
      )}
      <View style={styles.buttons}>
        {models.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.btn, active === m.key && styles.btnActive]}
            onPress={() => {
              setActive(m.key)
              setStatus('loading')
              setMsg('')
            }}
          >
            <Text style={[styles.btnText, active === m.key && styles.btnTextActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TestErrorBoundary name="GLTF Loading" key={active}>
        <Canvas style={{ flex: 1 }}>
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={<FallbackBox />}>
            <RotatingModel
              url={activeModel.url}
              onStatus={(s, m) => {
                setStatus(s)
                setMsg(m)
              }}
            />
          </Suspense>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  btnActive: {
    backgroundColor: '#1976d2',
  },
  btnText: {
    fontSize: 12,
    color: '#666',
  },
  btnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
    color: '#e65100',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#fff3e0',
  },
})
