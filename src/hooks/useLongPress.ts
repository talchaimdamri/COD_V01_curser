import { useCallback, useRef } from 'react'
import type React from 'react'

interface UseLongPressOptions {
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void
  onPress?: () => void
  ms?: number
  preventDefault?: boolean
}

export const useLongPress = ({
  onLongPress,
  onPress,
  ms = 500,
  preventDefault = true,
}: UseLongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (preventDefault) {
        const maybePrevent = (event as any)?.preventDefault
        if (typeof maybePrevent === 'function') {
          maybePrevent.call(event)
        }
      }

      isLongPressRef.current = false
      startPosRef.current = {
        x: 'touches' in event ? event.touches[0].clientX : event.clientX,
        y: 'touches' in event ? event.touches[0].clientY : event.clientY,
      }

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress(event)
      }, ms)
    },
    [onLongPress, ms, preventDefault]
  )

  const stop = useCallback(
    (event?: React.MouseEvent | React.TouchEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // Check if mouse/touch moved significantly
      if (event && startPosRef.current) {
        const currentPos = {
          x: 'touches' in event ? event.touches[0].clientX : event.clientX,
          y: 'touches' in event ? event.touches[0].clientY : event.clientY,
        }

        const distance = Math.sqrt(
          Math.pow(currentPos.x - startPosRef.current.x, 2) +
            Math.pow(currentPos.y - startPosRef.current.y, 2)
        )

        // If moved more than 10px, don't trigger press
        if (distance > 10) {
          isLongPressRef.current = false
          return
        }
      }

      // If it wasn't a long press and we have a press handler, call it
      if (!isLongPressRef.current && onPress) {
        onPress()
      }

      startPosRef.current = null
    },
    [onPress]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    isLongPressRef.current = false
    startPosRef.current = null
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: cancel,
  }
}
