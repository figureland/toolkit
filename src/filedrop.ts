import {
  type Events,
  type SignalRecord,
  createEvents,
  record,
  type Disposable
} from '@figureland/statekit'
import { isNotNullish } from '@figureland/typekit/guards'
import { createListener, type ListenerTarget } from '@figureland/toolkit/dom'

export type FileDropContent =
  | {
      files: File[]
    }
  | {
      text: string
    }

export type FileDropEvents = {
  drop: FileDropContent
  enter: boolean
  over: boolean
  leave: boolean
}

const initialState = {
  active: false,
  count: 0
}

export type FileDropOptions = {
  target?: ListenerTarget
  mimeTypes: string[]
  maxSize?: number
}

export type FileDropState = {
  active: boolean
  count: number
}

export const createFileDrop = ({
  target = window,
  mimeTypes,
  maxSize = 1024 * 64
}: FileDropOptions) => {
  const state = record<FileDropState>(initialState)
  const events = state.use(createEvents<FileDropEvents>())

  const reset = () => state.set(initialState)

  const onDragEnter = (event: DragEvent) =>
    filterEvent(event, (count) => {
      events.emit('enter', true)
      state.set({
        active: true,
        count
      })
    })

  const onDragLeave = (event: DragEvent) => {
    filterEvent(event, reset)
    events.emit('leave', true)
  }

  const onDragOver = (event: DragEvent) =>
    filterEvent(event, (count) => {
      events.emit('over', true)

      state.set({
        active: true,
        count
      })
    })

  const onDrop = (event: DragEvent) =>
    filterEvent(event, () => {
      reset()
      const result = getDropData(event)
      if (result) {
        events.emit('drop', result)
      }
    })

  const filterEvent = (event: DragEvent, fn: (count: number) => void) => {
    event.preventDefault()

    const text = event.dataTransfer?.getData('text/plain')
    const items = Array.from(event?.dataTransfer?.items || [])
    const types = items.map((i) => (i.kind === 'file' ? i.type : null)).filter(isNotNullish)

    if (
      !!event.dataTransfer &&
      mimeTypes.some((item) => types.includes(item)) &&
      items.length > 0
    ) {
      fn(items.length)
    } else if (text) {
      fn(1)
    } else {
      fn(0)
    }
  }

  const getDropData = (event: DragEvent): FileDropContent | void => {
    const text = event.dataTransfer?.getData('text/plain')
    const data = Array.from(event.dataTransfer?.files || [])
    const files = data.filter((file) => file.size <= maxSize)

    if (files.length > 0) {
      return { files }
    }
    if (text) {
      return { text }
    }
    return
  }

  state.use(events)
  state.use(createListener(target, 'dragenter', onDragEnter))
  state.use(createListener(target, 'dragleave', onDragLeave))
  state.use(createListener(target, 'dragover', onDragOver))
  state.use(createListener(target, 'drop', onDrop))

  return {
    dispose: state.dispose,
    state,
    events
  }
}

export type FileDrop = Disposable & {
  state: SignalRecord<FileDropState>
  events: Events<FileDropEvents>
}
