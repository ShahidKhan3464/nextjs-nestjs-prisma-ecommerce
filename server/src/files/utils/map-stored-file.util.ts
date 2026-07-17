import { Injectable } from '@nestjs/common';
import { STORED_FILE_SELECT } from '../constants/file.constants';

export type StoredFileMapped = {
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
};

export function mapStoredFile(file: StoredFileSelectRow): StoredFileMapped {
  return {
    id: file.id,
    urlPath: file.urlPath,
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
    file: mapStoredFile(entry.file),
  };
}

export { STORED_FILE_SELECT };
