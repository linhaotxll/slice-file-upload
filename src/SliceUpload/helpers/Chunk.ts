import { Status } from '../interface'

export class Chunk {
  public status: Status = Status.PENDING

  constructor(public blob: Blob) {}
}
