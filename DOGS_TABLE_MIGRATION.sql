-- Optional migration to add is_active column to dogs table if needed
-- Run this in your Supabase SQL Editor if you want to add the is_active column

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dogs' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.dogs 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Update existing dogs to be active by default
        UPDATE public.dogs SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- Add index for better query performance if column was added
CREATE INDEX IF NOT EXISTS idx_dogs_owner_active 
ON dogs(owner_id, is_active) 
WHERE is_active = true;
