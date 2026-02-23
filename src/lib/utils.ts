import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resizes and compresses an image file on the client-side.
 * Optimized for sub-2-second enrollment: 300x300px @ 60% quality (~20KB payload).
 */
export function resizeAndCompressImage(file: File, maxSize: number = 300, quality: number = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      
      // Force square aspect ratio for avatars
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium'; // Medium is faster than high and sufficient for avatars

      // Calculate source crop to center the square
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const minDim = Math.min(sourceWidth, sourceHeight);
      const sx = (sourceWidth - minDim) / 2;
      const sy = (sourceHeight - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
      
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
        const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(processedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. Check file format.'));
    };
    
    img.src = objectUrl;
  });
}
