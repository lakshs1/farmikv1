import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  twitterCard?: string;
}

export const useSeo = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  canonicalUrl,
  twitterCard = "summary_large_image",
}: SeoProps) => {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes("Farmik Oils") ? title : `${title} | Farmik Oils`;
    document.title = formattedTitle;

    // Helper to get or create a meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper to get or create a link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Update Meta Description
    if (description) {
      setMetaTag("name", "description", description);
    }

    // 3. Update Meta Keywords
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 4. Update Open Graph Tags
    setMetaTag("property", "og:title", ogTitle || formattedTitle);
    if (description || ogDescription) {
      setMetaTag("property", "og:description", ogDescription || description || "");
    }
    setMetaTag("property", "og:type", ogType);
    if (ogImage) {
      setMetaTag("property", "og:image", ogImage);
    }
    const currentHref = canonicalUrl || window.location.href;
    setMetaTag("property", "og:url", currentHref);

    // 5. Update Twitter Card Tags
    setMetaTag("name", "twitter:card", twitterCard);
    setMetaTag("name", "twitter:title", ogTitle || formattedTitle);
    if (description || ogDescription) {
      setMetaTag("name", "twitter:description", ogDescription || description || "");
    }
    if (ogImage) {
      setMetaTag("name", "twitter:image", ogImage);
    }

    // 6. Update Canonical URL
    setLinkTag("canonical", currentHref);

    // Optional: Clean up tags when unmounting if necessary,
    // but in SPAs we usually just overwrite them on the next page load.
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, canonicalUrl, twitterCard]);
};
