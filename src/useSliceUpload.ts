import { ref, toRaw } from 'vue'
import type { Ref } from 'vue'
import { Chunk } from './helpers'
import { Status } from './interface'
import type {
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
  CustomUploadRequest,
  CustomMergeRequest,
  BeforeFileHash,
  ProcessFileHash,
  SuccessFileHash,
  ErrorFileHash,
} from './interface'
import type {
  FileHashToMain,
  FileHashToWorker,
  InternalCustomUploadRequest,
  InternalMergeUploadRequest,
} from './internal-interface'
import {
  Hooks,
  callWithErrorHandling,
  isFunction,
  merge,
  useRequest,
  callWithAsyncErrorHandling,
  concurrentRequest,
  ErrorCode,
  RequestError,
} from './utils'
import FileHashWorker from './worker.js?worker'

export interface SliceUploadOptions<T, R> {
  chunkSize?: number
  concurrentMax?: number
  concurrentRetryMax?: number

  /**
   * ========== hask hooks ==========
   */
  beforeFileHash?: BeforeFileHash
  progressFileHash?: ProcessFileHash
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
  customUploadRequest?: CustomUploadRequest<T>

  mergeAction?: MergeAction
  mergeData?: MergeData
  mergeHeaders?: Data
  mergeMethod?: string
  customMergeRequest?: CustomMergeRequest<R>
}

export type MergeSliceUploadOptions<T, R> = Required<
  Pick<
    SliceUploadOptions<T, R>,
    | 'chunkSize'
    | 'concurrentMax'
    | 'concurrentRetryMax'
    | 'name'
    | 'mergeName'
    | 'withCredentials'
    | 'uploadMethod'
    | 'mergeMethod'
  >
> &
  SliceUploadOptions<T, R>

// 10M
const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 10

const defaultOptions: MergeSliceUploadOptions<unknown, unknown> = {
  chunkSize: DEFAULT_CHUNK_SIZE,
  concurrentMax: 5,
  concurrentRetryMax: 2,

  name: 'file',
  uploadMethod: 'post',

  mergeName: 'fileHash',
  mergeMethod: 'post',

  withCredentials: false,
}

const Error2StatusMap: Record<ErrorCode, Status> = {
  [ErrorCode.ERR_ABORT]: Status.ABORT,
  [ErrorCode.ERR_BAD_RESPONSE]: Status.ERROR,
  [ErrorCode.ERR_NETWORK]: Status.ERROR,
  [ErrorCode.ERR_TIME_OUT]: Status.TIMEOUT,
}

const createFormData = (name: string, chunk: Chunk, data?: Data) => {
  const fd = new FormData()
  fd.append(name, chunk.blob)
  if (data) {
    Object.keys(data).forEach(key => {
      fd.append(key, data[key] as string | Blob)
    })
  }
  return fd
}

const createMergeParams = (
  fileHash: string,
  name: string,
  data: Data | undefined
) => {
  return { [name]: fileHash, ...data }
}

export const useSliceUpload = <T, R>(
  options: SliceUploadOptions<T, R> = {}
) => {
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
    progressFileHash,
    errorFileHash,

    beforeUploadChunk,
    successUploadChunk,
    errorUploadChunk,
    progressUploadChunk,
    customUploadRequest,

    beforeMergeChunk,
    successMergeChunk,
    errorMergeChunk,
    customMergeRequest,
  } = merge({}, defaultOptions, options) as MergeSliceUploadOptions<T, R>

  const chunks = ref<Chunk[]>([])

  // file hash
  const fileHash = ref<string | undefined>()
  const fileHashLoading = ref<boolean>(false)
  const fileHashProgress = ref<number>(0)
  const fileHashError = ref<unknown>(null)

  // upload chunk
  const uploading = ref<boolean>(false)

  // merge chunk
  const mergeLoading = ref<boolean>(false)
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
      fileHashLoading.value = true

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

        fileHashProgress.value = progress

        // change filehash hook
        callWithErrorHandling(progressFileHash, Hooks.CHANGE_FILE_HASH, {
          file,
          progress,
          index,
          chunks,
        })

        if (done) {
          fileHashLoading.value = false
          callWithErrorHandling(successFileHash, Hooks.SUCCESS_FILE_HASH, {
            fileHash: fileHash!,
            file,
            chunks,
          })
          return resolve(fileHash!)
        }
      })

      worker.addEventListener('messageerror', error => {
        fileHashLoading.value = false
        fileHashError.value = error
        // TODO:
        callWithErrorHandling(errorFileHash, Hooks.ERROR_FILE_HASH, {
          file,
          chunks,
          error,
        })
        reject()
      })

      const data: FileHashToWorker = { chunks: toRaw(chunks) }
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

    const onBefore = () => {
      callWithErrorHandling(beforeUploadChunk, Hooks.BEFORE_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
      })

      chunk.setUploading()
    }

    const onSuccess = (response: T) => {
      chunk.setSuccess(response)
      callWithErrorHandling(successUploadChunk, Hooks.SUCCESS_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        response,
      })
    }

    const onError = (error: RequestError) => {
      chunk.setError(
        Error2StatusMap[error.code] || Status.ERROR,
        error.response
      )
      callWithErrorHandling(errorUploadChunk, Hooks.ERROR_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        error,
      })
    }

    const onProgress = (loaded: number, total: number) => {
      chunk.progress = (loaded / total) * 100
      callWithErrorHandling(progressUploadChunk, Hooks.PROGRESS_UPLOAD_CHUNK, {
        file,
        fileHash,
        index,
        chunk,
        loaded,
        total,
      })
    }

    const onAbort = (abort: () => void) => {
      if (aborts) {
        aborts[index] = abort
      }
    }

    const params: InternalCustomUploadRequest<T> = {
      url,
      data,
      file,
      fileHash,
      chunk,
      index,
      headers: uploadHeaders,
      method,
      onSuccess,
      onError,
      onProgress,
      onBefore,
      onAbort,
    }

    if (isFunction(customUploadRequest)) {
      return await _createCustomUploadChunkTask(params)
    }

    if (!url) {
      throw new Error('missing upload url')
    }

    return await _createDefaultUploadChunkTask(params)
  }

  /**
   * 创建切片的上传任务 - 自定义
   */
  const _createCustomUploadChunkTask = async (
    params: InternalCustomUploadRequest<T>
  ) => {
    params.onBefore()

    return await callWithAsyncErrorHandling(
      customUploadRequest!,
      Hooks.CUSTOM_UPLOAD_CHUNK,
      params
    )
  }

  /**
   * 创建切片的上传任务 - 默认
   */
  const _createDefaultUploadChunkTask = async (
    params: InternalCustomUploadRequest<T>
  ) => {
    const {
      url,
      data,
      headers,
      method,
      onBefore,
      onError,
      onProgress,
      onSuccess,
      onAbort,
    } = params
    onBefore()

    try {
      const { abort, execute } = useRequest<T>({
        immediate: false,
        url: url!,
        data,
        method,
        withCredentials,
        headers,
        responseType: 'json',
        onUploadProgress(loaded, total) {
          onProgress(loaded, total)
        },
      })

      onAbort(abort)

      const response = await execute()

      onSuccess(response)

      return response
    } catch (error: any) {
      onError(error)

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
    const isUnUpload = chunks.value!.find(chunk => chunk.isUnUpload())
    if (file && isUnUpload) {
      await uploadAndMerge(file, fileHash.value!, chunks!)
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

    const onBefore = () => {
      callWithErrorHandling(beforeMergeChunk, Hooks.BEFORE_MERGE_CHUNK, {
        file,
        fileHash,
      })
    }

    const onSuccess = (response: R) => {
      callWithErrorHandling(successMergeChunk, Hooks.SUCCESS_MERGE_CHUNK, {
        file,
        fileHash,
        response,
      })
    }

    const onError = (error: unknown) => {
      callWithErrorHandling(errorMergeChunk, Hooks.ERROR_MERGE_CHUNK, {
        file,
        fileHash,
        error,
      })
    }

    const params: InternalMergeUploadRequest<R> = {
      url,
      method,
      headers: mergeHeaders,
      file,
      fileHash,
      data,
      onSuccess,
      onError,
      onBefore,
    }

    if (isFunction(customMergeRequest)) {
      return await _mergeChunksCustom(params)
    }

    if (!url) {
      throw new Error('missing merge url')
    }

    return await _mergeChunksDefault(params)
  }

  /**
   * 合并切片 - 自定义
   */
  const _mergeChunksCustom = async (params: InternalMergeUploadRequest<R>) => {
    params.onBefore()

    return await callWithAsyncErrorHandling(
      customMergeRequest!,
      Hooks.CUSTOM_UPLOAD_CHUNK,
      params
    )
  }

  /**
   * 合并切片 - 默认
   */
  const _mergeChunksDefault = async (params: InternalMergeUploadRequest<R>) => {
    const { url, method, data, onBefore, onError, onSuccess } = params
    try {
      onBefore()

      const { execute } = useRequest<R>({
        immediate: false,
        url: url!,
        method,
        data,
        withCredentials,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...mergeHeaders,
        },
      })
      const response = await execute()

      onSuccess(response)

      return response
    } catch (error) {
      onError(error)
    }
  }

  /**
   * 开始上传
   */
  const start = async (uploadFile: File) => {
    file = uploadFile
    chunks.value = createChunks(uploadFile, chunkSize)
    fileHash.value = await createFileHash(uploadFile, chunks.value)
    await uploadAndMerge(uploadFile, fileHash.value, chunks)
  }

  /**
   * 上传、合并切片
   */
  const uploadAndMerge = async (
    uploadFile: File,
    fileHash: string,
    chunks: Ref<Chunk[]>
  ) => {
    await startUpload(uploadFile, fileHash, chunks.value)
    await mergeChunks(uploadFile, fileHash)
  }

  return {
    uploading,
    mergeLoading,
    start,
    cancel: cancelUpload,
    resume: resumeUpload,
    chunks,
    fileHash,
    fileHashLoading,
    fileHashProgress,
    fileHashError,
  }
}
