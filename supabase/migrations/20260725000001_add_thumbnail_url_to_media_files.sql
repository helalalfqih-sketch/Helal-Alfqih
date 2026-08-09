-- Migration: Add thumbnail_url to media_files table if not exists
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS thumbnail_url text;
