import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Box', icon: 'cube-outline' },
  { name: 'touch', title: 'Touch', icon: 'hand-left-outline' },
  { name: 'texture', title: 'Texture', icon: 'image-outline' },
  { name: 'gltf', title: 'GLTF', icon: 'download-outline' },
  { name: 'resize', title: 'Resize', icon: 'resize-outline' },
  { name: 'lifecycle', title: 'Mount', icon: 'refresh-outline' },
  { name: 'multi', title: 'Multi', icon: 'copy-outline' },
]

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1976d2',
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: { height: 80, paddingBottom: 20 },
        headerStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size - 4} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
