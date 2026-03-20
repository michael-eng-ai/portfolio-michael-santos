-- Add column to track which news items have been posted to X
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS posted_to_x_at timestamptz;
