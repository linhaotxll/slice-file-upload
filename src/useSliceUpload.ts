import { ref, toRaw } from 'vue'

import { Chunk } from './helpers'
import {
  Status,
} from './interface'
import {
  Hooks,
  callWithErrorHandling,
  isFunction,
  merge,
  useRequest,
  callWithAsyncErrorHandling,
  concurrentRequest,
} from './utils'
import FileHashWorker from './worker.js?worker&inline'

import type { Data, MergeSliceUploadOptions, SliceFileUploadReturn, SliceUploadOptions } from './interface'
import type {
  FileHashToMain,
  FileHashToWorker,
  InternalCustomUploadRequest,
  InternalMergeUploadRequest,
} from './internal-interface'
import type { Ref } from 'vue'

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

function createFormData (name: string, chunk: Chunk, data?: Data) {
  const fd = new FormData()
  fd.append(name, chunk.blob)
  if (data) {
    Object.keys(data).forEach((key) => {
      fd.append(key, data[key] as string | Blob)
    })
  }
  return fd
}

function createMergeParams (fileHash: string, name: string, data: Data | undefined) {
  return { [name]: fileHash, ...data }
}

export function useSliceUpload<T, R> (options: SliceUploadOptions<T, R> = {}): SliceFileUploadReturn<R> {
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

    checkUpload,

    skipChunkIndex,

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
  const mergeResponse = ref<R>()
  const mergeError = ref<unknown>(null)

  // upload chunk
  const uploading = ref<boolean>(false)

  // merge chunk
  const mergeLoading = ref<boolean>(false)
  let file: File | undefined

  // 中断请求的列表
  let aborts: ((()=> void) | undefined)[] | undefined
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
        chunks,
      )

      const worker = new FileHashWorker()
      worker.addEventListener('message', (e) => {
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

      worker.addEventListener('messageerror', (error) => {
        fileHashLoading.value = false
        fileHashError.value = error
        // TODO:
        callWithErrorHandling(errorFileHash, Hooks.ERROR_FILE_HASH, {
          file,
          chunks,
          error,
        })
        reject(error)
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
    chunk: Chunk,
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
      : createFormData(name, chunk, uploadData as Data)

    return new Promise<T>((_resolve, _reject) => {
      const resolve = (response: T) => {
        _resolve(response)
      }

      const reject = (error: any) => {
        _reject(error)
      }

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
          total: chunks.value.length,
          loaded: chunks.value.reduce<number>((prev, curr) => {
            if (curr.status === Status.SUCCESS) {
              return prev + 1
            }
            return prev
          }, 0),
        })

        resolve(response)
      }

      const onError = (error: any) => {
        chunk.setError(Status.ERROR, error)

        callWithErrorHandling(errorUploadChunk, Hooks.ERROR_UPLOAD_CHUNK, {
          file,
          fileHash,
          index,
          chunk,
          error,
        })

        reject(error)
      }

      const onProgress = (loaded: number, total: number) => {
        chunk.progress = (loaded / total) * 100
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
          },
        )
      }

      const onAbort = (abort: ()=> void) => {
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
        return _createCustomUploadChunkTask(params)
      }

      if (!url) {
        throw new Error('missing upload url')
      }

      _createDefaultUploadChunkTask(params)
    })
  }

  /**
   * 创建切片的上传任务 - 自定义
   */
  function _createCustomUploadChunkTask (
    params: InternalCustomUploadRequest<T>,
  ) {
    params.onBefore()

    callWithAsyncErrorHandling(
      customUploadRequest!,
      Hooks.CUSTOM_UPLOAD_CHUNK,
      params,
    )
  }

  /**
   * 创建切片的上传任务 - 默认
   */
  async function _createDefaultUploadChunkTask (
    params: InternalCustomUploadRequest<T>,
  ) {
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
        onUploadProgress (loaded, total) {
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

    // 需要跳过的切片索引
    const skipIndex = (await skipChunkIndex?.({ file, fileHash, chunks })) ?? []
    const skipIndexMap = skipIndex.reduce((prev, curr) => {
      prev[curr] = true
      return prev
    }, {} as Record<number, boolean>)

    // 对没有上传的切片创建请求任务
    const tasks: (()=> Promise<unknown>)[] = []
    chunks.forEach((chunk, index) => {
      if (!skipIndexMap[index]) {
        if (chunk.isUnUpload()) {
          tasks.push(() => createUploadChunkTask(file, fileHash, index, chunk))
        }
      } else {
        chunk.setSuccess(null)
      }
    })

    if (!tasks.length) {
      return
    }

    // 并发控制数量执行上传请求
    await concurrentRequest(tasks, {
      max: concurrentMax,
      retryCount: concurrentRetryMax,
      // TODO: 更优雅的解决方案
      beforeRequest: () => !aborted,
    })
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

    return new Promise<R>((_resovle, _reject) => {
      const resolve = (response: R) => {
        _resovle(response)
      }

      const reject = (error: any) => {
        _reject(error)
      }

      const onBefore = () => {
        mergeLoading.value = true
        callWithErrorHandling(beforeMergeChunk, Hooks.BEFORE_MERGE_CHUNK, {
          file,
          fileHash,
        })
      }

      const onSuccess = (response: R) => {
        mergeResponse.value = response
        mergeLoading.value = false
        callWithErrorHandling(successMergeChunk, Hooks.SUCCESS_MERGE_CHUNK, {
          file,
          fileHash,
          response,
        })

        resolve(response)
      }

      const onError = (error: unknown) => {
        mergeError.value = error
        mergeLoading.value = false
        callWithErrorHandling(errorMergeChunk, Hooks.ERROR_MERGE_CHUNK, {
          file,
          fileHash,
          error,
        })

        reject(error)
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
        return _mergeChunksCustom(params)
      }

      if (!url) {
        return reject(new Error('missing merge url'))
      }

      _mergeChunksDefault(params)
    })
  }

  /**
   * 合并切片 - 自定义
   */
  function _mergeChunksCustom (params: InternalMergeUploadRequest<R>) {
    params.onBefore()

    callWithAsyncErrorHandling(
      customMergeRequest!,
      Hooks.CUSTOM_UPLOAD_CHUNK,
      params,
    )
  }

  /**
   * 合并切片 - 默认
   */
  async function _mergeChunksDefault (params: InternalMergeUploadRequest<R>) {
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
    toggleUpload(async () => {
      chunks.value = createChunks(uploadFile, chunkSize)
      fileHash.value = await createFileHash(uploadFile, chunks.value)
      await uploadAndMerge(uploadFile, fileHash.value, chunks)
    })
  }

  /**
   * 取消上传
   */
  const cancelUpload = () => {
    if (aborts) {
      aborted = true
      aborts!.forEach((cancel) => {
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
    const isUnUpload = chunks.value.find(chunk => chunk.isUnUpload())
    if (file && isUnUpload) {
      toggleUpload(async () => {
        await uploadAndMerge(file!, fileHash.value!, chunks!)
      })
    }
  }

  /**
   * 切换 uploading 状态
   */
  async function toggleUpload (fn: (...args: unknown[])=> void) {
    uploading.value = true
    await fn()
    uploading.value = false
  }

  /**
   * 上传、合并切片
   */
  async function uploadAndMerge (
    uploadFile: File,
    fileHash: string,
    chunks: Ref<Chunk[]>,
  ) {
    const exist = await callWithAsyncErrorHandling(
      () => checkUpload?.({ file: uploadFile, fileHash, chunks: chunks.value }),
      Hooks.CHECK_UPLOAD_CHUNK,
    )
    if (exist !== false) {
      await startUpload(uploadFile, fileHash, chunks.value)
      await mergeChunks(uploadFile, fileHash)
    }
  }

  return {
    uploading,
    chunks,
    fileHash,
    fileHashLoading,
    fileHashProgress,
    fileHashError,
    mergeLoading,
    mergeResponse,
    mergeError,
    start,
    cancel: cancelUpload,
    resume: resumeUpload,
  }
}
