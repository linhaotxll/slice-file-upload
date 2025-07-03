import { Status } from '../interface'

export class Chunk {
  public response: unknown = null
  public error: unknown = null
  public progress = 0

  constructor(public blob: Blob, public status: Status = Status.PENDING) {}

  public isUnUpload() {
    return this.status === Status.PENDING || this.status === Status.ERROR
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
