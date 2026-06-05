-- Fix frozen reset_date for annual subscribers whose reset_date is
-- more than 30 days in the future (seeded to annual billing boundary,
-- never advanced monthly as intended).
UPDATE user_subscriptions
SET reset_date = NOW() + INTERVAL '30 days',
    lessons_used = 0
WHERE billing_interval = 'year'
  AND reset_date > NOW() + INTERVAL '30 days';
