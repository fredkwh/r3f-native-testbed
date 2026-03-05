import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
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

export default function LifecycleScreen() {
  const [mounted, setMounted] = useState(true)
  const [mountCount, setMountCount] = useState(0)
  const [unmountCount, setUnmountCount] = useState(0)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev.slice(0, 14)])
  }

  const toggle = () => {
    setMounted((m) => !m)
  }

  return (
    <View style={{ flex: 1 }}>
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
          onPress={toggle}
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
      <View style={styles.log}>
        <Text style={styles.logTitle}>Lifecycle Log:</Text>
        {log.map((entry, i) => (
          <Text key={i} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  counters: { flex: 1 },
  counter: { fontSize: 13, color: '#333' },
  unmounted: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  unmountedText: { fontSize: 16, color: '#999' },
  log: { backgroundColor: '#1a1a2e', padding: 10, maxHeight: 150 },
  logTitle: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  logEntry: { color: '#4fc3f7', fontSize: 12, fontFamily: 'Courier' },
})
