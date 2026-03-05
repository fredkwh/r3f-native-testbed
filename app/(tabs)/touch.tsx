import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function TouchBox({ onEvent }: { onEvent: (name: string) => void }) {
  const mesh = useRef<any>(null)
  const [color, setColor] = useState('dodgerblue')
  useFrame((_, delta) => (mesh.current.rotation.y += delta * 0.5))

  return (
    <mesh
      ref={mesh}
      onClick={() => {
        onEvent('onClick')
        setColor('lime')
      }}
      onPointerDown={() => {
        onEvent('onPointerDown')
        setColor('red')
      }}
      onPointerUp={() => {
        onEvent('onPointerUp')
        setColor('green')
      }}
      onPointerOver={() => onEvent('onPointerOver')}
      onPointerOut={() => onEvent('onPointerOut')}
      onPointerMove={() => onEvent('onPointerMove')}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function TouchScreen() {
  const [events, setEvents] = useState<string[]>([])
  const eventCount = useRef(0)

  const handleEvent = useCallback((name: string) => {
    eventCount.current++
    setEvents((prev) => [`#${eventCount.current} ${name}`, ...prev.slice(0, 19)])
  }, [])

  const hasEvents = events.length > 0

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={hasEvents ? 'pass' : 'info'}
        message={hasEvents ? `${events.length} events captured — tap the cube` : 'Tap the cube to test touch events'}
      />
      <TestErrorBoundary name="Touch Events">
        <View style={{ flex: 1 }}>
          <Canvas style={{ flex: 1 }}>
            <ambientLight intensity={Math.PI / 2} />
            <pointLight position={[10, 10, 10]} />
            <TouchBox onEvent={handleEvent} />
          </Canvas>
        </View>
      </TestErrorBoundary>
      <View style={styles.log}>
        <Text style={styles.logTitle}>Event Log:</Text>
        <ScrollView style={{ maxHeight: 120 }}>
          {events.map((e, i) => (
            <Text key={i} style={styles.logEntry}>{e}</Text>
          ))}
          {!hasEvents && <Text style={styles.logEntry}>No events yet</Text>}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  log: { backgroundColor: '#1a1a2e', padding: 10 },
  logTitle: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  logEntry: { color: '#4fc3f7', fontSize: 12, fontFamily: 'Courier' },
})
