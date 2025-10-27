-- Add Stripe reference columns to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text,
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text;

-- Create index on lookup_key for faster upserts
CREATE INDEX IF NOT EXISTS idx_subscription_plans_lookup_key 
ON public.subscription_plans(lookup_key);