-- Migration: Add Offers, Sliders, and Promo Codes System
-- Run this in your Supabase SQL Editor if needed

-- 1. Create Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    banner_url TEXT,
    badge_text TEXT DEFAULT 'Special Offer',
    discount_percentage NUMERIC DEFAULT 0,
    promo_code TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Sliders Table
CREATE TABLE IF NOT EXISTS public.sliders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    badge_text TEXT DEFAULT 'Limited Deal',
    button_text TEXT DEFAULT 'Shop Now',
    link_url TEXT,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Add MRP and Discount Percentage to products if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'mrp'
    ) THEN 
        ALTER TABLE public.products ADD COLUMN mrp NUMERIC;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'discount_percentage'
    ) THEN 
        ALTER TABLE public.products ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Public can view active sliders" ON public.sliders;
DROP POLICY IF EXISTS "Admins can manage sliders" ON public.sliders;
DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;

-- Policies for Offers
CREATE POLICY "Public can view active offers"
ON public.offers FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Policies for Sliders
CREATE POLICY "Public can view active sliders"
ON public.sliders FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Admins can manage sliders"
ON public.sliders FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Policies for Promo Codes
CREATE POLICY "Public can view active promo codes"
ON public.promo_codes FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Grant table access
GRANT ALL ON TABLE public.offers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sliders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.promo_codes TO anon, authenticated, service_role;

-- Seed initial Offers
INSERT INTO public.offers (id, title, subtitle, description, banner_url, badge_text, discount_percentage, promo_code)
VALUES 
(
  'c1111111-1111-1111-1111-111111111111',
  'Festive Harvest Special — Flat 25% Off',
  'Celebrate healthy cooking with fresh wood-pressed oils',
  'Get an instant 25% discount on our entire collection of authentic wooden-press oils. Extracted at room temperature with zero heat or additives.',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=1200',
  'Mega Harvest Deal',
  25,
  'HARVEST25'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Welcome to Pure Living — Flat ₹100 Off',
  'Special introductory offer on orders above ₹599',
  'Experience the difference of authentic single-origin kachi ghani mustard oil. Use code FARMIK100 at checkout.',
  'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=1200',
  'New User Exclusive',
  15,
  'FARMIK100'
)
ON CONFLICT (id) DO NOTHING;

-- Seed initial Promo Codes
INSERT INTO public.promo_codes (code, offer_id, discount_type, discount_value, min_order_amount, is_active)
VALUES 
('HARVEST25', 'c1111111-1111-1111-1111-111111111111', 'percentage', 25, 499, true),
('FARMIK100', 'c2222222-2222-2222-2222-222222222222', 'fixed', 100, 599, true),
('FARMIK10', NULL, 'percentage', 10, 299, true),
('WELCOME15', NULL, 'percentage', 15, 399, true)
ON CONFLICT (code) DO NOTHING;

-- Seed initial Sliders
INSERT INTO public.sliders (id, title, subtitle, description, image_url, badge_text, button_text, link_url, offer_id, display_order, is_active)
VALUES 
(
  's1111111-1111-1111-1111-111111111111',
  'Pure Cold-Pressed Mustard Oil (Kachi Ghani)',
  'Traditional wooden press method. 100% natural aroma & unrefined nutrients.',
  'Zero chemicals, zero hexane, and slow ambient pressing. Bring true health back to your kitchen.',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=1400',
  '🔥 Bestseller Offer',
  'Claim 25% Off',
  '/offers/c1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  1,
  true
),
(
  's2222222-2222-2222-2222-222222222222',
  'Heritage 5L Kitchen Canister Bundle',
  'Economical family pack with authentic farm freshness guaranteed.',
  'Packed securely in food-grade canisters. Extra savings with code FARMIK100 on your first order.',
  'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=1400',
  '✨ Family Value Pack',
  'View Canister Deal',
  '/offers/c2222222-2222-2222-2222-222222222222',
  'c2222222-2222-2222-2222-222222222222',
  2,
  true
),
(
  's3333333-3333-3333-3333-333333333333',
  'Organic Yellow Mustard & Sesame Oils',
  'Delicate aroma & rich antioxidant profile for gourmet cooking.',
  'Explore our premium wood-pressed specialty cooking and massage oils.',
  'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=1400',
  '🌿 Pure & Organic',
  'Shop Specialty Oils',
  '/products',
  NULL,
  3,
  true
)
ON CONFLICT (id) DO NOTHING;
