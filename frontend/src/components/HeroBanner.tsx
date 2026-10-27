import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import type { Category } from '../types';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';

export const HeroBanner: React.FC = () => {
  const { products, setSelectedCategory, setSearchQuery } = useProducts();

  const handleExplore = (cat: Category) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    const el = document.getElementById('shop-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featuredProduct = products.find((p) => p.featured) || products[0];

  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    setHeroImgError(false);
  }, [featuredProduct?.id, featuredProduct?.imageUrl]);

  const heroImageSrc = heroImgError
    ? getProductFallbackImage(featuredProduct?.name, featuredProduct?.category)
    : resolveImageUrl(featuredProduct?.imageUrl, featuredProduct?.name, featuredProduct?.category);

  return (
    <section className="hero-banner-section">
      <div className="hero-banner-container">
        {/* Left Column: Narrative & CTA */}
        <div className="hero-content">
          <div className="hero-tag-pill">
            <Sparkles size={14} className="hero-sparkle-icon" />
            <span>COLLECTION 2026 // ARCHITECTURAL MINIMALISM</span>
          </div>

          <h1 className="hero-title">
            Objects of <span className="hero-accent-text">clarity</span>, craft, and permanence.
          </h1>

          <p className="hero-description">
            A curated synthesis of Scandinavian precision and Japanese philosophy. Engineered with
            sustainably sourced raw materials, tactile textures, and quiet form.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => handleExplore('All')}
              className="hero-primary-btn"
            >
              <span>Explore Collection</span>
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => handleExplore('Electronics')}
              className="hero-secondary-btn"
            >
              <span>View Electronics</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="hero-perks-row">
            <div className="hero-perk-item">
              <Truck size={16} />
              <span>Free Worldwide Shipping over $150</span>
            </div>
            <div className="hero-perk-item">
              <ShieldCheck size={16} />
              <span>2-Year Studio Warranty</span>
            </div>
            <div className="hero-perk-item">
              <RefreshCw size={16} />
              <span>30-Day Effortless Returns</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="hero-visual-container">
          <div className="hero-card-showcase">
            {featuredProduct ? (
              <>
                <img
                  src={heroImageSrc}
                  alt={featuredProduct.name}
                  onError={() => setHeroImgError(true)}
                  referrerPolicy="no-referrer"
                  className="hero-featured-image"
                />
                <div className="hero-floating-badge">
                  <div className="hero-badge-header">
                    <span className="hero-badge-tag">FEATURED PIECE</span>
                    {featuredProduct.rating && (
                      <span className="hero-badge-stars">★ {featuredProduct.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <h4 className="hero-badge-title">{featuredProduct.name}</h4>
                  <p className="hero-badge-price">
                    ${Number(featuredProduct.price).toFixed(2)}
                    {featuredProduct.originalPrice && (
                      <span className="hero-badge-strike">
                        ${Number(featuredProduct.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="hero-empty-showcase">
                <div className="hero-showcase-symbol">◈</div>
                <h4>Curated Collection</h4>
                <p>Add products via the Admin console to feature them here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
