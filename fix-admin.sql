-- Delete existing admin user if exists
DELETE FROM profiles WHERE email = 'admin@feedback.com';
DELETE FROM users WHERE email = 'admin@feedback.com';

-- Insert admin user with correct password hash
SET @admin_id = '550e8400-e29b-41d4-a716-446655440000';
INSERT INTO users (id, email, password_hash) 
VALUES (@admin_id, 'admin@feedback.com', '$2b$10$puJ9JggMi8VmQFonOsvX3.n1VAcGFO.4m.uX9rBvbSglzHZSyKPOC');

-- Create admin profile
INSERT INTO profiles (id, first_name, last_name, is_admin, email)
VALUES (@admin_id, 'Admin', 'User', TRUE, 'admin@feedback.com');
