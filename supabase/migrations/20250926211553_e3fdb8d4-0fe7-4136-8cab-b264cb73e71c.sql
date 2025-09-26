-- Fix user deletion cascade issues by updating foreign key constraints safely

-- Drop existing constraints if they exist and recreate with proper CASCADE behavior
DO $$
BEGIN
    -- Events table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'events_user_id_fkey') THEN
        ALTER TABLE public.events DROP CONSTRAINT events_user_id_fkey;
    END IF;
    ALTER TABLE public.events 
    ADD CONSTRAINT events_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Lessons table  
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lessons_user_id_fkey') THEN
        ALTER TABLE public.lessons DROP CONSTRAINT lessons_user_id_fkey;
    END IF;
    ALTER TABLE public.lessons 
    ADD CONSTRAINT lessons_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Outputs table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'outputs_user_id_fkey') THEN
        ALTER TABLE public.outputs DROP CONSTRAINT outputs_user_id_fkey;
    END IF;
    ALTER TABLE public.outputs 
    ADD CONSTRAINT outputs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Feedback table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_user_id_fkey') THEN
        ALTER TABLE public.feedback DROP CONSTRAINT feedback_user_id_fkey;
    END IF;
    ALTER TABLE public.feedback 
    ADD CONSTRAINT feedback_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Refinements table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'refinements_user_id_fkey') THEN
        ALTER TABLE public.refinements DROP CONSTRAINT refinements_user_id_fkey;
    END IF;
    ALTER TABLE public.refinements 
    ADD CONSTRAINT refinements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Invites created_by
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invites_created_by_fkey') THEN
        ALTER TABLE public.invites DROP CONSTRAINT invites_created_by_fkey;
    END IF;
    ALTER TABLE public.invites 
    ADD CONSTRAINT invites_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Invites claimed_by  
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invites_claimed_by_fkey') THEN
        ALTER TABLE public.invites DROP CONSTRAINT invites_claimed_by_fkey;
    END IF;
    ALTER TABLE public.invites 
    ADD CONSTRAINT invites_claimed_by_fkey 
    FOREIGN KEY (claimed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

END $$;