import { useState, useCallback } from "react";

interface UseUploadOptions {
  onSuccess?: (response: any, file: File) => void;
  onError?: (error: Error, file: File) => void;
  onProgress?: (progress: number, file: File) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Update progress
      options.onProgress?.(10, file);

      // Upload file directly to /api/upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Update progress to 100%
      options.onProgress?.(100, file);

      // Call success callback
      options.onSuccess?.(result, file);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      options.onError?.(err, file);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  return { uploadFile, isUploading };
}