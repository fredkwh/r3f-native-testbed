import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type Props = { children: React.ReactNode; name: string }
type State = { error: Error | null }

export class TestErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>FAIL: {this.props.name}</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffebee', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#c62828', marginBottom: 10 },
  message: { fontSize: 14, color: '#333', textAlign: 'center' },
})
