import { useEffect, useRef, useState } from "react";

import { getAdminVisitors, getAuditLogs, getUsers } from "../../services/adminService";
import TopNav from "../../components/nav/TopNav";
import StatusPill from "../../components/ui/StatusPill";
import SubTabButton from "../../components/ui/SubTabButton";
import { QR_STATUS_STYLES, QR_STATUS_LABELS } from "../../constants/qrStatus";

import { ADMIN_TABS as TABS } from "../../constants/navTabs";

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const formatDateTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
};

function AdminReports() {
    const [subTab, setSubTab] = useState("visitors");

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-4">
                    Reports
                </h1>

                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                    <SubTabButton active={subTab === "visitors"} onClick={() => setSubTab("visitors")}>
                        Visitors
                    </SubTabButton>
                    <SubTabButton active={subTab === "failed"} onClick={() => setSubTab("failed")}>
                        Failed Scans
                    </SubTabButton>
                    <SubTabButton active={subTab === "audit"} onClick={() => setSubTab("audit")}>
                        Audit Logs
                    </SubTabButton>
                </div>

                {subTab === "visitors" && <VisitorReport />}
                {subTab === "failed" && <FailedScans />}
                {subTab === "audit" && <AuditLogReport />}

            </div>

        </div>
    );
}

function VisitorReport() {
    const [visitors, setVisitors] = useState([]);
    const [residents, setResidents] = useState([]);
    const [guards, setGuards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [unit, setUnit] = useState("");
    const [residentId, setResidentId] = useState("");
    const [guardId, setGuardId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [page, setPage] = useState(1);

    // See AuditLogReport's identical guard for why this is needed.
    const requestId = useRef(0);

    const fetchVisitors = async (targetPage = 1) => {
        const thisRequestId = ++requestId.current;
        setLoading(true);
        setError("");

        try {
            const data = await getAdminVisitors({
                search: search || undefined,
                status: status || undefined,
                unit: unit || undefined,
                resident_id: residentId || undefined,
                guard_id: guardId || undefined,
                from: from || undefined,
                to: to || undefined,
                page: targetPage,
            });

            if (thisRequestId !== requestId.current) return;

            const paginated = data.visitors || {};
            setVisitors(paginated.data || []);
            setMeta({
                current_page: paginated.current_page || 1,
                last_page: paginated.last_page || 1,
                total: paginated.total ?? (paginated.data || []).length,
            });
            setPage(targetPage);
        } catch (err) {
            if (thisRequestId !== requestId.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load visitors.");
        } finally {
            if (thisRequestId === requestId.current) setLoading(false);
        }
    };

    const goToPage = (nextPage) => fetchVisitors(nextPage);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchVisitors(1);

        (async () => {
            try {
                const [residentData, guardData] = await Promise.all([
                    getUsers({ role: "resident" }),
                    getUsers({ role: "guard" }),
                ]);
                setResidents(residentData.users || []);
                setGuards(guardData.users || []);
            } catch (err) {
                console.error("Failed to load filter options:", err);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <div className="space-y-2 mb-4">
                <input
                    type="text"
                    placeholder="Search visitor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={fieldClass}
                />

                <input
                    type="text"
                    placeholder="Filter by unit..."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={fieldClass}
                />

                <div className="flex gap-2">
                    <select
                        value={residentId}
                        onChange={(e) => setResidentId(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    >
                        <option value="">All Residents</option>
                        {residents.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>

                    <select
                        value={guardId}
                        onChange={(e) => setGuardId(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    >
                        <option value="">All Guards</option>
                        {guards.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    />
                    <span className="text-text-muted text-xs shrink-0">to</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    >
                        <option value="">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <button
                        onClick={() => fetchVisitors(1)}
                        className="shrink-0 bg-surface-alt border border-border text-text text-sm font-semibold px-3.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Go
                    </button>
                </div>
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
                ) : visitors.length === 0 ? (
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

                        {visitors.map((visitor) => {
                            const isExpanded = expandedId === visitor.id;

                            return (
                                <div key={visitor.id} className="border-b border-border last:border-b-0">
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
                                            <div className="bg-surface-alt rounded-lg p-3.5 space-y-2 text-sm">
                                                <Row label="Phone" value={visitor.phone} />
                                                <Row label="Purpose" value={visitor.purpose} />
                                                <Row label="Expected" value={formatDateTime(visitor.expected_at)} />

                                                {visitor.qr_status && (
                                                    <div className="flex justify-between items-center gap-3">
                                                        <span className="text-text-muted">QR Status</span>
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${QR_STATUS_STYLES[visitor.qr_status] || "bg-white/10 text-text-muted"}`}>
                                                            {QR_STATUS_LABELS[visitor.qr_status] || visitor.qr_status}
                                                        </span>
                                                    </div>
                                                )}

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
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-alt border border-border text-text disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-text-muted">
                        Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                    </span>
                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= meta.last_page}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-alt border border-border text-text disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}

function FailedScans() {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getAuditLogs({ action: "verify_qr", result: "failure" });
                setAttempts(data.logs?.data || []);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Unable to load failed verification attempts.");
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
                        Loading failed scans...
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        No failed verification attempts recorded.
                    </div>
                ) : (
                    attempts.map((log) => (
                        <div key={log.id} className="px-4 py-3.5 border-b border-border last:border-b-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <span className="text-sm font-semibold text-danger">
                                    Failed
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
                    ))
                )}
            </div>
        </>
    );
}

const AUDIT_ACTION_OPTIONS = [
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
    { value: "change_password", label: "Password Change" },
    { value: "password_reset", label: "Password Reset" },
    { value: "create_user", label: "Account Creation" },
    { value: "update_user", label: "Account Modification" },
    { value: "deactivate_user", label: "Account Deactivation" },
    { value: "resend_activation", label: "Resend Activation" },
    { value: "admin_reset_password", label: "Admin-Triggered Password Reset" },
    { value: "create_unit", label: "Unit Created" },
    { value: "update_unit", label: "Unit Updated" },
    { value: "delete_unit", label: "Unit Removed" },
    { value: "update_system_settings", label: "System Setting Change" },
    { value: "register_visitor", label: "Visitor Registration" },
    { value: "update_visitor", label: "Visitor Modification" },
    { value: "cancel_visitor", label: "Visitor Cancellation" },
    { value: "generate_qr", label: "QR Generation" },
    { value: "regenerate_qr", label: "QR Regeneration" },
    { value: "revoke_qr", label: "QR Revocation" },
    { value: "verify_qr", label: "QR Verification" },
    { value: "approve_visitor", label: "Visitor Approval / Check-In" },
    { value: "reject_visitor", label: "Visitor Rejection" },
    { value: "checkout_visitor", label: "Visitor Check-Out" },
];

function AuditLogReport() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [userRole, setUserRole] = useState("");
    const [result, setResult] = useState("");
    const [date, setDate] = useState("");
    const [securityOnly, setSecurityOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Guards against out-of-order responses: if a newer fetch has started
    // by the time an older one resolves (rapid filter changes, or React
    // StrictMode's dev-only double-invoke), the stale response is dropped
    // instead of overwriting newer state.
    const requestId = useRef(0);

    const fetchLogs = async (targetPage = 1) => {
        const thisRequestId = ++requestId.current;
        setLoading(true);
        setError("");

        try {
            const data = await getAuditLogs({
                search: search || undefined,
                action: action || undefined,
                user_role: userRole || undefined,
                result: result || undefined,
                date: date || undefined,
                security_only: securityOnly || undefined,
                page: targetPage,
            });

            if (thisRequestId !== requestId.current) return;

            const paginated = data.logs || {};
            setLogs(paginated.data || []);
            setMeta({
                current_page: paginated.current_page || 1,
                last_page: paginated.last_page || 1,
                total: paginated.total ?? (paginated.data || []).length,
            });
            setPage(targetPage);
        } catch (err) {
            if (thisRequestId !== requestId.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load audit logs.");
        } finally {
            if (thisRequestId === requestId.current) setLoading(false);
        }
    };

    const goToPage = (nextPage) => fetchLogs(nextPage);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [securityOnly]);

    return (
        <>
            <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search audit logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={fieldClass}
                    />

                    <button
                        onClick={() => fetchLogs(1)}
                        className="shrink-0 bg-surface-alt border border-border text-text text-sm font-semibold px-3.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Go
                    </button>
                </div>

                <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className={fieldClass}
                >
                    <option value="">All Actions</option>
                    {AUDIT_ACTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <div className="flex gap-2">
                    <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    >
                        <option value="">All Roles</option>
                        <option value="resident">Resident</option>
                        <option value="guard">Guard</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <select
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        className={`${fieldClass} flex-1`}
                    >
                        <option value="">Any Result</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                    </select>
                </div>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={fieldClass}
                />

                <button
                    onClick={() => setSecurityOnly((v) => !v)}
                    className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                        securityOnly
                            ? "bg-danger-bg text-danger border border-danger"
                            : "bg-surface-alt border border-border text-text-muted"
                    }`}
                >
                    {securityOnly ? "Showing Security Events Only" : "Show Security Events Only"}
                </button>
            </div>

            {error && (
                <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        Loading audit logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        No audit log entries found.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="px-4 py-3.5 border-b border-border last:border-b-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-sm font-semibold text-text capitalize">
                                    {log.action?.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                        log.result === "failure" ? "bg-danger-bg text-danger" : "bg-success-bg text-success"
                                    }`}>
                                        {log.result || "success"}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {log.created_at ? new Date(log.created_at).toLocaleString(undefined, {
                                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                        }) : "-"}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-text-muted">
                                {log.description}
                            </p>
                            <p className="text-xs text-text-muted mt-1 capitalize">
                                By {log.user?.name || "System"}{log.user_role ? ` (${log.user_role})` : ""}
                                {log.target_type ? ` · ${log.target_type} #${log.target_id}` : ""}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-alt border border-border text-text disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-text-muted">
                        Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                    </span>
                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= meta.last_page}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-alt border border-border text-text disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
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

export default AdminReports;
