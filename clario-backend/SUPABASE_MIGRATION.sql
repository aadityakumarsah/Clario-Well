-- Run this in: Supabase Dashboard → SQL Editor → New Query

create table if not exists subscriptions (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id  text,
  stripe_subscription_id text,
  plan                text,         -- 'weekly' | 'monthly' | 'yearly'
  status              text,         -- 'active' | 'trialing' | 'canceled' | 'past_due'
  current_period_end  bigint,       -- Unix timestamp (seconds)
  started_at          bigint        -- Unix timestamp (seconds)
);

-- If table already exists, add started_at column if missing:
alter table subscriptions add column if not exists started_at bigint;

-- Row-level security: users can only read their own row
alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Service role (backend) bypasses RLS automatically — no extra policy needed.
