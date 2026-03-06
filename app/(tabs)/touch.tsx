import { Canvas } from '@react-three/native'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { useRef, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function TouchMesh({
  position,
  color,
  name,
  onEvent,
}: {
  position: [number, number, number]
  color: string
  name: string
  onEvent: (name: string, meshName: string) => void
}) {
  const mesh = useRef<any>(null)
  const [currentColor, setCurrentColor] = useState(color)
  useFrame((_, delta) => (mesh.current.rotation.y += delta * 0.3))

  return (
    <mesh
      ref={mesh}
      position={position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onEvent('onClick', name)
        setCurrentColor('lime')
        setTimeout(() => setCurrentColor(color), 300)
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onEvent('onPointerDown', name)
        setCurrentColor('red')
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onEvent('onPointerUp', name)
        setCurrentColor('green')
        setTimeout(() => setCurrentColor(color), 300)
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onEvent('onPointerOver', name)
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onEvent('onPointerOut', name)
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={currentColor} />
    </mesh>
  )
}

export default function TouchScreen() {
  const [events, setEvents] = useState<string[]>([])
  const eventCount = useRef(0)
  const [clickedMeshes, setClickedMeshes] = useState<Set<string>>(new Set())

  const handleEvent = useCallback((eventName: string, meshName: string) => {
    eventCount.current++
    setEvents((prev) => [`#${eventCount.current} ${meshName}.${eventName}`, ...prev.slice(0, 29)])
    if (eventName === 'onClick') {
      setClickedMeshes((prev) => new Set(prev).add(meshName))
    }
  }, [])

  const allThreeClicked = clickedMeshes.size === 3

  return (
    <View style={{ flex: 1 }}>
      <StatusBanner
        status={allThreeClicked ? 'pass' : events.length > 0 ? 'info' : 'info'}
        message={
          allThreeClicked
            ? 'Raycasting works — all 3 meshes received targeted clicks'
            : events.length > 0
              ? `${clickedMeshes.size}/3 meshes clicked — tap each cube`
              : 'Tap each of the 3 cubes to test raycasting'
        }
      />
      <TestErrorBoundary name="Touch Events">
        <View style={{ flex: 1 }}>
          <Canvas style={{ flex: 1 }}>
            <ambientLight intensity={Math.PI / 2} />
            <pointLight position={[10, 10, 10]} />
            <TouchMesh position={[-2, 0, 0]} color="dodgerblue" name="Left" onEvent={handleEvent} />
            <TouchMesh position={[0, 0, 0]} color="orange" name="Center" onEvent={handleEvent} />
            <TouchMesh position={[2, 0, 0]} color="mediumpurple" name="Right" onEvent={handleEvent} />
          </Canvas>
        </View>
      </TestErrorBoundary>
      <View style={styles.log}>
        <Text style={styles.logTitle}>Event Log (mesh.event):</Text>
        <ScrollView style={{ maxHeight: 120 }}>
          {events.map((e, i) => (
            <Text key={i} style={styles.logEntry}>{e}</Text>
          ))}
          {events.length === 0 && <Text style={styles.logEntry}>No events yet</Text>}
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
