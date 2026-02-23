
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * High-performance client-side image compression.
 * Resizes to 400x400px @ 70% quality (Professional WhatsApp Standard).
 * Typically reduces a 5MB photo to <50KB in milliseconds.
 */
export function resizeAndCompressImage(file: File, maxSize: number = 400, quality: number = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      
      // Force square aspect ratio for "WhatsApp-style" avatars
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';

      // Center-crop logic
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const minDim = Math.min(sourceWidth, sourceHeight);
      const sx = (sourceWidth - minDim) / 2;
      const sy = (sourceHeight - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
      
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Compression failed'));
        const processedFile = new File([blob], "profile.jpg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(processedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Invalid image format'));
    };
    
    img.src = objectUrl;
  });
}
