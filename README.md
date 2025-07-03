# 📄 Slice File Upload

基于 Vue3 实现大文件切片上传

## 特性

* 通过 `Worker` 和 `spark-md5` 计算文件 `hash`

* 支持暂停和恢复上传

## 基本使用

### 使用事件监听

```ts
<script setup lang="ts">
import { useSliceUpload, SliceFileUploadResult } from 'slice-file-upload'

interface UploadResponse {}

interface MergeResponse {}

const {
    start,
    cancel,
    resume
}: SliceFileUploadResult<MergeResponse> = useSliceUpload<
    UploadResponse,
    MergeResponse
>({
    uploadAction: '',
    mergeAction: '',
    // 可以使用以下事件监听不同的阶段
    beforeFileHash ({file: File, chunks: Chunk[]}) {
        console.log('开始计算文件 hash')
    },
    progressFileHash ({file: File, chunks: Chunk[], index: number, progress: number}) {
        console.log('获取计算文件 hash 进度')
    },
    successFileHash ({file: File, chunks: Chunk[], fileHash: string}) {
        console.log('计算文件 hash 成功')
    },
    errorFileHash ({file: File, chunks: Chunk[], error: unknown}) {
        console.log('计算文件 hash 失败')
    },
    beforeUploadChunk ({file: File, fileHash: string, index: number, chunk: Chunk}) {
        console.log('开始上传切片')
    },
    progressUploadChunk ({file: File, fileHash: string, index: number, chunk: Chunk, loaded: number, total: number}) {
        console.log('获取上传切片进度')
    },
    successUploadChunk ({file: File, fileHash: string, index: number, chunk: Chunk, response: UploadResponse}) {
        console.log('上传切片成功')
    },
    errorUploadChunk ({file: File, fileHash: string, index: number, chunk: Chunk, error: unknown}) {
        console.log('上传切片失败')
    },
    beforeMergeChunk ({file: File, fileHash: string}) {
        console.log('开始合并切片')
    },
    successMergeChunk ({file: File, fileHash: string, response: MergeResponse}) {
        console.log('合并切片成功')
    },
    errorMergeChunk ({file: File, fileHash: string, error: unknown}) {
        console.log('合并切片失败')
    },
})

const handleChangeFile = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return 
  }

  await start(file)
}
</script>

<template>
    <input type="file" @change="handleChangeFile" />

    <button @click="cancel">暂停</button>

    <button @click="resume">恢复</button>
</template>
```

### 使用返回值数据

```ts
<script setup lang="ts">
import { useSliceUpload, SliceFileUploadResult } from 'slice-file-upload'

interface UploadResponse {}

interface MergeResponse {}

const {
    start,
    cancel,
    resume,
    uploading,
    chunks,
    fileHash,
    fileHashLoading,
    fileHashProgress,
    fileHashError,
    mergeLoading,
    mergeResponse,
    mergeError,
}: SliceFileUploadResult<MergeResponse> = useSliceUpload<
    UploadResponse,
    MergeResponse
>({
    uploadAction: '',
    mergeAction: '',
})

const handleChangeFile = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return 
  }

  await start(file)
}
</script>

<template>
    <input type="file" @change="handleChangeFile" />

    <button @click="cancel">暂停</button>

    <button @click="resume">恢复</button>
</template>
```

### 使用自定义请求

```ts
<script setup lang="ts">
import { useSliceUpload, SliceFileUploadResult } from 'slice-file-upload'

interface UploadResponse {}

interface MergeResponse {}

const {
    start,
    cancel,
    resume
}: SliceFileUploadResult<MergeResponse> = useSliceUpload<
    UploadResponse,
    MergeResponse
>({
    customMergeRequest ({ onSuccess, onError, file, fileHash }) {
        axios.post<MergeResult>('http://localhost:3000/merge-chunks', {
            fileHash,
            fileName: file.name
        })
        .then(res => {
            // 上传成功需要调用 onSuccess
            onSuccess(res.data)
        })
        .catch(err => {
            // 上传失败需要调用 onError
            onError(err.response.data)
        })
    },
    customUploadRequest ({ fileHash, index, chunk, onSuccess, onError, onProgress, onAbort }) {
        const source = CancelToken.source()
        const fd = new FormData()
        fd.append('fileHash', fileHash)
        fd.append('chunkName', `${fileHash}-${index}`)
        fd.append('chunk', chunk.blob)

        axios.post<UploadResult>('http://localhost:3000/upload-chunk', fd, {
            onUploadProgress (e) {
                // 上传进度需要调用 onProgress
                onProgress(e.loaded, e.total)
            },
            cancelToken: source.token
        })
        .then(res => {
            // 上传成功需要调用 onSuccess
            onSuccess(res.data)
        })
        .catch(err => {
            // 上传失败需要调用 onError
            onError(err)
        })

        // 调用 onAbort 存储取消请求操作
        onAbort(() => {
            source.cancel()
        })
    },
})

const handleChangeFile = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return 
  }

  await start(file)
}
</script>

<template>
    <input type="file" @change="handleChangeFile" />

    <button @click="cancel">暂停</button>

    <button @click="resume">恢复</button>
</template>
```

## API 文档

### `useSliceUpload` 参数

```ts
export interface SliceUploadOptions<T, R> {
  /**
   * 切片大小
   * @default 1024 * 1014 * 10
   */
  chunkSize?: number

  /**
   * 并发请求数量
   * @default 5
   */
  concurrentMax?: number

  /**
   * 失败后尝试重试的次数
   * @default 2
   */
  concurrentRetryMax?: number

  /**
   * 开始计算文件 hash
   */
  beforeFileHash?: BeforeFileHash

  /**
   * 计算文件 hash 的进度
   */
  progressFileHash?: ProcessFileHash

  /**
   * 计算文件 hash 成功
   */
  successFileHash?: SuccessFileHash

  /**
   * 计算文件 hash 失败
   */
  errorFileHash?: ErrorFileHash

  /**
   * 开始上传切片
   */
  beforeUploadChunk?: BeforeUploadChunk

  /**
   * 上传切片成功
   */
  successUploadChunk?: SuccessUploadChunk

  /**
   * 上传切片失败
   */
  errorUploadChunk?: ErrorUploadChunk

  /**
   * 上传切片进度
   */
  progressUploadChunk?: ProgressUploadChunk

  /**
   * 开始合并切片
   */
  beforeMergeChunk?: BeforeMergeChunk

  /**
   * 合并切片成功
   */
  successMergeChunk?: SuccessMergeChunk

  /**
   * 合并切片失败
   */
  errorMergeChunk?: ErrorMergeChunk

  /**
   * 切片在提交表单中的字段名
   * @default 'file'
   */
  name?: string

  /**
   * fileHash 在合并中的字段名
   * @default 'fileHash'
   */
  mergeName?: string

  /**
   * 是否允许携带 cookie
   * @default false
   */
  withCredentials?: boolean

  /**
   * 上传切片的请求地址
   */
  uploadAction?: UploadAction

  /**
   * 上传切片的请求数据
   */
  uploadData?: UploadData

  /**
   * 上传切片的请求头
   */
  uploadHeaders?: Data

  /**
   * 上传切片的请求方法
   * @default 'post'
   */
  uploadMethod?: string

  /**
   * 自定义上传请求
   */
  customUploadRequest?: CustomUploadRequest<T>

  /**
   * 合并切片的请求地址
   */
  mergeAction?: MergeAction

  /**
   * 合并切片的请求数据
   */
  mergeData?: MergeData

  /**
   * 合并切片的请求头
   */
  mergeHeaders?: Data

  /**
   * 合并切片的请求方法
   * @default 'post'
   */
  mergeMethod?: string

  /**
   * 自定义合并请求
   */
  customMergeRequest?: CustomMergeRequest<R>
}
```

### `useSliceUpload` 返回值

```ts
export interface SliceFileUploadReturn<R> {
  /**
   * 是否正在上传，包括：分割切片、计算 hash、上传切片、合并切片
   */
  uploading: Ref<boolean>

  /**
   * 切片列表
   */
  chunks: Ref<Chunk[]>

  /**
   * 文件 hash
   */
  fileHash: Ref<string | undefined>

  /**
   * 是否正在计算文件 hash
   */
  fileHashLoading: Ref<boolean>

  /**
   * 计算文件 hash 的进度
   */
  fileHashProgress: Ref<number>

  /**
   * 计算文件 hash 错误信息
   */
  fileHashError: Ref<unknown>

  /**
   * 是否正在合并切片
   */
  mergeLoading: Ref<boolean>

  /**
   * 合并切片的响应数据
   */
  mergeResponse: Ref<R | undefined>

  /**
   * 合并切片的错误信息
   */
  mergeError: Ref<unknown>

  /**
   * 开始上传
   * @param {File} uploadFile 上传原始文件
   */
  start: (uploadFile: File) => Promise<void>

  /**
   * 取消上传
   */
  cancel: () => void

  /**
   * 恢复上传
   */
  resume: () => Promise<void>
}
```

### `Chunk`

```ts
export class Chunk {
    /**
     * 切片原始数据
     */
    blob: Blob;

    /**
     * 切片状态
     */
    status: Status;

    /**
     * 上传成功后的响应数据    
     */
    response: unknown;

    /**
     * 上传失败后的错误信息    
     */
    error: unknown;

    /**
     * 上传切片的进度    
     */
    progress: number;
}
```

切片状态 `Status`

```ts
export declare enum Status {
    /**
     * 等待上传
     */
    PENDING = "pending",

    /**
     * 上传成功
     */
    SUCCESS = "success",

    /**
     * 上传失败
     */
    ERROR = "error",

    /**
     * 正在上传
     */
    UPLOADING = "uploading",
}
```
