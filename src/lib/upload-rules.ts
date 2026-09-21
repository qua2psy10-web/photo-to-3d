import {
  isAcceptedImageName,
  isAcceptedMime,
  MAX_FILE_BYTES,
  MAX_IMAGES,
  MIN_IMAGES,
} from "@/lib/limits";
import { ErrorCode, MESSAGES, UserFacingError } from "@/lib/messages";

export type UploadFileLike = {
  originalName: string;
  mimeType: string;
  size: number;
};

export function validateUploadFiles(files: UploadFileLike[]): void {
  if (files.length === 0) {
    throw new UserFacingError(ErrorCode.no_images, MESSAGES.no_images);
  }
  if (files.length < MIN_IMAGES) {
    throw new UserFacingError(
      ErrorCode.too_few_images,
      MESSAGES.too_few_images(files.length),
    );
  }
  if (files.length > MAX_IMAGES) {
    throw new UserFacingError(
      ErrorCode.too_many_images,
      MESSAGES.too_many_images(files.length),
    );
  }
  for (const file of files) {
    const okMime = isAcceptedMime(file.mimeType);
    const okName = isAcceptedImageName(file.originalName);
    if (!okMime && !okName) {
      throw new UserFacingError(
        ErrorCode.invalid_image,
        MESSAGES.invalid_image(file.originalName),
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new UserFacingError(
        ErrorCode.file_too_large,
        MESSAGES.file_too_large(file.originalName),
      );
    }
  }
}
