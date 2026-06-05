import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Share2, Facebook, Twitter, Link2, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/useSeo";
import { useJsonLd } from "@/hooks/useJsonLd";

interface Author {
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
}

interface Category {
  name: string;
  slug: string;
}

interface Tag {
  name: string;
  slug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  reading_time: number;
  seo_title: string | null;
  meta_description: string | null;
  faq: FAQItem[] | null;
  author: Author | null;
  category: Category | null;
  tags: Tag[];
}

export const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Post Detail
  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const { data: rawPost, error } = await supabase
          .from("blog_posts")
          .select(`
            id,
            title,
            slug,
            content,
            excerpt,
            featured_image,
            published_at,
            reading_time,
            seo_title,
            meta_description,
            faq,
            author:blog_authors(name, slug, bio, avatar_url, facebook_url, twitter_url, instagram_url),
            category:blog_categories(name, slug),
            post_tags:blog_posts_tags(tag:blog_tags(name, slug))
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (error || !rawPost) {
          console.error("Post not found:", error);
          setPost(null);
          setLoading(false);
          return;
        }

        const formattedPost: BlogPost = {
          id: rawPost.id,
          title: rawPost.title,
          slug: rawPost.slug,
          content: rawPost.content,
          excerpt: rawPost.excerpt,
          featured_image: rawPost.featured_image,
          published_at: rawPost.published_at,
          reading_time: rawPost.reading_time,
          seo_title: rawPost.seo_title,
          meta_description: rawPost.meta_description,
          faq: Array.isArray(rawPost.faq) ? rawPost.faq as FAQItem[] : [],
          author: rawPost.author ? {
            name: rawPost.author.name,
            slug: rawPost.author.slug,
            bio: rawPost.author.bio,
            avatar_url: rawPost.author.avatar_url,
            facebook_url: rawPost.author.facebook_url,
            twitter_url: rawPost.author.twitter_url,
            instagram_url: rawPost.author.instagram_url
          } : null,
          category: rawPost.category ? {
            name: rawPost.category.name,
            slug: rawPost.category.slug
          } : null,
          tags: rawPost.post_tags
            ? rawPost.post_tags
                .map((pt: any) => pt.tag)
                .filter((t: any) => t !== null)
            : []
        };

        setPost(formattedPost);

        // Fetch Related Posts in same category
        if (formattedPost.category) {
          const { data: relData } = await supabase
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
              author:blog_authors(name, slug, avatar_url),
              category:blog_categories(name, slug)
            `)
            .eq("status", "published")
            .eq("category_id", rawPost.category_id)
            .neq("id", formattedPost.id)
            .limit(3);

          const formattedRel: BlogPost[] = (relData || []).map((rel: any) => ({
            id: rel.id,
            title: rel.title,
            slug: rel.slug,
            content: rel.content,
            excerpt: rel.excerpt,
            featured_image: rel.featured_image,
            published_at: rel.published_at,
            reading_time: rel.reading_time,
            seo_title: null,
            meta_description: null,
            faq: [],
            author: rel.author ? { name: rel.author.name, slug: rel.author.slug, bio: null, avatar_url: rel.author.avatar_url, facebook_url: null, twitter_url: null, instagram_url: null } : null,
            category: rel.category ? { name: rel.category.name, slug: rel.category.slug } : null,
            tags: []
          }));
          setRelatedPosts(formattedRel);
        }
      } catch (err) {
        console.error("Error loading blog details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [slug]);

  // 2. Dynamic Table of Contents generation
  const tableOfContents = useMemo(() => {
    if (!post?.content) return [];
    const lines = post.content.split("\n");
    const headers: { text: string; id: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/\*\*|__/g, "");
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        headers.push({ text, id, level });
      }
    });
    return headers;
  }, [post?.content]);

  // 3. Simple custom Markdown HTML Renderer for headings to inject TOC anchors
  const renderedContentHtml = useMemo(() => {
    if (!post?.content) return "";
    let html = post.content;

    // Convert Headings with explicit anchors
    html = html.replace(/^(#{3})\s+(.+)$/gm, (_, hashes, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/\*\*|__/g, "");
      return `<h3 id="${id}" class="text-xl font-bold mt-8 mb-4 text-foreground">${text}</h3>`;
    });

    html = html.replace(/^(#{2})\s+(.+)$/gm, (_, hashes, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/\*\*|__/g, "");
      return `<h2 id="${id}" class="text-2xl font-bold mt-10 mb-4 pb-1 border-b text-foreground">${text}</h2>`;
    });

    // Convert Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert Bullet Lists
    html = html.replace(/^\*\s+(.+)$/gm, '<li class="ml-6 list-disc mb-1">$1</li>');

    // Convert paragraphs (skip lines starting with HTML or markdown structural elements)
    const lines = html.split("\n");
    const finalLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<l") || trimmed.startsWith("---") || trimmed.startsWith("|") || trimmed.startsWith("!")) {
        return line;
      }
      return `<p class="mb-4 leading-relaxed text-muted-foreground text-sm">${line}</p>`;
    });

    return finalLines.join("\n");
  }, [post?.content]);

  // 4. Dynamic SEO configurations
  const pageUrl = `https://myfarmik.com/blog/${slug}`;
  useSeo({
    title: post?.seo_title || post?.title || "Blog Article",
    description: post?.meta_description || post?.excerpt || "Read our educational guides on cold pressed oils.",
    ogImage: post?.featured_image || "https://myfarmik.com/assets/mustard-oil-product.jpg",
    ogType: "article",
    canonicalUrl: pageUrl
  });

  // 5. Schema Structured Data Configuration
  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": pageUrl
    },
    "headline": post.title,
    "description": post.excerpt || post.meta_description,
    "image": post.featured_image || "https://myfarmik.com/assets/mustard-oil-product.jpg",
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "Farmik Oils",
      "url": post.author ? `https://myfarmik.com/blog/author/${post.author.slug}` : "https://myfarmik.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Farmik Oils",
      "logo": {
        "@type": "ImageObject",
        "url": "https://myfarmik.com/assets/farmik-oils-logo.png"
      }
    }
  } : null;

  const breadcrumbSchema = post ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://myfarmik.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://myfarmik.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.category?.name || "Category",
        "item": `https://myfarmik.com/blog/category/${post.category?.slug}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": post.title,
        "item": pageUrl
      }
    ]
  } : null;

  const faqSchema = post && post.faq && post.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  useJsonLd(articleSchema, `blog-posting-${post?.id}`);
  useJsonLd(breadcrumbSchema, `blog-breadcrumb-${post?.id}`);
  useJsonLd(faqSchema, `blog-faq-${post?.id}`);

  // Social Share Helpers
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank");
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post?.title || "")}`, "_blank");
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(pageUrl);
    alert("Article link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm font-medium">Fetching article detail...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6 text-sm">The article you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate("/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Button variant="ghost" onClick={() => navigate("/blog")} className="mb-6 rounded-full hover:bg-muted">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to articles
        </Button>

        {/* Dynamic Breadcrumb Visual */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary">Blog</Link>
          <span>/</span>
          {post.category && (
            <Link to={`/blog/category/${post.category.slug}`} className="hover:text-primary">
              {post.category.name}
            </Link>
          )}
          <span>/</span>
          <span className="text-foreground font-semibold line-clamp-1">{post.title}</span>
        </nav>
      </div>

      {/* Main Core Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header content metadata */}
        <header className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-2 items-center">
            {post.category && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                {post.category.name}
              </Badge>
            )}
            {post.tags.map(tag => (
              <Badge key={tag.slug} variant="outline" className="text-muted-foreground">
                #{tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="font-semibold text-foreground">By {post.author?.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time} min read
            </span>
          </div>
        </header>

        {/* Featured Banner Image */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-10 shadow-md">
          <img
            src={post.featured_image || "/src/assets/mustard-oil-product.jpg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Left Side Dynamic Table of Contents */}
          {tableOfContents.length > 0 && (
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-28 space-y-4 p-4 rounded-xl border bg-card/50">
                <h4 className="font-bold text-sm text-foreground tracking-wider uppercase border-b pb-2">
                  Table of Contents
                </h4>
                <nav className="space-y-2 text-xs">
                  {tableOfContents.map((header) => (
                    <a
                      key={header.id}
                      href={`#${header.id}`}
                      className={`block text-muted-foreground hover:text-primary transition-colors leading-relaxed ${
                        header.level === 3 ? "pl-3 text-xxs font-normal" : "font-medium"
                      }`}
                    >
                      {header.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Core Body Rich Text */}
          <div className={`lg:col-span-${tableOfContents.length > 0 ? "3" : "4"} space-y-6`}>
            
            {/* Table of contents responsive version for small screen layouts */}
            {tableOfContents.length > 0 && (
              <div className="lg:hidden p-4 bg-muted/40 rounded-xl mb-6">
                <h4 className="font-bold text-sm mb-3">Jump to section:</h4>
                <div className="flex flex-wrap gap-2">
                  {tableOfContents.map((header) => (
                    <a
                      key={header.id}
                      href={`#${header.id}`}
                      className="text-xs bg-card border px-2.5 py-1 rounded-md text-muted-foreground hover:text-primary"
                    >
                      {header.text}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown rendered body */}
            <div 
              className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-24"
              dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
            />

            {/* FAQ Accordion Block */}
            {post.faq && post.faq.length > 0 && (
              <div className="mt-12 space-y-4">
                <Separator />
                <h3 className="text-xl font-bold flex items-center gap-2 pt-6">
                  <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
                </h3>
                <div className="space-y-4 mt-4">
                  {post.faq.map((item, idx) => (
                    <Card key={idx} className="border bg-card">
                      <CardContent className="p-5 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground">{item.question}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Social Sharing Footer Bar */}
            <div className="flex flex-wrap items-center justify-between py-6 border-y border-border gap-4 mt-12">
              <span className="text-xs text-muted-foreground">Enjoyed reading? Share this guide.</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={shareOnFacebook} className="h-8 w-8 p-0 rounded-full">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={shareOnTwitter} className="h-8 w-8 p-0 rounded-full">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={copyLinkToClipboard} className="h-8 w-8 p-0 rounded-full">
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Author details card */}
            {post.author && (
              <Card className="border bg-muted/20 mt-10">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {post.author.avatar_url ? (
                        <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{post.author.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                      <h4 className="font-bold text-sm text-foreground">Written by {post.author.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{post.author.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </article>

      {/* Dynamic Related Articles Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/30 border-t border-border mt-20 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold text-foreground mb-8">Related Oil Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <div key={rel.id} className="group bg-card rounded-lg overflow-hidden border hover:shadow-sm transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img src={rel.featured_image || "/src/assets/mustard-oil-product.jpg"} alt={rel.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <Link to={`/blog/${rel.slug}`} className="hover:text-primary transition-colors font-bold text-sm text-foreground line-clamp-2 block leading-snug">
                      {rel.title}
                    </Link>
                    <p className="text-xxs text-muted-foreground line-clamp-2 leading-relaxed">{rel.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default BlogDetail;
