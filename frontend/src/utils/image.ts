/**
 * Product Image Resolution and Contextual Fallback Utilities
 */

// Category fallback images
const CATEGORY_FALLBACKS: Record<string, string> = {
  Electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  Apparel: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  Accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  Home: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
  General: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
};

// Keyword-based fallback images to match specific product types
const KEYWORD_FALLBACKS: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['bat', 'cricket', 'ball', 'sports'],
    url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['jacket', 'coat', 'blazer', 'hoodie', 'outerwear'],
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['shirt', 't-shirt', 'cotton', 'solid cotten', 'deemoon'],
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pant', 'pants', 'trouser', 'formal pants', 'lycra', 'jeans'],
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['tie', 'striped tie', 'pocket square', 'cufflinks', 'gusleson'],
    url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['purifier', 'air purifier', 'honeywell', 'filtration'],
    url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['karcher', 'vacuum', 'pressure washer', 'cleaner'],
    url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['headphone', 'headset', 'audio', 'sound', 'speaker', 'dac', 'wireless'],
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['watch', 'smartwatch', 'wrist', 'timepiece'],
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Returns a high-quality contextual fallback image based on product name and category
 */
export function getProductFallbackImage(name?: string, category?: string): string {
  const text = `${name || ''} ${category || ''}`.toLowerCase();

  for (const item of KEYWORD_FALLBACKS) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      return item.url;
    }
  }

  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }

  return CATEGORY_FALLBACKS.General;
}

/**
 * Normalizes any product image URL:
 * - Directs local /uploads/ URLs to the configured API_BASE_URL
 * - Handles relative paths (/uploads/... or uploads/...)
 * - Preserves external CDN URLs (Unsplash, Zara, Swiggy, etc.)
 * - Falls back to a contextual image if URL is missing
 */
export function resolveImageUrl(url?: string | null, name?: string, category?: string): string {
  const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000').replace(/\/+$/, '');

  if (!url || typeof url !== 'string' || !url.trim()) {
    return getProductFallbackImage(name, category);
  }

  const trimmed = url.trim();

  // 1. If already an absolute URL pointing to /uploads/ resource on any localhost/host
  if (trimmed.includes('/uploads/')) {
    const idx = trimmed.indexOf('/uploads/');
    const uploadsPath = trimmed.slice(idx);
    // If it points to /uploads/filename.png without /products/, ensure /products/ is included
    if (uploadsPath.startsWith('/uploads/') && !uploadsPath.startsWith('/uploads/products/')) {
      const rest = uploadsPath.slice('/uploads/'.length);
      return `${apiBaseUrl}/uploads/products/${rest}`;
    }
    return `${apiBaseUrl}${uploadsPath}`;
  }

  // 2. Valid full external URL (http/https/data)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // 3. If it starts with /uploads/products/ or uploads/products/
  if (trimmed.startsWith('/uploads/products/')) {
    return `${apiBaseUrl}${trimmed}`;
  }
  if (trimmed.startsWith('uploads/products/')) {
    return `${apiBaseUrl}/${trimmed}`;
  }

  // 4. If it starts with /uploads/ or uploads/ (e.g. /uploads/filename.png)
  if (trimmed.startsWith('/uploads/')) {
    const rest = trimmed.replace(/^\/uploads\//, '');
    return `${apiBaseUrl}/uploads/products/${rest}`;
  }
  if (trimmed.startsWith('uploads/')) {
    const rest = trimmed.replace(/^uploads\//, '');
    return `${apiBaseUrl}/uploads/products/${rest}`;
  }

  // 5. If it starts with /products/ or products/
  if (trimmed.startsWith('/products/')) {
    return `${apiBaseUrl}/uploads${trimmed}`;
  }
  if (trimmed.startsWith('products/')) {
    return `${apiBaseUrl}/uploads/${trimmed}`;
  }

  // 6. If it's a bare filename or relative path
  const cleanFilename = trimmed.replace(/^\/+/, '');
  return `${apiBaseUrl}/uploads/products/${cleanFilename}`;
}
