import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/common-issues?make=Honda&model=Civic&year=2017
 * Get common issues for a specific vehicle
 */
router.get('/', async (req, res) => {
  try {
    const { make, model, year } = req.query;

    if (!make || !model || !year) {
      return res.status(400).json({ error: 'Make, model, and year are required' });
    }

    const vehicleYear = parseInt(year);

    console.log(`[Common Issues] Looking up ${year} ${make} ${model}`);

    // Query for issues where the year falls within the range
    const result = await query(
      `SELECT * FROM vehicle_common_issues
       WHERE LOWER(make) = LOWER($1)
       AND LOWER(model) = LOWER($2)
       AND year_start <= $3
       AND year_end >= $3
       ORDER BY
         CASE severity
           WHEN 'Critical' THEN 1
           WHEN 'Major' THEN 2
           WHEN 'Minor' THEN 3
         END,
         affected_percentage DESC`,
      [make, model, vehicleYear]
    );

    const issues = result.rows;

    // Categorize by severity
    const critical = issues.filter(i => i.severity === 'Critical');
    const major = issues.filter(i => i.severity === 'Major');
    const minor = issues.filter(i => i.severity === 'Minor');

    res.json({
      vehicle: {
        make,
        model,
        year: vehicleYear
      },
      totalIssues: issues.length,
      critical: critical.length,
      major: major.length,
      minor: minor.length,
      issues: {
        critical,
        major,
        minor
      },
      allIssues: issues
    });

  } catch (error) {
    console.error('[Common Issues] Lookup error:', error);
    res.status(500).json({ error: 'Failed to retrieve common issues' });
  }
});

/**
 * POST /api/common-issues/search
 * Search for issues by keyword
 */
router.post('/search', async (req, res) => {
  try {
    const { keyword, make, model } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    let queryText = `
      SELECT * FROM vehicle_common_issues
      WHERE to_tsvector('english', issue_name || ' ' || issue_description) @@ plainto_tsquery('english', $1)
    `;
    const params = [keyword];

    if (make) {
      queryText += ` AND LOWER(make) = LOWER($${params.length + 1})`;
      params.push(make);
    }

    if (model) {
      queryText += ` AND LOWER(model) = LOWER($${params.length + 1})`;
      params.push(model);
    }

    queryText += ` ORDER BY affected_percentage DESC LIMIT 20`;

    const result = await query(queryText, params);

    res.json({
      keyword,
      filters: { make, model },
      results: result.rows
    });

  } catch (error) {
    console.error('[Common Issues] Search error:', error);
    res.status(500).json({ error: 'Failed to search issues' });
  }
});

/**
 * GET /api/common-issues/categories
 * Get all issue categories
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT issue_category, COUNT(*) as count
       FROM vehicle_common_issues
       GROUP BY issue_category
       ORDER BY count DESC`
    );

    res.json({
      categories: result.rows
    });

  } catch (error) {
    console.error('[Common Issues] Categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

/**
 * GET /api/common-issues/stats
 * Get overall database statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) FROM vehicle_common_issues');
    const makesResult = await query('SELECT DISTINCT make FROM vehicle_common_issues');
    const severeResult = await query(
      "SELECT COUNT(*) FROM vehicle_common_issues WHERE severity = 'Critical'"
    );

    res.json({
      totalIssues: parseInt(totalResult.rows[0].count),
      totalMakes: makesResult.rows.length,
      criticalIssues: parseInt(severeResult.rows[0].count)
    });

  } catch (error) {
    console.error('[Common Issues] Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default router;
