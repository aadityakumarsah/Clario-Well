-- Run this in: Supabase Dashboard → SQL Editor → New Query

create table if not exists subscriptions (
  user_id             text primary key,
  stripe_customer_id  text,
  stripe_subscription_id text,
  plan                text,         -- 'weekly' | 'monthly' | 'yearly'
  status              text,         -- 'active' | 'trialing' | 'canceled' | 'past_due'
  current_period_end  bigint        -- Unix timestamp (seconds)
);

-- Row-level security: users can only read their own row
alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid()::text = user_id);

-- Service role (backend) bypasses RLS automatically — no extra policy needed.
