/** Max upload size for image profiles (matches files module limits). */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Max upload size for document profiles (matches files module limits). */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const IMAGE_MIME_REGEX = /^image\/(jpeg|jpg|png|gif|webp)$/i;

export const DOCUMENT_MIME_REGEX =
  /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i;
