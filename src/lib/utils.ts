
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
 * Generates a SHA-256 hash of an image file.
 * @param file The image file to hash.
 * @returns A promise that resolves with the hex string of the hash.
 */
export async function getImageHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Resizes and compresses an image file on the client-side.
 * @param file The image file to process.
 * @param maxSize The maximum width or height of the output image.
 * @param quality The quality of the output JPEG image (0 to 1).
 * @returns A promise that resolves with the processed image as a File object.
 */
export function resizeAndCompressImage(file: File, maxSize: number = 512, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            if (!blob) {
                return reject(new Error('Canvas to Blob conversion failed'));
            }
            const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
            resolve(processedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        reject(new Error('Failed to read file as string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
