import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVisitors, cancelVisitor } from "../../services/visitorService";
import QRModal from "../../components/resident/QRModal";
import TopNav from "../../components/nav/TopNav";
import StatusPill from "../../components/ui/StatusPill";
import { QR_STATUS_LABELS } from "../../constants/qrStatus";

import { RESIDENT_TABS as TABS } from "../../constants/navTabs";

export default function ResidentHistory() {
    const navigate = useNavigate();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const loadVisitors = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getVisitors();
            setVisitors(data.visitors || []);
        } catch (error) {
            console.error("Failed to load visitors:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load your visitors."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVisitors();
    }, []);

    const handleCancel = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this visitor registration?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setCancellingId(id);
            setError("");

            await cancelVisitor(id);
            await loadVisitors();
        } catch (error) {
            console.error("Failed to cancel visitor:", error);

            setError(
                error.response?.data?.message ||
                "Failed to cancel visitor."
            );
        } finally {
            setCancellingId(null);
        }
    };

    const handleEdit = (id) => {
        navigate(`/resident/visitors/${id}/edit`);
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "Not specified";
        const date = new Date(dateTime);
        if (Number.isNaN(date.getTime())) return dateTime;
        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const filteredVisitors = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return visitors;

        return visitors.filter((v) =>
            v.name?.toLowerCase().includes(keyword) ||
            v.unit?.toLowerCase().includes(keyword)
        );
    }, [search, visitors]);

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <div className="relative mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search visitor or unit..."
                        className="w-full bg-surface-alt border border-border text-text rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {error && (
                    <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Fixed-width table columns, sized to the viewport width */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">

                    {loading ? (
                        <div className="p-8 text-center text-text-muted text-sm">
                            Loading visitors...
                        </div>
                    ) : filteredVisitors.length === 0 ? (
                        <div className="p-8 text-center text-text-muted text-sm">
                            No visitor records found.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-[1fr_4.5rem_6.5rem] gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted border-b border-border">
                                <span>Visitor</span>
                                <span>Unit</span>
                                <span>Status</span>
                            </div>

                            {filteredVisitors.map((visitor) => {
                                const isExpanded = expandedId === visitor.id;
                                const isUpcoming = visitor.status === "upcoming";

                                return (
                                    <div key={visitor.id} className="border-b border-border last:border-b-0">
                                        <button
                                            onClick={() =>
                                                setExpandedId(isExpanded ? null : visitor.id)
                                            }
                                            className="w-full grid grid-cols-[1fr_4.5rem_6.5rem] gap-3 items-center px-4 py-3.5 text-left hover:bg-surface-alt transition-colors"
                                        >
                                            <span className="font-semibold text-text text-sm truncate">
                                                {visitor.name}
                                            </span>
                                            <span className="text-sm text-text-muted truncate">
                                                {visitor.unit || "-"}
                                            </span>
                                            <StatusPill status={visitor.status} />
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 -mt-1">
                                                <div className="bg-surface-alt rounded-lg p-3.5 space-y-2 text-sm mb-3">
                                                    <Row label="Phone" value={visitor.phone} />
                                                    <Row label="Purpose" value={visitor.purpose} />
                                                    <Row label="Expected" value={formatDateTime(visitor.expected_at)} />
                                                    {isUpcoming && visitor.qr_status && (
                                                        <Row label="QR Status" value={QR_STATUS_LABELS[visitor.qr_status] || visitor.qr_status} />
                                                    )}
                                                    {visitor.checked_in_at && (
                                                        <Row label="Checked In" value={formatDateTime(visitor.checked_in_at)} />
                                                    )}
                                                    {visitor.checked_out_at && (
                                                        <Row label="Checked Out" value={formatDateTime(visitor.checked_out_at)} />
                                                    )}
                                                </div>

                                                {isUpcoming && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => setSelectedVisitor(visitor)}
                                                            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                                                        >
                                                            View QR
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(visitor.id)}
                                                            className="flex-1 bg-surface-alt border border-border text-text text-sm font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(visitor.id)}
                                                            disabled={cancellingId === visitor.id}
                                                            className="flex-1 bg-danger-bg text-danger text-sm font-semibold py-2.5 rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                                                        >
                                                            {cancellingId === visitor.id ? "Cancelling..." : "Cancel"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                </div>
            </div>

            {selectedVisitor && (
                <QRModal
                    visitor={selectedVisitor}
                    onClose={() => setSelectedVisitor(null)}
                />
            )}
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-text-muted">{label}</span>
            <span className="text-text text-right">{value || "-"}</span>
        </div>
    );
}
