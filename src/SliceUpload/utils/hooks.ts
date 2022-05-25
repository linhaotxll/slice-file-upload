import { error } from './logger'

export enum Hooks {
  BEFORE_FILE_HASH = 'bfs',
  SUCCESS_FILE_HASH = 'sfs',
  CHANGE_FILE_HASH = 'cfs',
  ERROR_FILE_HASH = 'efs',
  BEFORE_UPLOAD_CHUNK = 'buc',
  SUCCESS_UPLOAD_CHUNK = 'suc',
  ERROR_UPLOAD_CHUNK = 'euc',
  BEFORE_MERGE_CHUNK = 'bmc',
  SUCCESS_MERGE_CHUNK = 'smc',
  ERROR_MERGE_CHUNK = 'emc',
}

export const ErrorTypeString: Record<Hooks, string> = {
  [Hooks.BEFORE_FILE_HASH]: 'before fileHash hook',
  [Hooks.SUCCESS_FILE_HASH]: 'success fileHash hook',
  [Hooks.ERROR_FILE_HASH]: 'error fileHash hook',
  [Hooks.CHANGE_FILE_HASH]: 'change fileHash hook',
  [Hooks.BEFORE_UPLOAD_CHUNK]: 'before uploadChunk hook',
  [Hooks.SUCCESS_UPLOAD_CHUNK]: 'success uploadChunk hook',
  [Hooks.ERROR_UPLOAD_CHUNK]: 'error uploadChunk hook',
  [Hooks.BEFORE_MERGE_CHUNK]: 'before mergeChunk hook',
  [Hooks.SUCCESS_MERGE_CHUNK]: 'success mergeChunk hook',
  [Hooks.ERROR_MERGE_CHUNK]: 'error mergeChunk hook',
}

export const invokeHooks = <T extends (...args: any) => any>(
  fn: T,
  errorType: Hooks,
  ...args: Parameters<T>
) => {
  let res
  try {
    res = args ? fn(args) : fn()
  } catch (e) {
    handleError(e, errorType)
  }
  return res
}

export const handleError = (e: unknown, errorType: Hooks) => {
  const errorInfo = ErrorTypeString[errorType]
  error(`Unhandled error during execution of ${errorInfo}: ${e}`)
}
