
export type Data = Record<string, any>

/**
 * hooks
 */

/**
 * before hash hook
 */
export type BeforeFileHash = (file: File, chunks: Blob[]) => void

/**
 * change hash hook
 */
export type ChangeFileHash = (params: {
    file: File;
    progress: number;
    index: number;
    chunks: Blob[];
}) => void
 
/**
 * success hash hook
 */
export type SuccessFileHash = (params: {
    fileHash: string;
    file: File;
    chunks: Blob[]
}) => void
 
/**
 * error hash hook
 */
export type ErrorFileHash = (params: {
    error: unknown;
    file: File;
    chunks: Blob[]
}) => void

/**
 * before upload chunk hook
 */
export type BeforeUploadChunk = (params: {
    file: File,
    fileHash: string,
    index: number,
    chunk: Blob,
}) => void

/**
 * success upload chunk hook
 */
export type SuccessUploadChunk = <T = any>(params: {
    file: File,
    fileHash: string,
    index: number,
    chunk: Blob,
    response: T
}) => void

/**
 * error upload chunk hook
 */
export type ErrorUploadChunk = <T = unknown>(params: {
    file: File,
    fileHash: string,
    index: number,
    chunk: Blob,
    error: T
}) => void

/**
 * progress upload chunk hook
 */
export type ProgressUploadChunk = (params: {
    file: File
    fileHash: string
    chunk: Blob
    index: number
    loaded: number
    total: number
}) => void


/**
 * before merge chunk hook
 */
export type BeforeMergeChunk = (params: {
    file: File
    fileHash: string
}) => void

/**
 * success merge chunk hook
 */
export type SuccessMergeChunk = <T = any>(params: {
    file: File
    fileHash: string
    response: T
}) => void

/**
 * error merge chunk hook
 */
export type ErrorMergeChunk = <T = any>(params: {
    file: File
    fileHash: string
    error: T
}) => void


export type BeforeUpload = (file: File) => boolean | Promise<boolean>

// upload
export type UploadAction =
    string |
    ((params: {
        file: File
        chunk: Blob
        index: number
        fileHash: string
    }) => string | Promise<string>)

export type UploadData =
    Data |
    ((params: {
        file: File
        chunk: Blob
        index: number
        fileHash: string
    }) => Data | Promise<Data>);

// merge
export type MergeAction =
    string |
    ((params: {
        file: File;
        fileHash: string
    }) => string | Promise<string>)

export type MergeData =
    Data |
    ((params: {
        file: File;
        fileHash: string
    }) => Data | Promise<Data>)