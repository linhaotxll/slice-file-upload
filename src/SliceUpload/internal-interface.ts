import { Chunk } from './helpers'
import {
  CustomMergeRequestOptions,
  CustomUploadRequestOptions,
} from './interface'

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

export interface InternalCustomUploadRequest<T = unknown>
  extends CustomUploadRequestOptions<T> {
  onBefore: () => void
}

export interface InternalMergeUploadRequest<R = unknown>
  extends CustomMergeRequestOptions<R> {
  onBefore: () => void
}
