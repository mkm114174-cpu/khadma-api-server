# Neon PostgreSQL migration (run once on your Neon branch)
# Renames legacy Clerk column to Neon Auth user id column.
ALTER TABLE IF EXISTS public.users
  RENAME COLUMN clerk_user_id TO auth_user_id;
