-- Drop the foreign key constraint on equipment.owner_id if it exists
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_owner_id_fkey;

-- The owner_id will now just be a UUID that references users conceptually
-- but won't have a strict foreign key (since auth.users cannot be referenced directly)
-- This allows seed data and flexibility while RLS policies still protect the data