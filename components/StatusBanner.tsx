import { View, Text, StyleSheet } from 'react-native'

type Status = 'pass' | 'fail' | 'loading' | 'info'

export function StatusBanner({ status, message }: { status: Status; message: string }) {
  const colors: Record<Status, string> = {
    pass: '#2e7d32',
    fail: '#c62828',
    loading: '#f57f17',
    info: '#1565c0',
  }
  return (
    <View style={[styles.banner, { backgroundColor: colors[status] }]}>
      <Text style={styles.text}>
        {status === 'pass' && 'PASS: '}
        {status === 'fail' && 'FAIL: '}
        {status === 'loading' && 'LOADING: '}
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, paddingHorizontal: 12 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
