import { error } from './logger'
import { isError, isPromise } from './types'

export enum Hooks {
  BEFORE_FILE_HASH = 'bfs',
  SUCCESS_FILE_HASH = 'sfs',
  CHANGE_FILE_HASH = 'cfs',
  ERROR_FILE_HASH = 'efs',
  BEFORE_UPLOAD_CHUNK = 'buc',
  SUCCESS_UPLOAD_CHUNK = 'suc',
  PROGRESS_UPLOAD_CHUNK = 'puc',
  ERROR_UPLOAD_CHUNK = 'euc',
  BEFORE_MERGE_CHUNK = 'bmc',
  SUCCESS_MERGE_CHUNK = 'smc',
  ERROR_MERGE_CHUNK = 'emc',
  UPLOAD_ACTION = 'ua',
  UPLOAD_DATA = 'ud',
  MERGE_ACTION = 'ma',
  MERGE_DATA = 'md',
}

export const ErrorTypeString: Record<Hooks, string> = {
  [Hooks.BEFORE_FILE_HASH]: 'before fileHash hook',
  [Hooks.SUCCESS_FILE_HASH]: 'success fileHash hook',
  [Hooks.ERROR_FILE_HASH]: 'error fileHash hook',
  [Hooks.CHANGE_FILE_HASH]: 'change fileHash hook',
  [Hooks.BEFORE_UPLOAD_CHUNK]: 'before uploadChunk hook',
  [Hooks.SUCCESS_UPLOAD_CHUNK]: 'success uploadChunk hook',
  [Hooks.ERROR_UPLOAD_CHUNK]: 'error uploadChunk hook',
  [Hooks.PROGRESS_UPLOAD_CHUNK]: 'progress uploadChunk hook',
  [Hooks.BEFORE_MERGE_CHUNK]: 'before mergeChunk hook',
  [Hooks.SUCCESS_MERGE_CHUNK]: 'success mergeChunk hook',
  [Hooks.ERROR_MERGE_CHUNK]: 'error mergeChunk hook',
  [Hooks.UPLOAD_ACTION]: 'upload action',
  [Hooks.UPLOAD_DATA]: 'upload data',
  [Hooks.MERGE_ACTION]: 'merge action',
  [Hooks.MERGE_DATA]: 'merge data',
}

export const callWithErrorHandling = <T extends (...args: any) => any>(
  fn: T,
  errorType: Hooks,
  ...args: Parameters<T>
) => {
  let res
  try {
    res = fn(...(args as any[]))
  } catch (e) {
    handleError(e, errorType)
  }
  return res
}

type PromiseReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : ReturnType<T>

export const callWithAsyncErrorHandling = async <
  T extends (...args: any) => any
>(
  fn: T,
  errorType: Hooks,
  ...args: Parameters<T>
): Promise<PromiseReturnType<T>> => {
  return new Promise((resolve, reject) => {
    const result = callWithErrorHandling(fn, errorType, ...args)
    if (isPromise(result)) {
      result
        .then(res => {
          resolve(res)
        })
        .catch(e => {
          handleError(e, errorType)
          reject(e)
        })
    } else {
      resolve(result)
    }
  })
}

export const handleError = (e: unknown, errorType: Hooks) => {
  const errorInfo = ErrorTypeString[errorType]
  throw new Error(
    `Unhandled error during execution of ${errorInfo}: ${
      isError(e) ? e.message : e
    }`
  )
}
