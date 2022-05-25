const _error = console.error

export const error = (message: string, ...args: unknown[]) => {
  const errorArgs = [`[SliceUpload error]: ${message}`, ...args]
  _error(errorArgs)
}
