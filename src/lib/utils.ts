import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Resizes and compresses an image file on the client-side.
 * Standard: 400x400px at 70% quality for optimal speed/quality balance.
 */
export function resizeAndCompressImage(file: File, maxSize: number = 400, quality: number = 0.7): Promise<File> {
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
      ctx.imageSmoothingQuality = 'high';

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
      reject(new Error('Failed to load image.'));
    };
    
    img.src = objectUrl;
  });
}
