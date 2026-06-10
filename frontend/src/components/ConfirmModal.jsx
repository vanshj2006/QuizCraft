export function AlertModal({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">error</span>
          <p className="text-on-surface text-body-md">{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary-container text-white rounded-xl font-bold text-body-sm hover:brightness-110 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">warning</span>
          <p className="text-on-surface text-body-md">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-outline-variant rounded-xl text-on-surface font-bold text-body-sm hover:bg-surface-variant transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-error text-white rounded-xl font-bold text-body-sm hover:brightness-110 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
