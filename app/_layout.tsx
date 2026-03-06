import '@react-three/native'
import * as THREE from 'three'
import { polyfills } from '@react-three/native'
polyfills(THREE)

import { Stack } from 'expo-router'

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
