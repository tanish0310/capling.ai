-- Add justification system to transactions table
ALTER TABLE transactions 
ADD COLUMN justification TEXT,
ADD COLUMN justification_status TEXT DEFAULT 'none' CHECK (justification_status IN ('none', 'pending', 'justified', 'rejected')),
ADD COLUMN original_classification TEXT,
ADD COLUMN final_classification TEXT;

-- Update existing transactions to have proper classification values
UPDATE transactions 
SET original_classification = classification,
    final_classification = classification
WHERE original_classification IS NULL;

-- Create index for better performance on justification queries
CREATE INDEX idx_transactions_justification_status ON transactions(justification_status);
CREATE INDEX idx_transactions_user_justification ON transactions(user_id, justification_status);