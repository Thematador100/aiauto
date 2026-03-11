import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImage, uploadAudio } from '../config/cloudinary.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/photos/upload
 * Upload a photo to Cloudinary
 * Requires authentication
 */
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { image, category, notes, inspectionId } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    console.log(`[Photos] Uploading photo for user ${req.user.email}`);

    // Upload to Cloudinary
    const uploadResult = await uploadImage(image, `inspections/${req.user.id}`);

    // If inspectionId provided, save to database
    let photoRecord = null;
    if (inspectionId) {
      // Verify user owns this inspection
      const inspectionCheck = await query(
        'SELECT id FROM inspections WHERE id = $1 AND user_id = $2',
        [inspectionId, req.user.id]
      );

      if (inspectionCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You do not own this inspection' });
      }

      // Save photo metadata to database
      const result = await query(
        `INSERT INTO photos (inspection_id, category, cloudinary_url, cloudinary_public_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [inspectionId, category || 'general', uploadResult.url, uploadResult.publicId, notes || '']
      );

      photoRecord = result.rows[0];
    }

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        id: photoRecord?.id,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format
      }
    });
  } catch (error) {
    console.error('[Photos] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

/**
 * POST /api/photos/upload-audio
 * Upload an audio note to Cloudinary
 * Requires authentication
 */
router.post('/upload-audio', authenticateToken, async (req, res) => {
  try {
    const { audio, category, inspectionId } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Validate base64 format
    if (!audio.startsWith('data:audio/')) {
      return res.status(400).json({ error: 'Invalid audio format' });
    }

    console.log(`[Photos] Uploading audio for user ${req.user.email}`);

    // Upload to Cloudinary
    const uploadResult = await uploadAudio(audio, `inspections/${req.user.id}/audio`);

    // If inspectionId provided, save to database
    let audioRecord = null;
    if (inspectionId) {
      // Verify user owns this inspection
      const inspectionCheck = await query(
        'SELECT id FROM inspections WHERE id = $1 AND user_id = $2',
        [inspectionId, req.user.id]
      );

      if (inspectionCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You do not own this inspection' });
      }

      // Save audio metadata to database
      const result = await query(
        `INSERT INTO audio_notes (inspection_id, category, cloudinary_url, cloudinary_public_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [inspectionId, category || 'general', uploadResult.url, uploadResult.publicId]
      );

      audioRecord = result.rows[0];
    }

    res.status(201).json({
      message: 'Audio uploaded successfully',
      audio: {
        id: audioRecord?.id,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        duration: uploadResult.duration,
        format: uploadResult.format
      }
    });
  } catch (error) {
    console.error('[Photos] Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

/**
 * GET /api/photos/inspection/:inspectionId
 * Get all photos for a specific inspection
 * Requires authentication
 */
router.get('/inspection/:inspectionId', authenticateToken, async (req, res) => {
  try {
    const { inspectionId } = req.params;

    // Verify user owns this inspection
    const inspectionCheck = await query(
      'SELECT id FROM inspections WHERE id = $1 AND user_id = $2',
      [inspectionId, req.user.id]
    );

    if (inspectionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this inspection' });
    }

    // Get all photos
    const result = await query(
      'SELECT * FROM photos WHERE inspection_id = $1 ORDER BY created_at ASC',
      [inspectionId]
    );

    res.json({ photos: result.rows });
  } catch (error) {
    console.error('[Photos] Get photos error:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
});

export default router;
