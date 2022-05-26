import {
  BeforeFileHash,
  ErrorFileHash,
  SuccessFileHash,
  ChangeFileHash,
  UploadAction,
  UploadData,
  Data,
  BeforeUploadChunk,
  SuccessUploadChunk,
  ErrorUploadChunk,
  MergeAction,
  MergeData,
  BeforeMergeChunk,
  SuccessMergeChunk,
  ErrorMergeChunk,
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

  /**
   * ========== hooks ==========
   */

  /**
   * ========== hask hooks ==========
   */
  beforeFileHash?: BeforeFileHash
  changeFileHash?: ChangeFileHash
  successFileHash?: SuccessFileHash
  errorFileHash?: ErrorFileHash

  /**
   * ========== upload chunk hooks ==========
   */
  beforeUploadChunk?: BeforeUploadChunk
  successUploadChunk?: SuccessUploadChunk
  errorUploadChunk?: ErrorUploadChunk

  /**
   * merge chunk hooks
   */
  beforeMergeChunk?: BeforeMergeChunk
  successMergeChunk?: SuccessMergeChunk
  errorMergeChunk?: ErrorMergeChunk

  name?: string
  mergeName?: string

  withCredentials?: boolean

  uploadAction?: UploadAction
  uploadData?: UploadData
  uploadHeaders?: Data
  uploadMethod?: string

  mergeAction?: MergeAction
  mergeData?: MergeData
  mergeHeaders?: Data
  mergeMethod?: string
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

  beforeUploadChunk: noop,
  successUploadChunk: noop,
  errorUploadChunk: noop,

  beforeMergeChunk: noop,
  successMergeChunk: noop,
  errorMergeChunk: noop,

  name: 'file',
  mergeName: 'fileHash',

  withCredentials: false,

  uploadAction: '',
  uploadData: {},
  uploadHeaders: {},
  uploadMethod: 'post',

  mergeAction: '',
  mergeData: {},
  mergeHeaders: {},
  mergeMethod: 'post',
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

const createMergeParams = (fileHash: string, name: string, data: Data) => {
  return { [name]: fileHash, ...data }
}

export const useSliceUpload = (options: SliceUploadOptions = {}) => {
  // merge options
  const {
    chunkSize,
    name,
    mergeName,
    withCredentials,

    uploadAction,
    uploadData,
    uploadHeaders,
    uploadMethod,

    mergeAction,
    mergeData,
    mergeHeaders,
    mergeMethod,

    beforeFileHash,
    successFileHash,
    changeFileHash,
    errorFileHash,

    beforeUploadChunk,
    successUploadChunk,
    errorUploadChunk,

    beforeMergeChunk,
    successMergeChunk,
    errorMergeChunk,
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

        // change filehash hook
        invokeHooks(changeFileHash, Hooks.CHANGE_FILE_HASH, {
          file,
          progress,
          index,
          chunks,
        })

        if (done) {
          invokeHooks(successFileHash, Hooks.SUCCESS_FILE_HASH, {
            fileHash: fileHash!,
            file,
            chunks,
          })
          return resolve(fileHash!)
        }
      })

      worker.addEventListener('messageerror', error => {
        // TODO:
        invokeHooks(errorFileHash, Hooks.ERROR_FILE_HASH, {
          file,
          chunks,
          error,
        })
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
    index: number,
    chunk: Blob
  ) => {
    const method = uploadMethod
    const url = isFunction(uploadAction)
      ? await uploadAction({ file, fileHash, chunk, index })
      : uploadAction

    const data = isFunction(uploadData)
      ? await uploadData({ file, fileHash, chunk, index })
      : createFormData(name, chunk, uploadData)

    invokeHooks(beforeUploadChunk, Hooks.BEFORE_UPLOAD_CHUNK, {
      file,
      fileHash,
      index,
      chunk,
    })

    try {
      const response = await request({
        url,
        data,
        method,
        withCredentials,
        headers: uploadHeaders,
      })

      invokeHooks(successUploadChunk, Hooks.SUCCESS_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        response,
      })

      return response
    } catch (error) {
      invokeHooks(errorUploadChunk, Hooks.ERROR_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        error,
      })
    }
  }

  /**
   * 开始上传
   */
  const startUpload = async (file: File, fileHash: string, chunks: Blob[]) => {
    const tasks = chunks.map((chunk, index) =>
      createUploadChunkTask(file, fileHash, index, chunk)
    )
    await Promise.all(tasks)
  }

  /**
   * 合并切片
   */
  const mergeChunks = async (file: File, fileHash: string) => {
    const method = mergeMethod
    const url = isFunction(mergeAction)
      ? await mergeAction({ file, fileHash })
      : mergeAction

    const data = isFunction(mergeData)
      ? await mergeData({ file, fileHash })
      : createMergeParams(fileHash, mergeName, mergeData)

    invokeHooks(beforeMergeChunk, Hooks.BEFORE_MERGE_CHUNK, { file, fileHash })

    try {
      const response = await request({
        url,
        method,
        data,
        withCredentials,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...mergeHeaders,
        },
      })

      invokeHooks(successMergeChunk, Hooks.SUCCESS_MERGE_CHUNK, {
        file,
        fileHash,
        response,
      })

      return response
    } catch (error) {
      invokeHooks(errorMergeChunk, Hooks.ERROR_MERGE_CHUNK, {
        file,
        fileHash,
        error,
      })
    }
  }

  /**
   * 开始上传
   */
  const start = async (file: File) => {
    // TODO: beforeUpload 校验文件
    const chunks = createChunks(file, chunkSize)
    const fileHash = await createFileHash(file, chunks)
    await startUpload(file, fileHash, chunks)
    await mergeChunks(file, fileHash)
  }

  return {
    start,
  }
}
