export interface FileHashToWorker {
    chunks: Blob[]
}

export interface FileHashToMain {
    done: boolean
    progress: number
    index: number
    fileHash?: string
    error?: unknown
}

