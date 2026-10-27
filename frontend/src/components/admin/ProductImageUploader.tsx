import React from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  previewUrl: string;
  selectedFile: File | null;
  submitting: boolean;
  uploadingImage: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearImage: () => void;
}

export const ProductImageUploader: React.FC<ImageUploaderProps> = ({
  previewUrl,
  selectedFile,
  submitting,
  uploadingImage,
  handleFileSelect,
  handleClearImage,
}) => {
  return (
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
  );
};
