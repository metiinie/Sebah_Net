/*
  # Add Rating Column to Music Table
  
  This migration adds a rating column to the music table to match the movies table.
*/

-- Add rating column to music table
ALTER TABLE music 
ADD COLUMN rating decimal(3,1) CHECK (rating >= 0 AND rating <= 10);

-- Add comment for documentation
COMMENT ON COLUMN music.rating IS 'Rating from 0 to 10 for music tracks';
