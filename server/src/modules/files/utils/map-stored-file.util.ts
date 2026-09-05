import {
  isPrivateStorageKey,
  buildSecureFileUrlPath,
  isPrivateAssociationType,
} from '../constants/file.constants';

type StoredFileMapped = {
  id: number;
  urlPath: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  createdAt: Date;
  originalName: string;
  storedName: string;
};

export type FileAssociationMapped = {
  id: number;
  type: string;
  sortOrder?: number;
  file: StoredFileMapped;
};

type StoredFileSelectRow = {
  id: number;
  urlPath: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  createdAt: Date;
  originalName: string;
  storedName: string;
  storageKey?: string;
};

function resolveUrlPath(
  file: StoredFileSelectRow,
  associationType?: string,
): string {
  if (
    (associationType && isPrivateAssociationType(associationType)) ||
    (file.storageKey && isPrivateStorageKey(file.storageKey))
  ) {
    return buildSecureFileUrlPath(file.id);
  }

  return file.urlPath;
}

function mapStoredFile(
  file: StoredFileSelectRow,
  associationType?: string,
): StoredFileMapped {
  return {
    id: file.id,
    urlPath: resolveUrlPath(file, associationType),
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    extension: file.extension,
    createdAt: file.createdAt,
    originalName: file.originalName,
    storedName: file.storedName,
  };
}

export function mapAssociation(entry: {
  id: number;
  type: string;
  sortOrder?: number;
  file: StoredFileSelectRow;
}): FileAssociationMapped {
  return {
    id: entry.id,
    type: entry.type,
    sortOrder: entry.sortOrder,
    file: mapStoredFile(entry.file, entry.type),
  };
}
