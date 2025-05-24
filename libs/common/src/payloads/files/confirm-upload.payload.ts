import { GetUploadDataPayload } from './get-upload-data.payload';

export class ConfirmUploadPayload extends GetUploadDataPayload {
  key: string;
  size: number;
}
