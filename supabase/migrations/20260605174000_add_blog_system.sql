-- Supabase Migration: SEO-First Blog Platform for myfarmik.com

-- 1. Create Blog Authors Table
CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_authors
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- 2. Create Blog Categories Table
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- 3. Create Blog Posts Table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMP WITH TIME ZONE,
  reading_time INTEGER NOT NULL DEFAULT 1,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  meta_description TEXT,
  faq JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 4. Create Blog Tags Table
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_tags
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- 5. Create Blog Posts Tags Join Table
CREATE TABLE public.blog_posts_tags (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Enable RLS on blog_posts_tags
ALTER TABLE public.blog_posts_tags ENABLE ROW LEVEL SECURITY;

-- 6. Attach Update triggers for updated_at
CREATE TRIGGER update_blog_authors_updated_at
  BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Define RLS Policies

-- Select Policies (Anyone can view published posts, and categories/authors/tags)
CREATE POLICY "Anyone can view authors" 
  ON public.blog_authors FOR SELECT USING (true);

CREATE POLICY "Anyone can view categories" 
  ON public.blog_categories FOR SELECT USING (true);

CREATE POLICY "Anyone can view published blog posts" 
  ON public.blog_posts FOR SELECT 
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "Admins can view all posts including drafts" 
  ON public.blog_posts FOR SELECT 
  USING (public.get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Anyone can view tags" 
  ON public.blog_tags FOR SELECT USING (true);

CREATE POLICY "Anyone can view post-tag links" 
  ON public.blog_posts_tags FOR SELECT USING (true);

-- Admin Management Policies (Admins can perform any write operations)
CREATE POLICY "Admins can manage authors" 
  ON public.blog_authors FOR ALL 
  USING (public.get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage categories" 
  ON public.blog_categories FOR ALL 
  USING (public.get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage blog posts" 
  ON public.blog_posts FOR ALL 
  USING (public.get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage tags" 
  ON public.blog_tags FOR ALL 
  USING (public.get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage post-tag links" 
  ON public.blog_posts_tags FOR ALL 
  USING (public.get_current_user_role() = 'admin'::user_role);


-- 8. Seed Sample Data

-- Authors
INSERT INTO public.blog_authors (id, name, slug, bio, avatar_url, facebook_url, twitter_url, instagram_url) VALUES
('a1111111-1111-1111-1111-111111111111', 'Dr. Aarav Mehta', 'dr-aarav-mehta', 'Nutritional scientist and researcher specializing in organic seed oils and traditional dietetics.', '/src/assets/farmik-oils-logo.png', 'https://facebook.com/draarav', 'https://twitter.com/draarav', 'https://instagram.com/draarav');

-- Categories
INSERT INTO public.blog_categories (id, name, slug, description, seo_title, meta_description) VALUES
('c1111111-1111-1111-1111-111111111111', 'Cold-Pressed Oils', 'cold-pressed-oils', 'Everything you need to know about the science, extraction, and benefits of unrefined cold-pressed oils.', 'Cold-Pressed Oils: Nutritional Guides & Cooking Benefits', 'Discover why cold-pressed wood-extracted oils are the healthier alternative to refined oils. Read expert guides and chemical comparisons.'),
('c2222222-2222-2222-2222-222222222222', 'Mustard Oil', 'mustard-oil', 'In-depth nutritional profiles and wellness secrets of premium wood-pressed mustard oil.', 'Cold-Pressed Mustard Oil: Health Benefits & Culinary Uses', 'Unlock the benefits of Kachi Ghani cold-pressed mustard oil. Rich in Omega-3 and natural MUFA. Perfect for daily Indian cooking.'),
('c3333333-3333-3333-3333-333333333333', 'Groundnut Oil', 'groundnut-oil', 'Guides on using pure wood-pressed groundnut oil for healthy deep frying and cooking.', 'Wood-Pressed Groundnut Oil: Cooking & Deep Frying Benefits', 'Learn about wood-pressed groundnut oil, its high smoke point, healthy fats, and heart-friendly plant sterols for your kitchen.'),
('c4444444-4444-4444-4444-444444444444', 'Coconut Oil', 'coconut-oil', 'Discover the therapeutic and skincare benefits of virgin cold-pressed coconut oil.', 'Cold-Pressed Coconut Oil: Skincare, Hair Care & Edible Uses', 'Explore the versatility of cold-pressed coconut oil, rich in medium-chain triglycerides (MCTs) for metabolism, skin, and hair health.'),
('c5555555-5555-5555-5555-555555555555', 'Sesame Oil', 'sesame-oil', 'Ayurvedic rituals and therapeutic uses of traditional cold-pressed sesame oil.', 'Cold-Pressed Sesame Oil: Ayurvedic Benefits & Sesame Seeds Science', 'Dive into traditional sesame oil, rich in antioxidants, excellent for sesame oil pulling, cooking, and body massage.');

-- Tags
INSERT INTO public.blog_tags (id, name, slug) VALUES
('d1111111-1111-1111-1111-111111111111', 'Heart Health', 'heart-health'),
('d2222222-2222-2222-2222-222222222222', 'Kachi Ghani', 'kachi-ghani'),
('d3333333-3333-3333-3333-333333333333', 'Refined vs Cold-Pressed', 'refined-vs-cold-pressed'),
('d4444444-4444-4444-4444-444444444444', 'Ayurveda', 'ayurveda'),
('d5555555-5555-5555-5555-555555555555', 'Cooking Tips', 'cooking-tips');

-- Blog Posts
INSERT INTO public.blog_posts (id, title, slug, content, excerpt, featured_image, author_id, category_id, status, published_at, reading_time, is_featured, seo_title, meta_description, faq) VALUES
(
  'e1111111-1111-1111-1111-111111111111',
  'Why Cold-Pressed Mustard Oil is a Superfood for Your Heart',
  'why-cold-pressed-mustard-oil-is-a-superfood-for-your-heart',
  '# Why Cold-Pressed Mustard Oil is a Superfood for Your Heart

For centuries, mustard oil has been a staple in traditional Indian kitchens. From flavoring pickles to cooking rich curries, this oil is legendary. But did you know that modern nutrition science fully supports the use of traditional **cold-pressed mustard oil** as a heart-healthy superfood?

Let’s dive into the science behind Kachi Ghani mustard oil, its extraction process, and why it outperforms refined seed oils.

---

## 1. What Makes Cold-Pressed Mustard Oil Different?

In traditional extraction, mustard seeds are crushed at room temperature in wooden churns (called *Kohlu* or *Ghani*). Because no heat or chemical solvent (like hexane) is applied during this cold-press extraction:
* **Natural Antioxidants** (like Vitamin E) are fully preserved.
* **Allyl Isothiocyanate (AITC)**, the compound responsible for its pungent flavor and antibacterial properties, remains stable.
* There is **zero solvent residue**, resulting in a 100% pure product.

---

## 2. The Heart-Healthy Fatty Acid Profile

Mustard oil has an optimal ratio of Monounsaturated Fatty Acids (MUFA) and Polyunsaturated Fatty Acids (PUFA), which are crucial for maintaining healthy cholesterol levels:
1. **Rich in MUFA**: Oleic acid and erucic acid help reduce low-density lipoprotein (LDL or "bad" cholesterol) and improve high-density lipoprotein (HDL or "good" cholesterol).
2. **Perfect Omega-3 to Omega-6 Ratio**: An imbalance of these essential fatty acids promotes inflammation. Cold-pressed mustard oil offers a highly balanced composition, keeping inflammation in check.

---

## 3. High Smoke Point: Perfect for Cooking

Many healthy oils (like extra virgin olive oil) decompose at high cooking temperatures, creating free radicals. In contrast, mustard oil has a high smoke point of **250°C (482°F)**. This makes it extremely stable for deep frying, sautéing, and typical high-heat Indian cooking methods.

---

## Conclusion: Make the Switch Today

Switching from chemically refined oils to pure, cold-pressed mustard oil is one of the simplest and most impactful adjustments you can make for your heart. Make sure you choose certified unrefined, wood-pressed products like **Farmik Premium Cold-Pressed Mustard Oil** to enjoy these benefits fully.',
  'Discover the scientific reasons why traditional cold-pressed mustard oil is a heart-healthy superfood, detailing its extraction, fatty acid profile, and high smoke point.',
  '/src/assets/mustard-oil-product.jpg',
  'a1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'published',
  '2026-06-01T09:00:00+05:30',
  5,
  true,
  'Why Cold-Pressed Mustard Oil is a Superfood for Your Heart | Farmik',
  'Discover the health benefits of cold-pressed mustard oil. Learn why its fatty acid ratio, high smoke point, and traditional extraction make it a true heart-healthy superfood.',
  '[
    {
      "question": "Is mustard oil safe for daily cooking?",
      "answer": "Yes. Due to its balanced ratio of MUFA and PUFA and high smoke point (250°C), it is ideal for high-heat cooking and daily use."
    },
    {
      "question": "What is Kachi Ghani?",
      "answer": "Kachi Ghani refers to the traditional cold-pressing method where seeds are crushed slowly in a wooden pestle without heat or chemicals."
    }
  ]'::jsonb
),
(
  'e2222222-2222-2222-2222-222222222222',
  'The Ultimate Guide to Cold-Pressed vs. Refined Oils',
  'the-ultimate-guide-to-cold-pressed-vs-refined-oils',
  '# The Ultimate Guide to Cold-Pressed vs. Refined Oils

Walk down any grocery store aisle, and you’ll see shelves loaded with oils claiming to be "healthy," "light," or "pure." The main distinction you must understand is the difference between **cold-pressed oils** and **refined oils**. 

This comprehensive guide compares the extraction, nutrient retention, chemical involvement, and health impact of both oils.

---

## 1. Extraction Methods: How Are They Made?

### Refined Oils
Refined oils are extracted using extreme heat (up to 200°C) and chemical solvents (usually petroleum-derived Hexane) to squeeze out the maximum volume from seeds. 
To make it palatable, it undergoes a harsh refining process:
* **Degumming**: Removing natural phospholipids.
* **Neutralization**: Treating with caustic soda (sodium hydroxide) to remove free fatty acids.
* **Bleaching**: Using acid-activated clays to strip color.
* **Deodorization**: High-temperature vacuum steam processing to remove natural odors.

### Cold-Pressed Oils
Cold-pressed oils are extracted mechanically by pressing the seeds in a wooden or steel expeller. The temperature is strictly maintained below 49°C (120°F). No chemical solvents, refining agents, or preservatives are added. It is filtered naturally through sedimentation and immediately bottled.

---

## 2. Nutrient Comparison Table

| Feature | Cold-Pressed Oils | Refined Oils |
| :--- | :--- | :--- |
| **Nutrient Value** | High (Vitamins & bioactive compounds intact) | Low (Destroyed during thermal processing) |
| **Trans Fats** | 0% | Can be present due to high heat processing |
| **Chemical Additives** | None | Solvent residues, bleaching elements, preservatives |
| **Shelf Life** | Moderate (Natural antioxidants stabilize it) | Long (Artificial preservatives added) |

---

## 3. How to Choose

If your goal is nutritional health, cellular rejuvenation, and flavor, **cold-pressed unrefined oils** are the clear winner. Refined oils might be cheaper and have longer shelf lives, but they lack the biological nutrients your body needs.',
  'Confused between cold-pressed and refined oils? Our complete engineering comparison details nutrient profiles, extraction methodologies, and culinary uses.',
  '/src/assets/mustard-oil-product.jpg',
  'a1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  'published',
  '2026-06-02T10:00:00+05:30',
  6,
  false,
  'Cold-Pressed vs Refined Oils: The Ultimate Comparison Guide | Farmik',
  'Unpack the differences between cold-pressed and refined cooking oils. We compare extraction techniques, chemical residues, and nutritional integrity.',
  '[
    {
      "question": "Do cold-pressed oils spoil faster than refined oils?",
      "answer": "Yes, because they contain no chemical preservatives. However, their natural Vitamin E content acts as a stabilizer, keeping them fresh for 6-9 months when stored in a cool, dark place."
    }
  ]'::jsonb
);

-- Link Posts to Tags
INSERT INTO public.blog_posts_tags (post_id, tag_id) VALUES
('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111'),
('e1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222'),
('e2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333'),
('e2222222-2222-2222-2222-222222222222', 'd5555555-5555-5555-5555-555555555555');
