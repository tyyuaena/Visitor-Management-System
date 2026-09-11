import { useState } from "react";
import { approveVisitor, rejectVisitor } from "../../services/guardService";
import { getStoredUser } from "../../services/authService";
import StatusPill from "../../components/ui/StatusPill";
import { QR_STATUS_STYLES, QR_STATUS_LABELS } from "../../constants/qrStatus";

const REJECT_REASONS = [
    "Invalid QR",
    "Expired QR",
    "Revoked QR",
    "Already-used QR",
    "Visitor not registered",
    "Registration cancelled",
    "Information mismatch",
    "Outside visiting hours",
    "Suspicious attempt",
    "Other",
];

export default function VisitorVerification({ visitor }) {
    const [loading, setLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [completed, setCompleted] = useState(false);

    if (!visitor) {
        return null;
    }

    const guardUser = getStoredUser();
    const initials = (visitor.name || "?")
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const handleApprove = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await approveVisitor(visitor.id);
            setMessage(response.message || "Visitor entry approved successfully.");
            setCompleted(true);

        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Unable to approve visitor."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            setError("Please select a rejection reason.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await rejectVisitor(visitor.id, rejectionReason);
            setMessage(response.message || "Visitor entry rejected.");
            setShowRejectForm(false);
            setCompleted(true);

        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Unable to reject visitor."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface border border-border rounded-2xl p-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">

                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-text truncate">
                            {visitor.name}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                            Visiting Unit {visitor.unit || "-"}
                        </p>
                    </div>
                </div>

                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    VALID
                </span>

            </div>

            {/* Success message */}
            {message && (
                <div className="mb-4 p-3 bg-success-bg text-success text-sm rounded-lg">
                    {message}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-danger-bg text-danger text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Visitor details */}
            <div className="space-y-2.5 text-sm mb-5">
                <InfoRow label="Phone" value={visitor.phone} />
                <InfoRow label="Purpose" value={visitor.purpose} />
                <InfoRow
                    label="Expected"
                    value={
                        visitor.expected_at
                            ? new Date(visitor.expected_at).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                              })
                            : "-"
                    }
                />
                <InfoRow
                    label="Verified"
                    value={`${guardUser?.name || "Guard"}, ${new Date().toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                    })}`}
                />
                {visitor.resident && (
                    <InfoRow label="Resident" value={visitor.resident.name} />
                )}

                <div className="flex justify-between items-center gap-4">
                    <span className="text-text-muted">Registration Status</span>
                    <StatusPill status={visitor.status} />
                </div>

                {visitor.qr_status && (
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-text-muted">QR Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${QR_STATUS_STYLES[visitor.qr_status] || "bg-white/10 text-text-muted"}`}>
                            {QR_STATUS_LABELS[visitor.qr_status] || visitor.qr_status}
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!completed && !showRejectForm && (
                <div className="flex gap-3">
                    <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 bg-success text-white font-bold uppercase tracking-wide text-sm py-3 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? "..." : "Approve"}
                    </button>

                    <button
                        onClick={() => {
                            setShowRejectForm(true);
                            setError("");
                        }}
                        disabled={loading}
                        className="flex-1 border border-danger text-danger font-bold uppercase tracking-wide text-sm py-3 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        Reject
                    </button>
                </div>
            )}

            {/* Rejection form */}
            {!completed && showRejectForm && (
                <div className="border-t border-border pt-4">

                    <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Rejection Reason
                    </label>

                    <select
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Select a reason</option>
                        {REJECT_REASONS.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                        ))}
                    </select>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => {
                                setShowRejectForm(false);
                                setRejectionReason("");
                                setError("");
                            }}
                            disabled={loading}
                            className="flex-1 bg-surface-alt border border-border text-text text-sm font-semibold py-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleReject}
                            disabled={loading}
                            className="flex-1 bg-danger text-white text-sm font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? "..." : "Confirm Rejection"}
                        </button>
                    </div>
                </div>
            )}

            {/* Next step */}
            {completed && (
                <p className="text-center text-text-muted text-sm">
                    You can scan the next visitor when ready.
                </p>
            )}

        </div>
    );
}


function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-text-muted">{label}</span>
            <span className="text-text text-right">{value || "-"}</span>
        </div>
    );
}
