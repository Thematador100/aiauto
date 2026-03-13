import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure local upload directory exists as fallback
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

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
  console.warn('⚠️  Cloudinary not configured — using local file storage fallback');
}

/**
 * Save image locally as fallback when Cloudinary is not configured
 */
const saveImageLocally = async (base64Image, folder = 'inspections') => {
  const subDir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
  const ext = base64Image.match(/data:image\/(\w+);/)?.[1] || 'jpg';
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = path.join(subDir, filename);
  const base64Data = base64Image.replace(/^data:[^;]+;base64,/, '');
  fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
  const publicUrl = `/uploads/${folder}/${filename}`;
  console.log(`[Storage] Photo saved locally: ${publicUrl}`);
  return { url: publicUrl, publicId: `local/${folder}/${filename}`, width: 0, height: 0, format: ext };
};

/**
 * Upload a base64 image to Cloudinary (or save locally as fallback)
 * @param {string} base64Image - Base64 encoded image with data URI prefix
 * @param {string} folder - Cloudinary folder (e.g., 'inspections/photos')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (base64Image, folder = 'inspections') => {
  if (!isConfigured()) {
    return saveImageLocally(base64Image, folder);
  }

  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1920, height: 1920, crop: 'limit' }
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
    console.error('[Cloudinary] Upload error — falling back to local storage:', error.message);
    return saveImageLocally(base64Image, folder);
  }
};

/**
 * Upload audio file to Cloudinary (or save locally as fallback)
 * @param {string} base64Audio - Base64 encoded audio with data URI prefix
 * @param {string} folder - Cloudinary folder (e.g., 'inspections/audio')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadAudio = async (base64Audio, folder = 'inspections/audio') => {
  if (!isConfigured()) {
    const subDir = path.join(LOCAL_UPLOAD_DIR, folder);
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.webm`;
    const filepath = path.join(subDir, filename);
    const base64Data = base64Audio.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    console.log(`[Storage] Audio saved locally: /uploads/${folder}/${filename}`);
    return { url: `/uploads/${folder}/${filename}`, publicId: `local/${folder}/${filename}`, duration: 0, format: 'webm' };
  }

  try {
    const result = await cloudinary.uploader.upload(base64Audio, {
      folder: folder,
      resource_type: 'video'
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
 * Delete a file from Cloudinary (or local storage)
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - 'image' or 'video'
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  if (!isConfigured() || publicId.startsWith('local/')) {
    if (publicId.startsWith('local/')) {
      const localPath = path.join(LOCAL_UPLOAD_DIR, publicId.replace('local/', ''));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
    return { result: 'ok' };
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
