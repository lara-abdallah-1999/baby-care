import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
export function WorkflowDialog({
  title,
  onClose,
  children,
  busy = false,
  print = false,
  closeOnBackdrop = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  print?: boolean;
  closeOnBackdrop?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={`workflow-dialog ${print ? "bracelet-dialog" : ""}`}
      aria-label={title}
      onClick={(event) => {
        if (!closeOnBackdrop || busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button className="quiet" aria-label="Close panel" disabled={busy} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
