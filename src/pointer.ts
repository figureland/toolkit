import { signal, type Signal } from '@figureland/statekit'
import {
  allowEvent,
  createListener,
  isPointerEvent,
  type ListenerTarget,
  type PointerInteractionEvent
} from '@figureland/toolkit/dom'
import { vector2, type Vector2 } from '@figureland/mathkit/vector2'

export type { ListenerTarget, PointerInteractionEvent } from '@figureland/toolkit/dom'

export type PointerType = 'mouse' | 'pen' | 'touch'

export type PointerState = {
  button: number | null
  touchDistance: number
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  origin: Vector2
  delta: Vector2
  point: Vector2
  pinching: boolean
  pointerType: PointerType | null
  active: boolean
  hasDelta: boolean
}

export const defaultPointerState = (): PointerState => ({
  touchDistance: 0,
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  button: 0,
  point: vector2(),
  delta: vector2(),
  origin: vector2(),
  pinching: false,
  pointerType: null,
  active: false,
  hasDelta: false
})

type EventFilter = (event: PointerInteractionEvent, valid: boolean) => void

export type PointerOptions = {
  target?: ListenerTarget
  filterEvents?: EventFilter
  preventGestureDefault?: boolean
}

export const createPointer = ({
  target = window,
  filterEvents,
  preventGestureDefault = true
}: PointerOptions = {}): Pointer => {
  const state = signal(defaultPointerState)
  const prevent = (e: PointerInteractionEvent) => filterEvents?.(e, allowEvent(e))

  const onPointerDown = (e: PointerInteractionEvent) => {
    if (!isPointerEvent(e)) {
      return
    }

    const { button, pointerType, shiftKey, metaKey } = e
    prevent(e)

    state.set({
      button,
      metaKey,
      shiftKey,
      pointerType: pointerType as PointerType,
      delta: vector2(),
      origin: state.get().point,
      active: true
    })
  }

  const onPointerMove = (e: PointerInteractionEvent) => {
    if (!isPointerEvent(e)) {
      return
    }
    const { clientX, clientY, shiftKey, metaKey, ctrlKey, button } = e
    prevent(e)

    const point = vector2(clientX, clientY)

    const current = state.get()

    const delta = current.active
      ? vector2(point.x - current.point.x, point.y - current.point.y)
      : vector2()

    const hasDelta = delta.x !== 0 || delta.y !== 0

    state.set({
      button,
      metaKey,
      shiftKey,
      ctrlKey,
      point,
      delta,
      hasDelta
    })
  }

  const onPointerUp = (e: PointerInteractionEvent) => {
    prevent(e)
    state.set({
      button: null,
      delta: vector2(),
      pointerType: null,
      pinching: false,
      active: false,
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
      hasDelta: false
    })
  }
  state.use(createListener(target, 'wheel', prevent, { passive: false }))
  state.use(createListener(target, 'touchstart', prevent))
  state.use(createListener(target, 'pointermove', onPointerMove))
  state.use(createListener(target, 'pointerdown', onPointerDown))
  state.use(createListener(target, 'pointerup', onPointerUp))
  state.use(createListener(target, 'lostpointercapture', onPointerUp))

  if (preventGestureDefault) {
    state.use(createListener(document, 'gesturestart', prevent))
    state.use(createListener(document, 'gesturechange', prevent))
    state.use(createListener(document, 'gestureend', prevent))
  }

  return state
}

export type Pointer = Signal<PointerState>
