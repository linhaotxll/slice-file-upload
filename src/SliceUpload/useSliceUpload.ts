import { Chunk } from './helpers'
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
  ProgressUploadChunk,
  Status,
} from './interface'
import { FileHashToMain, FileHashToWorker } from './internal-interface'
import {
  Hooks,
  callWithErrorHandling,
  isFunction,
  merge,
  useRequest,
  callWithAsyncErrorHandling,
  concurrentRequest,
} from './utils'
import FileHashWorker from './worker.js?worker'

export interface SliceUploadOptions {
  chunkSize?: number
  concurrentMax?: number
  concurrentRetryMax?: number

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
  progressUploadChunk?: ProgressUploadChunk

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
const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 10

// eslint-disable-next-line
const noop = () => {}

const defaultOptions: MergeSliceUploadOptions = {
  chunkSize: DEFAULT_CHUNK_SIZE,
  concurrentMax: 5,
  concurrentRetryMax: 2,

  beforeFileHash: noop,
  changeFileHash: noop,
  successFileHash: noop,
  errorFileHash: noop,

  beforeUploadChunk: noop,
  successUploadChunk: noop,
  errorUploadChunk: noop,
  progressUploadChunk: noop,

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

const createFormData = (name: string, chunk: Chunk, data?: Data) => {
  const fd = new FormData()
  fd.append(name, chunk.blob)
  if (data) {
    Object.keys(data).forEach(key => {
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
    concurrentMax,
    concurrentRetryMax,

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
    progressUploadChunk,

    beforeMergeChunk,
    successMergeChunk,
    errorMergeChunk,
  } = merge({}, defaultOptions, options) as MergeSliceUploadOptions

  // 切片列表
  let chunks: Chunk[] | undefined
  let fileHash: string | undefined
  let file: File | undefined

  // 中断请求的列表
  let aborts: ((() => void) | undefined)[] | undefined
  let aborted = false

  /**
   * 创建文件切片
   */
  const createChunks = (file: File, chunkSize: number) => {
    let currentSize = 0
    const chunks: Chunk[] = []
    const total = file.size

    while (currentSize < total) {
      chunks.push(new Chunk(file.slice(currentSize, currentSize + chunkSize)))
      currentSize += chunkSize
    }
    return chunks
  }

  /**
   * 计算文件 hash
   */
  const createFileHash = async (file: File, chunks: Chunk[]) => {
    return new Promise<string>((resolve, reject) => {
      // before filehash hook
      callWithErrorHandling(
        beforeFileHash,
        Hooks.BEFORE_FILE_HASH,
        file,
        chunks
      )

      const worker = new FileHashWorker()
      worker.addEventListener('message', e => {
        const { fileHash, progress, index, done } = e.data as FileHashToMain

        // change filehash hook
        callWithErrorHandling(changeFileHash, Hooks.CHANGE_FILE_HASH, {
          file,
          progress,
          index,
          chunks,
        })

        if (done) {
          callWithErrorHandling(successFileHash, Hooks.SUCCESS_FILE_HASH, {
            fileHash: fileHash!,
            file,
            chunks,
          })
          return resolve(fileHash!)
        }
      })

      worker.addEventListener('messageerror', error => {
        // TODO:
        callWithErrorHandling(errorFileHash, Hooks.ERROR_FILE_HASH, {
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
    chunk: Chunk
  ) => {
    const method = uploadMethod
    const url = isFunction(uploadAction)
      ? await callWithAsyncErrorHandling(uploadAction, Hooks.UPLOAD_ACTION, {
          file,
          fileHash,
          chunk,
          index,
        })
      : uploadAction

    const data = isFunction(uploadData)
      ? await callWithAsyncErrorHandling(uploadData, Hooks.UPLOAD_DATA, {
          file,
          fileHash,
          chunk,
          index,
        })
      : createFormData(name, chunk, uploadData)

    callWithErrorHandling(beforeUploadChunk, Hooks.BEFORE_UPLOAD_CHUNK, {
      file,
      fileHash,
      index,
      chunk,
    })

    chunk.setUploading()

    try {
      const { abort, execute } = useRequest({
        immediate: false,
        url,
        data,
        method,
        withCredentials,
        headers: uploadHeaders,
        responseType: 'json',
        onUploadProgress(loaded, total) {
          callWithErrorHandling(
            progressUploadChunk,
            Hooks.PROGRESS_UPLOAD_CHUNK,
            {
              file,
              fileHash,
              index,
              chunk,
              loaded,
              total,
            }
          )
        },
      })
      aborts![index] = abort

      const response = await execute()

      chunk.setSuccess(response)

      callWithErrorHandling(successUploadChunk, Hooks.SUCCESS_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        response,
      })

      return response
    } catch (error: any) {
      chunk.setError(error.type || Status.ERROR, error.response)

      callWithErrorHandling(errorUploadChunk, Hooks.ERROR_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        error,
      })

      // 抛错
      throw error
    }
  }

  /**
   * 开始上传
   */
  const startUpload = async (file: File, fileHash: string, chunks: Chunk[]) => {
    aborted = false
    aborts = []
    // 对没有上传的切片创建请求任务
    const tasks: (() => Promise<unknown>)[] = []
    chunks.forEach((chunk, index) => {
      if (chunk.isUnUpload()) {
        tasks.push(() => createUploadChunkTask(file, fileHash, index, chunk))
      }
    })

    // 并发控制数量执行上传请求
    await concurrentRequest(tasks, {
      max: concurrentMax,
      retryCount: concurrentRetryMax,
      // TODO: 更优雅的解决方案
      beforeRequest: () => !aborted,
    })
  }

  /**
   * 取消上传
   */
  const cancelUpload = () => {
    if (aborts) {
      aborted = true
      aborts!.forEach(cancel => {
        if (cancel) {
          cancel()
        }
      })

      aborts = undefined
    }
  }

  /**
   * 恢复上传
   */
  const resumeUpload = async () => {
    const isUnUpload = chunks!.find(chunk => chunk.isUnUpload())
    if (file && isUnUpload) {
      await uploadAndMerge(file, fileHash!, chunks!)
    }
  }

  /**
   * 合并切片
   */
  const mergeChunks = async (file: File, fileHash: string) => {
    const method = mergeMethod
    const url = isFunction(mergeAction)
      ? await callWithAsyncErrorHandling(mergeAction, Hooks.MERGE_ACTION, {
          file,
          fileHash,
        })
      : mergeAction

    const data = isFunction(mergeData)
      ? await callWithAsyncErrorHandling(mergeData, Hooks.MERGE_DATA, {
          file,
          fileHash,
        })
      : createMergeParams(fileHash, mergeName, mergeData)

    callWithErrorHandling(beforeMergeChunk, Hooks.BEFORE_MERGE_CHUNK, {
      file,
      fileHash,
    })

    try {
      const { execute } = useRequest({
        immediate: false,
        url,
        method,
        data,
        withCredentials,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...mergeHeaders,
        },
      })
      const response = await execute()

      callWithErrorHandling(successMergeChunk, Hooks.SUCCESS_MERGE_CHUNK, {
        file,
        fileHash,
        response,
      })

      return response
    } catch (error) {
      callWithErrorHandling(errorMergeChunk, Hooks.ERROR_MERGE_CHUNK, {
        file,
        fileHash,
        error,
      })
    }
  }

  /**
   * 开始上传
   */
  const start = async (uploadFile: File) => {
    // debugger
    // TODO: beforeUpload 校验文件
    file = uploadFile
    chunks = createChunks(uploadFile, chunkSize)
    fileHash = await createFileHash(uploadFile, chunks)
    await uploadAndMerge(uploadFile, fileHash, chunks)
  }

  /**
   * 上传、合并切片
   */
  const uploadAndMerge = async (
    uploadFile: File,
    fileHash: string,
    chunks: Chunk[]
  ) => {
    await startUpload(uploadFile, fileHash, chunks)
    await mergeChunks(uploadFile, fileHash)
  }

  return {
    start,
    cancel: cancelUpload,
    resume: resumeUpload,
  }
}
