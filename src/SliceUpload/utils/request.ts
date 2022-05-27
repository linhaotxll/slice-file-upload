import { forEach } from './array'
import { serializeForm } from './serialize'
import { isFormData } from './types'

export interface RequestOptions {
  url: string
  method?: string
  withCredentials?: boolean
  headers?: Record<string, string>
  responseType?: XMLHttpRequestResponseType
  timeout?: number
  data?: unknown

  abort?: (cancel: () => void) => void

  onUploadProgress?: (
    this: XMLHttpRequestUpload,
    loaded: number,
    total: number
  ) => void
  onObort?: (
    this: XMLHttpRequest,
    e: ProgressEvent<XMLHttpRequestEventTarget>
  ) => void
  onTimeout?: (
    this: XMLHttpRequest,
    e: ProgressEvent<XMLHttpRequestEventTarget>
  ) => void
}

const setHeaders = (
  xhr: XMLHttpRequest,
  headers: RequestOptions['headers']
) => {
  if (headers) {
    forEach(Object.keys(headers), key => {
      xhr.setRequestHeader(key, headers[key])
    })
  }
}

export const request = <T = unknown>(options: RequestOptions) => {
  return new Promise<T>((resolve, reject) => {
    const {
      withCredentials,
      headers,
      method = 'GET',
      url,
      data,
      timeout,
      responseType = 'json',
      onUploadProgress,
      onTimeout,
      onObort,
      abort,
    } = options
    const xhr = new XMLHttpRequest()

    xhr.withCredentials = !!withCredentials
    xhr.responseType = responseType
    timeout && (xhr.timeout = timeout)

    let resolveData = data
    if (isFormData(data) && headers) {
      delete headers['Content-Type']
    } else if (
      (headers?.['Content-Type']?.indexOf('application/json') ?? -1) >= 0
    ) {
      resolveData = `${JSON.stringify(data)}`
    } else {
      resolveData = serializeForm(data)
    }

    xhr.open(method.toUpperCase(), url)
    setHeaders(xhr, headers)

    abort?.(() => {
      xhr.abort()
    })

    xhr.addEventListener('load', function () {
      const status = this.status
      if (status >= 200 && status < 400) {
        return resolve(this.response)
      }
      reject(this.response)
    })

    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        onUploadProgress?.call(this, e.loaded, e.total)
      }
    })

    xhr.addEventListener('timeout', function (e) {
      onTimeout?.call(this, e)
      reject(e)
    })

    xhr.addEventListener('abort', function (e) {
      onObort?.call(this, e)
      reject(e)
    })

    xhr.addEventListener('error', function (e) {
      reject(e)
    })

    xhr.send(resolveData)
  })
}
