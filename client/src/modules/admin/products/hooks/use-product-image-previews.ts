"use client";

import { previewKey } from "../lib/product-form";
import { useCallback, useEffect, useRef } from "react";

export function useProductImageFilePreviews() {
  const objectUrlsRef = useRef<Map<File, string>>(new Map());

  useEffect(() => {
    const map = objectUrlsRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const objectUrlFor = useCallback((file: File): string => {
    const map = objectUrlsRef.current;
    let url = map.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      map.set(file, url);
    }
    return url;
  }, []);

  const revokeFile = useCallback((file: File) => {
    const url = objectUrlsRef.current.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(file);
    }
  }, []);

  return { objectUrlFor, revokeFile, previewKey };
}
