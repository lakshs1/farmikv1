import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, BookOpen, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/useSeo";

interface Author {
  name: string;
  slug: string;
  avatar_url: string | null;
}

interface Category {
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  meta_description: string | null;
}

interface Tag {
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  published_at: string | null;
  reading_time: number;
  is_featured: boolean;
  seo_title: string | null;
  meta_description: string | null;
  author: Author | null;
  category: Category | null;
  tags: Tag[];
}

export const BlogList = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 1. Fetch Categories & Tags
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data: catData } = await supabase
          .from("blog_categories")
          .select("name, slug, description, seo_title, meta_description");
        setCategories(catData || []);

        const { data: tagData } = await supabase
          .from("blog_tags")
          .select("name, slug");
        setTags(tagData || []);
      } catch (err) {
        console.error("Error fetching blog metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Fetch Blog Posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Build base query
        let query = supabase
          .from("blog_posts")
          .select(`
            id,
            title,
            slug,
            excerpt,
            content,
            featured_image,
            published_at,
            reading_time,
            is_featured,
            seo_title,
            meta_description,
            author:blog_authors(name, slug, avatar_url),
            category:blog_categories(name, slug, description),
            post_tags:blog_posts_tags(tag:blog_tags(name, slug))
          `)
          .eq("status", "published")
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        // Map join tables structure into simple array tags
        const formattedPosts: BlogPost[] = (data || []).map((post: any) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image: post.featured_image,
          published_at: post.published_at,
          reading_time: post.reading_time,
          is_featured: post.is_featured,
          seo_title: post.seo_title,
          meta_description: post.meta_description,
          author: post.author ? {
            name: post.author.name,
            slug: post.author.slug,
            avatar_url: post.author.avatar_url
          } : null,
          category: post.category ? {
            name: post.category.name,
            slug: post.category.slug,
            description: post.category.description,
            seo_title: null,
            meta_description: null
          } : null,
          tags: post.post_tags
            ? post.post_tags
                .map((pt: any) => pt.tag)
                .filter((t: any) => t !== null)
            : []
        }));

        setPosts(formattedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // 3. Find Selected Category Information
  const currentCategory = categories.find(c => c.slug === categorySlug);

  // 4. Filter Posts based on Category, Search & Tag
  const filteredPosts = posts.filter(post => {
    const matchesCategory = categorySlug ? post.category?.slug === categorySlug : true;
    const matchesTag = selectedTag ? post.tags.some(t => t.slug === selectedTag) : true;
    const matchesSearch = searchQuery
      ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesTag && matchesSearch;
  });

  const featuredPost = filteredPosts.find(p => p.is_featured) || filteredPosts[0];
  const remainingPosts = featuredPost 
    ? filteredPosts.filter(p => p.id !== featuredPost.id)
    : filteredPosts;

  // 5. Dynamic SEO Meta Configuration
  const seoTitle = currentCategory?.seo_title || (categorySlug ? `${currentCategory?.name || "Category"} - Farmik Oils Blog` : "Healthy Living Blog - Cold Pressed Oils Guides");
  const seoDescription = currentCategory?.meta_description || "Read expert articles on organic cold-pressed mustard oil, groundnut oil, skincare remedies, and Ayurvedic practices.";

  useSeo({
    title: seoTitle,
    description: seoDescription,
    keywords: "cold pressed oil benefits, mustard oil health, wooden kachi ghani, coconut oil skin, sesame pulling, farmik blog",
    canonicalUrl: categorySlug 
      ? `https://myfarmik.com/blog/category/${categorySlug}` 
      : "https://myfarmik.com/blog"
  });

  const handleCategoryClick = (slug: string | null) => {
    setSelectedTag(null);
    if (slug) {
      navigate(`/blog/category/${slug}`);
    } else {
      navigate("/blog");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm font-medium">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            Farmik Wellness Journal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {currentCategory ? `${currentCategory.name} Guides` : "The Organic Oil Chronicle"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {currentCategory?.description || "Scientific insights, traditional cooking methods, and Ayurvedic benefits of premium wood-pressed and organic cold-pressed seed oils."}
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto mt-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search articles by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 shadow-sm rounded-full bg-card"
            />
          </div>
        </div>
      </section>

      {/* Category Pills Navigation */}
      <div className="border-b border-border bg-card/50 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={!categorySlug ? "default" : "ghost"}
            size="sm"
            onClick={() => handleCategoryClick(null)}
            className="rounded-full flex-shrink-0"
          >
            All Articles
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.slug}
              variant={categorySlug === cat.slug ? "default" : "ghost"}
              size="sm"
              onClick={() => handleCategoryClick(cat.slug)}
              className="rounded-full flex-shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* Tag Filter Status Indicator */}
            {selectedTag && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-sm">Filtering articles containing tag: <strong className="text-primary">#{selectedTag}</strong></span>
                <Button variant="ghost" size="xs" onClick={() => setSelectedTag(null)}>Clear Filter</Button>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No articles found</h3>
                <p className="text-muted-foreground text-sm mt-1">Try checking another category or clearing search terms.</p>
              </div>
            ) : (
              <>
                {/* 1. Featured Spotlight Post */}
                {!selectedTag && !searchQuery && featuredPost && (
                  <article className="group overflow-hidden rounded-2xl border bg-card shadow-card hover:shadow-lg transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto overflow-hidden relative min-h-[300px]">
                        <img
                          src={featuredPost.featured_image || "/src/assets/mustard-oil-product.jpg"}
                          alt={featuredPost.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            {featuredPost.category && (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                {featuredPost.category.name}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-accent text-accent">
                              Featured Spotlight
                            </Badge>
                          </div>
                          
                          <Link to={`/blog/${featuredPost.slug}`}>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                              {featuredPost.title}
                            </h2>
                          </Link>

                          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{featuredPost.author?.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : ""}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {featuredPost.reading_time} min read
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                {/* 2. Grid list of subsequent articles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {remainingPosts.map((post) => (
                    <article key={post.id} className="group flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={post.featured_image || "/src/assets/mustard-oil-product.jpg"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {post.category && (
                              <span className="text-xs text-primary font-bold tracking-wider uppercase">
                                {post.category.name}
                              </span>
                            )}
                          </div>
                          
                          <Link to={`/blog/${post.slug}`}>
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </h3>
                          </Link>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between text-xxs text-muted-foreground">
                          <span>By {post.author?.name}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time}m read
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Tag Cloud Card */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Filter by Topic</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.slug}
                      variant={selectedTag === tag.slug ? "default" : "secondary"}
                      onClick={() => setSelectedTag(selectedTag === tag.slug ? null : tag.slug)}
                      className="cursor-pointer hover:opacity-85 transition-opacity py-1 rounded-md text-xs"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Subscription Box */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-base">Subscribe to Farmik Letters</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join 15,000+ wellness lovers. Receive scientific cooking oil metrics, heart recipes, and direct farm updates monthly.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); alert("Subscription successful!"); }} className="space-y-2">
                  <Input type="email" placeholder="Enter your email" required className="bg-card text-xs h-10" />
                  <Button type="submit" className="w-full text-xs h-10">Subscribe</Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BlogList;
