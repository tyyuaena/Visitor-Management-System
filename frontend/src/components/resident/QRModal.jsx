import { useEffect, useState } from "react";
import { getVisitorQR, regenerateVisitorQR } from "../../services/visitorService";
import { QR_STATUS_STYLES, QR_STATUS_LABELS } from "../../constants/qrStatus";

export default function QRModal({ visitor, onClose, }) {
    const [qrUrl, setQrUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [qrStatus, setQrStatus] = useState(visitor.qr_status);
    const [regenerating, setRegenerating] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    // Load QR code
    useEffect(() => {
        let objectUrl = null;

        const loadQR = async () => {
            try {
                setLoading(true);
                setError("");

                const blob = await getVisitorQR(visitor.id);

                objectUrl = URL.createObjectURL(blob);

                setQrUrl(objectUrl);

            } catch (error) {
                console.error("Failed to load QR code:", error);
                setError(
                    error.response?.data?.message || "Failed to load QR code."
                );

            } finally {
                setLoading(false);
            }
        };

        loadQR();

        // Clean up temporary URL
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };

    }, [visitor.id, reloadToken]);


    // Download QR code
    const handleDownload = () => {
        if (!qrUrl) { return; }

        const link = document.createElement("a");
        link.href = qrUrl;
        link.download = `visitor-qr-${visitor.id}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // Share QR code
    const handleShare = async () => {
        if (!qrUrl) { return; }

        try {
            // Convert QR URL into Blob
            const response = await fetch(qrUrl);
            const blob = await response.blob();

            // Create file
            const file = new File(
                [blob],
                `visitor-qr-${visitor.id}.svg`,
                {
                    type: "image/svg+xml",
                }
            );

            // Check whether device supports sharing files
            if (
                navigator.canShare &&
                navigator.canShare({
                    files: [file],
                })
            ) {
                await navigator.share({
                    title: "Visitor QR Code",
                    text:
                        `Visitor QR Code for ${visitor.name}`,
                    files: [file],
                });
            } else {
                // Fallback
                alert("File sharing is not supported on this device. Please download the QR code instead.");
            }
        } catch (error) {
            console.error("QR sharing failed:", error);
        }
    };

    // Regenerate QR code, invalidating the previous one
    const handleRegenerate = async () => {
        if (
            !window.confirm(
                "Generate a new QR code? The current one will stop working immediately."
            )
        ) {
            return;
        }

        setRegenerating(true);
        setError("");

        try {
            const data = await regenerateVisitorQR(visitor.id);
            setQrStatus(data.visitor?.qr_status || "active");
            setReloadToken((n) => n + 1);

        } catch (error) {
            console.error("Failed to regenerate QR code:", error);
            setError(
                error.response?.data?.message || "Failed to regenerate QR code."
            );
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50">

            <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-5">

                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-text">
                            Visitor QR Code
                        </h2>

                        {qrStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${QR_STATUS_STYLES[qrStatus] || "bg-white/10 text-text-muted"}`}>
                                {QR_STATUS_LABELS[qrStatus] || qrStatus}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-white/5 text-xl transition-colors"
                    >
                        ×
                    </button>

                </div>

                {/* VISITOR INFORMATION */}
                <div className="mb-5 bg-surface-alt rounded-lg p-3.5">

                    <p className="font-semibold text-text text-sm">
                        {visitor.name}
                    </p>

                    <p className="text-xs text-text-muted mt-0.5">
                        {visitor.phone} {visitor.unit ? `· Unit ${visitor.unit}` : ""}
                    </p>

                    <p className="text-xs text-text-muted mt-1">
                        Purpose: {visitor.purpose}
                    </p>

                    <p className="text-xs text-text-muted mt-1">
                        Expected:{" "}
                        {new Date(
                            visitor.expected_at
                        ).toLocaleString()}
                    </p>

                </div>

                {/* QR CODE */}
                <div className="flex justify-center items-center min-h-[280px] bg-white rounded-xl">

                    {(loading || regenerating) && (
                        <p className="text-gray-500 text-sm">
                            {regenerating ? "Regenerating QR code..." : "Loading QR code..."}
                        </p>
                    )}

                    {!loading && !regenerating && error && (
                        <p className="text-danger text-sm text-center px-4">
                            {error}
                        </p>
                    )}

                    {!loading &&
                        !regenerating &&
                        !error &&
                        qrUrl && (
                            <img
                                src={qrUrl}
                                alt="Visitor QR Code"
                                className="w-64 h-64"
                            />
                        )}

                </div>


                {/* BUTTONS */}

                <div className="flex gap-2 mt-5">

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        disabled={!qrUrl}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 transition-colors"
                    >
                        Download
                    </button>


                    {/* Share */}
                    <button
                        onClick={handleShare}
                        disabled={!qrUrl}
                        className="flex-1 bg-success-bg text-success text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 transition-colors"
                    >
                        Share
                    </button>

                </div>

                <div className="flex gap-2 mt-2">

                    {/* Regenerate */}
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="flex-1 bg-warning-bg text-warning text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 transition-colors"
                    >
                        {regenerating ? "Regenerating..." : "Regenerate"}
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="flex-1 bg-surface-alt border border-border text-text text-sm font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Close
                    </button>

                </div>
            </div>
        </div>
    );
}
