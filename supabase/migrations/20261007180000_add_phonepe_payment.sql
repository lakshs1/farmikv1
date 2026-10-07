-- Migration: Add PhonePe payment gateway support
-- Adds new columns to orders table and creates payment_logs table

-- ── Add new columns to orders ─────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gateway       TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS phonepe_order_id      TEXT,
  ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at   TIMESTAMP WITH TIME ZONE;

-- ── Payment logs table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_ref               TEXT,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gateway                 TEXT NOT NULL DEFAULT 'phonepe',
  payment_status          TEXT NOT NULL,
  phonepe_transaction_id  TEXT,
  raw_response            TEXT,
  callback_params         TEXT,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_logs
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all payment logs
CREATE POLICY "Admins can view payment logs"
  ON public.payment_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (edge functions) can insert
CREATE POLICY "Service role can insert payment logs"
  ON public.payment_logs FOR INSERT
  WITH CHECK (true);

-- Allow users to see their own payment logs
CREATE POLICY "Users can view their own payment logs"
  ON public.payment_logs FOR SELECT
  USING (user_id = auth.uid());

-- Allow service role full access to orders (for edge function callbacks)
CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON public.orders(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
