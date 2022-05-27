import { Chunk } from './helpers'

export interface FileHashToWorker {
  chunks: Chunk[]
}

export interface FileHashToMain {
  done: boolean
  progress: number
  index: number
  fileHash?: string
  error?: unknown
}
