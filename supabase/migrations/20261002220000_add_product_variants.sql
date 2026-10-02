-- Add variants column to products table
-- Allows storing pack sizes like 500ml, 1L, 5L with their respective pricing and stock

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.variants IS 'Array of product variants/sizes, e.g. [{"size": "500ml", "mrp": 210, "price": 168, "discount_percentage": 20, "stock_quantity": 50}, {"size": "1L", "mrp": 420, "price": 336, "discount_percentage": 20, "stock_quantity": 100}, {"size": "5L", "mrp": 1899, "price": 1595, "discount_percentage": 16, "stock_quantity": 25}]';
