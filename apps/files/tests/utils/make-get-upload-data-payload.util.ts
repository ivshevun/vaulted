import { GetUploadDataPayload } from '@app/common';

export const makeGetUploadDataPayload = (
  overrides?: Partial<GetUploadDataPayload>,
): GetUploadDataPayload => {
  return {
    userId: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed',
    filename: 'text.txt',
    contentType: 'text/plain',
    ...overrides,
  };
};
