import React from "react";

const DeleteAlertContent = ({ content, onDelete }) => {
  return (
    <div className="p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">{content}</p>

      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="btn-small bg-[var(--color-error)] hover:bg-red-600" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlertContent;
