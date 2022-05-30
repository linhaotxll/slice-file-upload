import { Status } from '../interface'

export class Chunk {
  public status: Status = Status.PENDING
  public response: unknown = null
  public error: unknown = null

  constructor(public blob: Blob) {}

  public isUnUpload() {
    return this.status === Status.PENDING || this.status === Status.ABORT
  }

  public setUploading() {
    this.status = Status.UPLOADING
  }

  public setSuccess(response: unknown) {
    this.status = Status.SUCCESS
    this.response = response
  }

  public setError(status: Status = Status.ERROR, error: unknown) {
    this.status = status
    this.error = error
  }
}
