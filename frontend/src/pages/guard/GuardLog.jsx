import { useEffect, useMemo, useState } from "react";
import { getVisitorLogs, checkoutVisitor, getVerificationAttempts } from "../../services/guardService";
import TopNav from "../../components/nav/TopNav";
import StatusPill from "../../components/ui/StatusPill";

const TABS = [
    { label: "Scan", to: "/guard/scan" },
    { label: "Log", to: "/guard/log" },
];

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "checked_in", label: "Checked In" },
    { value: "checked_out", label: "Checked Out" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
    { value: "expired", label: "Expired" },
];

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const formatDateTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
};

const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function GuardLog() {
    const [subTab, setSubTab] = useState("visitors");

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-4">
                    Visitor Log
                </h1>

                <div className="flex gap-2 mb-4">
                    <SubTabButton active={subTab === "visitors"} onClick={() => setSubTab("visitors")}>
                        Visitors
                    </SubTabButton>
                    <SubTabButton active={subTab === "scans"} onClick={() => setSubTab("scans")}>
                        Recent Scans
                    </SubTabButton>
                </div>

                {subTab === "visitors" ? <VisitorLog /> : <RecentScans />}

            </div>
        </div>
    );
}

function SubTabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "bg-surface-alt text-text-muted border border-border"
            }`}
        >
            {children}
        </button>
    );
}

function VisitorLog() {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [date, setDate] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const loadLogs = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getVisitorLogs();
            setVisitors(response.visitors || []);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Unable to load visitor logs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleCheckout = async (visitorId) => {
        if (!window.confirm("Are you sure this visitor has left the premises?")) {
            return;
        }

        setProcessingId(visitorId);
        setError("");
        setMessage("");

        try {
            const response = await checkoutVisitor(visitorId);
            setMessage(response.message || "Visitor checked out successfully.");
            await loadLogs();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Unable to checkout visitor."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const filteredVisitors = useMemo(() => {
        let result = visitors;

        if (status !== "all") {
            result = result.filter((v) => v.status === status);
        }

        if (date) {
            result = result.filter((v) => v.expected_at && v.expected_at.slice(0, 10) === date);
        }

        const keyword = search.trim().toLowerCase();
        if (keyword) {
            result = result.filter((v) =>
                v.name?.toLowerCase().includes(keyword) ||
                v.unit?.toLowerCase().includes(keyword) ||
                v.resident?.name?.toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [visitors, status, search, date]);

    const currentlyInside = visitors.filter((v) => v.status === "checked_in").length;

    return (
        <>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-muted">
                    {filteredVisitors.length} record{filteredVisitors.length === 1 ? "" : "s"}
                </span>
                <span className="bg-success-bg text-success text-xs font-semibold px-3 py-1.5 rounded-full">
                    {currentlyInside} Inside
                </span>
            </div>

            <div className="relative mb-3">
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

            <div className="flex gap-2 mb-3">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`${fieldClass} flex-1`}
                />
                <button
                    onClick={() => setDate(todayIso())}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        date === todayIso() ? "bg-primary text-white" : "bg-surface-alt text-text-muted border border-border"
                    }`}
                >
                    Today
                </button>
                {date && (
                    <button
                        onClick={() => setDate("")}
                        className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-alt text-text-muted border border-border"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            status === opt.value
                                ? "bg-primary text-white"
                                : "bg-surface-alt text-text-muted border border-border"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {message && (
                <div className="mb-4 p-3 bg-success-bg text-success text-sm rounded-lg">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-danger-bg text-danger text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Fixed-width table columns, sized to the viewport width */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">

                {loading ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        Loading visitor logs...
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

                            return (
                                <div
                                    key={visitor.id}
                                    className="border-b border-border last:border-b-0"
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : visitor.id)}
                                        className="w-full grid grid-cols-[1fr_4.5rem_6.5rem] gap-3 items-center px-4 py-3.5 text-left hover:bg-surface-alt transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-text text-sm truncate">
                                                {visitor.name}
                                            </p>
                                            <p className="text-xs text-text-muted truncate">
                                                {visitor.resident?.name || "-"}
                                            </p>
                                        </div>
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
                                                {visitor.checked_in_at && (
                                                    <Row
                                                        label="Checked In"
                                                        value={`${formatDateTime(visitor.checked_in_at)}${visitor.approver?.name ? ` · ${visitor.approver.name}` : ""}`}
                                                    />
                                                )}
                                                {visitor.checked_out_at && (
                                                    <Row
                                                        label="Checked Out"
                                                        value={`${formatDateTime(visitor.checked_out_at)}${visitor.checkout_guard?.name ? ` · ${visitor.checkout_guard.name}` : ""}`}
                                                    />
                                                )}
                                                {visitor.rejected_at && (
                                                    <Row
                                                        label="Rejected"
                                                        value={`${formatDateTime(visitor.rejected_at)}${visitor.rejector?.name ? ` · ${visitor.rejector.name}` : ""}`}
                                                    />
                                                )}
                                                {visitor.rejection_reason && (
                                                    <Row label="Reason" value={visitor.rejection_reason} />
                                                )}
                                            </div>

                                            {visitor.status === "checked_in" && (
                                                <button
                                                    onClick={() => handleCheckout(visitor.id)}
                                                    disabled={processingId === visitor.id}
                                                    className="w-full bg-danger-bg text-danger text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
                                                >
                                                    {processingId === visitor.id ? "Processing..." : "Check Out"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

            </div>
        </>
    );
}

function RecentScans() {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getVerificationAttempts();
                setAttempts(data.attempts || []);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Unable to load recent scans.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-danger-bg text-danger text-sm rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        Loading recent scans...
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        No scans recorded yet.
                    </div>
                ) : (
                    attempts.map((log) => {
                        const failed = log.description?.startsWith("QR verification failed");

                        return (
                            <div key={log.id} className="px-4 py-3.5 border-b border-border last:border-b-0">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <span className={`text-sm font-semibold ${failed ? "text-danger" : "text-success"}`}>
                                        {failed ? "Failed" : "Valid"}
                                    </span>
                                    <span className="text-xs text-text-muted shrink-0">
                                        {formatDateTime(log.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted">
                                    {log.description}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    Scanned by {log.user?.name || "Unknown"}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>
        </>
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
