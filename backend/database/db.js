// Compatibility shim — re-exports from the canonical database module
export { query, getClient } from '../config/database.js';
import pool from '../config/database.js';
export { pool };
