-- Migration: Add missing user columns for Phase 2C
-- Adds company_name, phone, and subscription_status columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
