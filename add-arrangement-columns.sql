-- Add Piano and Keys arrangement columns to the songs table
-- Run this in your Supabase SQL editor

-- Add has_piano_arrangement column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'has_piano_arrangement') 
    THEN
        ALTER TABLE songs ADD COLUMN has_piano_arrangement BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added has_piano_arrangement column';
    ELSE
        RAISE NOTICE 'has_piano_arrangement column already exists';
    END IF;
END $$;

-- Add has_keys_arrangement column if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'has_keys_arrangement')
    THEN
        ALTER TABLE songs ADD COLUMN has_keys_arrangement BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added has_keys_arrangement column';
    ELSE
        RAISE NOTICE 'has_keys_arrangement column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'songs' 
  AND column_name IN ('has_piano_arrangement', 'has_keys_arrangement')
ORDER BY column_name;
