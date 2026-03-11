// services/imageOptimizer.ts

const MAX_DIMENSION = 1280; // Max width/height for resized images
const JPEG_QUALITY = 0.8;   // Compression quality for JPEGs

interface OptimizedImage {
  base64: string;
  mimeType: string;
}

/**
 * Resizes and compresses an image file on the client-side.
 * @param file The image File object to process.
 * @returns A promise that resolves with the optimized image data.
 */
export const resizeAndCompressImage = (file: File): Promise<OptimizedImage> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // For photos, JPEG is generally better for compression.
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        const base64 = dataUrl.split(',')[1];
        
        if (!base64) {
          return reject(new Error('Could not generate base64 string.'));
        }

        resolve({ base64, mimeType });
      };
      img.onerror = (error) => reject(new Error('Image could not be loaded.'));
    };
    reader.onerror = (error) => reject(new Error('File could not be read.'));
  });
};
