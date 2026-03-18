import { useEffect } from "react";

export default function PdfModal({ open, title, url, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="panel w-full max-w-5xl p-4">
        <div className="flex justify-between items-center gap-2">
          <div className="font-extrabold">{title || "PDF"}</div>
          <button className="btn btn-glass" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-3 h-[70vh]">
          {url ? (
            <iframe title="pdf" src={url} className="w-full h-full rounded-xl" />
          ) : null}
        </div>
      </div>
    </div>
  );
}