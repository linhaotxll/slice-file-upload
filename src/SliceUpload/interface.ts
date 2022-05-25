
export type Data = Record<string, any>

/**
 * file hash hooks
 */
export type BeforeFileHash = (file: File, chunks: Blob[]) => void

export type ChangeFileHash = (params: {
    file: File;
    progress: number;
    index: number;
    chunks: Blob[];
}) => void

export type SuccessFileHash = (params: {
    fileHash: string;
    file: File;
    chunks: Blob[]
}) => void

export type ErrorFileHash = (params: {
    error: unknown;
    file: File;
    chunks: Blob[]
}) => void


export type BeforeUpload = (file: File) => boolean | Promise<boolean>

export type UploadAction =
    string |
    ((params: {
        file: File;
        chunk: Blob;
        fileHash: string
    }) => string | Promise<string>)

export type UploadData =
    Data |
    ((params: {
        file: File;
        chunk: Blob;
        fileHash: string
    }) => Data | Promise<Data>);

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