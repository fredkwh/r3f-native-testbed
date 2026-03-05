import { Canvas } from '@react-three/native'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { View } from 'react-native'
import { StatusBanner } from '../../components/StatusBanner'
import { TestErrorBoundary } from '../../components/ErrorBoundary'

function Box() {
  const mesh = useRef<any>(null)
  const [active, setActive] = useState(false)
  useFrame((_, delta) => (mesh.current.rotation.x += delta))
  return (
    <mesh ref={mesh} scale={active ? 1.5 : 1} onPress={() => setActive(!active)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={active ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

export default function BoxScreen() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBanner status="pass" message="Basic mesh, geometry, material, useFrame, lights" />
      <TestErrorBoundary name="Box">
        <Canvas>
          <ambientLight intensity={Math.PI / 2} />
          <pointLight position={[10, 10, 10]} />
          <Box />
        </Canvas>
      </TestErrorBoundary>
    </View>
  )
}
