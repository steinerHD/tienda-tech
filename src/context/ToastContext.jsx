import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "bi-check-lg",
  error: "bi-x-lg",
  warning: "bi-exclamation-lg",
  info: "bi-info-lg",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const toast = {
    success: (title, message) => showToast("success", title, message),
    error: (title, message) => showToast("error", title, message),
    warning: (title, message) => showToast("warning", title, message),
    info: (title, message) => showToast("info", title, message),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <div className="toast-icon">
              <i className={`bi ${ICONS[t.type]}`} />
            </div>
            <div className="toast-text">
              <strong>{t.title}</strong>
              {t.message && <span>{t.message}</span>}
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);