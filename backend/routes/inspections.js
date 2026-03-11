import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/inspections
 * Get all inspections for the authenticated user
 * Requires authentication
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    console.log(`[Inspections] Fetching inspections for user ${req.user.email}`);

    // Get inspections with photo counts
    const result = await query(
      `SELECT
        i.*,
        COUNT(DISTINCT p.id) as photo_count,
        COUNT(DISTINCT a.id) as audio_count
       FROM inspections i
       LEFT JOIN photos p ON p.inspection_id = i.id
       LEFT JOIN audio_notes a ON a.inspection_id = i.id
       WHERE i.user_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM inspections WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      inspections: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[Inspections] Get inspections error:', error);
    res.status(500).json({ error: 'Failed to retrieve inspections' });
  }
});

/**
 * GET /api/inspections/:id
 * Get a specific inspection by ID
 * Requires authentication and ownership
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get inspection
    const result = await query(
      'SELECT * FROM inspections WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const inspection = result.rows[0];

    // Get associated photos
    const photosResult = await query(
      'SELECT * FROM photos WHERE inspection_id = $1 ORDER BY created_at ASC',
      [id]
    );

    // Get associated audio notes
    const audioResult = await query(
      'SELECT * FROM audio_notes WHERE inspection_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      ...inspection,
      photos: photosResult.rows,
      audioNotes: audioResult.rows
    });
  } catch (error) {
    console.error('[Inspections] Get inspection error:', error);
    res.status(500).json({ error: 'Failed to retrieve inspection' });
  }
});

/**
 * POST /api/inspections
 * Create a new inspection
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      vehicleVin,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleType,
      odometer,
      overallNotes,
      checklistData,
      aiSummary,
      photoIds = [],
      audioIds = []
    } = req.body;

    // Validation
    if (!vehicleMake || !vehicleModel || !vehicleYear) {
      return res.status(400).json({ error: 'Vehicle make, model, and year are required' });
    }

    console.log(`[Inspections] Creating inspection for user ${req.user.email}`);

    // Create inspection
    const result = await query(
      `INSERT INTO inspections (
        user_id, vehicle_vin, vehicle_make, vehicle_model, vehicle_year,
        vehicle_type, odometer, overall_notes, checklist_data, ai_summary,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        req.user.id,
        vehicleVin || null,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleType || 'standard',
        odometer || null,
        overallNotes || '',
        JSON.stringify(checklistData || {}),
        aiSummary || ''
      ]
    );

    const inspection = result.rows[0];

    // Link photos to this inspection if photoIds provided
    if (photoIds.length > 0) {
      await query(
        `UPDATE photos
         SET inspection_id = $1
         WHERE cloudinary_public_id = ANY($2::text[]) AND inspection_id IS NULL`,
        [inspection.id, photoIds]
      );
    }

    // Link audio notes if audioIds provided
    if (audioIds.length > 0) {
      await query(
        `UPDATE audio_notes
         SET inspection_id = $1
         WHERE cloudinary_public_id = ANY($2::text[]) AND inspection_id IS NULL`,
        [inspection.id, audioIds]
      );
    }

    res.status(201).json({
      message: 'Inspection created successfully',
      inspection: {
        id: inspection.id,
        vehicleInfo: {
          vin: inspection.vehicle_vin,
          make: inspection.vehicle_make,
          model: inspection.vehicle_model,
          year: inspection.vehicle_year,
          type: inspection.vehicle_type
        },
        odometer: inspection.odometer,
        createdAt: inspection.created_at
      }
    });
  } catch (error) {
    console.error('[Inspections] Create inspection error:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

/**
 * PUT /api/inspections/:id
 * Update an existing inspection
 * Requires authentication and ownership
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleVin,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleType,
      odometer,
      overallNotes,
      checklistData,
      aiSummary
    } = req.body;

    // Verify ownership
    const ownershipCheck = await query(
      'SELECT id FROM inspections WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this inspection' });
    }

    console.log(`[Inspections] Updating inspection ${id} for user ${req.user.email}`);

    // Update inspection
    const result = await query(
      `UPDATE inspections
       SET
         vehicle_vin = COALESCE($1, vehicle_vin),
         vehicle_make = COALESCE($2, vehicle_make),
         vehicle_model = COALESCE($3, vehicle_model),
         vehicle_year = COALESCE($4, vehicle_year),
         vehicle_type = COALESCE($5, vehicle_type),
         odometer = COALESCE($6, odometer),
         overall_notes = COALESCE($7, overall_notes),
         checklist_data = COALESCE($8, checklist_data),
         ai_summary = COALESCE($9, ai_summary),
         updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        vehicleVin,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleType,
        odometer,
        overallNotes,
        checklistData ? JSON.stringify(checklistData) : null,
        aiSummary,
        id,
        req.user.id
      ]
    );

    res.json({
      message: 'Inspection updated successfully',
      inspection: result.rows[0]
    });
  } catch (error) {
    console.error('[Inspections] Update inspection error:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

/**
 * DELETE /api/inspections/:id
 * Delete an inspection and all associated photos/audio
 * Requires authentication and ownership
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const ownershipCheck = await query(
      'SELECT id FROM inspections WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this inspection' });
    }

    console.log(`[Inspections] Deleting inspection ${id} for user ${req.user.email}`);

    // Delete will cascade to photos and audio_notes due to foreign key constraints
    await query(
      'DELETE FROM inspections WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('[Inspections] Delete inspection error:', error);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
});

export default router;
