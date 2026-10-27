import React from 'react';
import { ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col-brand">
            <div className="footer-logo">
              <span className="brand-symbol">◈</span>
              <span className="brand-name">AURA</span>
              <span className="brand-edition">STUDIO</span>
            </div>
            <p className="footer-bio">
              Modern design collective producing tactile, minimalist lifestyle goods, acoustic hardware,
              and architectural accessories engineered for enduring quality.
            </p>
            <span className="footer-copy">© 2026 AURA Studio Inc. All rights reserved.</span>
          </div>

          {/* Catalog Columns */}
          <div className="footer-col">
            <h4 className="footer-heading">Collections</h4>
            <ul className="footer-links">
              <li><a href="#shop-section">Electronics & Audio</a></li>
              <li><a href="#shop-section">Minimal Apparel</a></li>
              <li><a href="#shop-section">Horology & Accessories</a></li>
              <li><a href="#shop-section">Architectural Home</a></li>
              <li><a href="#shop-section">Archival Releases</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Studio & Support</h4>
            <ul className="footer-links">
              <li><a href="#shop-section">Order Tracking</a></li>
              <li><a href="#shop-section">Care & Repair Guides</a></li>
              <li><a href="#shop-section">Sustainability Charter</a></li>
              <li><a href="#shop-section">Retail Showrooms</a></li>
              <li><a href="#shop-section">Press & Media</a></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="footer-col">
            <h4 className="footer-heading">The Archival Journal</h4>
            <p className="footer-subtext">
              Subscribe to receive private preview access for limited runs and architectural releases.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="footer-email-input"
              />
              <button type="submit" className="footer-subscribe-btn" aria-label="Subscribe">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};
