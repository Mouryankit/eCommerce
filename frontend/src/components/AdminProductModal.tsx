import React, { useState, useEffect } from 'react';
import type { Product, Category } from '../types';
import { useProducts } from '../context/ProductContext';
import { uploadProductImage, validateImageFile } from '../services/imageUploadService';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';
import { X, UploadCloud, Check, AlertCircle } from 'lucide-react';

interface AdminProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Category[] = ['Electronics', 'Apparel', 'Accessories', 'Home'];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addProduct, updateProduct } = useProducts();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Electronics');
  const [price, setPrice] = useState('99.00');
  const [quantity, setQuantity] = useState('10');
  const [badge, setBadge] = useState('');

  // Image states: file input + preview + existing Cloudinary/CDN image preservation
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      const rawDesc = product.description || '';
      const cleanDesc = rawDesc.replace(/^\[(Electronics|Apparel|Accessories|Home)\]\s*/i, '');
      setDescription(cleanDesc);
      setCategory(product.category || 'Electronics');
      setPrice(String(product.price ?? 0));
      setQuantity(String(product.quantity ?? 1));
      setBadge(product.badge || '');

      setExistingImageUrl(product.imageUrl || '');
      setSelectedFile(null);
      setPreviewUrl(product.imageUrl ? resolveImageUrl(product.imageUrl, product.name, product.category) : '');
    } else {
      setName('');
      setDescription('');
      setCategory('Electronics');
      setPrice('');
      setQuantity('1');
      setBadge('');

      setExistingImageUrl('');
      setSelectedFile(null);
      setPreviewUrl('');
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Please select a valid image file (JPEG, PNG, WebP up to 5 MB).');
      return;
    }

    setError('');
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setExistingImageUrl('');
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid price greater than or equal to 0.');
      return;
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 0) {
      setError('Please enter a valid inventory quantity.');
      return;
    }

    let finalImageUrl = existingImageUrl.trim();

    // 1. If a new file was chosen, upload to Cloudinary via GraphQL mutation first
    if (selectedFile) {
      setUploadingImage(true);
      try {
        finalImageUrl = await uploadProductImage(selectedFile);
      } catch (uploadErr: any) {
        setUploadingImage(false);
        setError(uploadErr?.message || 'Failed to upload image to Cloudinary.');
        return;
      } finally {
        setUploadingImage(false);
      }
    } else if (!finalImageUrl) {
      // Default contextual image for newly created product without an image
      finalImageUrl = getProductFallbackImage(name.trim(), category);
    }

    setSubmitting(true);

    try {
      if (product) {
        // Edit existing product
        await updateProduct(product.id, {
          name: name.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl,
          category,
          price: numPrice,
          quantity: numQty,
          badge: badge.trim() || undefined,
        });
      } else {
        // Create new product
        await addProduct({
          name: name.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl,
          category,
          price: numPrice,
          quantity: numQty,
          badge: badge.trim() || undefined,
          featured: false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="admin-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="admin-modal-header">
          <div>
            <h2 className="admin-modal-title">
              {product ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h2>
            <p className="admin-modal-subtitle">
              {product
                ? 'Update pricing, stock, category or Cloudinary imagery.'
                : 'Fill in details below to publish a new product to the catalog.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="modal-close-icon-btn"
            aria-label="Close dialog"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="admin-modal-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="prod-title">
              Product Title *
            </label>
            <input
              id="prod-title"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Wireless ANC Headphones"
              className="form-input"
            />
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-cat">
                Department Category *
              </label>
              <select
                id="prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="form-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">
                Base Retail Price ($) *
              </label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.00"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-qty">
                Stock Quantity *
              </label>
              <input
                id="prod-qty"
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-badge">
                Badge / Tag (Optional)
              </label>
              <input
                id="prod-badge"
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Best Seller"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-desc">
              Description
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe materials, dimensions, aesthetic, and features..."
              className="form-textarea"
            />
          </div>

          {/* Product Image Section: File Upload & Preview (No Manual URL Input) */}
          <div className="form-group image-upload-group">
            <label className="form-label">Product Photography (Cloudinary)</label>

            {previewUrl ? (
              <div className="image-preview-card">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  referrerPolicy="no-referrer"
                  className="preview-thumbnail"
                />
                <div className="preview-meta" style={{ flex: 1 }}>
                  <span className="preview-status">
                    {selectedFile
                      ? `Ready to upload: ${selectedFile.name}`
                      : 'Current Product Image'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <label
                      className="preview-remove-link"
                      style={{ cursor: 'pointer', color: '#2563eb' }}
                    >
                      Change Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden-file-input"
                        disabled={submitting || uploadingImage}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="preview-remove-link"
                      disabled={submitting || uploadingImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="upload-dropzone">
                <UploadCloud size={28} className="upload-dropzone-icon" />
                <span className="upload-dropzone-title">Click to select product image</span>
                <span className="upload-dropzone-sub">
                  JPEG, PNG, or WebP (max 5 MB) — uploaded to Cloudinary on submit
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden-file-input"
                  disabled={submitting || uploadingImage}
                />
              </label>
            )}

            {uploadingImage && (
              <div className="uploading-status-indicator">
                <div
                  className="btn-spinner"
                  style={{ width: 14, height: 14, borderWidth: 2 }}
                />
                <span>Uploading image to Cloudinary via GraphQL...</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="admin-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary"
              disabled={submitting || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting || uploadingImage}
            >
              {submitting || uploadingImage ? (
                <>
                  <div className="btn-spinner" />
                  <span>{uploadingImage ? 'Uploading Image...' : 'Saving Product...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{product ? 'Save Changes' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
