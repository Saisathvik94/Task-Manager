import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg bg-white dark:bg-neutral-900 animate-slide-up ${
              t.type === "success"
                ? "border-teal-100 dark:border-teal-900/40 text-teal-700 dark:text-teal-400"
                : "border-red-100 dark:border-red-900/40 text-red-650 dark:text-red-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.type === "success" ? (
                <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
              )}
              <p className="text-xs font-medium truncate leading-tight">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
