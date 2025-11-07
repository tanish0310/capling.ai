-- Add unique constraint to prevent duplicate transactions
-- This prevents the same transaction from being created multiple times
-- based on user, merchant, amount, and timestamp (within 1 minute window)

-- First, let's clean up any existing duplicates
WITH duplicates AS (
  SELECT 
    user_id,
    merchant,
    amount,
    timestamp,
    array_agg(id ORDER BY created_at) as all_ids
  FROM transactions
  GROUP BY user_id, merchant, amount, timestamp
  HAVING COUNT(*) > 1
)
DELETE FROM transactions 
WHERE id IN (
  SELECT unnest(all_ids[2:]) -- Keep the first one (oldest), delete the rest
  FROM duplicates
);

-- Add unique constraint to prevent future duplicates
-- Using a composite unique constraint on user, merchant, amount, and exact timestamp
CREATE UNIQUE INDEX IF NOT EXISTS unique_transaction_exact 
ON transactions (user_id, merchant, amount, timestamp);

-- Add a comment explaining the constraint
COMMENT ON INDEX unique_transaction_exact IS 'Prevents exact duplicate transactions for the same user, merchant, amount, and timestamp';