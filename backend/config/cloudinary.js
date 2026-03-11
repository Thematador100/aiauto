import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verify configuration
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isConfigured()) {
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️  Cloudinary not configured - photo uploads will fail');
}

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image with data URI prefix
 * @param {string} folder - Cloudinary folder (e.g., 'inspections/photos')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (base64Image, folder = 'inspections') => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Optimize image
        { width: 1920, height: 1920, crop: 'limit' } // Max dimensions
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload audio file to Cloudinary
 * @param {string} base64Audio - Base64 encoded audio with data URI prefix
 * @param {string} folder - Cloudinary folder (e.g., 'inspections/audio')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadAudio = async (base64Audio, folder = 'inspections/audio') => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(base64Audio, {
      folder: folder,
      resource_type: 'video' // Cloudinary uses 'video' for audio files
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format
    };
  } catch (error) {
    console.error('[Cloudinary] Audio upload error:', error);
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - 'image' or 'video'
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export default { uploadImage, uploadAudio, deleteFile, isConfigured };
