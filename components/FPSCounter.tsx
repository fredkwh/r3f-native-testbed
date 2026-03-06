import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'

const SAMPLE_SIZE = 60
const LOG_INTERVAL = 5000

/**
 * FPS counter that runs inside the R3F render loop.
 * Calls onFPS with the rolling average FPS every SAMPLE_SIZE frames.
 * Logs to console every 5 seconds with FPS + optional label.
 */
export function FPSCounter({ onFPS, label }: { onFPS: (fps: number) => void; label?: string }) {
  const frameTimes = useRef<number[]>([])
  const lastLogTime = useRef(0)
  const onFPSRef = useRef(onFPS)
  onFPSRef.current = onFPS

  useFrame(() => {
    const now = performance.now()
    const times = frameTimes.current

    if (times.length > 0) {
      const delta = now - times[times.length - 1]
      if (delta > 0) {
        times.push(now)
        if (times.length > SAMPLE_SIZE) times.shift()

        if (times.length >= 2) {
          const elapsed = now - times[0]
          const fps = Math.round(((times.length - 1) / elapsed) * 1000)
          onFPSRef.current(fps)

          if (now - lastLogTime.current > LOG_INTERVAL) {
            lastLogTime.current = now
            const memInfo = (performance as any).memory
              ? ` | mem: ${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB`
              : ''
            console.log(`[Perf${label ? ` ${label}` : ''}] FPS: ${fps}${memInfo}`)
          }
        }
      }
    } else {
      times.push(now)
      lastLogTime.current = now
    }
  })

  return null
}
