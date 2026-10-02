-- Migration: Add multi-image support for products and storage bucket setup

-- 1. Add images array (JSONB) to products table for multiple product photos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.images IS 'Array of image URLs for the product gallery, e.g. ["url1", "url2", "url3"]';

-- 2. Create public storage bucket for uploaded media (sliders & product pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('farmik-media', 'farmik-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage access policies for farmik-media bucket
DO $$
BEGIN
  -- Public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for farmik-media'
  ) THEN
    CREATE POLICY "Public Access for farmik-media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'farmik-media');
  END IF;

  -- Authenticated user upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload media'
  ) THEN
    CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'farmik-media');
  END IF;

  -- Authenticated user update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update media'
  ) THEN
    CREATE POLICY "Authenticated users can update media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'farmik-media');
  END IF;

  -- Authenticated user delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete media'
  ) THEN
    CREATE POLICY "Authenticated users can delete media"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'farmik-media');
  END IF;
END $$;
