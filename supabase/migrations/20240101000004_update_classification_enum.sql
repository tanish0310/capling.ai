-- Update transaction_classification enum to match new values
-- First, add the new values to the enum
ALTER TYPE transaction_classification ADD VALUE 'irresponsible';
ALTER TYPE transaction_classification ADD VALUE 'neutral';

-- Note: PostgreSQL doesn't allow removing enum values directly
-- The old values 'borderline' and 'impulsive' will remain but won't be used
-- This is safe as existing data will still work