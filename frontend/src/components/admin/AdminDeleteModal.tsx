import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  deletingId: number | null;
  setDeletingId: (id: number | null) => void;
  confirmDelete: () => Promise<void>;
}

export const AdminDeleteModal: React.FC<DeleteModalProps> = ({
  deletingId,
  setDeletingId,
  confirmDelete,
}) => {
  if (deletingId === null) return null;

  return (
    <div className="modal-backdrop-overlay" onClick={() => setDeletingId(null)}>
      <div
        className="delete-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
      >
        <div className="delete-icon-box">
          <Trash2 size={28} />
        </div>
        <h3>Remove Product from Catalog?</h3>
        <p>
          This action will permanently delete product #{deletingId} from the active database
          and store catalog.
        </p>
        <div className="delete-modal-actions">
          <button
            onClick={() => setDeletingId(null)}
            className="admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="delete-confirm-btn"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
};
