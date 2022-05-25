import { forEach } from './array'

export interface RequestOptions {
  url: string
  method?: string
  withCredentials?: boolean
  headers?: Record<string, string>
  responseType?: XMLHttpRequestResponseType
  data?: any

  onProgress?: (loaded: number, total: number) => void
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

export const request = (options: RequestOptions) => {
  return new Promise((resolve, reject) => {
    const {
      withCredentials,
      headers,
      method = 'GET',
      url,
      data,
      responseType = 'json',
      onProgress,
    } = options
    const xhr = new XMLHttpRequest()

    xhr.withCredentials = !!withCredentials
    xhr.open(method.toUpperCase(), url)
    xhr.responseType = responseType
    setHeaders(xhr, headers)

    xhr.addEventListener('load', function () {
      const status = this.status
      if (status >= 200 && status < 400) {
        resolve(this.response)
      }
      reject()
    })

    xhr.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        onProgress?.(e.loaded, e.total)
      }
    })

    xhr.addEventListener('timeout', function () {
      reject()
    })

    xhr.addEventListener('abort', function () {
      reject()
    })

    xhr.send(data)
  })
}
