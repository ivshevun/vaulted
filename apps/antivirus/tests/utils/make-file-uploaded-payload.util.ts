import { FileUploadedPayload } from '@app/common';

export const makeFileUploadedPayload = (
  overrides?: Partial<FileUploadedPayload>,
): FileUploadedPayload => {
  return {
    key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
    userId: 'DEAFB36C-5838-4453-8167-7FCDF7E9D82C',
    filename: 'avatar.png',
    contentType: 'image/png',
    ...overrides,
  };
};
