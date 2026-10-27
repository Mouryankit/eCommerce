import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AdminNoticeProps {
  email: string;
  adminUrl: string;
  onClose: () => void;
}

export const AdminNoticeBanner: React.FC<AdminNoticeProps> = ({
  email,
  adminUrl,
  onClose,
}) => {
  return (
    <div className="admin-redirect-banner">
      <h4>Administrator Account Detected</h4>
      <p>You have signed in with an administrator account ({email}).</p>
      <div className="admin-banner-actions">
        <a
          href={adminUrl}
          className="admin-banner-go-btn"
          title="Open Administrative Console"
        >
          <span>Go to Admin Portal</span>
          <ExternalLink size={14} />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="admin-banner-stay-btn"
        >
          Continue Browsing Storefront
        </button>
      </div>
    </div>
  );
};
