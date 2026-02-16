-- 1. Create coworking_users table (مع التعديل الجديد)
CREATE TABLE public.coworking_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hour_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscription_expiry TIMESTAMP WITH TIME ZONE -- <--- تم إضافة هذا السطر بنجاح
);

-- 2. Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.coworking_users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours NUMERIC,
  cost_syp NUMERIC,
  cost_usd NUMERIC,
  deducted_from_balance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT
);

-- 3. Create balance_transactions table
CREATE TABLE public.balance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.coworking_users(id) ON DELETE CASCADE,
  hours_added NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.coworking_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (allow all operations since it's a single-operator system)
CREATE POLICY "Allow all access to coworking_users" ON public.coworking_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to balance_transactions" ON public.balance_transactions FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable realtime for sessions (live timer updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- 7. Create indexes for performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_active ON public.sessions(user_id) WHERE end_time IS NULL;
CREATE INDEX idx_balance_transactions_user_id ON public.balance_transactions(user_id);