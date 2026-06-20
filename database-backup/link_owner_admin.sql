-- Link project owner admin account after Neon Auth migration.
-- Run once if automatic relink on sign-in did not run yet.
--
-- Replace NEW_NEON_AUTH_USER_ID with the `sub` from your Neon Auth JWT
-- (Neon Console → Auth → Users, or browser devtools after admin sign-in).

UPDATE users
SET
  auth_user_id = 'NEW_NEON_AUTH_USER_ID',
  role = 'admin',
  email = 'mkm114174@gmail.com',
  updated_at = NOW()
WHERE email ILIKE 'mkm114174@gmail.com'
   OR auth_user_id = 'user_3FB0xo2X503nkmIpusfuPy4o5IG';

-- Verify:
-- SELECT id, auth_user_id, email, role FROM users WHERE email ILIKE 'mkm114174@gmail.com';
