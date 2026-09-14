import useLockBodyScroll from "../../hooks/useLockBodyScroll";

// Presentational half of the app-styled confirm/alert dialog — see
// DialogContext for the state/promise machinery that drives it.
export default function ConfirmDialog({
    message,
    variant = "confirm",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}) {
    useLockBodyScroll();

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50">

            <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6">

                <p className="text-text text-sm leading-relaxed mb-6 whitespace-pre-line">
                    {message}
                </p>

                <div className="flex gap-2">

                    {variant === "confirm" && (
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-surface-alt border border-border text-text text-sm font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    )}

                    <button
                        onClick={onConfirm}
                        autoFocus
                        className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {variant === "alert" ? "OK" : confirmLabel}
                    </button>

                </div>

            </div>

        </div>
    );
}
