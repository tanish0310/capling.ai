-- Add improvement_suggestion column to transactions table
-- This will store actionable advice from the LLM when transactions are classified as irresponsible

ALTER TABLE transactions 
ADD COLUMN improvement_suggestion TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN transactions.improvement_suggestion IS 'Actionable improvement suggestion from LLM analysis, typically provided for irresponsible or neutral transactions';