import {
  BeforeFileHash,
  ErrorFileHash,
  SuccessFileHash,
  ChangeFileHash,
  UploadAction,
  UploadData,
  Data,
} from './interface'
import { FileHashToMain, FileHashToWorker } from './internal-interface'
import {
  forEach,
  Hooks,
  invokeHooks,
  isFunction,
  merge,
  request,
} from './utils'
import FileHashWorker from './worker.js?worker'

export interface SliceUploadOptions {
  chunkSize?: number
  concurrentMax?: number

  beforeFileHash?: BeforeFileHash
  changeFileHash?: ChangeFileHash
  successFileHash?: SuccessFileHash
  errorFileHash?: ErrorFileHash

  name?: string

  withCredentials?: boolean

  uploadAction?: UploadAction
  uploadData?: UploadData
  uploadHeaders?: Data
  uploadMethod?: string
}

export type MergeSliceUploadOptions = Required<SliceUploadOptions>

// 10M
const CHUNK_SIZE = 1024 * 1024 * 10

// eslint-disable-next-line
const noop = () => {}

const defaultOptions: MergeSliceUploadOptions = {
  chunkSize: CHUNK_SIZE,
  concurrentMax: 2,

  beforeFileHash: noop,
  changeFileHash: noop,
  successFileHash: noop,
  errorFileHash: noop,

  name: '',

  withCredentials: false,

  uploadAction: '',
  uploadData: {},
  uploadHeaders: {},
  uploadMethod: 'post',
}

const createFormData = (name: string, chunk: Blob, data?: Data) => {
  const fd = new FormData()
  fd.append(name, chunk)
  if (data) {
    forEach(Object.keys(data), key => {
      fd.append(key, data[key])
    })
  }
  return fd
}

export const useSliceUpload = (options: SliceUploadOptions = {}) => {
  // merge options
  const {
    chunkSize,
    beforeFileHash,
    successFileHash,
    changeFileHash,

    name,
    withCredentials,

    uploadAction,
    uploadData,
    uploadHeaders,
    uploadMethod,
  } = merge({}, defaultOptions, options) as MergeSliceUploadOptions

  /**
   * 创建文件切片
   */
  const createChunks = (file: File, chunkSize: number) => {
    let currentSize = 0
    const chunks: Blob[] = []
    const total = file.size

    while (currentSize < total) {
      chunks.push(file.slice(currentSize, currentSize + chunkSize))
      currentSize += chunkSize
    }
    return chunks
  }

  /**
   * 计算文件 hash
   */
  const createFileHash = async (file: File, chunks: Blob[]) => {
    return new Promise<string>((resolve, reject) => {
      // before filehash hook
      invokeHooks(beforeFileHash, Hooks.BEFORE_FILE_HASH, file, chunks)

      const worker = new FileHashWorker()
      worker.addEventListener('message', e => {
        const { fileHash, progress, index, done } = e.data as FileHashToMain

        if (done) {
          invokeHooks(successFileHash, Hooks.SUCCESS_FILE_HASH, {
            fileHash: fileHash!,
            file,
            chunks,
          })
          return resolve(fileHash!)
        }

        // change filehash hook
        invokeHooks(changeFileHash, Hooks.CHANGE_FILE_HASH, {
          file,
          progress,
          index,
          chunks,
        })
      })

      worker.addEventListener('messageerror', () => {
        // TODO:
        reject()
      })

      const data: FileHashToWorker = { chunks }
      worker.postMessage(data)
    })
  }

  /**
   * 创建切片的上传任务
   */
  const createUploadChunkTask = async (
    file: File,
    fileHash: string,
    chunk: Blob
  ) => {
    const method = uploadMethod
    const url = isFunction(uploadAction)
      ? await uploadAction({ file, fileHash, chunk })
      : uploadAction
    const data = isFunction(uploadData)
      ? await uploadData({ file, fileHash, chunk })
      : createFormData(name, chunk, uploadData)

    return request({
      url,
      data,
      method,
      responseType: 'blob',
      withCredentials,
    })
  }

  /**
   * 开始上传
   */
  const start = async (file: File) => {
    // TODO: beforeUpload 校验文件
    const chunks = createChunks(file, chunkSize)
    const fileHash = await createFileHash(file, chunks)
    const tasks = chunks.map(chunk =>
      createUploadChunkTask(file, fileHash, chunk)
    )
    console.log('fileHash: ', fileHash)
  }

  return {
    start,
  }
}
