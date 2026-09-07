"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const timer = useRef(null);

  // Mobile browsers only apply CSS :active styles on tap when at least one
  // touchstart listener exists somewhere on the page — without this, the
  // app's press-feedback (scale-down on :active) silently never fires on
  // touch, which is invisible until you also remove the browser's own tap
  // highlight overlay (as this app does) and there's nothing left at all.
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  const showToast = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message ? (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 24,
            zIndex: 60,
            width: "calc(100% - 32px)",
            maxWidth: 420,
            padding: "13px 15px",
            borderRadius: 14,
            background: "var(--ink)",
            color: "#fff6e6",
            font: "500 12.5px/1.4 var(--font-body)",
            boxShadow: "0 12px 30px -10px rgba(0,0,0,.6)",
            animation: "fadeUp .25s ease both",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
