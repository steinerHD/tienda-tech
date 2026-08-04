import { useEffect } from "react";

export default function Modal({ show, onClose, title, children, maxWidth = 600 }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (show) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel card-dark"
        style={{ maxWidth, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <button className="btn-close-custom" onClick={onClose} type="button">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}