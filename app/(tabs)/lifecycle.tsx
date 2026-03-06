import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect, Suspense } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function SpinningBox({ color, onMount, onUnmount }: { color: string; onMount: () => void; onUnmount: () => void }) {
  const mesh = useRef<any>(null)

  useEffect(() => {
    onMount()
    return () => onUnmount()
  }, [])

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.x += delta
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Simulates an async resource load by throwing a promise
const suspenseCache = new Map<string, { resolved: boolean; promise: Promise<void> }>()

function AsyncMesh({ id, delay, onResolved }: { id: string; delay: number; onResolved: () => void }) {
  let entry = suspenseCache.get(id)
  if (!entry) {
    let resolve: () => void
    const promise = new Promise<void>((r) => {
      resolve = r
    })
    entry = { resolved: false, promise }
    suspenseCache.set(id, entry)
    setTimeout(() => {
      entry!.resolved = true
      resolve!()
      onResolved()
    }, delay)
  }
  if (!entry.resolved) {
    throw entry.promise
  }

  const mesh = useRef<any>(null)
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta
  })

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="gold" />
    </mesh>
  )
}

function SuspenseFallback() {
  const mesh = useRef<any>(null)
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.z += delta * 2
  })
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  )
}

type TestMode = 'lifecycle' | 'suspense'

export default function LifecycleScreen() {
  const [mode, setMode] = useState<TestMode>('lifecycle')
  const [mounted, setMounted] = useState(true)
  const [mountCount, setMountCount] = useState(0)
  const [unmountCount, setUnmountCount] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [suspenseKey, setSuspenseKey] = useState(0)
  const [suspenseStatus, setSuspenseStatus] = useState<'loading' | 'pass'>('loading')

  const addLog = (msg: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev.slice(0, 14)])
  }

  const resetSuspense = () => {
    suspenseCache.clear()
    setSuspenseKey((k) => k + 1)
    setSuspenseStatus('loading')
    addLog('Suspense test reset — showing fallback')
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.modeButtons}>
        <Pressable
          style={[styles.modeBtn, mode === 'lifecycle' && styles.modeBtnActive]}
          onPress={() => setMode('lifecycle')}
        >
          <Text style={[styles.modeBtnText, mode === 'lifecycle' && styles.modeBtnTextActive]}>
            Lifecycle
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === 'suspense' && styles.modeBtnActive]}
          onPress={() => { setMode('suspense'); resetSuspense() }}
        >
          <Text style={[styles.modeBtnText, mode === 'suspense' && styles.modeBtnTextActive]}>
            Suspense
          </Text>
        </Pressable>
      </View>

      {mode === 'lifecycle' ? (
        <>
          <StatusBanner
            status={mountCount > 1 ? 'pass' : 'info'}
            message={
              mountCount > 1
                ? `${mountCount} mounts, ${unmountCount} unmounts — lifecycle works`
                : 'Tap to unmount and remount the Canvas'
            }
          />
          <View style={styles.controls}>
            <Pressable
              style={[styles.button, { backgroundColor: mounted ? '#c62828' : '#2e7d32' }]}
              onPress={() => setMounted((m) => !m)}
            >
              <Text style={styles.buttonText}>{mounted ? 'Unmount Canvas' : 'Mount Canvas'}</Text>
            </Pressable>
            <View style={styles.counters}>
              <Text style={styles.counter}>Mounts: {mountCount}</Text>
              <Text style={styles.counter}>Unmounts: {unmountCount}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {mounted ? (
              <TestErrorBoundary name="Lifecycle">
                <Canvas style={{ flex: 1 }}>
                  <ambientLight intensity={Math.PI / 2} />
                  <pointLight position={[10, 10, 10]} />
                  <SpinningBox
                    color="teal"
                    onMount={() => {
                      setMountCount((c) => c + 1)
                      addLog('Canvas MOUNTED')
                    }}
                    onUnmount={() => {
                      setUnmountCount((c) => c + 1)
                      addLog('Canvas UNMOUNTED')
                    }}
                  />
                </Canvas>
              </TestErrorBoundary>
            ) : (
              <View style={styles.unmounted}>
                <Text style={styles.unmountedText}>Canvas is unmounted</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <StatusBanner
            status={suspenseStatus}
            message={
              suspenseStatus === 'pass'
                ? 'Suspense resolved — gold cube rendered after 2s delay'
                : 'Suspense fallback showing (gray wireframe) — resolves in 2s...'
            }
          />
          <Pressable style={styles.resetBtn} onPress={resetSuspense}>
            <Text style={styles.buttonText}>Reset Suspense Test</Text>
          </Pressable>
          <TestErrorBoundary name="Suspense">
            <Canvas style={{ flex: 1 }} key={`suspense-${suspenseKey}`}>
              <ambientLight intensity={Math.PI / 2} />
              <pointLight position={[10, 10, 10]} />
              <Suspense fallback={<SuspenseFallback />}>
                <AsyncMesh
                  id={`test-${suspenseKey}`}
                  delay={2000}
                  onResolved={() => {
                    setSuspenseStatus('pass')
                    addLog('Suspense RESOLVED — async mesh rendered')
                  }}
                />
              </Suspense>
            </Canvas>
          </TestErrorBoundary>
        </>
      )}

      <View style={styles.log}>
        <Text style={styles.logTitle}>Log:</Text>
        {log.map((entry, i) => (
          <Text key={i} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  modeBtnActive: { backgroundColor: '#1976d2' },
  modeBtnText: { fontSize: 13, color: '#666' },
  modeBtnTextActive: { color: '#fff', fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  counters: { flex: 1 },
  counter: { fontSize: 13, color: '#333' },
  unmounted: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  unmountedText: { fontSize: 16, color: '#999' },
  resetBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  log: { backgroundColor: '#1a1a2e', padding: 10, maxHeight: 120 },
  logTitle: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  logEntry: { color: '#4fc3f7', fontSize: 12, fontFamily: 'Courier' },
})
