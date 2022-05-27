export interface ConcurrentRequestOptions {
  max?: number
  retryCount?: number
  beforeRequest?: () => boolean
}

export type Request = (...args: any[]) => Promise<unknown>

const defaultOptions: Required<ConcurrentRequestOptions> = {
  max: 5,
  retryCount: 0,
  beforeRequest: () => true,
}

export const concurrentRequest = async (
  requests: Request[],
  options: ConcurrentRequestOptions = {}
) => {
  return new Promise((resolve, reject) => {
    const resolveOptions: Required<ConcurrentRequestOptions> = {
      ...defaultOptions,
      ...options,
    }

    const total = requests.length
    const errorRequests: Request[] = []
    const retryCountsMap = new Map<Request, number>()
    const { retryCount, beforeRequest } = resolveOptions

    let { max } = resolveOptions
    let count = 0
    let index = 0

    const release = () => {
      // 每个请求结束完成后，释放 max
      ++max
    }

    const start = () => {
      if (!beforeRequest()) {
        return
      }

      while ((errorRequests.length || index < total) && max > 0) {
        const isCallErrorRequest = !!errorRequests.length
        const request = errorRequests.length
          ? errorRequests.shift()
          : requests[index]

        if (!request) {
          continue
        }

        // 每执行一个请求，需要回收一个 max，索引往后移一位
        --max
        if (!isCallErrorRequest) {
          ++index
        }

        request()
          .then(() => {
            // 每个请求成功后，累加 count
            count++
            release()

            if (count === total) {
              resolve(undefined)
            } else {
              start()
            }
          })
          .catch(e => {
            release()

            // 累加重试次数，超出次数直接 reject
            const count = retryCountsMap.get(request) || 0
            if (count >= retryCount) {
              return reject(e)
            }
            retryCountsMap.set(request, count + 1)
            errorRequests.push(request)
            start()
          })
      }
    }

    start()
  })
}
