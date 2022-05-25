export interface ConcurrentRequestOptions {
	max?: number
	retryCount?: number
}

export type Request = (...args: any[]) => Promise<unknown>

const defaultOptions: Required<ConcurrentRequestOptions> = {
	max: 3,
	retryCount: 0,
}

export const concurrentRequest = async (
	requests: Request[],
	options: ConcurrentRequestOptions = {},
) => {
	return new Promise((resolve, reject) => {
		const resolveOptions: Required<ConcurrentRequestOptions> = ({ ...defaultOptions, ...options })

		const total = requests.length
		const errorRequests: Request[] = []
		const retryCountsMap = new Map<Request, number>()
		let { max, retryCount } = resolveOptions
		let count = 0
		let index = 0

		const start = () => {
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

						if (count === total) {
							resolve(undefined)
						} else {
							start()
						}
					})
					.catch(e => {
						// 累加重试次数，超出次数直接 reject
						let count = retryCountsMap.get(request) || 0
						if (count >= retryCount) {
							return reject(e)
						}
						retryCountsMap.set(request, count + 1)
						errorRequests.push(request)
						start()
					})
					.finally(() => {
						// 每个请求结束完成后，释放 max
						++max
					})
			}
		}

		start()
	})
}
