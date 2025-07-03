import { ref, shallowRef } from 'vue'
import { Data } from '../interface'
import { serializeForm } from './serialize'
import { isFormData } from './types'

export interface RequestOptions {
  url: string
  method?: string
  withCredentials?: boolean
  headers?: Data
  responseType?: XMLHttpRequestResponseType
  timeout?: number
  data?: Record<string, unknown> | FormData
  immediate?: boolean

  onUploadProgress?: (
    this: XMLHttpRequestUpload,
    loaded: number,
    total: number
  ) => void
}

const setHeaders = (
  xhr: XMLHttpRequest,
  headers: RequestOptions['headers']
) => {
  if (headers) {
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key] as string)
    })
  }
}

export const useRequest = <T>(options: RequestOptions) => {
  const {
    withCredentials,
    headers,
    method = 'GET',
    url,
    data,
    timeout,
    responseType,
    immediate = true,
    onUploadProgress,
  } = options

  const isFetching = ref<boolean>(false)
  const isTimeout = ref<boolean>(false)
  const isAbort = ref<boolean>(false)
  const responseData = shallowRef<T | null>(null)
  const error = shallowRef<unknown>(null)
  let xhr: XMLHttpRequest | undefined

  const loading = (isLoading: boolean) => {
    isFetching.value = isLoading ? true : isLoading
  }

  const execute = () =>
    new Promise<T>((resolve, reject) => {
      const _reject = (e: unknown) => {
        _complete()
        error.value = e
        reject(e)
      }

      const _resolve = (data: T) => {
        responseData.value = data
        _complete()
        resolve(data)
      }

      const _complete = () => {
        loading(false)
      }

      loading(true)

      xhr = new XMLHttpRequest()

      xhr.withCredentials = !!withCredentials
      responseType && (xhr.responseType = responseType)
      timeout && (xhr.timeout = timeout)

      let resolveData: string | FormData | null = null

      if (data) {
        if (isFormData(data)) {
          resolveData = data
          if (headers) {
            delete headers['Content-Type']
          }
        } else if (
          ((headers?.['Content-Type'] as string)?.indexOf('application/json') ??
            -1) >= 0
        ) {
          resolveData = `${JSON.stringify(data)}`
        } else {
          resolveData = serializeForm(data)
        }
      }

      xhr.open(method.toUpperCase(), url)
      setHeaders(xhr, headers)

      xhr.addEventListener('load', function () {
        const status = this.status
        if (status >= 200 && status < 300) {
          return _resolve(this.response)
        }
        _reject(new Error(`Request failed with status code ${this.status}`))
      })

      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          onUploadProgress?.call(this, e.loaded, e.total)
        }
      })

      xhr.addEventListener('timeout', function () {
        isTimeout.value = true
        _reject(
          new Error(
            `${
              timeout
                ? 'timeout of ' + timeout + 'ms exceeded'
                : 'timeout exceeded'
            }`
          )
        )
      })

      xhr.addEventListener('abort', function () {
        isAbort.value = true
        _reject(new Error('Request aborted'))
      })

      xhr.addEventListener('error', function () {
        _reject(new Error('Network Error'))
      })

      xhr.send(resolveData)
    })

  const abort = () => {
    xhr?.abort()
  }

  if (immediate) {
    setTimeout(execute, 0)
  }

  return {
    responseData,
    isFetching,
    isTimeout,
    isAbort,
    abort,
    execute,
  }
}
