-- This file will be executed when the database is reset
-- It's useful for adding initial data or test data

-- Note: This seed file will only run if there are no users in the system
-- The actual user data will be created when users sign up through the auth system

-- You can add any initial data here that should be available to all users
-- For example, default categories, system settings, etc.

-- Example: Insert some default transaction categories (if needed)
-- INSERT INTO transaction_categories (name, description) VALUES 
-- ('shopping', 'General shopping purchases'),
-- ('food', 'Grocery and food items'),
-- ('transport', 'Transportation costs'),
-- ('bills', 'Bills and utilities'),
-- ('dining', 'Restaurant and dining out'),
-- ('entertainment', 'Entertainment and leisure'),
-- ('health', 'Health and medical expenses'),
-- ('income', 'Income and earnings');

-- The user-specific data (accounts, transactions, goals) will be created
-- automatically when users sign up through the handle_new_user() function
