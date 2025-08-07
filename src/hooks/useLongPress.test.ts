import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLongPress } from './useLongPress'

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onLongPress after specified delay', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onMouseDown({ clientX: 0, clientY: 0 } as any)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('calls onPress when released before long press threshold', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onMouseDown({ clientX: 0, clientY: 0 } as any)
    })

    act(() => {
      vi.advanceTimersByTime(300)
      result.current.onMouseUp()
    })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPress).toHaveBeenCalled()
  })

  it('cancels long press when mouse leaves', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onMouseDown({ clientX: 0, clientY: 0 } as any)
    })

    act(() => {
      result.current.onMouseLeave()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('cancels long press when moved significantly', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onMouseDown({ clientX: 0, clientY: 0 } as any)
    })

    act(() => {
      result.current.onMouseUp({ clientX: 20, clientY: 20 } as any)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('works with touch events', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as any)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('cancels touch long press on touch cancel', () => {
    const onLongPress = vi.fn()
    const onPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        onPress,
        ms: 500,
      })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as any)
    })

    act(() => {
      result.current.onTouchCancel()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('uses default 500ms delay when not specified', () => {
    const onLongPress = vi.fn()

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
      })
    )

    act(() => {
      result.current.onMouseDown({ clientX: 0, clientY: 0 } as any)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalled()
  })

  it('prevents default when preventDefault is true', () => {
    const onLongPress = vi.fn()
    const event = { preventDefault: vi.fn(), clientX: 0, clientY: 0 }

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        preventDefault: true,
      })
    )

    act(() => {
      result.current.onMouseDown(event as any)
    })

    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('does not prevent default when preventDefault is false', () => {
    const onLongPress = vi.fn()
    const event = { preventDefault: vi.fn(), clientX: 0, clientY: 0 }

    const { result } = renderHook(() =>
      useLongPress({
        onLongPress,
        preventDefault: false,
      })
    )

    act(() => {
      result.current.onMouseDown(event as any)
    })

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
